"""
Demonstrates the citation validator catching a fabricated citation.
Run: python test_validator_demo.py
"""
import asyncio
from uuid import uuid4

from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models import DocumentChunk
from app.services.validator import validate_finding


async def main():
    async with AsyncSessionLocal() as db:
        # Get a real chunk to act as the "source"
        chunk = (await db.execute(
            select(DocumentChunk).limit(1)
        )).scalar_one()

        print(f"Real source chunk content:")
        print(f"  {chunk.content[:100]}...\n")

        # Simulate an LLM that FABRICATES a citation
        fabricated = {
            "verdict": "SUPPORTED",
            "flagged_span": "Our app cures cancer",
            "excerpt": "Our app is medically proven to cure cancer.",
            "source_id": 1,
            "source_chunk": chunk,  # real chunk exists, but excerpt is fake
            "explanation": "Looks good.",
            "suggested_fix": "None",
        }

        print("LLM produced this finding (fabricated citation):")
        print(f"  verdict: {fabricated['verdict']}")
        print(f"  excerpt: {fabricated['excerpt']!r}\n")

        result = validate_finding(fabricated)

        print("After citation validator:")
        print(f"  verdict: {result['verdict']}")
        print(f"  status:  {result['validator_status']}")
        print(f"  reason:  {result.get('downgrade_reason', 'none')}")

        assert result["verdict"] == "UNVERIFIABLE", "validator FAILED to downgrade"
        assert result["validator_status"] == "downgraded"
        print("\n✅ VALIDATOR WORKING — fabricated citation was downgraded to UNVERIFIABLE")


asyncio.run(main())