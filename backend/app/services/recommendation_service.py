import math
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.services.kpi_service import format_metric_value

def prepare_chart_data(
    df: pd.DataFrame,
    chart_type: str,
    x_col: str,
    y_col: Optional[str] = None,
    agg: str = "sum",
    group_col: Optional[str] = None,
    limit: int = 15
) -> List[Dict[str, Any]]:
    if df.empty:
        return []
        
    df_clean = df.copy()
    
    if chart_type in ["line", "area"]:
        # Time-series aggregation
        try:
            df_clean["_date"] = pd.to_datetime(df_clean[x_col], errors="coerce")
            df_clean = df_clean.dropna(subset=["_date"]).sort_values("_date")
            if df_clean.empty:
                return []
                
            # Choose intelligent frequency: Month ('M') if > 90 days, Day ('D') if <= 90 days, Year ('Y') if > 3 years
            span_days = (df_clean["_date"].max() - df_clean["_date"].min()).days
            if span_days > 1000:
                df_clean["_period"] = df_clean["_date"].dt.to_period("Y").astype(str)
            elif span_days > 60:
                df_clean["_period"] = df_clean["_date"].dt.to_period("M").astype(str)
            else:
                df_clean["_period"] = df_clean["_date"].dt.strftime("%Y-%m-%d")
                
            if group_col and group_col in df_clean.columns and group_col != x_col:
                top_groups = df_clean[group_col].value_counts().head(4).index.tolist()
                df_filtered = df_clean[df_clean[group_col].isin(top_groups)]
                pivot = df_filtered.pivot_table(
                    index="_period",
                    columns=group_col,
                    values=y_col,
                    aggfunc=agg if agg in ["sum", "mean", "count"] else "sum"
                ).fillna(0)
                records = []
                for idx, row in pivot.iterrows():
                    rec = {"period": str(idx)}
                    for col_name, val in row.items():
                        rec[str(col_name)] = round(float(val), 2)
                    records.append(rec)
                return records
            else:
                grouped = df_clean.groupby("_period")[y_col].agg(agg if agg in ["sum", "mean", "count"] else "sum").reset_index()
                return [{"period": str(row["_period"]), "value": round(float(row[y_col]), 2)} for _, row in grouped.iterrows()]
        except Exception:
            return []
            
    elif chart_type in ["bar", "donut", "pie"]:
        # Categorical aggregation
        try:
            df_clean[x_col] = df_clean[x_col].fillna("Unknown").astype(str)
            if y_col and y_col in df_clean.columns and pd.api.types.is_numeric_dtype(df_clean[y_col]):
                grouped = df_clean.groupby(x_col)[y_col].agg(agg if agg in ["sum", "mean", "count", "min", "max"] else "sum").reset_index()
                grouped = grouped.sort_values(by=y_col, ascending=False).head(limit)
                return [{"name": str(row[x_col]), "value": round(float(row[y_col]), 2)} for _, row in grouped.iterrows()]
            else:
                counts = df_clean[x_col].value_counts().head(limit).reset_index()
                counts.columns = ["name", "value"]
                return [{"name": str(row["name"]), "value": int(row["value"])} for _, row in counts.iterrows()]
        except Exception:
            return []
            
    elif chart_type == "scatter":
        # Two numeric columns
        try:
            sample_df = df_clean[[x_col, y_col]].dropna()
            if len(sample_df) > 250:
                sample_df = sample_df.sample(250, random_state=42)
            records = []
            for _, row in sample_df.iterrows():
                records.append({
                    "x": round(float(row[x_col]), 2),
                    "y": round(float(row[y_col]), 2)
                })
            return records
        except Exception:
            return []
            
    elif chart_type == "histogram":
        # Continuous numeric column binned
        try:
            clean_s = pd.to_numeric(df_clean[x_col], errors="coerce").dropna()
            if len(clean_s) == 0:
                return []
            counts, bin_edges = np.histogram(clean_s, bins=10)
            histogram_data = []
            for i in range(len(counts)):
                label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
                histogram_data.append({
                    "bin": label,
                    "count": int(counts[i]),
                    "min": round(float(bin_edges[i]), 1),
                    "max": round(float(bin_edges[i+1]), 1)
                })
            return histogram_data
        except Exception:
            return []
            
    return []

