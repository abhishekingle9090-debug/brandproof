from ..models import DocumentChunk


def normalize(text: str) -> str:
    return " ".join(text.lower().split())


def validate_finding(finding: dict) -> dict:
    """
    Enforce: every LLM finding must cite a real chunk AND quote it verbatim.
    If either fails, downgrade to UNVERIFIABLE.
    """
    chunk: DocumentChunk | None = finding.get("source_chunk")
    excerpt = finding.get("excerpt", "").strip()

    if chunk is None:
        return _downgrade(finding, "no_source_chunk")

    if not excerpt:
        return _downgrade(finding, "empty_excerpt")

    if normalize(excerpt) not in normalize(chunk.content):
        return _downgrade(finding, "excerpt_not_in_source")

    finding["validator_status"] = "passed"
    finding["source_chunk_id"] = chunk.id
    finding.pop("source_chunk", None)
    return finding


def _downgrade(finding: dict, reason: str) -> dict:
    finding["verdict"] = "UNVERIFIABLE"
    finding["validator_status"] = "downgraded"
    finding["downgrade_reason"] = reason
    finding["source_chunk_id"] = None
    finding.pop("source_chunk", None)
    return finding