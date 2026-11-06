import asyncio
from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models import DocumentChunk, Organisation
from app.services.embedding import embed_query
from app.services.llm_analysis import analyze_with_llm
from app.services.retrieval import hybrid_search
from app.services.rule_engine import run_rule_engine
from app.services.validator import validate_finding


SUBMISSION = (
    "Meet Acme Fit, your daily home workout partner. "
    "The app is guaranteed to be the #1 rated fitness app in India. "
    "Start your free plan today."
)


async def main():
    async with AsyncSessionLocal() as db:
        org = (await db.execute(
            select(Organisation).where(Organisation.name == "Acme Fit")
        )).scalar_one()

        print(f"Org: {org.id}")
        print(f"Submission: {SUBMISSION}\n")

        print("Step 1: Hybrid retrieval...")
        emb = await embed_query(SUBMISSION)
        chunks = await hybrid_search(db, org.id, SUBMISSION, emb, top_k=10)
        print(f"  Retrieved {len(chunks)} chunks")
        for c in chunks:
            rule = (c.chunk_metadata or {}).get("rule_id", "?")
            print(f"    [{rule}] {c.content[:70]}...")

        print("\nStep 2: Rule engine...")
        rule_findings = run_rule_engine(SUBMISSION, chunks)
        print(f"  {len(rule_findings)} findings")
        for f in rule_findings:
            print(f"    [{f['verdict']}/{f['risk_tier']}] {f['flagged_span']!r} (rule {f['rule_id']})")

        print("\nStep 3: LLM analysis + citation validation...")
        llm_raw = await analyze_with_llm(SUBMISSION, chunks)
        print(f"  LLM returned {len(llm_raw)} findings")
        llm_findings = [validate_finding(f) for f in llm_raw]
        for f in llm_findings:
            status = f.get("validator_status", "?")
            reason = f.get("downgrade_reason", "")
            extra = f" ({reason})" if reason else ""
            print(f"    [{f['verdict']}/{status}] {f.get('flagged_span', '')[:50]!r}{extra}")

        total = len(rule_findings) + len(llm_findings)
        print(f"\n=== TOTAL: {total} findings ===")


asyncio.run(main())