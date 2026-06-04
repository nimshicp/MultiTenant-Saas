from sentence_transformers import SentenceTransformer

from app.services.vector_store import search_similar_chunks


model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def retrieve_context(
    question: str,
    schema_name: str,
    limit: int = 5,
):
    """
    Convert user question to embedding
    and retrieve most similar chunks
    from the current tenant schema.
    """

    query_embedding = model.encode(
        question
    ).tolist()

    chunks = search_similar_chunks(
        schema_name=schema_name,
        query_embedding=query_embedding,
        limit=limit,
    )

    return chunks