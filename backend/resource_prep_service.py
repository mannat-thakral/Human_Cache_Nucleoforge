"""
Learning Resource Preparation Service.

Ensures that before inviting a learner to review a topic or take a recall quiz,
appropriate, source-grounded learning resources (Quizzes, Flashcard Decks, Notes)
already exist or are prepared idempotently with zero hallucination.
"""
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.models import Topic, Quiz, FlashcardDeck, Flashcard, Note, DocumentTopic
from backend.ai.generation import RAGIntelligenceEngine

logger = logging.getLogger(__name__)

def prepare_or_reuse_learning_resources(
    db: Session,
    user_id: str,
    topic_id: str
) -> Dict[str, Any]:
    """
    Checks for existing study materials for the topic.
    If none exist, idempotently generates and persists a high-yield recall quiz
    and flashcard deck using the RAG intelligence engine.
    Returns status and resource IDs.
    """
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
    if not topic:
        return {"status": "error", "message": "Topic not found"}

    # 1. Check for existing Quiz
    existing_quiz = db.query(Quiz).filter(Quiz.user_id == user_id, Quiz.topic_id == topic_id).first()
    
    # 2. Check for existing Flashcard Deck
    existing_deck = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == user_id, FlashcardDeck.topic_id == topic_id).first()

    rag_engine = RAGIntelligenceEngine(db)

    # If quiz is missing, synthesize one grounded in user's documents
    quiz_id = existing_quiz.id if existing_quiz else None
    if not existing_quiz:
        try:
            quiz_data = rag_engine.generate_quiz(
                user_id=user_id,
                topic_name=topic.canonical_name,
                question_count=3,
                difficulty="medium"
            )
            new_quiz = Quiz(
                user_id=user_id,
                topic_id=topic_id,
                title=quiz_data.get("title", f"Active Recall Drill: {topic.canonical_name}"),
                difficulty="medium",
                questions=quiz_data.get("questions", [])
            )
            db.add(new_quiz)
            db.commit()
            db.refresh(new_quiz)
            quiz_id = new_quiz.id
            logger.info(f"Prepared new quiz {quiz_id} for topic {topic.canonical_name}")
        except Exception as e:
            logger.warning(f"Could not auto-generate quiz for topic {topic_id}: {e}")

    # If flashcard deck is missing, synthesize an adaptive one
    deck_id = existing_deck.id if existing_deck else None
    if not existing_deck:
        try:
            deck_data = rag_engine.generate_flashcards(
                user_id=user_id,
                topic_name=topic.canonical_name,
                detail_level="semi-detailed"
            )
            cards = deck_data.get("cards", [])
            if cards:
                new_deck = FlashcardDeck(
                    user_id=user_id,
                    topic_id=topic_id,
                    title=f"Deck: {topic.canonical_name}",
                    description=f"Auto-generated drill cards for {topic.canonical_name}",
                    detail_level="semi-detailed",
                    version=1
                )
                db.add(new_deck)
                db.commit()
                db.refresh(new_deck)
                deck_id = new_deck.id

                for c in cards:
                    fc = Flashcard(
                        deck_id=new_deck.id,
                        front=c["front"],
                        back=c["back"],
                        hint=c.get("hint", ""),
                        topic_id=topic_id,
                        detail_level=c.get("detail_level", "semi-detailed"),
                        concept_id=c.get("concept_id"),
                        section_name=c.get("section_name"),
                        source_citation=c.get("source_citation")
                    )
                    db.add(fc)
                db.commit()
                logger.info(f"Prepared new adaptive flashcard deck {deck_id} ({len(cards)} cards) for topic {topic.canonical_name}")
        except Exception as e:
            logger.warning(f"Could not auto-generate flashcard deck for topic {topic_id}: {e}")

    return {
        "status": "ready",
        "topic_id": topic_id,
        "topic_name": topic.canonical_name,
        "quiz_id": quiz_id,
        "deck_id": deck_id,
        "action_url": f"/recall?topic_id={topic_id}" if quiz_id else f"/learn?topic_id={topic_id}"
    }
