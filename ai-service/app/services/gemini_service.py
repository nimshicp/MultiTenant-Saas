import os

import google.generativeai as genai


genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)


model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


def generate_with_gemini(
    question: str,
    context: str,
):
    """
    Generate answer using Gemini.
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

    response = model.generate_content(
        prompt
    )

    return response.text


def stream_with_gemini(
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

    response = model.generate_content(
        prompt,
        stream=True,
    )

    for chunk in response:
        text = getattr(chunk, "text", "") or ""
        if text:
            yield text
