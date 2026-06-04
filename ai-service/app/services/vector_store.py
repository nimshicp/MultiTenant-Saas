import os

import psycopg2
from psycopg2 import sql


DB_NAME = os.getenv("DB_NAME", os.getenv("POSTGRES_DB"))
DB_USER = os.getenv("DB_USER", os.getenv("POSTGRES_USER"))
DB_PASSWORD = os.getenv("DB_PASSWORD", os.getenv("POSTGRES_PASSWORD"))
DB_HOST = os.getenv("DB_HOST", os.getenv("POSTGRES_HOST", "postgres"))
DB_PORT = os.getenv("DB_PORT", os.getenv("POSTGRES_PORT", "5432"))


def get_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )


def save_chunks(
    schema_name,
    filename,
    document_id,
    chunks,
    embeddings,
):
    print(
        f"========== SAVE_CHUNKS START ({schema_name}) =========="
    )

    conn = get_connection()
    cursor = None

    try:
        from app.services.schema_setup import create_vector_table

        create_vector_table(schema_name)

        cursor = conn.cursor()

        documents_table = sql.SQL("{}.documents").format(
            sql.Identifier(schema_name)
        )

        table_name = sql.SQL("{}.document_chunks").format(
            sql.Identifier(schema_name)
        )

        cursor.execute(
            sql.SQL("""
                INSERT INTO {}
                (
                    document_id,
                    filename,
                    chunks_count
                )
                VALUES
                (%s, %s, %s)
                ON CONFLICT (document_id)
                DO UPDATE SET
                    filename = EXCLUDED.filename,
                    chunks_count = EXCLUDED.chunks_count,
                    uploaded_at = NOW()
            """).format(documents_table),
            (
                document_id,
                filename,
                len(chunks),
            ),
        )

        for idx, (chunk, embedding) in enumerate(
            zip(chunks, embeddings)
        ):
            cursor.execute(
                sql.SQL("""
                INSERT INTO {}
                (
                    document_id,
                    chunk_index,
                    content,
                    embedding
                )
                VALUES
                (%s, %s, %s, %s)
                """).format(table_name),
                (
                    document_id,
                    idx,
                    chunk,
                    str(embedding),
                ),
            )

        conn.commit()

        print("COMMIT SUCCESS")

    except Exception as e:

        conn.rollback()

        print("DATABASE ERROR:", e)

        raise

    finally:
        if cursor:
            cursor.close()
        conn.close()


def search_similar_chunks(
    schema_name,
    query_embedding,
    limit=5,
):
    conn = get_connection()
    cursor = None

    try:
        from app.services.schema_setup import create_vector_table

        create_vector_table(schema_name)

        cursor = conn.cursor()

        table_name = sql.SQL("{}.document_chunks").format(
            sql.Identifier(schema_name)
        )

        cursor.execute(
            sql.SQL("""
            SELECT
                id,
                content,
                document_id,
                chunk_index
            FROM {}
            ORDER BY embedding <=> %s
            LIMIT %s
            """).format(table_name),
            (
                str(query_embedding),
                limit,
            ),
        )

        rows = cursor.fetchall()

        return [
            {
                "chunk_id": row[0],
                "content": row[1],
                "document_id": str(row[2]),
                "chunk_index": row[3],
            }
            for row in rows
        ]

    except Exception as e:

        print("SEARCH ERROR:", e)

        raise

    finally:
        if cursor:
            cursor.close()
        conn.close()
