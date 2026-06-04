from app.services.grok_service import (
    generate_with_grok,
    stream_with_grok,
)

from app.services.gemini_service import (
    generate_with_gemini,
    stream_with_gemini,
)


def generate_answer(
    question: str,
    context: str,
):
    """
    Main LLM Router

    1. Try Grok first
    2. If Grok fails, use Gemini
    """

    try:

        answer = generate_with_grok(
            question=question,
            context=context,
        )

        return {
            "provider": "grok",
            "answer": answer,
        }

    except Exception as e:

        print(
            f"Grok Failed: {e}"
        )

        answer = generate_with_gemini(
            question=question,
            context=context,
        )

        return {
            "provider": "gemini",
            "answer": answer,
        }


def stream_answer(
    question: str,
    context: str,
):
    try:
        for token in stream_with_grok(
            question=question,
            context=context,
        ):
            yield "grok", token
        return
    except Exception as e:
        print(f"Grok stream failed: {e}")

    for token in stream_with_gemini(
        question=question,
        context=context,
    ):
        yield "gemini", token
