"""Document upload routes for evidence gathering."""

from __future__ import annotations

import io
import uuid

from fastapi import APIRouter, HTTPException, UploadFile

router = APIRouter(prefix="/api/projects/{project_id}/documents", tags=["documents"])


def _get_db():
    from ..main import app_state
    return app_state["db"]


@router.post("")
async def upload_document(project_id: str, file: UploadFile):
    """Upload a document and extract its text content."""
    db = _get_db()

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    content_type = file.content_type or "application/octet-stream"
    raw = await file.read()

    # Extract text based on content type
    if content_type == "application/pdf" or (file.filename and file.filename.lower().endswith(".pdf")):
        extracted = _extract_pdf(raw)
    elif content_type == "text/csv" or (file.filename and file.filename.lower().endswith(".csv")):
        extracted = raw.decode("utf-8", errors="replace")
    else:
        # Treat as plain text
        extracted = raw.decode("utf-8", errors="replace")

    if not extracted.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from file")

    doc_id = str(uuid.uuid4())[:8]
    result = await db.create_document(
        doc_id=doc_id,
        project_id=project_id,
        filename=file.filename,
        content_type=content_type,
        extracted_text=extracted,
    )
    return result


@router.get("")
async def list_documents(project_id: str):
    """List all uploaded documents for a project."""
    db = _get_db()
    return await db.list_documents(project_id)


@router.delete("/{doc_id}")
async def delete_document(project_id: str, doc_id: str):
    """Delete an uploaded document."""
    db = _get_db()
    await db.delete_document(doc_id)
    return {"ok": True}


def _extract_pdf(raw: bytes) -> str:
    """Extract text from a PDF using pdfplumber."""
    try:
        import pdfplumber

        pages_text = []
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text)
        return "\n\n".join(pages_text)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to extract PDF text: {exc}")
