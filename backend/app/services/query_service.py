import re
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.services.kpi_service import format_metric_value
from app.services.recommendation_service import prepare_chart_data

def get_predefined_questions(columns_meta: List[Dict[str, Any]]) -> List[str]:
    numeric_cols = [c["name"] for c in columns_meta if c["data_type"] == "numeric" and not c.get("is_identifier")]
    cat_cols = [c["name"] for c in columns_meta if c["data_type"] in ["categorical", "boolean"] and not c.get("is_identifier")]
    date_cols = [c["name"] for c in columns_meta if c["data_type"] == "datetime"]
    
    primary_num = numeric_cols[0] if numeric_cols else None
    primary_cat = cat_cols[0] if cat_cols else None
    
    questions = ["What are the main insights in this dataset?"]
    
    if primary_cat and primary_num:
        questions.append(f"Which {primary_cat} has the highest {primary_num}?")
        questions.append(f"Compare {primary_num} across {primary_cat}")
        
    if date_cols and primary_num:
        questions.append(f"Show monthly trends for {primary_num}")
        
    if primary_num:
        questions.append(f"What is the average {primary_num}?")
        questions.append(f"Are there any outliers in {primary_num}?")
        
    return questions[:6]

def answer_data_query(
    df: pd.DataFrame,
    columns_meta: List[Dict[str, Any]],
    query: str
) -> Dict[str, Any]:
    if df.empty:
        return {
            "answer": "The dataset is currently empty. Please upload data or reset active filters.",
            "chart": None,
            "table": None,
            "suggested_followups": []
        }
        
    q_lower = query.lower().strip()
    col_map = {c["name"].lower(): c["name"] for c in columns_meta}
    numeric_cols = [c["name"] for c in columns_meta if c["data_type"] == "numeric" and not c.get("is_identifier")]
    cat_cols = [c["name"] for c in columns_meta if c["data_type"] in ["categorical", "boolean"] and not c.get("is_identifier")]
    date_cols = [c["name"] for c in columns_meta if c["data_type"] == "datetime"]
    
    # Helper to find referenced column in query
    def find_mentioned_col(candidates):
        for c in candidates:
            if c.lower() in q_lower:
                return c
        return None
        
    matched_num = find_mentioned_col(numeric_cols) or (numeric_cols[0] if numeric_cols else None)
    matched_cat = find_mentioned_col(cat_cols) or (cat_cols[0] if cat_cols else None)
    matched_date = find_mentioned_col(date_cols) or (date_cols[0] if date_cols else None)
    
    # 1. Main Insights / Summary
    if any(k in q_lower for k in ["main insight", "key insight", "overview", "summary", "summarize", "tell me about"]):
        from app.services.insights_service import generate_rule_based_insights
        insights = generate_rule_based_insights(df, columns_meta)
        if not insights:
            return {
                "answer": f"Dataset contains {len(df):,} records and {len(columns_meta)} columns. No significant anomalies or variances detected.",
                "chart": None,
                "table": None,
                "suggested_followups": get_predefined_questions(columns_meta)
            }
        bullets = "\n".join([f"• **{i['title']}**: {i['measured_fact']}" for i in insights[:3]])
        return {
            "answer": f"Here are the top findings from your data:\n\n{bullets}",
            "chart": None,
            "table": None,
            "suggested_followups": [
                f"Which {cat_cols[0]} has the highest {numeric_cols[0]}?" if (cat_cols and numeric_cols) else "Show monthly trends",
                "Are there any outliers in this dataset?"
            ]
        }
        
    # 2. Outliers / Anomalies
    if any(k in q_lower for k in ["outlier", "anomaly", "anomalies", "unusual", "pattern", "abnormal"]):
        if not numeric_cols:
            return {
                "answer": "No numeric columns are available to perform statistical outlier detection.",
                "chart": None,
                "table": None,
                "suggested_followups": get_predefined_questions(columns_meta)
            }
        target_num = matched_num or numeric_cols[0]
        s = pd.to_numeric(df[target_num], errors="coerce").dropna()
        q25 = s.quantile(0.25)
        q75 = s.quantile(0.75)
        iqr = q75 - q25
        lower = q25 - 1.5 * iqr
        upper = q75 + 1.5 * iqr
        outliers_df = df[(df[target_num] < lower) | (df[target_num] > upper)]
        outlier_count = len(outliers_df)
        
        if outlier_count == 0:
            ans = f"No significant statistical outliers were detected in '{target_num}'. All values fall within standard IQR thresholds ({lower:.2f} to {upper:.2f})."
            c_data = None
        else:
            ans = f"Found **{outlier_count} potential outlier(s)** in '{target_num}'. The expected normal range is between {lower:,.2f} and {upper:,.2f}. The highest outlier is **{s.max():,.2f}** and the lowest is **{s.min():,.2f}**."
            c_data = prepare_chart_data(df, "histogram", x_col=target_num)
            
        return {
            "answer": ans,
            "chart": {
                "type": "histogram",
                "title": f"Distribution and Outliers in {target_num}",
                "data": c_data,
                "x_column": target_num
            } if c_data else None,
            "table": None,
            "suggested_followups": [f"What is the average {target_num}?", "Show monthly trends"]
        }
        
    # 3. Monthly Trends / Over Time
    if any(k in q_lower for k in ["trend", "monthly", "over time", "timeline", "history", "by date", "growth"]):
        if not date_cols:
            return {
                "answer": "This dataset does not contain a detected datetime column to display temporal trends. You can compare categories or calculate averages instead.",
                "chart": None,
                "table": None,
                "suggested_followups": [f"Compare {numeric_cols[0]} across {cat_cols[0]}"] if (numeric_cols and cat_cols) else []
            }
        target_date = matched_date or date_cols[0]
        target_num = matched_num or (numeric_cols[0] if numeric_cols else None)
        
        if not target_num:
            return {
                "answer": f"Found date column '{target_date}', but no numeric measure to plot over time.",
                "chart": None,
                "table": None,
                "suggested_followups": []
            }
            
        chart_data = prepare_chart_data(df, "area", x_col=target_date, y_col=target_num, agg="sum")
        if not chart_data:
            return {
                "answer": f"Unable to aggregate '{target_num}' over time using '{target_date}'.",
                "chart": None,
                "table": None,
                "suggested_followups": []
            }
            
        first_val = chart_data[0].get("value", 0)
        last_val = chart_data[-1].get("value", 0)
        chg = ((last_val - first_val) / max(0.01, abs(first_val))) * 100 if first_val != 0 else 0
        
        ans = f"Monthly trend for **{target_num}** using '{target_date}':\n• Starting period ({chart_data[0]['period']}): **{first_val:,.2f}**\n• Latest period ({chart_data[-1]['period']}): **{last_val:,.2f}**\n• Overall change: **{chg:+.1f}%** across {len(chart_data)} periods."
        
        return {
            "answer": ans,
            "chart": {
                "type": "area",
                "title": f"{target_num} Trend Over Time",
                "data": chart_data,
                "x_column": target_date,
                "y_column": target_num
            },
            "table": None,
            "suggested_followups": [f"Which {cat_cols[0]} has the highest {target_num}?"] if cat_cols else []
        }
        
    # 4. Highest / Top / Best Category
    if any(k in q_lower for k in ["highest", "top", "best", "most", "maximum", "max", "leader"]):
        if not cat_cols or not numeric_cols:
            return {
                "answer": f"To find the highest category, both a category and a numeric measure are required. Available categories: {', '.join(cat_cols) or 'None'}.",
                "chart": None,
                "table": None,
                "suggested_followups": get_predefined_questions(columns_meta)
            }
        target_cat = matched_cat or cat_cols[0]
        target_num = matched_num or numeric_cols[0]
        
        grouped = df.groupby(target_cat)[target_num].sum().sort_values(ascending=False).reset_index()
        top_row = grouped.iloc[0]
        top_name = str(top_row[target_cat])
        top_val = float(top_row[target_num])
        total_val = float(grouped[target_num].sum())
        pct = (top_val / max(0.01, total_val)) * 100
        
        chart_data = [{"name": str(r[target_cat]), "value": round(float(r[target_num]), 2)} for _, r in grouped.head(8).iterrows()]
        
        ans = f"The top **{target_cat}** by total **{target_num}** is **'{top_name}'** with **{top_val:,.2f}** ({pct:.1f}% of all {target_num})."
        
        return {
            "answer": ans,
            "chart": {
                "type": "bar",
                "title": f"Top {target_cat} by {target_num}",
                "data": chart_data,
                "x_column": target_cat,
                "y_column": target_num
            },
            "table": grouped.head(5).to_dict(orient="records"),
            "suggested_followups": [
                f"Which {target_cat} has the lowest {target_num}?",
                f"What is the average {target_num}?"
            ]
        }
        
    # 5. Lowest / Worst Category
    if any(k in q_lower for k in ["lowest", "worst", "least", "bottom", "minimum", "min"]):
        if not cat_cols or not numeric_cols:
            return {
                "answer": "Category and numeric columns are required to evaluate the lowest values.",
                "chart": None,
                "table": None,
                "suggested_followups": get_predefined_questions(columns_meta)
            }
        target_cat = matched_cat or cat_cols[0]
        target_num = matched_num or numeric_cols[0]
        
        grouped = df.groupby(target_cat)[target_num].sum().sort_values(ascending=True).reset_index()
        bottom_row = grouped.iloc[0]
        bottom_name = str(bottom_row[target_cat])
        bottom_val = float(bottom_row[target_num])
        total_val = float(grouped[target_num].sum())
        pct = (bottom_val / max(0.01, total_val)) * 100
        
        ans = f"The lowest **{target_cat}** by total **{target_num}** is **'{bottom_name}'** with **{bottom_val:,.2f}** ({pct:.1f}% of total)."
        return {
            "answer": ans,
            "chart": None,
            "table": grouped.head(5).to_dict(orient="records"),
            "suggested_followups": [f"Which {target_cat} has the highest {target_num}?"]
        }
        
    # 6. Compare Across Categories
    if any(k in q_lower for k in ["compare", "comparison", "across", "breakdown", "versus", "vs", "distribution"]):
        target_cat = matched_cat or (cat_cols[0] if cat_cols else None)
        target_num = matched_num or (numeric_cols[0] if numeric_cols else None)
        
        if not target_cat:
            return {
                "answer": "No categorical breakdown column was found. Please specify a category like " + ", ".join(cat_cols[:3]),
                "chart": None,
                "table": None,
                "suggested_followups": []
            }
            
        chart_data = prepare_chart_data(df, "bar", x_col=target_cat, y_col=target_num, agg="sum", limit=8)
        ans = f"Breakdown of **{target_num or 'Records'}** compared across **{target_cat}** ({len(chart_data)} categories shown):"
        return {
            "answer": ans,
            "chart": {
                "type": "bar",
                "title": f"{target_num or 'Count'} by {target_cat}",
                "data": chart_data,
                "x_column": target_cat,
                "y_column": target_num
            },
            "table": None,
            "suggested_followups": [f"Which {target_cat} has the highest {target_num}?"] if target_num else []
        }
        
    # 7. Average / Mean
    if any(k in q_lower for k in ["average", "mean", "avg"]):
        target_num = matched_num or (numeric_cols[0] if numeric_cols else None)
        if not target_num:
            return {
                "answer": "Please specify a numeric column to calculate the average. Available: " + ", ".join(numeric_cols[:4]),
                "chart": None,
                "table": None,
                "suggested_followups": []
            }
        s = pd.to_numeric(df[target_num], errors="coerce").dropna()
        avg = s.mean()
        med = s.median()
        std = s.std()
        ans = f"The **average {target_num}** is **{avg:,.2f}** (median: **{med:,.2f}**, std dev: **{std:,.2f}**, range: {s.min():,.2f} to {s.max():,.2f})."
        return {
            "answer": ans,
            "chart": None,
            "table": None,
            "suggested_followups": [f"Show monthly trends for {target_num}", f"Are there any outliers in {target_num}?"]
        }
        
    # 8. Total / Sum
    if any(k in q_lower for k in ["total", "sum", "overall"]):
        target_num = matched_num or (numeric_cols[0] if numeric_cols else None)
        if not target_num:
            return {
                "answer": f"Total record count in this dataset is **{len(df):,} rows**.",
                "chart": None,
                "table": None,
                "suggested_followups": get_predefined_questions(columns_meta)
            }
        s = pd.to_numeric(df[target_num], errors="coerce").dropna()
        total = s.sum()
        ans = f"The **total {target_num}** across all records is **{total:,.2f}** (based on {len(s):,} entries)."
        return {
            "answer": ans,
            "chart": None,
            "table": None,
            "suggested_followups": [f"What is the average {target_num}?", f"Which {cat_cols[0]} has the highest {target_num}?"] if cat_cols else []
        }
        
    # Fallback explanation
    available_cols = ", ".join([f"'{c['name']}' ({c['data_type']})" for c in columns_meta[:8]])
    return {
        "answer": f"I couldn't directly map '{query}' to a single operation. You can ask about averages, totals, top categories, monthly trends, or outliers.\n\nAvailable columns in this dataset: {available_cols}.",
        "chart": None,
        "table": None,
        "suggested_followups": get_predefined_questions(columns_meta)
    }