def generate_dashboard_charts(
    df: pd.DataFrame,
    columns_meta: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    col_map = {c["name"]: c for c in columns_meta}
    
    date_cols = [c["name"] for c in columns_meta if c["data_type"] == "datetime"]
    numeric_cols = [c["name"] for c in columns_meta if c["data_type"] == "numeric" and not c.get("is_identifier")]
    cat_cols = [c["name"] for c in columns_meta if (c["data_type"] in ["categorical", "boolean"] and not c.get("is_identifier") and 1 < c.get("distinct_count", 0) <= 60)]
    
    # Priority measures: revenue, sales, profit, amount, spend, score
    def measure_priority(c_name: str) -> int:
        name_l = c_name.lower()
        if any(k in name_l for k in ["revenue", "sales", "income"]):
            return 1
        if any(k in name_l for k in ["profit", "margin", "gain"]):
            return 2
        if any(k in name_l for k in ["spend", "cost", "expense", "amount"]):
            return 3
        if any(k in name_l for k in ["rating", "score", "performance"]):
            return 4
        if any(k in name_l for k in ["quantity", "qty", "volume"]):
            return 5
        return 10
        
    sorted_numeric = sorted(numeric_cols, key=measure_priority)
    primary_measure = sorted_numeric[0] if sorted_numeric else None
    secondary_measure = sorted_numeric[1] if len(sorted_numeric) > 1 else None
    
    charts: List[Dict[str, Any]] = []
    
    # 1. Main Trend Chart: Date + Primary Numeric
    if date_cols and primary_measure:
        d_col = date_cols[0]
        c_data = prepare_chart_data(df, "area", x_col=d_col, y_col=primary_measure, agg="sum")
        charts.append({
            "id": "chart_trend_main",
            "type": "area",
            "title": f"{primary_measure} Trend Over Time",
            "x_column": d_col,
            "y_column": primary_measure,
            "aggregation": "sum",
            "group_column": None,
            "x_label": "Time Period",
            "y_label": primary_measure,
            "format_type": col_map.get(primary_measure, {}).get("semantic_type", "currency"),
            "width": "2/3",  # Spans 8 cols in 12-col grid
            "data": c_data
        })
        
    # 2. Donut / Pie Chart: Category with Low Cardinality (2-7 values)
    low_cat_cols = [c for c in cat_cols if 2 <= col_map[c].get("distinct_count", 0) <= 7]
    donut_cat = low_cat_cols[0] if low_cat_cols else (cat_cols[0] if cat_cols else None)
    if donut_cat and primary_measure:
        c_data = prepare_chart_data(df, "donut", x_col=donut_cat, y_col=primary_measure, agg="sum", limit=6)
        charts.append({
            "id": "chart_donut_share",
            "type": "donut",
            "title": f"{primary_measure} Share by {donut_cat}",
            "x_column": donut_cat,
            "y_column": primary_measure,
            "aggregation": "sum",
            "group_column": None,
            "x_label": donut_cat,
            "y_label": primary_measure,
            "format_type": col_map.get(primary_measure, {}).get("semantic_type", "currency"),
            "width": "1/3",
            "data": c_data
        })
        
    # 3. Bar Chart: Major Breakdown (Top Categories)
    remaining_cats = [c for c in cat_cols if c != donut_cat]
    bar_cat = remaining_cats[0] if remaining_cats else donut_cat
    bar_measure = secondary_measure if secondary_measure else primary_measure
    if bar_cat and bar_measure:
        c_data = prepare_chart_data(df, "bar", x_col=bar_cat, y_col=bar_measure, agg="sum", limit=10)
        charts.append({
            "id": "chart_bar_comparison",
            "type": "bar",
            "title": f"{bar_measure} by {bar_cat}",
            "x_column": bar_cat,
            "y_column": bar_measure,
            "aggregation": "sum",
            "group_column": None,
            "x_label": bar_cat,
            "y_label": bar_measure,
            "format_type": col_map.get(bar_measure, {}).get("semantic_type", "numeric"),
            "width": "1/2",
            "data": c_data
        })
        
    # 4. Scatter Plot or Histogram
    if primary_measure and secondary_measure and primary_measure != secondary_measure:
        c_data = prepare_chart_data(df, "scatter", x_col=primary_measure, y_col=secondary_measure)
        charts.append({
            "id": "chart_scatter_corr",
            "type": "scatter",
            "title": f"{secondary_measure} vs {primary_measure} Correlation",
            "x_column": primary_measure,
            "y_column": secondary_measure,
            "aggregation": "none",
            "group_column": None,
            "x_label": primary_measure,
            "y_label": secondary_measure,
            "format_type": "number",
            "width": "1/2",
            "data": c_data
        })
    elif primary_measure:
        c_data = prepare_chart_data(df, "histogram", x_col=primary_measure)
        charts.append({
            "id": "chart_histogram_dist",
            "type": "histogram",
            "title": f"Distribution of {primary_measure}",
            "x_column": primary_measure,
            "y_column": None,
            "aggregation": "count",
            "group_column": None,
            "x_label": primary_measure,
            "y_label": "Frequency",
            "format_type": "number",
            "width": "1/2",
            "data": c_data
        })
        
    # 5. Multi-series or Secondary Bar Chart if more categories or dates exist
    if len(cat_cols) > 2 and primary_measure:
        third_cat = cat_cols[2]
        c_data = prepare_chart_data(df, "bar", x_col=third_cat, y_col=primary_measure, agg="avg", limit=8)
        charts.append({
            "id": "chart_bar_avg",
            "type": "bar",
            "title": f"Average {primary_measure} by {third_cat}",
            "x_column": third_cat,
            "y_column": primary_measure,
            "aggregation": "avg",
            "group_column": None,
            "x_label": third_cat,
            "y_label": f"Avg {primary_measure}",
            "format_type": col_map.get(primary_measure, {}).get("semantic_type", "numeric"),
            "width": "full",
            "data": c_data
        })
        
    # Fallback if no numeric measures: create frequency bar charts of top categories
    if not charts and cat_cols:
        for i, c in enumerate(cat_cols[:3]):
            c_data = prepare_chart_data(df, "bar", x_col=c, limit=8)
            charts.append({
                "id": f"chart_cat_freq_{i}",
                "type": "bar",
                "title": f"Record Counts by {c}",
                "x_column": c,
                "y_column": None,
                "aggregation": "count",
                "group_column": None,
                "x_label": c,
                "y_label": "Record Count",
                "format_type": "number",
                "width": "1/2" if i < 2 else "full",
                "data": c_data
            })
            
    return charts
