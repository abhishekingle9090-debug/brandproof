from datetime import datetime
from uuid import UUID

from ..models import DocumentChunk


BANNED_TERMS = ["guaranteed", "risk-free", "instant results"]


def check_banned_terms(
    submission_text: str, banned_chunk: DocumentChunk
) -> list[dict]:
    findings = []
    text_lower = submission_text.lower()
    for term in BANNED_TERMS:
        if term in text_lower:
            idx = text_lower.index(term)
            start = max(0, idx - 30)
            end = min(len(submission_text), idx + len(term) + 30)
            findings.append({
                "verdict": "CONTRADICTED",
                "risk_tier": "MEDIUM",
                "flagged_span": submission_text[idx:idx + len(term)],
                "rule_id": "BT-001",
                "source_chunk_id": banned_chunk.id,
                "explanation": f"Prohibited term '{term}' — see rule BT-001.",
                "suggested_fix": f"Remove '{term}' or use approved language.",
                "context": submission_text[start:end],
            })
    return findings


def check_expired_claims(
    submission_text: str,
    claim_chunk: DocumentChunk,
    expires_on: datetime = datetime(2026, 3, 31),
) -> list[dict]:
    findings = []
    now = datetime.utcnow()
    claim_phrase = "#1 rated"
    if claim_phrase in submission_text.lower() and now > expires_on:
        idx = submission_text.lower().index(claim_phrase)
        findings.append({
            "verdict": "EXPIRED",
            "risk_tier": "HIGH",
            "flagged_span": submission_text[idx:idx + len(claim_phrase)],
            "rule_id": "CL-014",
            "source_chunk_id": claim_chunk.id,
            "explanation": (
                f"Claim CL-014 expired on {expires_on.date()}. "
                "The FitSurvey India Q1 2025 evidence is out of date."
            ),
            "suggested_fix": (
                "Remove the ranking claim, or update it with a current "
                "dated source. Example: 'Rated #1 in the 2026 FitSurvey.'"
            ),
        })
    return findings


def run_rule_engine(
    submission_text: str, chunks: list[DocumentChunk]
) -> list[dict]:
    """Run all deterministic checks. Return list of findings."""
    findings: list[dict] = []
    for chunk in chunks:
        rule_id = (chunk.chunk_metadata or {}).get("rule_id")
        if rule_id == "BT-001":
            findings.extend(check_banned_terms(submission_text, chunk))
        elif rule_id == "CL-014":
            findings.extend(check_expired_claims(submission_text, chunk))

    # Accessibility checks — use first chunk as source reference
    if chunks:
        findings.extend(check_accessibility(submission_text, chunks[0].id))

    return findings




# ---------- Accessibility checks (WCAG 2.2 practices) ----------

import re


def check_accessibility(submission_text: str, source_chunk_id) -> list[dict]:
    """Deterministic accessibility checks. No AI."""
    findings = []

    # AC-001: ALL CAPS words (>30% of words uppercase)
    words = [w for w in submission_text.split() if len(w) > 2 and w.isalpha()]
    if words:
        caps_words = [w for w in words if w.isupper()]
        if len(caps_words) / len(words) > 0.3:
            findings.append({
                "verdict": "CONTRADICTED",
                "risk_tier": "LOW",
                "flagged_span": ", ".join(caps_words[:5]),
                "rule_id": "AC-001",
                "source_chunk_id": source_chunk_id,
                "explanation": (
                    f"{len(caps_words)} of {len(words)} words are ALL CAPS "
                    "(>30%). WCAG 2.2 practice: avoid long runs of uppercase "
                    "as screen readers may read letter-by-letter."
                ),
                "suggested_fix": "Convert to sentence case; use bold for emphasis instead.",
            })

    # AC-002: Long sentences (>50 words)
    sentences = re.split(r"[.!?]+", submission_text)
    for s in sentences:
        s_words = s.strip().split()
        if len(s_words) > 50:
            findings.append({
                "verdict": "CONTRADICTED",
                "risk_tier": "LOW",
                "flagged_span": " ".join(s_words[:10]) + "...",
                "rule_id": "AC-002",
                "source_chunk_id": source_chunk_id,
                "explanation": (
                    f"Sentence is {len(s_words)} words. WCAG 2.2 practice: "
                    "sentences over 50 words reduce comprehension for readers "
                    "with cognitive disabilities."
                ),
                "suggested_fix": "Split into two or three shorter sentences.",
            })

    # AC-003: Vague link text
    vague_links = ["click here", "read more", "learn more", "find out more", "here"]
    text_lower = submission_text.lower()
    for link in vague_links:
        if link in text_lower:
            findings.append({
                "verdict": "CONTRADICTED",
                "risk_tier": "LOW",
                "flagged_span": link,
                "rule_id": "AC-003",
                "source_chunk_id": source_chunk_id,
                "explanation": (
                    f"Link text '{link}' is not descriptive. WCAG 2.2 practice: "
                    "screen reader users often navigate by link text alone."
                ),
                "suggested_fix": "Use descriptive text, e.g., 'Read our privacy policy'.",
            })

    # AC-004: Emoji-heavy text (more than 5 emojis)
    emoji_pattern = re.compile(
        "[" "\U0001F600-\U0001F64F" "\U0001F300-\U0001F5FF"
        "\U0001F680-\U0001F6FF" "\U0001F1E0-\U0001F1FF"
        "\U00002702-\U000027B0" "\U0001F900-\U0001F9FF" "]+",
        flags=re.UNICODE,
    )
    emojis = emoji_pattern.findall(submission_text)
    total_emoji = sum(len(e) for e in emojis)
    if total_emoji > 5:
        findings.append({
            "verdict": "CONTRADICTED",
            "risk_tier": "LOW",
            "flagged_span": f"{total_emoji} emojis",
            "rule_id": "AC-004",
            "source_chunk_id": source_chunk_id,
            "explanation": (
                f"{total_emoji} emojis in body text. WCAG 2.2 practice: "
                "screen readers read emoji alt text, breaking reading flow."
            ),
            "suggested_fix": "Reduce emoji count to 0-2 in body copy.",
        })

    return findings