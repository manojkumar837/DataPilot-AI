from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.services.kpi_service import calculate_kpis
from app.services.recommendation_service import prepare_chart_data

def apply_filters_to_dataframe(
    df: pd.DataFrame,
    filters: Dict[str, Any]
) -> pd.DataFrame:
    if df.empty or not filters:
        return df
        
    filtered_df = df.copy()
    
    # 1. Date range filter
    date_filter = filters.get("date_range")
    if date_filter and isinstance(date_filter, dict):
        col = date_filter.get("column")
        start = date_filter.get("start")
        end = date_filter.get("end")
        if col and col in filtered_df.columns:
            try:
                date_s = pd.to_datetime(filtered_df[col], errors="coerce")
                if start:
                    start_dt = pd.to_datetime(start)
                    filtered_df = filtered_df[date_s >= start_dt]
                    date_s = pd.to_datetime(filtered_df[col], errors="coerce")
                if end:
                    end_dt = pd.to_datetime(end)
                    filtered_df = filtered_df[date_s <= end_dt]
            except Exception:
                pass
                
    # 2. Categorical filters (including cross-filtering selections)
    cat_filters = filters.get("categories", {})
    if isinstance(cat_filters, dict):
        for col, selected_vals in cat_filters.items():
            if col in filtered_df.columns and selected_vals:
                if isinstance(selected_vals, list):
                    vals_str = [str(v) for v in selected_vals]
                    filtered_df = filtered_df[filtered_df[col].astype(str).isin(vals_str)]
                else:
                    filtered_df = filtered_df[filtered_df[col].astype(str) == str(selected_vals)]
                    
    # 3. Numeric range filters
    num_filters = filters.get("numeric_ranges", {})
    if isinstance(num_filters, dict):
        for col, rng in num_filters.items():
            if col in filtered_df.columns and isinstance(rng, dict):
                min_val = rng.get("min")
                max_val = rng.get("max")
                if min_val is not None:
                    filtered_df = filtered_df[filtered_df[col] >= float(min_val)]
                if max_val is not None:
                    filtered_df = filtered_df[filtered_df[col] <= float(max_val)]
                    
    # 4. Search query
    search_q = filters.get("search_query")
    if search_q and isinstance(search_q, str) and search_q.strip():
        q = search_q.strip().lower()
        # Search text / object columns
        text_cols = [c for c in filtered_df.columns if filtered_df[c].dtype == "object"]
        if text_cols:
            mask = pd.Series(False, index=filtered_df.index)
            for c in text_cols:
                mask = mask | filtered_df[c].astype(str).str.lower().str.contains(q, na=False, regex=False)
            filtered_df = filtered_df[mask]
            
    return filtered_df

def execute_dashboard_query(
    df: pd.DataFrame,
    columns_meta: List[Dict[str, Any]],
    charts_config: List[Dict[str, Any]],
    filters: Dict[str, Any],
    table_page: int = 1,
    table_page_size: int = 50
) -> Dict[str, Any]:
    total_unfiltered_rows = len(df)
    filtered_df = apply_filters_to_dataframe(df, filters)
    filtered_rows = len(filtered_df)
    
    # Recalculate KPIs
    date_cols = [c["name"] for c in columns_meta if c["data_type"] == "datetime"]
    date_col = date_cols[0] if date_cols else None
    updated_kpis = calculate_kpis(filtered_df, columns_meta, date_col=date_col)
    
    # Recalculate chart data
    updated_charts = []
    for chart in charts_config:
        c_copy = dict(chart)
        c_type = chart.get("type", "bar")
        x_col = chart.get("x_column")
        y_col = chart.get("y_column")
        agg = chart.get("aggregation", "sum")
        group_col = chart.get("group_column")
        
        c_copy["data"] = prepare_chart_data(
            filtered_df,
            chart_type=c_type,
            x_col=x_col,
            y_col=y_col,
            agg=agg,
            group_col=group_col
        )
        updated_charts.append(c_copy)
        
    # Paginated data table preview
    start_idx = (table_page - 1) * table_page_size
    end_idx = start_idx + table_page_size
    records = filtered_df.iloc[start_idx:end_idx].fillna("").to_dict(orient="records")
    
    return {
        "total_unfiltered_rows": total_unfiltered_rows,
        "filtered_rows": filtered_rows,
        "filter_ratio": round(filtered_rows / max(1, total_unfiltered_rows) * 100, 1),
        "kpis": updated_kpis,
        "charts": updated_charts,
        "table": {
            "records": records,
            "total_records": filtered_rows,
            "page": table_page,
            "page_size": table_page_size,
            "total_pages": int(np.ceil(filtered_rows / max(1, table_page_size)))
        }
    }
