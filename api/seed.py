import asyncio
from sqlalchemy import text

from app.db import AsyncSessionLocal
from app.models import DocumentChunk, GuidelineVersion, Organisation
from app.services.embedding import embed_document


DEMO_CHUNKS = [
    (
        "Prohibited terms: never use 'guaranteed', 'risk-free', or 'instant results'. "
        "These words make unsubstantiated promises that violate advertising standards.",
        {"rule_id": "BT-001", "type": "banned_terms"},
    ),
    (
        "Claim CL-014: '#1 rated fitness app in India'. Evidence: FitSurvey India Q1 2025. "
        "This claim expired on 31 March 2026 and must not be used until new evidence is on file.",
        {"rule_id": "CL-014", "type": "claim", "expires_on": "2026-03-31"},
    ),
    (
        "Terminology: always write 'home workouts' (plural), not 'home workout' (singular). "
        "The plural form is our approved brand voice.",
        {"rule_id": "TM-001", "type": "terminology"},
    ),
    (
        "Brand voice: warm, direct, and evidence-based. Avoid superlatives without a cited "
        "source. Never claim outcomes we have not measured.",
        {"rule_id": "BV-001", "type": "voice"},
    ),
]


async def seed():
    async with AsyncSessionLocal() as db:
        # wipe existing demo data
        await db.execute(text("DELETE FROM findings"))
        await db.execute(text("DELETE FROM submissions"))
        await db.execute(text("DELETE FROM document_chunks"))
        await db.execute(text("DELETE FROM guideline_versions"))
        await db.execute(text("DELETE FROM memberships"))
        await db.execute(text("DELETE FROM organisations"))
        await db.commit()

        org = Organisation(name="Acme Fit")
        db.add(org)
        await db.flush()

        gv = GuidelineVersion(org_id=org.id, version_label="v1.0")
        db.add(gv)
        await db.flush()

        for content, meta in DEMO_CHUNKS:
            emb = await embed_document(content)
            chunk = DocumentChunk(
                org_id=org.id,
                guideline_version_id=gv.id,
                content=content,
                embedding=emb,
                chunk_metadata=meta,
            )
            db.add(chunk)
            await db.flush()
            await db.execute(
                text(
                    "UPDATE document_chunks SET content_tsvector = "
                    "to_tsvector('english', content) WHERE id = :id"
                ),
                {"id": chunk.id},
            )

        await db.commit()
        print(f"Seeded org={org.id} gv={gv.id} chunks={len(DEMO_CHUNKS)}")


if __name__ == "__main__":
    asyncio.run(seed())