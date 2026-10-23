from fastapi import APIRouter, HTTPException
from app.services.file_service import get_dataframe
from app.services.insights_service import get_insights_for_dataset
from app.database import get_dataset_meta

router = APIRouter(prefix="/api/insights", tags=["Insights"])

@router.get("/{dataset_id}")
def get_dataset_insights(dataset_id: str):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    meta = get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset metadata not found")
        
    insights_data = get_insights_for_dataset(df, meta["columns"], meta["name"])
    return insights_data
