import re
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

def format_metric_value(val: float, format_type: str = "number") -> str:
    if val is None or np.isnan(val):
        return "N/A"
        
    abs_val = abs(val)
    prefix = "-" if val < 0 else ""
    
    if format_type == "currency":
        curr_symbol = "$"
        if abs_val >= 1_000_000_000:
            return f"{prefix}{curr_symbol}{abs_val/1_000_000_000:.2f}B"
        elif abs_val >= 1_000_000:
            return f"{prefix}{curr_symbol}{abs_val/1_000_000:.2f}M"
        elif abs_val >= 1_000:
            return f"{prefix}{curr_symbol}{abs_val/1_000:.1f}K"
        else:
            return f"{prefix}{curr_symbol}{abs_val:.2f}"
            
    elif format_type == "percentage":
        # Check if already 0-100 or 0-1
        display_val = val * 100 if abs_val <= 1.0 else val
        return f"{display_val:.1f}%"
        
    else:  # Standard number
        if abs_val >= 1_000_000_000:
            return f"{prefix}{abs_val/1_000_000_000:.2f}B"
        elif abs_val >= 1_000_000:
            return f"{prefix}{abs_val/1_000_000:.2f}M"
        elif abs_val >= 10_000:
            return f"{prefix}{abs_val/1_000:.1f}K"
        elif isinstance(val, int) or val.is_integer():
            return f"{int(val):,}"
        else:
            return f"{val:,.2f}"

