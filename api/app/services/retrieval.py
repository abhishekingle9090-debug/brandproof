from uuid import UUID

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import DocumentChunk


K = 60                 # RRF constant
FETCH_MULTIPLIER = 3   # fetch 3x candidates from each retriever


async def hybrid_search(
    db: AsyncSession,
    org_id: UUID,
    query_text: str,
    query_embedding: list[float],
    top_k: int = 10,
) -> list[DocumentChunk]:
    vector_subq = (
        select(
            DocumentChunk.id.label("chunk_id"),
            func.row_number().over(
                order_by=DocumentChunk.embedding.cosine_distance(query_embedding)
            ).label("vrank"),
        )
        .where(DocumentChunk.org_id == org_id)
        .limit(top_k * FETCH_MULTIPLIER)
        .subquery()
    )

    tsquery = func.plainto_tsquery("english", query_text)
    keyword_subq = (
        select(
            DocumentChunk.id.label("chunk_id"),
            func.row_number().over(
                order_by=desc(
                    func.ts_rank_cd(DocumentChunk.content_tsvector, tsquery)
                )
            ).label("krank"),
        )
        .where(DocumentChunk.org_id == org_id)
        .where(DocumentChunk.content_tsvector.op("@@")(tsquery))
        .limit(top_k * FETCH_MULTIPLIER)
        .subquery()
    )

    rrf_score = (
        func.coalesce(1.0 / (K + vector_subq.c.vrank), 0.0)
        + func.coalesce(1.0 / (K + keyword_subq.c.krank), 0.0)
    ).label("rrf_score")

    combined = (
        select(
            func.coalesce(
                vector_subq.c.chunk_id, keyword_subq.c.chunk_id
            ).label("chunk_id"),
            rrf_score,
        )
        .select_from(
            vector_subq.outerjoin(
                keyword_subq,
                vector_subq.c.chunk_id == keyword_subq.c.chunk_id,
                full=True,
            )
        )
        .order_by(desc("rrf_score"))
        .limit(top_k)
        .subquery()
    )

    result = await db.execute(
        select(DocumentChunk)
        .join(combined, DocumentChunk.id == combined.c.chunk_id)
        .order_by(desc(combined.c.rrf_score))
    )
    return list(result.scalars().all())