import os
import re
from typing import Tuple, List, Dict, Any
import pypdf
import docx

def extract_text_from_file(file_path: str, filename: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Extracts text from PDF, DOCX, TXT, MD files.
    Returns: (full_text, list_of_chunks_with_page_info)
    """
    ext = os.path.splitext(filename)[1].lower()
    pages_data = []
    full_text = ""

    if ext == ".pdf":
        try:
            reader = pypdf.PdfReader(file_path)
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                page_clean = page_text.strip()
                if page_clean:
                    pages_data.append({
                        "page_number": idx + 1,
                        "text": page_clean
                    })
                    full_text += f"\n--- Page {idx + 1} ---\n" + page_clean
        except Exception as e:
            full_text = f"Error extracting PDF: {str(e)}"
    elif ext in [".docx", ".doc"]:
        try:
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)
            pages_data.append({
                "page_number": 1,
                "text": full_text
            })
        except Exception as e:
            full_text = f"Error extracting DOCX: {str(e)}"
    else: # txt, md, csv, etc.
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()
            pages_data.append({
                "page_number": 1,
                "text": full_text
            })
        except Exception as e:
            full_text = f"Error reading text file: {str(e)}"

    # Source-aware chunking preserving headings and paragraph boundaries
    chunks = []
    heading_re = re.compile(r'^(?:#{1,4}\s+|Chapter\s+\d+[:\s]+|[0-9]+\.\s+)([A-Z][^\n]{3,60})', re.MULTILINE)

    if pages_data and len(pages_data) > 1:
        for p in pages_data:
            text_p = p["text"]
            h_match = heading_re.search(text_p)
            sec_heading = h_match.group(1).strip() if h_match else None
            chunks.append({
                "content": text_p,
                "page_number": p["page_number"],
                "section_heading": sec_heading
            })
    else:
        # Split into sensible semantic chunks of roughly 800-1200 characters
        paragraphs = re.split(r'\n\s*\n', full_text)
        current_chunk = ""
        current_heading = None
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            h_match = heading_re.search(para)
            if h_match:
                current_heading = h_match.group(1).strip()

            if len(current_chunk) + len(para) > 1100 and len(current_chunk) > 250:
                chunks.append({
                    "content": current_chunk,
                    "page_number": 1,
                    "section_heading": current_heading
                })
                current_chunk = para
            else:
                current_chunk = f"{current_chunk}\n\n{para}".strip()

        if current_chunk:
            chunks.append({
                "content": current_chunk,
                "page_number": 1,
                "section_heading": current_heading
            })

    if not chunks:
        chunks = [{"content": full_text or "No content extracted.", "page_number": 1, "section_heading": None}]

    return full_text, chunks

def extract_topics_and_concepts(text: str, filename: str) -> List[Dict[str, Any]]:
    """
    Intelligent deterministic extractor for topics and concepts from raw text.
    Identifies high-frequency academic keywords, headings, capital concepts, and definitions.
    """
    topics_found = []
    seen = set()

    # 1. Detect headings (e.g. # Heading, Chapter 1, Section, Title Case lines)
    heading_pattern = r'^(?:#{1,4}\s+|Chapter\s+\d+[:\s]+|[A-Z][A-Za-z0-9\s]{3,35}:)([^\n]+)'
    for match in re.finditer(heading_pattern, text, re.MULTILINE):
        topic_name = match.group(1).strip()
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', topic_name).strip()
        if 3 < len(cleaned) < 50 and cleaned.lower() not in seen:
            seen.add(cleaned.lower())
            topics_found.append({
                "name": cleaned,
                "canonical_name": cleaned.title(),
                "description": f"Key concept identified in {filename} under section heading.",
                "topic_type": "concept"
            })

    # 2. Detect definitions ("X is defined as...", "X refers to...", "X is a...")
    def_pattern = r'([A-Z][A-Za-z\s]{2,30})\s+(?:is defined as|refers to|is a fundamental|is the process of)\s+([^.\n]+)'
    for match in re.finditer(def_pattern, text):
        concept = match.group(1).strip()
        definition = match.group(2).strip()
        if 3 < len(concept) < 40 and concept.lower() not in seen:
            seen.add(concept.lower())
            topics_found.append({
                "name": concept,
                "canonical_name": concept.title(),
                "description": f"{concept} {definition[:180]}.",
                "topic_type": "definition"
            })

    # 3. Fallback extraction if text has few formal headings: capitalized phrases or title keywords
    if len(topics_found) < 3:
        # Look for frequent technical terms or capitalized word pairs
        candidates = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b', text)
        freq = {}
        stopwords = {"The", "This", "That", "These", "Those", "When", "What", "There", "Here", "With", "From", "Into", "Over", "After", "Before", "Page"}
        for c in candidates:
            c_str = c.strip()
            if c_str not in stopwords and len(c_str) > 3:
                freq[c_str] = freq.get(c_str, 0) + 1
        
        sorted_candidates = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        for term, count in sorted_candidates[:6]:
            if term.lower() not in seen:
                seen.add(term.lower())
                topics_found.append({
                    "name": term,
                    "canonical_name": term.title(),
                    "description": f"Frequently referenced topic in {filename} (mentioned {count} times).",
                    "topic_type": "concept"
                })

    # If still none found, fallback to document name
    if not topics_found:
        base_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()
        topics_found.append({
            "name": base_name,
            "canonical_name": base_name,
            "description": f"Primary topic derived from document {filename}.",
            "topic_type": "concept"
        })

    return topics_found[:8] # return up to 8 strong concepts
