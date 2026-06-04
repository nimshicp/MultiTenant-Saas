from pydantic import BaseModel


class DocumentResponse(BaseModel):
    filename: str
    schema_name: str
    document_id: str
    chunks_count: int