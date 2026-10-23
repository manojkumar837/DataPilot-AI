import os
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from app.services.kpi_service import format_metric_value
from app.config import OPENAI_API_KEY, GEMINI_API_KEY

def generate_rule_based_insights(
    df: pd.DataFrame,
    columns_meta: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    if df.empty:
        return []
        
    insights: List[Dict[str, Any]] = []
    
    col_map = {c["name"]: c for c in columns_meta}
    numeric_cols = [c["name"] for c in columns_meta if c["data_type"] == "numeric" and not c.get("is_identifier")]
    cat_cols = [c["name"] for c in columns_meta if c["data_type"] in ["categorical", "boolean"] and not c.get("is_identifier") and 2 <= c.get("distinct_count", 0) <= 50]
    date_cols = [c["name"] for c in columns_meta if c["data_type"] == "datetime"]
    
    # Priority numeric column
    def priority_sort(c):
        cl = c.lower()
        if "revenue" in cl or "sales" in cl: return 1
        if "profit" in cl or "income" in cl: return 2
        if "amount" in cl or "spend" in cl or "cost" in cl: return 3
        return 5
    sorted_nums = sorted(numeric_cols, key=priority_sort)
    primary_num = sorted_nums[0] if sorted_nums else None
    secondary_num = sorted_nums[1] if len(sorted_nums) > 1 else None
    
    # 1. Top & Bottom Performer
    if primary_num and cat_cols:
        target_cat = cat_cols[0]
        agg_data = df.groupby(target_cat)[primary_num].sum().sort_values(ascending=False)
        total_val = float(agg_data.sum())
        
        if len(agg_data) >= 2 and total_val > 0:
            top_name = str(agg_data.index[0])
            top_val = float(agg_data.iloc[0])
            top_pct = round((top_val / total_val) * 100, 1)
            
            bottom_name = str(agg_data.index[-1])
            bottom_val = float(agg_data.iloc[-1])
            bottom_pct = round((bottom_val / total_val) * 100, 1)
            
            fmt_type = col_map.get(primary_num, {}).get("semantic_type", "number")
            top_formatted = format_metric_value(top_val, fmt_type)
            bottom_formatted = format_metric_value(bottom_val, fmt_type)
            
            ratio = round(top_val / max(0.01, bottom_val), 1)
            
            insights.append({
                "id": "insight_top_performer",
                "category": "performance",
                "badge": "Top Performer",
                "severity": "positive",
                "title": f"Leading {target_cat}: {top_name}",
                "measured_fact": f"'{top_name}' generated {top_formatted} ({top_pct}% of total {primary_num}), exceeding the lowest segment '{bottom_name}' ({bottom_formatted}) by {ratio}x.",
                "detail": f"Based on aggregate sum of '{primary_num}' grouped across all {len(agg_data)} distinct categories of '{target_cat}'.",
                "recommendation": f"Evaluate high-performing practices in '{top_name}' to help scale performance in '{bottom_name}'."
            })
            
            # Check 80/20 Pareto Concentration
            cum_share = (agg_data.cumsum() / total_val).tolist()
            top_20_count = max(1, int(np.ceil(len(agg_data) * 0.2)))
            top_20_share = round(cum_share[top_20_count - 1] * 100, 1)
            if top_20_share >= 60.0:
                insights.append({
                    "id": "insight_pareto",
                    "category": "concentration",
                    "badge": "Pareto Concentration",
                    "severity": "info",
                    "title": f"High Concentration in {target_cat}",
                    "measured_fact": f"The top {top_20_count} {target_cat} category/categories account for {top_20_share}% of all {primary_num}.",
                    "detail": f"A small subset of {target_cat} contributes disproportionately to overall volume.",
                    "recommendation": f"Maintain strong retention and operational focus on these key {target_cat} segments to protect overall performance."
                })
                
    # 2. Time-series Trends & Milestones
    if date_cols and primary_num:
        d_col = date_cols[0]
        try:
            df_t = df.copy()
            df_t["_d"] = pd.to_datetime(df_t[d_col], errors="coerce")
            df_t = df_t.dropna(subset=["_d"]).sort_values("_d")
            
            if len(df_t) >= 10:
                df_t["_period"] = df_t["_d"].dt.to_period("M").astype(str)
                monthly = df_t.groupby("_period")[primary_num].sum()
                if len(monthly) >= 2:
                    first_p = monthly.index[0]
                    last_p = monthly.index[-1]
                    first_v = float(monthly.iloc[0])
                    last_v = float(monthly.iloc[-1])
                    
                    if first_v > 0:
                        change_pct = round(((last_v - first_v) / first_v) * 100, 1)
                        trend_dir = "growth" if change_pct >= 0 else "decline"
                        peak_p = monthly.idxmax()
                        peak_v = float(monthly.max())
                        fmt = col_map.get(primary_num, {}).get("semantic_type", "number")
                        
                        insights.append({
                            "id": "insight_trend",
                            "category": "trend",
                            "badge": "Trend Analysis",
                            "severity": "positive" if change_pct >= 0 else "warning",
                            "title": f"{trend_dir.capitalize()} of {abs(change_pct)}% in {primary_num}",
                            "measured_fact": f"{primary_num} shifted by {change_pct:+.1f}% from {first_p} ({format_metric_value(first_v, fmt)}) to {last_p} ({format_metric_value(last_v, fmt)}). Peak reached in {peak_p} at {format_metric_value(peak_v, fmt)}.",
                            "detail": f"Calculated by comparing starting period {first_p} against concluding period {last_p} across {len(monthly)} monthly intervals.",
                            "recommendation": f"Analyze drivers contributing to the peak in {peak_p} to replicate seasonal momentum."
                        })
        except Exception:
            pass
            
    # 3. Statistical Anomalies / Outliers
    for num_c in sorted_nums[:3]:
        clean_s = pd.to_numeric(df[num_c], errors="coerce").dropna()
        if len(clean_s) >= 20:
            mean = clean_s.mean()
            std = clean_s.std()
            if std > 0:
                z_scores = ((clean_s - mean).abs() / std)
                outliers = clean_s[z_scores > 3.0]
                if len(outliers) > 0:
                    max_outlier = float(outliers.max())
                    fmt = col_map.get(num_c, {}).get("semantic_type", "number")
                    insights.append({
                        "id": f"insight_anomaly_{num_c}",
                        "category": "anomaly",
                        "badge": "Outlier Alert",
                        "severity": "warning",
                        "title": f"Statistical Outliers in {num_c}",
                        "measured_fact": f"Detected {len(outliers)} record(s) in '{num_c}' that deviate by more than 3 standard deviations from the mean (maximum value: {format_metric_value(max_outlier, fmt)} vs mean: {format_metric_value(mean, fmt)}).",
                        "detail": f"Identified via standard normal z-score evaluation (threshold > 3.0σ).",
                        "recommendation": f"Audit high-value transaction outliers to verify data recording accuracy or flag potential unusual events."
                    })
                    break  # One outlier insight is sufficient
                    
    # 4. Correlation Analysis (Verified Statistical Facts)
    if primary_num and secondary_num:
        try:
            valid_subset = df[[primary_num, secondary_num]].dropna()
            if len(valid_subset) >= 15:
                corr = float(valid_subset[primary_num].corr(valid_subset[secondary_num]))
                if not np.isnan(corr) and abs(corr) >= 0.4:
                    strength = "strong" if abs(corr) >= 0.7 else "moderate"
                    direction = "positive" if corr > 0 else "negative"
                    insights.append({
                        "id": "insight_correlation",
                        "category": "correlation",
                        "badge": "Correlation",
                        "severity": "info",
                        "title": f"{strength.capitalize()} {direction} correlation between {primary_num} and {secondary_num}",
                        "measured_fact": f"Pearson correlation coefficient r = {corr:.2f} indicates a {strength} {direction} linear relationship between '{primary_num}' and '{secondary_num}'.",
                        "detail": "Measured statistical linear co-movement across observations. Note: Correlation measures co-variance and does not establish causality.",
                        "recommendation": f"Monitor {secondary_num} as an indicator when forecasting expected movements in {primary_num}."
                    })
        except Exception:
            pass
            
    # 5. Data Quality / Missing data issues
    null_counts = df.isnull().sum()
    high_nulls = null_counts[null_counts > 0].sort_values(ascending=False)
    if len(high_nulls) > 0:
        worst_col = high_nulls.index[0]
        null_n = int(high_nulls.iloc[0])
        null_p = round((null_n / len(df)) * 100, 1)
        insights.append({
            "id": "insight_quality",
            "category": "data_quality",
            "badge": "Data Quality",
            "severity": "warning" if null_p > 20 else "info",
            "title": f"Missing values in {worst_col}",
            "measured_fact": f"Column '{worst_col}' contains {null_n} null values ({null_p}% of all rows in the dataset).",
            "detail": f"Records missing '{worst_col}' will be excluded from breakdowns relying on this field.",
            "recommendation": f"Use DataPilot's data cleaning tools to impute missing entries or filter incomplete records."
        })
        
    return insights

def summarize_with_llm(insights: List[Dict[str, Any]], dataset_name: str) -> Optional[str]:
    # If API key is available, call OpenAI or Gemini
    if not (OPENAI_API_KEY or GEMINI_API_KEY):
        return None
        
    prompt = f"You are DataPilot AI, an expert business analyst. Here are verified statistical facts extracted from the dataset '{dataset_name}':\n"
    for i in insights:
        prompt += f"- {i['title']}: {i['measured_fact']}\n"
    prompt += "\nWrite a concise 2-3 sentence executive summary explaining the strategic significance of these verified facts. Do not invent any numbers not present in the facts."
    
    try:
        import httpx
        if OPENAI_API_KEY:
            resp = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are a senior business intelligence analyst. Be concise, objective, and data-driven."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 200
                },
                timeout=10.0
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
                
        elif GEMINI_API_KEY:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            resp = httpx.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                },
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        pass
        
    return None

def get_insights_for_dataset(
    df: pd.DataFrame,
    columns_meta: List[Dict[str, Any]],
    dataset_name: str
) -> Dict[str, Any]:
    rule_insights = generate_rule_based_insights(df, columns_meta)
    ai_summary = summarize_with_llm(rule_insights, dataset_name)
    
    if not ai_summary and rule_insights:
        # High quality rule-based executive summary
        top_items = [i["measured_fact"] for i in rule_insights[:2]]
        ai_summary = f"Analysis of {dataset_name} reveals key operational dynamics: " + " ".join(top_items)
        
    return {
        "dataset_name": dataset_name,
        "executive_summary": ai_summary,
        "insights_count": len(rule_insights),
        "insights": rule_insights
    }
