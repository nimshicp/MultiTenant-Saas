from sentence_transformers import SentenceTransformer


model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def generate_embeddings(chunks):

    embeddings = []

    for chunk in chunks:

        vector = model.encode(chunk)

        embeddings.append(vector.tolist())

    return embeddings