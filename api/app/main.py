from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .db import engine
from .models import Base
from .routers import guidelines, submissions, reviews


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS idx_chunks_hnsw
                ON document_chunks
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64)
                """
            )
        )
        await conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS idx_chunks_fts
                ON document_chunks
                USING GIN (content_tsvector)
                """
            )
        )
    yield


app = FastAPI(title="BrandProof API", lifespan=lifespan)

# CORS — allow the frontend dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(guidelines.router, prefix="/guidelines", tags=["guidelines"])
app.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])


@app.get("/healthz")
async def healthz():
    return {"ok": True}