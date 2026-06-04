import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.retriever import retrieve_context
from app.services.llm_service import generate_answer, stream_answer

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    schema_name: str


@router.post("/query")
async def query(
    payload: QueryRequest,
):
    chunks = retrieve_context(
        question=payload.question,
        schema_name=payload.schema_name,
    )

    context = "\n\n".join(
        chunk["content"]
        for chunk in chunks
    )

    result = generate_answer(
        question=payload.question,
        context=context,
    )

    return {
        "question": payload.question,
        "provider": result["provider"],
        "answer": result["answer"],
        "retrieved_chunks": chunks,
        "citations": [
            {
                "citation_id": idx + 1,
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "chunk_index": chunk["chunk_index"],
            }
            for idx, chunk in enumerate(chunks)
        ],
    }


@router.post("/query/stream")
async def query_stream(payload: QueryRequest):
    chunks = retrieve_context(
        question=payload.question,
        schema_name=payload.schema_name,
    )

    citations = [
        {
            "citation_id": idx + 1,
            "chunk_id": chunk["chunk_id"],
            "document_id": chunk["document_id"],
            "chunk_index": chunk["chunk_index"],
            "content": chunk["content"],
        }
        for idx, chunk in enumerate(chunks)
    ]

    context = "\n\n".join(
        chunk["content"]
        for chunk in chunks
    )

    def event_stream():
        yield f"event: meta\ndata: {json.dumps({'citations': citations})}\n\n"

        provider = "grok"
        answer_parts = []

        try:
            for provider_name, token in stream_answer(
                question=payload.question,
                context=context,
            ):
                provider = provider_name
                answer_parts.append(token)
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"
            return

        yield f"event: done\ndata: {json.dumps({'provider': provider, 'answer': ''.join(answer_parts), 'retrieved_chunks': chunks, 'citations': citations})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
    )
