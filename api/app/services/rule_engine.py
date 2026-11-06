from datetime import datetime
from uuid import UUID

from ..models import DocumentChunk


BANNED_TERMS = ["guaranteed", "risk-free", "instant results"]


def check_banned_terms(
    submission_text: str, banned_chunk: DocumentChunk
) -> list[dict]:
    findings = []
    text_lower = submission_text.lower()
    for term in BANNED_TERMS:
        if term in text_lower:
            idx = text_lower.index(term)
            start = max(0, idx - 30)
            end = min(len(submission_text), idx + len(term) + 30)
            findings.append({
                "verdict": "CONTRADICTED",
                "risk_tier": "MEDIUM",
                "flagged_span": submission_text[idx:idx + len(term)],
                "rule_id": "BT-001",
                "source_chunk_id": banned_chunk.id,
                "explanation": f"Prohibited term '{term}' — see rule BT-001.",
                "suggested_fix": f"Remove '{term}' or use approved language.",
                "context": submission_text[start:end],
            })
    return findings


def check_expired_claims(
    submission_text: str,
    claim_chunk: DocumentChunk,
    expires_on: datetime = datetime(2026, 3, 31),
) -> list[dict]:
    findings = []
    now = datetime.utcnow()
    claim_phrase = "#1 rated"
    if claim_phrase in submission_text.lower() and now > expires_on:
        idx = submission_text.lower().index(claim_phrase)
        findings.append({
            "verdict": "EXPIRED",
            "risk_tier": "HIGH",
            "flagged_span": submission_text[idx:idx + len(claim_phrase)],
            "rule_id": "CL-014",
            "source_chunk_id": claim_chunk.id,
            "explanation": (
                f"Claim CL-014 expired on {expires_on.date()}. "
                "The FitSurvey India Q1 2025 evidence is out of date."
            ),
            "suggested_fix": (
                "Remove the ranking claim, or update it with a current "
                "dated source. Example: 'Rated #1 in the 2026 FitSurvey.'"
            ),
        })
    return findings


def run_rule_engine(
    submission_text: str, chunks: list[DocumentChunk]
) -> list[dict]:
    """Run all deterministic checks. Return list of findings."""
    findings: list[dict] = []
    for chunk in chunks:
        rule_id = (chunk.chunk_metadata or {}).get("rule_id")
        if rule_id == "BT-001":
            findings.extend(check_banned_terms(submission_text, chunk))
        elif rule_id == "CL-014":
            findings.extend(check_expired_claims(submission_text, chunk))
    return findings