from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.file_service import get_dataframe
from app.services.query_service import answer_data_query, get_predefined_questions
from app.database import get_dataset_meta

router = APIRouter(prefix="/api/query", tags=["Conversational Query"])

class QueryMessageRequest(BaseModel):
    query: str

@router.get("/{dataset_id}/suggestions")
def get_query_suggestions(dataset_id: str):
    meta = get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"suggestions": get_predefined_questions(meta["columns"])}

@router.post("/{dataset_id}")
def ask_question_about_dataset(dataset_id: str, req: QueryMessageRequest):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    meta = get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset metadata not found")
        
    result = answer_data_query(df, meta["columns"], req.query)
    return result
