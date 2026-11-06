import asyncio
from sqlalchemy import select
from app.db import AsyncSessionLocal
from app.models import Organisation
from app.services.embedding import embed_query
from app.services.retrieval import hybrid_search


async def main():
    async with AsyncSessionLocal() as db:
        org = (await db.execute(
            select(Organisation).where(Organisation.name == "Acme Fit")
        )).scalar_one()

        for q in ["ranking claims evidence", "guaranteed offers", "home workout"]:
            emb = await embed_query(q)
            results = await hybrid_search(db, org.id, q, emb, top_k=3)
            print(f"\n=== Query: {q} ===")
            for r in results:
                print(f"  [{r.chunk_metadata.get('rule_id')}] {r.content[:90]}...")


asyncio.run(main())