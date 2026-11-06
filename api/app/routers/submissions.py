from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import FirebaseUser, get_current_user
from ..db import get_db
from ..models import DocumentChunk, Finding, Submission
from ..services.embedding import embed_query
from ..services.llm_analysis import analyze_with_llm
from ..services.org import get_or_create_org
from ..services.retrieval import hybrid_search
from ..services.rule_engine import run_rule_engine
from ..services.validator import validate_finding

router = APIRouter()


class SubmissionIn(BaseModel):
    content: str


@router.post("")
async def create_submission(
    body: SubmissionIn,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.content.strip():
        raise HTTPException(400, "content must not be empty")

    org_id = await get_or_create_org(db, user)

    submission = Submission(org_id=org_id, content=body.content)
    db.add(submission)
    await db.flush()

    # 1. Retrieve relevant guideline chunks for the submission text
    query_emb = await embed_query(body.content)
    chunks = await hybrid_search(db, org_id, body.content, query_emb, top_k=5)

       import asyncio
    # 2. Rule engine (sync, instant) + LLM (async) in parallel
    rule_findings = run_rule_engine(body.content, chunks)
    llm_raw = await analyze_with_llm(body.content, chunks)
    llm_findings = [validate_finding(f) for f in llm_raw]
    # 4. Persist everything
    stored = []
    for f in rule_findings + llm_findings:
        row = Finding(
            submission_id=submission.id,
            verdict=f.get("verdict", "UNVERIFIABLE"),
            risk_tier=_tier_for(f),
            flagged_span=f.get("flagged_span"),
            rule_id=f.get("rule_id"),
            source_chunk_id=f.get("source_chunk_id"),
            explanation=f.get("explanation"),
            suggested_fix=f.get("suggested_fix"),
            validator_status=f.get("validator_status", "passed"),
        )
        db.add(row)
        await db.flush()
        stored.append({
            "id": str(row.id),
            "verdict": row.verdict,
            "risk_tier": row.risk_tier,
            "flagged_span": row.flagged_span,
            "rule_id": row.rule_id,
            "explanation": row.explanation,
            "suggested_fix": row.suggested_fix,
            "validator_status": row.validator_status,
        })

    await db.commit()
    return {
        "submission_id": str(submission.id),
        "finding_count": len(stored),
        "findings": stored,
    }


def _tier_for(f: dict) -> str:
    verdict = f.get("verdict")
    if verdict == "EXPIRED":
        return "HIGH"
    if verdict == "CONTRADICTED":
        return "MEDIUM"
    if verdict == "UNVERIFIABLE":
        return "MEDIUM"
    return "LOW"