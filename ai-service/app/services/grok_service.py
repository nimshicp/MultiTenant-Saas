import os

from openai import OpenAI


client = OpenAI(
    api_key=os.getenv("GROK_API_KEY"),
    base_url="https://api.x.ai/v1",
)


def generate_with_grok(
    question: str,
    context: str,
):
    """
    Generate answer using Grok.
    Uses retrieved RAG context as source.
    """

    prompt = f"""
You are a helpful AI assistant.

Answer the user's question using ONLY the provided context.

If the answer cannot be found in the context, reply:

"I could not find the answer in the uploaded documents."

Context:
{context}

Question:
{question}
"""

    response = client.chat.completions.create(
        model="grok-3-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a RAG assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_tokens=500,
    )

    return response.choices[0].message.content


def stream_with_grok(
    question: str,
    context: str,
):
    prompt = f"""
You are a helpful AI assistant.

Answer the user's question using ONLY the provided context.

If the answer cannot be found in the context, reply:

"I could not find the answer in the uploaded documents."

Context:
{context}

Question:
{question}
"""

    stream = client.chat.completions.create(
        model="grok-3-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a RAG assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_tokens=500,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        if delta:
            yield delta
