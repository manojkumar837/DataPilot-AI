import re
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

CURRENCY_KEYWORDS = {"price", "cost", "revenue", "sales", "profit", "fee", "salary", "amount", "balance", "spend", "charge", "income", "budget", "wage", "rate_pay"}
PERCENT_KEYWORDS = {"percent", "pct", "rate", "ratio", "margin", "discount", "share", "roi", "probability"}
ID_KEYWORDS = {"id", "uuid", "guid", "code", "key", "number", "no", "ssn", "identifier", "sku", "index"}

def is_date_candidate(series: pd.Series) -> bool:
    if pd.api.types.is_datetime64_any_dtype(series):
        return True
    
    col_name = str(series.name).lower()
    if any(k in col_name for k in ["date", "time", "timestamp", "year", "month", "day", "created_at", "updated_at", "order_date"]):
        # Test a non-null sample
        sample = series.dropna().head(20).astype(str)
        if len(sample) == 0:
            return False
        try:
            pd.to_datetime(sample, errors="raise")
            return True
        except Exception:
            return False
            
    # Sample check for typical string dates like 2023-01-01 or 01/15/2023
    if series.dtype == "object":
        sample = series.dropna().head(10).astype(str)
        if len(sample) >= 3:
            # Quick regex check for date-like formats
            date_pattern = re.compile(r'^\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}')
            matches = sum(bool(date_pattern.search(s.strip())) for s in sample)
            if matches / len(sample) >= 0.7:
                try:
                    pd.to_datetime(sample, errors="raise")
                    return True
                except Exception:
                    return False
    return False

def detect_column_type(series: pd.Series, total_rows: int) -> Dict[str, Any]:
    col_name = str(series.name).lower().strip()
    n_unique = series.nunique(dropna=True)
    null_count = int(series.isnull().sum())
    non_null_count = total_rows - null_count
    
    is_bool = pd.api.types.is_bool_dtype(series) or (n_unique <= 2 and set(series.dropna().unique()).issubset({0, 1, "0", "1", True, False, "true", "false", "True", "False", "yes", "no", "Yes", "No", "Y", "N"}))
    
    if is_bool:
        return {
            "data_type": "boolean",
            "semantic_type": "boolean",
            "is_identifier": False,
            "is_measure": False,
            "is_dimension": True
        }
        
    if is_date_candidate(series):
        return {
            "data_type": "datetime",
            "semantic_type": "datetime",
            "is_identifier": False,
            "is_measure": False,
            "is_dimension": True
        }
        
    # Check for identifier
    # If column name ends with id or contains id/code/key and distinct ratio is very high
    is_id_name = any(re.search(rf"\b{k}\b", col_name) or col_name.endswith(f"_{k}") or col_name.endswith(k) for k in ID_KEYWORDS)
    if non_null_count > 0:
        uniqueness_ratio = n_unique / non_null_count
    else:
        uniqueness_ratio = 0.0
        
    if (is_id_name and uniqueness_ratio > 0.8) or (uniqueness_ratio == 1.0 and total_rows > 30 and (pd.api.types.is_integer_dtype(series) or series.dtype == "object")):
        return {
            "data_type": "identifier",
            "semantic_type": "identifier",
            "is_identifier": True,
            "is_measure": False,
            "is_dimension": False
        }
        
    if pd.api.types.is_numeric_dtype(series):
        # Determine semantic subtype
        is_curr = any(k in col_name for k in CURRENCY_KEYWORDS)
        is_pct = any(k in col_name for k in PERCENT_KEYWORDS)
        
        # If low cardinality integers, could be categorical rating / tier
        if n_unique <= 6 and series.min() >= 1 and series.max() <= 10 and not is_curr:
            semantic = "rating" if "rating" in col_name or "score" in col_name else "discrete_numeric"
        elif is_curr:
            semantic = "currency"
        elif is_pct:
            semantic = "percentage"
        else:
            semantic = "numeric"
            
        return {
            "data_type": "numeric",
            "semantic_type": semantic,
            "is_identifier": False,
            "is_measure": True,
            "is_dimension": False
        }
        
    # Categorical
    return {
        "data_type": "categorical",
        "semantic_type": "categorical",
        "is_identifier": False,
        "is_measure": False,
        "is_dimension": True
    }

