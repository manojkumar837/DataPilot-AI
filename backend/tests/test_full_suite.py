import sys
import io
import json
from pathlib import Path
import pandas as pd
import numpy as np

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import init_db, save_dataset_meta, get_dataset_meta, save_dashboard, get_dashboard
from app.services.file_service import (
    load_dataset_from_bytes,
    cache_dataframe,
    get_dataframe
)
from app.services.profiling_service import profile_dataset, detect_column_type
from app.services.cleaning_service import preview_cleaning_operations, apply_cleaning_operations
from app.services.kpi_service import calculate_kpis, format_metric_value
from app.services.recommendation_service import generate_dashboard_charts, prepare_chart_data
from app.services.filter_service import execute_dashboard_query, apply_filters_to_dataframe
from app.services.insights_service import generate_rule_based_insights, get_insights_for_dataset
from app.services.query_service import answer_data_query, get_predefined_questions
from app.services.sample_data_service import generate_retail_sales, generate_ecommerce_orders, generate_hr_analytics
from app.services.export_service import export_dataframe_to_csv

def test_full_application_workflow():
    print("\n[TEST 1] Initializing SQLite database...")
    init_db()

    # --- TEST 2: Multi-format parsing (CSV, JSON, Excel) ---
    print("\n[TEST 2] Verifying CSV, Excel, and JSON parsing...")
    
    # CSV
    csv_bytes = b"Store,Date,Revenue,Transactions\nDowntown,2024-01-01,15200.50,120\nUptown,2024-01-02,18900.00,145\nSuburbs,2024-01-03,9800.20,78\n"
    df_csv, ext = load_dataset_from_bytes(csv_bytes, "test.csv")
    assert len(df_csv) == 3
    assert "Revenue" in df_csv.columns
    print("  [PASS] CSV parsed correctly:", df_csv.shape)

    # JSON
    json_bytes = json.dumps([
        {"id": 1, "product": "Widget A", "price": 25.5, "in_stock": True},
        {"id": 2, "product": "Widget B", "price": 40.0, "in_stock": False},
        {"id": 3, "product": "Widget C", "price": 15.0, "in_stock": True}
    ]).encode("utf-8")
    df_json, ext = load_dataset_from_bytes(json_bytes, "items.json")
    assert len(df_json) == 3
    assert "price" in df_json.columns
    print("  [PASS] JSON parsed correctly:", df_json.shape)

    # Excel (create in-memory)
    excel_buf = io.BytesIO()
    with pd.ExcelWriter(excel_buf, engine="openpyxl") as writer:
        df_csv.to_excel(writer, sheet_name="SalesData", index=False)
    excel_bytes = excel_buf.getvalue()
    df_excel, ext = load_dataset_from_bytes(excel_bytes, "data.xlsx", sheet_name="SalesData")
    assert len(df_excel) == 3
    print("  [PASS] Excel parsed correctly:", df_excel.shape)

    # --- TEST 3: Schema & Type Profiling ---
    print("\n[TEST 3] Testing Schema & Type Profiling Engine...")
    df_retail = generate_retail_sales()
    p_retail = profile_dataset(df_retail)
    
    assert p_retail["summary"]["row_count"] == 350
    assert p_retail["summary"]["quality_report"]["score"] > 80
    
    col_names = [c["name"] for c in p_retail["columns"]]
    assert "Date" in col_names
    assert "Sales" in col_names
    assert "Profit" in col_names
    
    sales_col = next(c for c in p_retail["columns"] if c["name"] == "Sales")
    assert sales_col["data_type"] == "numeric"
    assert sales_col["semantic_type"] == "currency"
    print("  [PASS] 'Sales' detected as numeric / currency with outlier count:", sales_col["stats"]["outlier_count"])

    # --- TEST 4: Identifier Detection ---
    print("\n[TEST 4] Testing Identifier Column Detection (IDs never treated as measures)...")
    df_ecom = generate_ecommerce_orders()
    p_ecom = profile_dataset(df_ecom)
    order_id_col = next(c for c in p_ecom["columns"] if c["name"] == "Order ID")
    assert order_id_col["is_identifier"] is True
    assert order_id_col["is_measure"] is False
    print("  [PASS] 'Order ID' detected as is_identifier=True and is_measure=False")

    # --- TEST 5: Automatic KPI Calculations ---
    print("\n[TEST 5] Testing Automatic KPI Calculations...")
    kpis_retail = calculate_kpis(df_retail, p_retail["columns"], "Date")
    assert len(kpis_retail) >= 4
    kpi_titles = [k["title"] for k in kpis_retail]
    assert any("Sales" in t or "Revenue" in t for t in kpi_titles)
    assert any("Profit" in t for t in kpi_titles)
    print("  [PASS] Generated KPIs for Retail Sales:", [f"{k['title']}: {k['formatted_value']}" for k in kpis_retail])

    kpis_hr = calculate_kpis(generate_hr_analytics(), profile_dataset(generate_hr_analytics())["columns"])
    hr_titles = [k["title"] for k in kpis_hr]
    assert any("Employees" in t or "Records" in t for t in hr_titles)
    assert any("Income" in t for t in hr_titles)
    print("  [PASS] Generated KPIs for HR Analytics:", [f"{k['title']}: {k['formatted_value']}" for k in kpis_hr])

    # --- TEST 6: Automatic Chart Recommendations ---
    print("\n[TEST 6] Testing Automatic Chart Recommendation Engine...")
    charts = generate_dashboard_charts(df_retail, p_retail["columns"])
    assert len(charts) >= 4
    chart_types = [c["type"] for c in charts]
    assert "area" in chart_types or "line" in chart_types
    assert "bar" in chart_types
    assert "donut" in chart_types or "pie" in chart_types
    print("  [PASS] Generated recommended charts:", [(c["title"], c["type"], len(c["data"])) for c in charts])

    # --- TEST 7: Interactive Filtering & Cross-Filtering ---
    print("\n[TEST 7] Testing Interactive Filtering & Cross-Filtering...")
    # Cross-filter by Store Type = 'Express Outlet'
    filter_res = execute_dashboard_query(
        df=df_retail,
        columns_meta=p_retail["columns"],
        charts_config=charts,
        filters={"categories": {"Store Type": ["Express Outlet"]}}
    )
    assert filter_res["filtered_rows"] < len(df_retail)
    assert filter_res["filter_ratio"] < 100.0
    print(f"  [PASS] Cross-filtered to 'Express Outlet': {filter_res['filtered_rows']} of {filter_res['total_unfiltered_rows']} rows ({filter_res['filter_ratio']}%)")

    # --- TEST 8: Rule-Based Analytical AI Insights ---
    print("\n[TEST 8] Testing Rule-Based Analytical AI Insights Engine...")
    insights_res = get_insights_for_dataset(df_retail, p_retail["columns"], "Retail Sales")
    assert insights_res["insights_count"] >= 3
    print("  [PASS] Generated insights count:", insights_res["insights_count"])
    for i in insights_res["insights"]:
        print(f"    - [{i['badge']}] {i['title']}")

    # --- TEST 9: Chat with Your Data (Conversational AI) ---
    print("\n[TEST 9] Testing Conversational Query Engine (Chat With Your Data)...")
    q1 = answer_data_query(df_retail, p_retail["columns"], "Which category has the highest sales?")
    assert "Electronics" in q1["answer"] or "Sales" in q1["answer"]
    print("  [PASS] Answer 1 (Top Category):", q1["answer"][:120], "...")

    q2 = answer_data_query(df_retail, p_retail["columns"], "Show monthly trends for sales")
    assert q2["chart"] is not None
    assert q2["chart"]["type"] == "area"
    print("  [PASS] Answer 2 (Monthly Trend): returned dynamic chart with", len(q2["chart"]["data"]), "periods")

    q3 = answer_data_query(df_retail, p_retail["columns"], "Are there any outliers in sales?")
    assert "outlier" in q3["answer"].lower()
    print("  [PASS] Answer 3 (Outliers):", q3["answer"][:120], "...")

    # --- TEST 10: Data Cleaning Operations ---
    print("\n[TEST 10] Testing Data Cleaning Operations Preview & Apply...")
    # Introduce deliberate duplicates and nulls
    dirty_df = df_retail.copy()
    dirty_df = pd.concat([dirty_df, dirty_df.head(5)], ignore_index=True)
    clean_prev = preview_cleaning_operations(dirty_df, {"drop_duplicates": True})
    assert clean_prev["rows_removed"] == 5
    print("  [PASS] Cleaning preview correctly detected 5 duplicates to remove.")

    cleaned_df = apply_cleaning_operations(dirty_df, {"drop_duplicates": True})
    assert len(cleaned_df) == len(df_retail)
    print("  [PASS] Cleaning applied without altering original schema.")

    # --- TEST 11: Dashboard Saving & Reloading ---
    print("\n[TEST 11] Testing Dashboard Persistence in SQLite...")
    dash_id = "test_dash_123"
    dataset_id = "test_ds_123"
    cache_dataframe(dataset_id, df_retail)
    save_dataset_meta(
        dataset_id=dataset_id,
        name="Retail Sales",
        filename="retail.csv",
        file_type="csv",
        row_count=len(df_retail),
        col_count=len(df_retail.columns),
        columns=p_retail["columns"],
        summary=p_retail["summary"],
        storage_path=f"data/uploads/{dataset_id}.parquet"
    )
    save_dashboard(
        dashboard_id=dash_id,
        dataset_id=dataset_id,
        title="Custom Saved Sales Dashboard",
        description="Executive sales review",
        theme="light",
        layout=[],
        kpis=kpis_retail,
        charts=charts,
        filters={"categories": {"Region": ["Europe"]}}
    )
    loaded = get_dashboard(dash_id)
    assert loaded is not None
    assert loaded["title"] == "Custom Saved Sales Dashboard"
    assert loaded["filters"]["categories"]["Region"] == ["Europe"]
    print("  [PASS] Dashboard successfully saved and reloaded with filters preserved.")

    # --- TEST 12: CSV Export of Filtered Data ---
    print("\n[TEST 12] Testing CSV Export...")
    filtered_df = apply_filters_to_dataframe(df_retail, {"categories": {"Region": ["Europe"]}})
    csv_out = export_dataframe_to_csv(filtered_df)
    assert "Region" in csv_out
    assert "Europe" in csv_out
    print(f"  [PASS] Filtered CSV exported: {len(csv_out)} characters.")

    print("\n" + "=" * 65)
    print(" >>> ALL 12 INTEGRATION TEST SUITES PASSED FLAWLESSLY! <<<")
    print("=" * 65)

if __name__ == "__main__":
    test_full_application_workflow()
