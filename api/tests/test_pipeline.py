"""
BrandProof test suite — proves the claims in our proposal.
Run: python -m pytest tests/ -v
"""
from unittest.mock import MagicMock

import pytest
from sqlalchemy import select

from app.db import AsyncSessionLocal
from app.models import Organisation
from app.services.embedding import embed_query
from app.services.retrieval import hybrid_search
from app.services.rule_engine import check_banned_terms, check_expired_claims
from app.services.validator import validate_finding


# ---------- Citation validator ----------

def test_validator_downgrades_fabricated_quote():
    """Proposal: 'A citation that does not exist downgrades the finding to Unverifiable.'"""
    chunk = MagicMock()
    chunk.content = "Never use 'guaranteed' in marketing copy."
    chunk.id = "fake-id"

    finding = {
        "verdict": "CONTRADICTED",
        "excerpt": "Our app cures cancer",
        "source_chunk": chunk,
    }
    result = validate_finding(finding)
    assert result["verdict"] == "UNVERIFIABLE"
    assert result["validator_status"] == "downgraded"
    assert result["downgrade_reason"] == "excerpt_not_in_source"


def test_validator_passes_verbatim_quote():
    chunk = MagicMock()
    chunk.content = "Never use 'guaranteed' in marketing copy."
    chunk.id = "fake-id"

    finding = {
        "verdict": "CONTRADICTED",
        "excerpt": "Never use 'guaranteed'",
        "source_chunk": chunk,
    }
    result = validate_finding(finding)
    assert result["validator_status"] == "passed"
    assert result["verdict"] == "CONTRADICTED"


def test_validator_downgrades_missing_source():
    finding = {
        "verdict": "SUPPORTED",
        "excerpt": "anything",
        "source_chunk": None,
    }
    result = validate_finding(finding)
    assert result["verdict"] == "UNVERIFIABLE"
    assert result["downgrade_reason"] == "no_source_chunk"


# ---------- Rule engine ----------

def test_banned_term_detected():
    """Proposal: 'Deterministic rule engine catches banned terms.'"""
    chunk = MagicMock()
    chunk.id = "bt-chunk"
    findings = check_banned_terms("Our app is guaranteed to work.", chunk)
    assert len(findings) == 1
    assert findings[0]["rule_id"] == "BT-001"
    assert findings[0]["verdict"] == "CONTRADICTED"
    assert findings[0]["flagged_span"] == "guaranteed"


def test_expired_claim_detected():
    chunk = MagicMock()
    chunk.id = "cl-chunk"
    findings = check_expired_claims(
        "We are the #1 rated fitness app in India.", chunk
    )
    assert len(findings) == 1
    assert findings[0]["rule_id"] == "CL-014"
    assert findings[0]["verdict"] == "EXPIRED"
    assert findings[0]["risk_tier"] == "HIGH"


def test_clean_text_produces_no_findings():
    chunk = MagicMock()
    chunk.id = "bt-chunk"
    findings = check_banned_terms("Our app is free to download.", chunk)
    assert findings == []


# ---------- Role gate ----------

def test_role_gate_present_in_code():
    """Proposal: 'HIGH findings require reviewer or admin.'"""
    import inspect
    from app.routers.reviews import decide

    src = inspect.getsource(decide)
    assert 'role not in ("reviewer", "admin")' in src
    assert "HIGH findings require reviewer or admin role" in src
    assert "Creators cannot decide MEDIUM findings" in src


# ---------- Hybrid retrieval ----------

@pytest.mark.asyncio
async def test_hybrid_retrieval_returns_relevant_chunk():
    """Proposal: 'Hybrid retrieval with RRF returns the correct rule chunk.'"""
    async with AsyncSessionLocal() as db:
        org = (await db.execute(
            select(Organisation).where(Organisation.name == "Acme Fit")
        )).scalar_one_or_none()
        if org is None:
            pytest.skip("Seed data not present — run python seed.py first")

        emb = await embed_query("ranking claims evidence")
        results = await hybrid_search(
            db, org.id, "ranking claims evidence", emb, top_k=5
        )
        assert len(results) > 0
        rule_ids = [
            (r.chunk_metadata or {}).get("rule_id") for r in results
        ]
        assert "CL-014" in rule_ids, f"Expected CL-014 in top 5, got {rule_ids}"