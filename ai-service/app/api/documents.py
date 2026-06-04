from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException

from app.services.pdf_service import extract_text_from_pdf
from app.services.chunking_service import chunk_text
from app.services.embedding_service import generate_embeddings
from app.services.vector_store import save_chunks
from app.schemas.document import DocumentResponse

router = APIRouter()


@router.post(
    "/upload-document",
    response_model=DocumentResponse
)
async def upload_document(
    schema_name: str = Form(...),
    document_id: str = Form(...),
    file: UploadFile = File(...)
):
    from app.services.schema_setup import create_vector_table

    create_vector_table(schema_name)

    extracted_text = await extract_text_from_pdf(
        file
    )

    chunks = chunk_text(
        extracted_text
    )

    embeddings = generate_embeddings(
        chunks
    )

    save_chunks(
        schema_name=schema_name,
        filename=file.filename,
        document_id=document_id,
        chunks=chunks,
        embeddings=embeddings,
    )

    return {
        "filename": file.filename,
        "schema_name": schema_name,
        "document_id": document_id,
        "chunks_count": len(chunks),
    }


@router.get("/documents")
def list_documents(schema_name: str = Query(...)):
    from psycopg2 import sql
    from app.services.schema_setup import create_vector_table
    from app.services.vector_store import get_connection

    conn = get_connection()
    cursor = None

    try:
        create_vector_table(schema_name)

        cursor = conn.cursor()

        table_name = sql.SQL("{}.document_chunks").format(
            sql.Identifier(schema_name)
        )

        documents_table = sql.SQL("{}.documents").format(
            sql.Identifier(schema_name)
        )

        cursor.execute(
            sql.SQL("""
                SELECT
                    d.document_id::text,
                    d.filename,
                    d.uploaded_at,
                    d.chunks_count,
                    COALESCE(c.total_chunks, 0) AS actual_chunks_count
                FROM {} d
                LEFT JOIN (
                    SELECT
                        document_id,
                        COUNT(*) AS total_chunks
                    FROM {}
                    GROUP BY document_id
                ) c
                ON c.document_id = d.document_id
                ORDER BY d.uploaded_at DESC
            """).format(documents_table, table_name)
        )

        rows = cursor.fetchall()

        return {
            "schema_name": schema_name,
            "documents": [
                {
                    "document_id": row[0],
                    "filename": row[1],
                    "uploaded_at": row[2].isoformat() if row[2] else None,
                    "chunks_count": row[4],
                }
                for row in rows
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if cursor:
            cursor.close()
        conn.close()


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    schema_name: str = Query(...),
):
    from psycopg2 import sql
    from app.services.schema_setup import create_vector_table
    from app.services.vector_store import get_connection

    conn = get_connection()
    cursor = None

    try:
        create_vector_table(schema_name)

        cursor = conn.cursor()

        table_name = sql.SQL("{}.document_chunks").format(
            sql.Identifier(schema_name)
        )

        documents_table = sql.SQL("{}.documents").format(
            sql.Identifier(schema_name)
        )

        cursor.execute(
            sql.SQL("DELETE FROM {} WHERE document_id = %s").format(table_name),
            (document_id,),
        )

        cursor.execute(
            sql.SQL("DELETE FROM {} WHERE document_id = %s").format(documents_table),
            (document_id,),
        )

        deleted_rows = cursor.rowcount
        conn.commit()

        return {
            "schema_name": schema_name,
            "document_id": document_id,
            "deleted_rows": deleted_rows,
        }
        

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if cursor:
            cursor.close()
        conn.close()
