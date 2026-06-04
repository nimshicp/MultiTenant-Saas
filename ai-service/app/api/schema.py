from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.schema_setup import create_vector_table

router = APIRouter(
    prefix="/schema",
    tags=["Schema"]
)


class SchemaSetupRequest(BaseModel):
    schema_name: str


@router.post("/setup")
def setup_schema(payload: SchemaSetupRequest):
    try:

        schema_name = payload.schema_name

        if not schema_name.startswith("tenant_"):
            raise HTTPException(
                status_code=400,
                detail="Invalid schema name"
            )

        create_vector_table(schema_name)

        return {
            "success": True,
            "schema_name": schema_name,
            "message": f"Vector table initialized for {schema_name}"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )