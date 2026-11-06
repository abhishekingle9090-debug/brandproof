import uuid
import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import declarative_base

from .config import settings

Base = declarative_base()


class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Membership(Base):
    __tablename__ = "memberships"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    firebase_uid = Column(String, unique=True, nullable=False)
    role = Column(String, default="creator")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GuidelineVersion(Base):
    __tablename__ = "guideline_versions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    version_label = Column(String, default="v1.0")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    guideline_version_id = Column(
        UUID(as_uuid=True), ForeignKey("guideline_versions.id"), nullable=False
    )
    content = Column(Text, nullable=False)
    content_tsvector = Column(TSVECTOR)
    embedding = Column(Vector(settings.embedding_dimension))
    chunk_metadata = Column(JSON, default=dict)


class Submission(Base):
    __tablename__ = "submissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")
    passport = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Finding(Base):
    __tablename__ = "findings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(
        UUID(as_uuid=True), ForeignKey("submissions.id"), nullable=False
    )
    verdict = Column(String)
    risk_tier = Column(String)
    flagged_span = Column(Text)
    rule_id = Column(String, nullable=True)
    source_chunk_id = Column(
        UUID(as_uuid=True), ForeignKey("document_chunks.id"), nullable=True
    )
    explanation = Column(Text)
    suggested_fix = Column(Text)
    decision = Column(String, nullable=True)
    decided_by = Column(String, nullable=True)
    validator_status = Column(String, default="passed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)