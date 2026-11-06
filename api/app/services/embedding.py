import httpx
from ..config import settings


EMBED_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{settings.embedding_model}:embedContent"
)


async def _embed(text: str, task_type: str) -> list[float]:
    payload = {
        "model": f"models/{settings.embedding_model}",
        "content": {"parts": [{"text": text}]},
        "outputDimensionality": settings.embedding_dimension,
        "taskType": task_type,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            EMBED_URL,
            params={"key": settings.gemini_api_key},
            json=payload,
        )
        if resp.status_code != 200:
            raise RuntimeError(
                f"Gemini embedding failed {resp.status_code}: {resp.text}"
            )
        data = resp.json()
    return data["embedding"]["values"]


async def embed_document(text: str) -> list[float]:
    """For guideline chunks. Stored at indexing time."""
    return await _embed(text, "RETRIEVAL_DOCUMENT")


async def embed_query(text: str) -> list[float]:
    """For the user's search query. Different task type improves recall."""
    return await _embed(text, "RETRIEVAL_QUERY")