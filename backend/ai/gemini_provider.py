"""
Gemini Provider implementation using the official Google Gemini API.
Uses modern models (gemini-2.5-flash / text-embedding-004) via standard HTTP requests,
resilient against SDK version discrepancies and environment conflicts.
"""
import json
import logging
import re
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel, ValidationError

from backend.config import settings
from backend.ai.provider import BaseAIProvider

logger = logging.getLogger(__name__)

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, embedding_model: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model or getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite")
        self.embedding_model = embedding_model or getattr(settings, "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1500, temperature: float = 0.2) -> str:
        if not self.is_available():
            raise RuntimeError("Gemini API key is not configured. Provider unavailable.")

        # Models to try in order of preference
        candidate_models = [self.model, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash-preview"]
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        last_error = None
        for cur_model in candidate_models:
            url = f"{self.base_url}/models/{cur_model}:generateContent?key={self.api_key}"
            headers = {"Content-Type": "application/json"}
            contents = []
            if system_prompt:
                contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}"}]})
                contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})

            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                }
            }

            try:
                with httpx.Client(timeout=30.0) as client:
                    response = client.post(url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                    logger.warning(f"Model {cur_model} returned {response.status_code}, trying fallback candidate...")
                    last_error = f"HTTP {response.status_code}: {response.text[:200]}"
            except Exception as e:
                logger.warning(f"Model {cur_model} failed with {e}, trying fallback candidate...")
                last_error = str(e)

        raise RuntimeError(f"All Gemini model candidates failed. Last error: {last_error}")

    def generate_structured(self, prompt: str, schema_class: Any, system_prompt: Optional[str] = None, temperature: float = 0.1) -> Dict[str, Any]:
        """
        Enforces structured JSON generation, strips Markdown code fences, validates via Pydantic,
        and provides 1 bounded repair retry if parsing fails.
        """
        augmented_prompt = (
            f"{prompt}\n\n"
            f"IMPORTANT: Respond ONLY with a single valid JSON object strictly complying with the requested schema. "
            f"Do not include markdown code block wrappers (no ```json). Do not include any explanations before or after the JSON."
        )

        for attempt in range(2):
            raw_text = self.generate_text(augmented_prompt, system_prompt=system_prompt, temperature=temperature)
            
            # Clean markdown code blocks if returned
            clean_json = raw_text.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            elif clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            try:
                parsed = json.loads(clean_json, strict=False)
            except json.JSONDecodeError:
                # Repair unescaped LaTeX backslashes (e.g. \Delta, \eta, \alpha, \c, \e)
                repaired = re.sub(r'\\([a-zA-Z])', r'\\\\\1', clean_json)
                try:
                    parsed = json.loads(repaired, strict=False)
                except Exception:
                    parsed = None

            try:
                if parsed is not None:
                    if issubclass(schema_class, BaseModel):
                        validated = schema_class.model_validate(parsed)
                        return validated.model_dump()
                    return parsed
                raise ValueError("JSON parse resulted in None")
            except (json.JSONDecodeError, ValidationError, ValueError) as err:
                logger.warning(f"Structured output parse error on attempt {attempt + 1}: {err}")
                if attempt == 0:
                    augmented_prompt = (
                        f"Your previous output failed to validate with error: {str(err)}.\n"
                        f"Previous output snippet: {clean_json[:300]}\n"
                        f"Fix the JSON structure and return ONLY the corrected, valid JSON object strictly adhering to the schema."
                    )
                else:
                    raise ValueError(f"Failed to generate valid structured response after repair attempt: {err}")

    def generate_embedding(self, text: str) -> List[float]:
        if not self.is_available():
            raise RuntimeError("Gemini API key is not configured. Embedding unavailable.")

        clean_text = text.strip()[:2048]
        if not clean_text:
            clean_text = "empty"

        url = f"{self.base_url}/models/{self.embedding_model}:embedContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": f"models/{self.embedding_model}",
            "content": {"parts": [{"text": clean_text}]}
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    raise RuntimeError(f"Gemini embedding error ({resp.status_code}): {resp.text}")
                data = resp.json()
                return data["embedding"]["values"]
        except Exception as e:
            logger.error(f"Gemini embedding failed: {e}")
            raise

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        # Single or batch API calls
        embeddings = []
        for t in texts:
            embeddings.append(self.generate_embedding(t))
        return embeddings
