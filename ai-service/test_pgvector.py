import os
import psycopg2
from psycopg2 import sql

def test():
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", os.getenv("POSTGRES_DB", "postgres")),
        user=os.getenv("DB_USER", os.getenv("POSTGRES_USER", "postgres")),
        password=os.getenv("DB_PASSWORD", os.getenv("POSTGRES_PASSWORD", "postgres")),
        host=os.getenv("DB_HOST", os.getenv("POSTGRES_HOST", "localhost")),
        port=os.getenv("DB_PORT", os.getenv("POSTGRES_PORT", "5432")),
    )
    cursor = conn.cursor()
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
    cursor.execute("CREATE SCHEMA IF NOT EXISTS test_schema")
    table_name = sql.SQL("test_schema.document_chunks")
    cursor.execute("DROP TABLE IF EXISTS test_schema.document_chunks CASCADE")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_schema.document_chunks (
            id SERIAL PRIMARY KEY,
            document_id UUID NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding VECTOR(3)
        )
    """)
    embedding = [0.1, 0.2, 0.3]
    try:
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
                "123e4567-e89b-12d3-a456-426614174000",
                0,
                "test",
                str(embedding),
            ),
        )
        print("Success!")
    except Exception as e:
        print("Error:", e)
    finally:
        conn.rollback()
        conn.close()

if __name__ == "__main__":
    test()
