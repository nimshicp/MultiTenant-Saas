from psycopg2 import sql

from app.services.vector_store import get_connection


def create_vector_table(schema_name: str):
    conn = get_connection()

    try:
        cursor = conn.cursor()

        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")

        documents_table = sql.SQL("{}.documents").format(
            sql.Identifier(schema_name)
        )

        table_name = sql.SQL("{}.document_chunks").format(
            sql.Identifier(schema_name)
        )

        cursor.execute(
            sql.SQL("""
                CREATE TABLE IF NOT EXISTS {} (
                    document_id UUID PRIMARY KEY,
                    filename TEXT NOT NULL,
                    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    chunks_count INTEGER NOT NULL DEFAULT 0
                )
            """).format(documents_table)
        )

        cursor.execute(
            sql.SQL("""
                CREATE TABLE IF NOT EXISTS {} (
                    id SERIAL PRIMARY KEY,
                    document_id UUID NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    embedding VECTOR(384)
                )
            """).format(table_name)
        )

        cursor.execute(
            sql.SQL("""
                CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
                ON {}
                USING hnsw (embedding vector_cosine_ops)
            """).format(table_name)
        )

        conn.commit()

        print(
            f"document_chunks table created for schema: {schema_name}"
        )

    except Exception as e:

        conn.rollback()

        print(
            f"Schema setup failed: {str(e)}"
        )

        raise

    finally:
        cursor.close()
        conn.close()
