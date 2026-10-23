import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from pydantic import BaseModel
import pandas as pd

from app.services.file_service import (
    load_dataset_from_bytes,
    cache_dataframe,
    get_dataframe,
    list_excel_sheets
)
from app.services.profiling_service import profile_dataset
from app.services.cleaning_service import preview_cleaning_operations, apply_cleaning_operations
from app.services.sample_data_service import SAMPLE_CATALOG
from app.database import save_dataset_meta, get_dataset_meta, list_datasets

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

class CleanRequest(BaseModel):
    drop_duplicates: bool = False
    drop_high_null_columns: bool = False
    null_threshold_pct: float = 50.0
    impute_strategy: Optional[str] = None  # "smart", "median_mode", "zero_unknown"
    handle_outliers: bool = False
    outlier_method: str = "clip"

@router.get("")
def get_all_datasets():
    return list_datasets()

@router.get("/samples")
def get_sample_catalog():
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"],
            "icon": s["icon"],
            "tags": s["tags"]
        }
        for s in SAMPLE_CATALOG
    ]

@router.post("/sample/{sample_id}")
def load_sample_dataset(sample_id: str):
    target = next((s for s in SAMPLE_CATALOG if s["id"] == sample_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Sample dataset not found")
        
    df = target["generator"]()
    dataset_id = str(uuid.uuid4())
    profile = profile_dataset(df)
    
    cache_dataframe(dataset_id, df)
    save_dataset_meta(
        dataset_id=dataset_id,
        name=target["name"],
        filename=target["filename"],
        file_type="csv",
        row_count=profile["summary"]["row_count"],
        col_count=profile["summary"]["col_count"],
        columns=profile["columns"],
        summary=profile["summary"],
        storage_path=f"data/uploads/{dataset_id}.parquet"
    )
    
    preview_records = df.head(100).fillna("").to_dict(orient="records")
    return {
        "dataset_id": dataset_id,
        "name": target["name"],
        "filename": target["filename"],
        "file_type": "csv",
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": profile["columns"],
        "summary": profile["summary"],
        "preview": preview_records,
        "is_sample": True
    }

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None)
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
    filename = file.filename or "uploaded_data"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ["csv", "xlsx", "xls", "json", "txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '.{ext}'. Supported formats are CSV, XLSX, and JSON."
        )
        
    # Check if Excel file has multiple sheets and none specified
    if ext in ["xlsx", "xls"] and not sheet_name:
        try:
            sheets = list_excel_sheets(contents)
            if len(sheets) > 1:
                return {
                    "action_required": "select_sheet",
                    "sheets": sheets,
                    "filename": filename
                }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read Excel workbook: {str(e)}")
            
    try:
        df, detected_ext = load_dataset_from_bytes(contents, filename, sheet_name=sheet_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded dataset contains zero records.")
        
    dataset_id = str(uuid.uuid4())
    profile = profile_dataset(df)
    
    cache_dataframe(dataset_id, df)
    clean_name = filename.rsplit(".", 1)[0].replace("_", " ").title()
    if sheet_name:
        clean_name += f" ({sheet_name})"
        
    save_dataset_meta(
        dataset_id=dataset_id,
        name=clean_name,
        filename=filename,
        file_type=detected_ext,
        row_count=profile["summary"]["row_count"],
        col_count=profile["summary"]["col_count"],
        columns=profile["columns"],
        summary=profile["summary"],
        storage_path=f"data/uploads/{dataset_id}.parquet"
    )
    
    preview_records = df.head(100).fillna("").to_dict(orient="records")
    return {
        "dataset_id": dataset_id,
        "name": clean_name,
        "filename": filename,
        "file_type": detected_ext,
        "row_count": len(df),
        "col_count": len(df.columns),
        "columns": profile["columns"],
        "summary": profile["summary"],
        "preview": preview_records
    }

@router.get("/{dataset_id}")
def get_dataset(dataset_id: str):
    meta = get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = get_dataframe(dataset_id)
    preview_records = df.head(100).fillna("").to_dict(orient="records") if df is not None else []
    meta["preview"] = preview_records
    return meta

@router.get("/{dataset_id}/preview")
def get_dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200)
):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset data not found in cache or storage")
    start = (page - 1) * page_size
    end = start + page_size
    records = df.iloc[start:end].fillna("").to_dict(orient="records")
    return {
        "records": records,
        "total_records": len(df),
        "page": page,
        "page_size": page_size,
        "total_pages": int((len(df) + page_size - 1) // page_size)
    }

@router.post("/{dataset_id}/clean-preview")
def preview_clean(dataset_id: str, req: CleanRequest):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    preview = preview_cleaning_operations(df, req.model_dump())
    return preview

@router.post("/{dataset_id}/clean-apply")
def apply_clean(dataset_id: str, req: CleanRequest):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    cleaned_df = apply_cleaning_operations(df, req.model_dump())
    
    meta = get_dataset_meta(dataset_id) or {}
    new_dataset_id = str(uuid.uuid4())
    new_name = f"{meta.get('name', 'Dataset')} (Cleaned)"
    profile = profile_dataset(cleaned_df)
    
    cache_dataframe(new_dataset_id, cleaned_df)
    save_dataset_meta(
        dataset_id=new_dataset_id,
        name=new_name,
        filename=f"cleaned_{meta.get('filename', 'data.csv')}",
        file_type="csv",
        row_count=profile["summary"]["row_count"],
        col_count=profile["summary"]["col_count"],
        columns=profile["columns"],
        summary=profile["summary"],
        storage_path=f"data/uploads/{new_dataset_id}.parquet"
    )
    
    return {
        "dataset_id": new_dataset_id,
        "name": new_name,
        "row_count": len(cleaned_df),
        "col_count": len(cleaned_df.columns),
        "columns": profile["columns"],
        "summary": profile["summary"],
        "preview": cleaned_df.head(100).fillna("").to_dict(orient="records")
    }
