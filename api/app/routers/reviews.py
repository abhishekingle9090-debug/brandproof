from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import FirebaseUser, get_current_user
from ..db import get_db
from ..models import Finding, Submission

router = APIRouter()


class DecisionIn(BaseModel):
    decision: str
    reason: str = ""


@router.get("/queue")
async def review_queue(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Finding)
        .where(Finding.decision.is_(None))
        .where(Finding.risk_tier.in_(["MEDIUM", "HIGH"]))
        .order_by(Finding.created_at.desc())
        .limit(50)
    )
    findings = result.scalars().all()
    return {
        "count": len(findings),
        "findings": [
            {
                "id": str(f.id),
                "verdict": f.verdict,
                "risk_tier": f.risk_tier,
                "flagged_span": f.flagged_span,
                "rule_id": f.rule_id,
                "explanation": f.explanation,
                "suggested_fix": f.suggested_fix,
            }
            for f in findings
        ],
    }


@router.post("/{finding_id}/decision")
async def decide(
    finding_id: UUID,
    body: DecisionIn,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):    
    result = await db.execute(select(Finding).where(Finding.id == finding_id))
    finding = result.scalar_one_or_none()
    if finding is None:
        raise HTTPException(404, "Finding not found")

    if body.decision not in ("approved", "rejected"):
        raise HTTPException(400, "decision must be 'approved' or 'rejected'")

    role = user.role or "creator"
    if finding.risk_tier == "HIGH" and role not in ("reviewer", "admin"):
        raise HTTPException(403, "HIGH findings require reviewer or admin role")
    if finding.risk_tier == "MEDIUM" and role == "creator":
        raise HTTPException(403, "Creators cannot decide MEDIUM findings")

    finding.decision = body.decision
    finding.decided_by = user.uid
    await db.commit()
    return {"ok": True, "finding_id": str(finding.id), "decision": body.decision}


@router.get("/passport/{submission_id}")
async def passport(
    submission_id: UUID,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = (await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )).scalar_one_or_none()
    if sub is None:
        raise HTTPException(404, "Submission not found")

    findings = (await db.execute(
        select(Finding).where(Finding.submission_id == submission_id)
    )).scalars().all()

    pending = [f for f in findings if f.risk_tier in ("MEDIUM", "HIGH") and f.decision is None]
    approved = len(pending) == 0

    passport_data = {
        "submission_id": str(sub.id),
        "checks_run": ["rule_engine", "hybrid_retrieval", "citation_validator"],
        "findings": [
            {
                "id": str(f.id),
                "verdict": f.verdict,
                "risk_tier": f.risk_tier,
                "rule_id": f.rule_id,
                "decision": f.decision,
                "decided_by": f.decided_by,
            }
            for f in findings
        ],
        "status": "approved" if approved else "pending_review",
        "note": "Audit record, not a certification of compliance.",
    }

    sub.passport = passport_data
    await db.commit()
    return passport_data