from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def preview_cleaning_operations(
    df: pd.DataFrame,
    operations: Dict[str, Any]
) -> Dict[str, Any]:
    # Work on a copy
    cleaned = df.copy()
    original_rows = len(df)
    original_nulls = int(df.isnull().sum().sum())
    
    actions_taken = []
    
    # 1. Drop duplicates
    if operations.get("drop_duplicates"):
        dups_count = int(cleaned.duplicated().sum())
        if dups_count > 0:
            cleaned = cleaned.drop_duplicates()
            actions_taken.append(f"Removed {dups_count} duplicate row(s)")
            
    # 2. Drop high missing columns
    if operations.get("drop_high_null_columns"):
        threshold = float(operations.get("null_threshold_pct", 50.0))
        dropped_cols = []
        for col in cleaned.columns:
            null_pct = (cleaned[col].isnull().sum() / len(cleaned)) * 100.0
            if null_pct > threshold:
                dropped_cols.append(col)
        if dropped_cols:
            cleaned = cleaned.drop(columns=dropped_cols)
            actions_taken.append(f"Dropped columns with >{threshold}% missing: {', '.join(dropped_cols)}")
            
    # 3. Impute missing values
    impute_strategy = operations.get("impute_strategy")  # "smart", "median_mode", "zero_unknown"
    if impute_strategy:
        imputed_count = 0
        for col in cleaned.columns:
            nulls = cleaned[col].isnull().sum()
            if nulls > 0:
                imputed_count += int(nulls)
                if pd.api.types.is_numeric_dtype(cleaned[col]):
                    if impute_strategy in ["smart", "median_mode"]:
                        val = cleaned[col].median()
                        cleaned[col] = cleaned[col].fillna(val)
                    elif impute_strategy == "zero_unknown":
                        cleaned[col] = cleaned[col].fillna(0)
                else:
                    if impute_strategy in ["smart", "median_mode"]:
                        mode_s = cleaned[col].mode()
                        val = mode_s.iloc[0] if len(mode_s) > 0 else "Unknown"
                        cleaned[col] = cleaned[col].fillna(val)
                    elif impute_strategy == "zero_unknown":
                        cleaned[col] = cleaned[col].fillna("Unknown")
        if imputed_count > 0:
            actions_taken.append(f"Imputed {imputed_count} missing values using '{impute_strategy}' strategy")
            
    # 4. Handle outliers
    if operations.get("handle_outliers"):
        outlier_method = operations.get("outlier_method", "clip")  # "clip" or "remove"
        for col in cleaned.select_dtypes(include=[np.number]).columns:
            q25 = cleaned[col].quantile(0.25)
            q75 = cleaned[col].quantile(0.75)
            iqr = q75 - q25
            if iqr > 0:
                lower = q25 - 1.5 * iqr
                upper = q75 + 1.5 * iqr
                if outlier_method == "clip":
                    cleaned[col] = cleaned[col].clip(lower=lower, upper=upper)
                elif outlier_method == "remove":
                    cleaned = cleaned[(cleaned[col] >= lower) & (cleaned[col] <= upper)]
        actions_taken.append(f"Treated statistical outliers via '{outlier_method}'")
        
    final_rows = len(cleaned)
    final_nulls = int(cleaned.isnull().sum().sum())
    
    # Return preview info and sample records
    preview_records = cleaned.head(20).fillna("").to_dict(orient="records")
    
    return {
        "original_rows": original_rows,
        "final_rows": final_rows,
        "rows_removed": original_rows - final_rows,
        "original_nulls": original_nulls,
        "final_nulls": final_nulls,
        "actions_taken": actions_taken,
        "preview_records": preview_records,
        "columns": list(cleaned.columns)
    }

def apply_cleaning_operations(
    df: pd.DataFrame,
    operations: Dict[str, Any]
) -> pd.DataFrame:
    # Executes the approved cleaning operations and returns the new DataFrame
    preview = preview_cleaning_operations(df, operations)
    # Perform actual modifications
    cleaned = df.copy()
    
    if operations.get("drop_duplicates"):
        cleaned = cleaned.drop_duplicates()
        
    if operations.get("drop_high_null_columns"):
        threshold = float(operations.get("null_threshold_pct", 50.0))
        dropped_cols = [c for c in cleaned.columns if (cleaned[c].isnull().sum() / len(cleaned)) * 100.0 > threshold]
        if dropped_cols:
            cleaned = cleaned.drop(columns=dropped_cols)
            
    impute_strategy = operations.get("impute_strategy")
    if impute_strategy:
        for col in cleaned.columns:
            if cleaned[col].isnull().sum() > 0:
                if pd.api.types.is_numeric_dtype(cleaned[col]):
                    val = cleaned[col].median() if impute_strategy in ["smart", "median_mode"] else 0
                    cleaned[col] = cleaned[col].fillna(val)
                else:
                    mode_s = cleaned[col].mode()
                    val = mode_s.iloc[0] if (len(mode_s) > 0 and impute_strategy in ["smart", "median_mode"]) else "Unknown"
                    cleaned[col] = cleaned[col].fillna(val)
                    
    if operations.get("handle_outliers"):
        outlier_method = operations.get("outlier_method", "clip")
        for col in cleaned.select_dtypes(include=[np.number]).columns:
            q25 = cleaned[col].quantile(0.25)
            q75 = cleaned[col].quantile(0.75)
            iqr = q75 - q25
            if iqr > 0:
                lower = q25 - 1.5 * iqr
                upper = q75 + 1.5 * iqr
                if outlier_method == "clip":
                    cleaned[col] = cleaned[col].clip(lower=lower, upper=upper)
                elif outlier_method == "remove":
                    cleaned = cleaned[(cleaned[col] >= lower) & (cleaned[col] <= upper)]
                    
    return cleaned
