import json

from openai import AsyncOpenAI

from ..config import settings
from ..models import DocumentChunk


client = AsyncOpenAI(
    api_key=settings.groq_api_key,
    base_url=settings.llm_base_url,
)


async def analyze_with_llm(
    submission_text: str, chunks: list[DocumentChunk]
) -> list[dict]:
    if not chunks:
        return []

    excerpts = "\n\n".join(
        f"[{i + 1}] {c.content}" for i, c in enumerate(chunks)
    )

    prompt = f"""You are a brand compliance analyst. Approved guideline excerpts:

{excerpts}

Submitted content to review:
\"\"\"{submission_text}\"\"\"

Return ONLY a JSON object with this exact shape:
{{
  "findings": [
    {{
      "flagged_span": "exact text from the submission",
      "category": "tone|claim|terminology|prohibited",
      "source_id": 1,
      "excerpt": "exact sentence from the source excerpt above",
      "explanation": "why this is an issue",
      "suggested_fix": "how to fix it",
      "verdict": "CONTRADICTED|EXPIRED|UNVERIFIABLE"
    }}
  ]
}}

Rules:
- source_id must be the [N] number of the excerpt that supports the finding.
- excerpt must be copied EXACTLY from that excerpt, no paraphrasing.
- If no excerpt supports an issue, use verdict "UNVERIFIABLE" and omit source_id and excerpt.
- Do not invent source IDs. Do not cite IDs not in the list above.
- If there are no issues, return {{"findings": []}}.
"""

    resp = await client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0,
    )
    content = resp.choices[0].message.content or "{}"
    data = json.loads(content)

    findings = data.get("findings", [])
    for f in findings:
        sid = f.get("source_id")
        if isinstance(sid, int) and 1 <= sid <= len(chunks):
            f["source_chunk"] = chunks[sid - 1]
        else:
            f["source_chunk"] = None
    return findings