def calculate_kpis(
    df: pd.DataFrame,
    columns_meta: List[Dict[str, Any]],
    date_col: Optional[str] = None
) -> List[Dict[str, Any]]:
    if df.empty:
        return []
        
    col_map = {c["name"]: c for c in columns_meta}
    numeric_cols = [c["name"] for c in columns_meta if c["data_type"] == "numeric" and not c.get("is_identifier")]
    total_records = len(df)
    
    kpis: List[Dict[str, Any]] = []
    used_cols = set()
    
    # 1. Check for Entity / Record Count
    id_cols = [c["name"] for c in columns_meta if c.get("is_identifier")]
    customer_cols = [c for c in df.columns if "customer" in c.lower() or "client" in c.lower()]
    employee_cols = [c for c in df.columns if "employee" in c.lower() or "worker" in c.lower() or "staff" in c.lower()]
    order_cols = [c for c in df.columns if "order" in c.lower() and ("id" in c.lower() or "number" in c.lower() or "code" in c.lower())]
    
    # Order Count
    if order_cols:
        col = order_cols[0]
        cnt = int(df[col].nunique(dropna=True))
        kpis.append({
            "id": "kpi_orders",
            "title": "Total Orders",
            "value": cnt,
            "formatted_value": format_metric_value(cnt, "number"),
            "format_type": "number",
            "aggregation": "distinct_count",
            "column": col,
            "icon": "ShoppingCart"
        })
    elif customer_cols:
        col = customer_cols[0]
        cnt = int(df[col].nunique(dropna=True))
        kpis.append({
            "id": "kpi_customers",
            "title": "Total Customers",
            "value": cnt,
            "formatted_value": format_metric_value(cnt, "number"),
            "format_type": "number",
            "aggregation": "distinct_count",
            "column": col,
            "icon": "Users"
        })
    elif employee_cols:
        col = employee_cols[0]
        cnt = int(df[col].nunique(dropna=True))
        kpis.append({
            "id": "kpi_employees",
            "title": "Total Employees",
            "value": cnt,
            "formatted_value": format_metric_value(cnt, "number"),
            "format_type": "number",
            "aggregation": "distinct_count",
            "column": col,
            "icon": "UserCheck"
        })
    else:
        kpis.append({
            "id": "kpi_total_records",
            "title": "Total Records",
            "value": total_records,
            "formatted_value": format_metric_value(total_records, "number"),
            "format_type": "number",
            "aggregation": "count",
            "column": "_rows",
            "icon": "Database"
        })
        
    # 2. Check for Revenue / Sales
    rev_matches = [c for c in numeric_cols if any(k in c.lower() for k in ["revenue", "sales", "income", "turnover", "total_amount", "spend"])]
    if rev_matches:
        col = rev_matches[0]
        val = float(df[col].sum(skipna=True))
        used_cols.add(col)
        title = "Total Revenue" if "revenue" in col.lower() else "Total Sales" if "sales" in col.lower() else f"Total {col}"
        kpis.append({
            "id": "kpi_revenue",
            "title": title,
            "value": round(val, 2),
            "formatted_value": format_metric_value(val, "currency"),
            "format_type": "currency",
            "aggregation": "sum",
            "column": col,
            "icon": "DollarSign"
        })
        
    # 3. Check for Profit / Margin
    profit_matches = [c for c in numeric_cols if any(k in c.lower() for k in ["profit", "net_income", "margin", "gain"]) and c not in used_cols]
    if profit_matches:
        col = profit_matches[0]
        val = float(df[col].sum(skipna=True))
        used_cols.add(col)
        is_pct = col_map.get(col, {}).get("semantic_type") == "percentage" or "rate" in col.lower()
        fmt = "percentage" if is_pct else "currency"
        kpis.append({
            "id": "kpi_profit",
            "title": f"Total {col}",
            "value": round(val, 2),
            "formatted_value": format_metric_value(val, fmt),
            "format_type": fmt,
            "aggregation": "sum" if not is_pct else "avg",
            "column": col,
            "icon": "TrendingUp"
        })
        
    # 4. Check for Average / Rating / Score
    rating_matches = [c for c in numeric_cols if any(k in c.lower() for k in ["rating", "score", "satisfaction", "satisfaction_level"]) and c not in used_cols]
    if rating_matches:
        col = rating_matches[0]
        avg_val = float(df[col].mean(skipna=True))
        used_cols.add(col)
        kpis.append({
            "id": "kpi_rating",
            "title": f"Average {col}",
            "value": round(avg_val, 2),
            "formatted_value": f"{avg_val:.2f}",
            "format_type": "decimal",
            "aggregation": "avg",
            "column": col,
            "icon": "Star"
        })
    elif rev_matches and order_cols:
        # AOV: Average Order Value
        rev_val = float(df[rev_matches[0]].sum(skipna=True))
        n_orders = max(1, int(df[order_cols[0]].nunique(dropna=True)))
        aov = rev_val / n_orders
        kpis.append({
            "id": "kpi_aov",
            "title": "Avg Order Value",
            "value": round(aov, 2),
            "formatted_value": format_metric_value(aov, "currency"),
            "format_type": "currency",
            "aggregation": "avg",
            "column": rev_matches[0],
            "icon": "Activity"
        })
        
    # 5. Quantity / Volume
    qty_matches = [c for c in numeric_cols if any(k in c.lower() for k in ["qty", "quantity", "units", "items", "volume"]) and c not in used_cols]
    if qty_matches and len(kpis) < 5:
        col = qty_matches[0]
        qty_val = float(df[col].sum(skipna=True))
        used_cols.add(col)
        kpis.append({
            "id": "kpi_quantity",
            "title": f"Total {col}",
            "value": round(qty_val, 2),
            "formatted_value": format_metric_value(qty_val, "number"),
            "format_type": "number",
            "aggregation": "sum",
            "column": col,
            "icon": "Layers"
        })
        
    # 6. Fallback generic KPIs if we have fewer than 4 KPIs and remaining numeric columns
    remaining_nums = [c for c in numeric_cols if c not in used_cols]
    for col in remaining_nums:
        if len(kpis) >= 4:
            break
        sem_type = col_map.get(col, {}).get("semantic_type", "numeric")
        fmt = "currency" if sem_type == "currency" else "percentage" if sem_type == "percentage" else "number"
        sum_val = float(df[col].sum(skipna=True))
        kpis.append({
            "id": f"kpi_{col.lower().replace(' ', '_')}",
            "title": f"Total {col}",
            "value": round(sum_val, 2),
            "formatted_value": format_metric_value(sum_val, fmt),
            "format_type": fmt,
            "aggregation": "sum",
            "column": col,
            "icon": "BarChart3"
        })
        used_cols.add(col)
        
    # Compute sparklines / trend percentage if date_col is present
    if date_col and date_col in df.columns:
        try:
            df_temp = df.copy()
            df_temp["_parsed_date"] = pd.to_datetime(df_temp[date_col], errors="coerce")
            df_temp = df_temp.dropna(subset=["_parsed_date"]).sort_values("_parsed_date")
            if len(df_temp) >= 6:
                # Divide into 8 equal buckets
                df_temp["_bucket"] = pd.qcut(df_temp["_parsed_date"].astype("int64"), q=min(8, len(df_temp)), labels=False, duplicates="drop")
                for kpi in kpis:
                    target_col = kpi.get("column")
                    if target_col and target_col in df_temp.columns and pd.api.types.is_numeric_dtype(df_temp[target_col]):
                        agg = kpi.get("aggregation", "sum")
                        spark = df_temp.groupby("_bucket")[target_col].agg(agg if agg in ["sum", "mean"] else "sum").tolist()
                        kpi["sparkline"] = [round(float(v), 2) for v in spark]
                        if len(spark) >= 2 and spark[0] != 0:
                            change = ((spark[-1] - spark[0]) / abs(spark[0])) * 100
                            kpi["change_pct"] = round(float(change), 1)
        except Exception:
            pass
            
    return kpis[:5]
