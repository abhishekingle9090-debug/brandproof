import fitz  # PyMuPDF


def extract_text(pdf_bytes: bytes) -> str:
    """Extract text from a PDF. Falls back to empty string for image-only pages."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page in doc:
        text = page.get_text()
        pages.append(text)
    return "\n".join(pages)


def chunk_text(text: str, chunk_words: int = 350, overlap_words: int = 35) -> list[str]:
    """Split text into overlapping chunks of ~350 words."""
    words = text.split()
    if not words:
        return []
    chunks = []
    step = max(1, chunk_words - overlap_words)
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_words])
        if chunk.strip():
            chunks.append(chunk)
        if i + chunk_words >= len(words):
            break
        i += step
    return chunks