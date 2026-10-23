from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
import json

from app.services.file_service import get_dataframe
from app.services.filter_service import apply_filters_to_dataframe
from app.services.export_service import export_dataframe_to_csv
from app.database import get_dashboard, get_dataset_meta

router = APIRouter(prefix="/api/export", tags=["Exports"])

class ExportCsvRequest(BaseModel):
    filters: Dict[str, Any] = {}

@router.post("/{dataset_id}/csv")
def export_csv(dataset_id: str, req: ExportCsvRequest):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    filtered_df = apply_filters_to_dataframe(df, req.filters)
    csv_str = export_dataframe_to_csv(filtered_df)
    
    meta = get_dataset_meta(dataset_id) or {}
    clean_name = meta.get("name", "data").replace(" ", "_").lower()
    
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={clean_name}_filtered.csv"}
    )

@router.get("/dashboard/{dashboard_id}/json")
def export_dashboard_json(dashboard_id: str):
    dash = get_dashboard(dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    dash_json = json.dumps(dash, indent=2)
    clean_title = dash.get("title", "dashboard").replace(" ", "_").lower()
    return Response(
        content=dash_json,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={clean_title}_config.json"}
    )