def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_rows = int(df.duplicated().sum())
    
    columns_meta = []
    numeric_summaries = {}
    categorical_summaries = {}
    date_summaries = {}
    
    total_cells = total_rows * total_cols
    total_missing = int(df.isnull().sum().sum())
    
    column_quality_issues = []
    
    for col in df.columns:
        series = df[col]
        null_count = int(series.isnull().sum())
        null_pct = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        n_unique = int(series.nunique(dropna=True))
        
        type_info = detect_column_type(series, total_rows)
        data_type = type_info["data_type"]
        semantic_type = type_info["semantic_type"]
        
        col_meta = {
            "name": col,
            "data_type": data_type,
            "semantic_type": semantic_type,
            "is_identifier": type_info["is_identifier"],
            "is_measure": type_info["is_measure"],
            "is_dimension": type_info["is_dimension"],
            "null_count": null_count,
            "null_percentage": null_pct,
            "distinct_count": n_unique
        }
        
        if null_pct > 10.0:
            column_quality_issues.append({
                "column": col,
                "type": "high_missing",
                "severity": "warning" if null_pct < 40 else "critical",
                "message": f"Column '{col}' has {null_pct}% missing values ({null_count} null rows)."
            })
            
        # Detailed stats per type
        if data_type == "numeric" and not type_info["is_identifier"]:
            clean_s = pd.to_numeric(series, errors="coerce").dropna()
            if len(clean_s) > 0:
                q25 = float(clean_s.quantile(0.25))
                q75 = float(clean_s.quantile(0.75))
                iqr = q75 - q25
                lower_bound = q25 - 1.5 * iqr
                upper_bound = q75 + 1.5 * iqr
                outliers = clean_s[(clean_s < lower_bound) | (clean_s > upper_bound)]
                outlier_count = int(len(outliers))
                
                num_summary = {
                    "min": float(clean_s.min()),
                    "max": float(clean_s.max()),
                    "mean": round(float(clean_s.mean()), 2),
                    "median": round(float(clean_s.median()), 2),
                    "std": round(float(clean_s.std()), 2) if len(clean_s) > 1 else 0.0,
                    "sum": round(float(clean_s.sum()), 2),
                    "q25": round(q25, 2),
                    "q75": round(q75, 2),
                    "outlier_count": outlier_count,
                    "outlier_pct": round(outlier_count / len(clean_s) * 100, 2)
                }
                numeric_summaries[col] = num_summary
                col_meta["stats"] = num_summary
                
                if outlier_count > 0 and (outlier_count / len(clean_s)) > 0.05:
                    column_quality_issues.append({
                        "column": col,
                        "type": "outliers",
                        "severity": "info",
                        "message": f"Column '{col}' has {outlier_count} potential statistical outliers ({round(outlier_count / len(clean_s) * 100, 1)}%)."
                    })
                    
        elif data_type == "categorical" or type_info["is_identifier"]:
            val_counts = series.dropna().astype(str).value_counts().head(10)
            top_values = [{"value": str(k), "count": int(v), "pct": round(int(v) / total_rows * 100, 1)} for k, v in val_counts.items()]
            cat_summary = {
                "distinct_count": n_unique,
                "top_values": top_values
            }
            categorical_summaries[col] = cat_summary
            col_meta["top_values"] = top_values
            
        elif data_type == "datetime":
            try:
                date_s = pd.to_datetime(series, errors="coerce").dropna()
                if len(date_s) > 0:
                    min_d = date_s.min()
                    max_d = date_s.max()
                    date_sum = {
                        "min_date": str(min_d),
                        "max_date": str(max_d),
                        "span_days": int((max_d - min_d).days)
                    }
                    date_summaries[col] = date_sum
                    col_meta["date_summary"] = date_sum
            except Exception:
                pass
                
        columns_meta.append(col_meta)
        
    # Data quality score (0-100)
    completeness = max(0.0, 100.0 - (total_missing / max(1, total_cells) * 100.0))
    uniqueness = max(0.0, 100.0 - (duplicate_rows / max(1, total_rows) * 100.0))
    overall_score = round((completeness * 0.6) + (uniqueness * 0.4), 1)
    
    if duplicate_rows > 0:
        column_quality_issues.append({
            "column": "_dataset",
            "type": "duplicate_rows",
            "severity": "warning",
            "message": f"Found {duplicate_rows} duplicate rows ({round(duplicate_rows/total_rows*100, 1)}% of dataset)."
        })
        
    quality_report = {
        "score": overall_score,
        "grade": "Excellent" if overall_score >= 90 else "Good" if overall_score >= 75 else "Fair" if overall_score >= 60 else "Needs Attention",
        "completeness_score": round(completeness, 1),
        "uniqueness_score": round(uniqueness, 1),
        "total_missing": total_missing,
        "total_missing_pct": round(total_missing / max(1, total_cells) * 100, 2),
        "duplicate_rows": duplicate_rows,
        "issues": column_quality_issues
    }
    
    summary = {
        "row_count": total_rows,
        "col_count": total_cols,
        "duplicate_rows": duplicate_rows,
        "total_missing": total_missing,
        "numeric_summaries": numeric_summaries,
        "categorical_summaries": categorical_summaries,
        "date_summaries": date_summaries,
        "quality_report": quality_report
    }
    
    return {
        "columns": columns_meta,
        "summary": summary
    }
