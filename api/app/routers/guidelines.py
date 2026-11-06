import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import FirebaseUser, get_current_user
from ..db import get_db
from ..models import DocumentChunk, GuidelineVersion
from ..services.embedding import embed_document, embed_query
from ..services.ingest import chunk_text, extract_text
from ..services.org import get_or_create_org
from ..services.retrieval import hybrid_search

router = APIRouter()


@router.post("/upload")
async def upload_guideline(
    file: UploadFile = File(...),
    version_label: str = Form("v1.0"),
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    pdf_bytes = await file.read()
    text_content = extract_text(pdf_bytes)
    if len(text_content.strip()) < 50:
        raise HTTPException(
            400,
            "Could not extract text. Upload a PDF with a text layer (not a scanned image).",
        )

    chunks = chunk_text(text_content)
    if not chunks:
        raise HTTPException(400, "No usable chunks found in this PDF")

    org_id = await get_or_create_org(db, user)
    gv = GuidelineVersion(org_id=org_id, version_label=version_label)
    db.add(gv)
    await db.flush()

    created = []
    for chunk in chunks:
        embedding = await embed_document(chunk)
        row = DocumentChunk(
            org_id=org_id,
            guideline_version_id=gv.id,
            content=chunk,
            embedding=embedding,
            chunk_metadata={"source": file.filename},
        )
        db.add(row)
        await db.flush()
        # populate tsvector for keyword search
        await db.execute(
            text(
                "UPDATE document_chunks SET content_tsvector = "
                "to_tsvector('english', content) WHERE id = :id"
            ),
            {"id": row.id},
        )
        created.append(str(row.id))

    await db.commit()
    return {
        "org_id": str(org_id),
        "guideline_version_id": str(gv.id),
        "chunks_created": len(created),
        "chunk_ids": created,
    }


@router.get("/search")
async def search_guidelines(
    q: str,
    top_k: int = 5,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not q.strip():
        raise HTTPException(400, "q must not be empty")
    org_id = await get_or_create_org(db, user)
    query_emb = await embed_query(q)
    results = await hybrid_search(db, org_id, q, query_emb, top_k=top_k)
    return {
        "query": q,
        "results": [
            {
                "chunk_id": str(r.id),
                "content": r.content,
                "metadata": r.chunk_metadata,
            }
            for r in results
        ],
    }