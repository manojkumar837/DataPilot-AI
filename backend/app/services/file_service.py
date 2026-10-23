import os
import io
import uuid
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
from app.config import UPLOAD_DIR

# In-memory LRU / active cache for rapid querying
DATASET_CACHE: Dict[str, pd.DataFrame] = {}

def get_storage_path(dataset_id: str, ext: str = "parquet") -> Path:
    return UPLOAD_DIR / f"{dataset_id}.{ext}"

def cache_dataframe(dataset_id: str, df: pd.DataFrame):
    DATASET_CACHE[dataset_id] = df
    # Persist as parquet (fast & preserves types) or feather
    try:
        df.to_parquet(get_storage_path(dataset_id, "parquet"), index=False)
    except Exception:
        # Fallback to csv if pyarrow has issues
        df.to_csv(get_storage_path(dataset_id, "csv"), index=False)

def get_dataframe(dataset_id: str) -> Optional[pd.DataFrame]:
    if dataset_id in DATASET_CACHE:
        return DATASET_CACHE[dataset_id]
    
    parquet_path = get_storage_path(dataset_id, "parquet")
    if parquet_path.exists():
        try:
            df = pd.read_parquet(parquet_path)
            DATASET_CACHE[dataset_id] = df
            return df
        except Exception:
            pass
            
    csv_path = get_storage_path(dataset_id, "csv")
    if csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
            DATASET_CACHE[dataset_id] = df
            return df
        except Exception:
            pass
            
    return None

def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = []
    seen = {}
    for col in df.columns:
        col_str = str(col).strip()
        if not col_str or col_str.lower() == "unnamed:":
            col_str = "Column"
        if col_str in seen:
            seen[col_str] += 1
            col_str = f"{col_str}_{seen[col_str]}"
        else:
            seen[col_str] = 0
        cleaned.append(col_str)
    df.columns = cleaned
    return df

def list_excel_sheets(file_bytes: bytes) -> List[str]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True)
    return wb.sheetnames

def load_dataset_from_bytes(
    file_bytes: bytes,
    filename: str,
    sheet_name: Optional[str] = None
) -> Tuple[pd.DataFrame, str]:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if ext == "csv" or ext == "txt":
        # Attempt UTF-8 with automatic separator detection
        for encoding in ["utf-8", "utf-8-sig", "latin1", "cp1252"]:
            try:
                # Try sniffing delimiter
                sample = file_bytes[:8192].decode(encoding, errors="ignore")
                sep = ","
                if "\t" in sample and sample.count("\t") > sample.count(","):
                    sep = "\t"
                elif ";" in sample and sample.count(";") > sample.count(","):
                    sep = ";"
                
                df = pd.read_csv(io.BytesIO(file_bytes), sep=sep, encoding=encoding)
                return clean_column_names(df), ext
            except Exception:
                continue
        # Fallback
        df = pd.read_csv(io.BytesIO(file_bytes), sep=None, engine="python", encoding="latin1")
        return clean_column_names(df), ext

    elif ext in ["xlsx", "xls"]:
        sheet = sheet_name or 0
        df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=sheet)
        return clean_column_names(df), ext

    elif ext == "json":
        try:
            # Try parsing as standard JSON records
            df = pd.read_json(io.BytesIO(file_bytes))
        except Exception:
            # Fallback to json.loads and pd.json_normalize
            data = json.loads(file_bytes.decode("utf-8", errors="ignore"))
            if isinstance(data, list):
                df = pd.json_normalize(data)
            elif isinstance(data, dict):
                # Check if it has a data or records key
                for key in ["data", "records", "rows", "items", "results"]:
                    if key in data and isinstance(data[key], list):
                        df = pd.json_normalize(data[key])
                        return clean_column_names(df), ext
                df = pd.json_normalize([data])
            else:
                raise ValueError("Unsupported JSON format")
        return clean_column_names(df), ext

    else:
        raise ValueError(f"Unsupported file format: .{ext}. Supported formats: CSV, XLSX, JSON.")
