import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import init_db
from app.services.sample_data_service import generate_retail_sales, generate_ecommerce_orders, generate_hr_analytics
from app.services.profiling_service import profile_dataset
from app.services.kpi_service import calculate_kpis
from app.services.recommendation_service import generate_dashboard_charts
from app.services.insights_service import get_insights_for_dataset
from app.services.query_service import answer_data_query
from app.services.filter_service import execute_dashboard_query
from app.services.cleaning_service import preview_cleaning_operations, apply_cleaning_operations

def run_tests():
    init_db()
    print("Database initialized successfully.")
    
    # 1. Retail Sales Test
    df_retail = generate_retail_sales()
    p_retail = profile_dataset(df_retail)
    assert p_retail["summary"]["row_count"] == 350
    assert len(p_retail["columns"]) == 10
    
    kpis_retail = calculate_kpis(df_retail, p_retail["columns"], "Date")
    assert len(kpis_retail) >= 3
    print(f"Retail Sales: {len(df_retail)} rows, {len(kpis_retail)} KPIs calculated.")
    for k in kpis_retail:
        print(f"  - {k['title']}: {k['formatted_value']}")
        
    charts_retail = generate_dashboard_charts(df_retail, p_retail["columns"])
    assert len(charts_retail) >= 3
    print(f"Retail Charts: {len(charts_retail)} generated.")
    for c in charts_retail:
        print(f"  - Chart: {c['title']} ({c['type']})")
        
    insights_retail = get_insights_for_dataset(df_retail, p_retail["columns"], "Retail Sales")
    assert len(insights_retail["insights"]) >= 2
    print(f"Retail Insights: {len(insights_retail['insights'])} generated.")
    for ins in insights_retail["insights"]:
        print(f"  - [{ins['badge']}] {ins['title']}: {ins['measured_fact']}")
        
    query_res = answer_data_query(df_retail, p_retail["columns"], "Which category has the highest sales?")
    print("Conversational query response:", query_res["answer"])
    
    # 2. Filtering Test
    filtered_res = execute_dashboard_query(
        df=df_retail,
        columns_meta=p_retail["columns"],
        charts_config=charts_retail,
        filters={"categories": {"Category": ["Electronics"]}}
    )
    assert filtered_res["filtered_rows"] < len(df_retail)
    print(f"Filtered to Electronics: {filtered_res['filtered_rows']} rows.")
    
    # 3. E-commerce Test (has Order ID and different categories)
    df_ecom = generate_ecommerce_orders()
    p_ecom = profile_dataset(df_ecom)
    # Ensure Order ID is detected as identifier and not metric
    order_id_col = next(c for c in p_ecom["columns"] if c["name"] == "Order ID")
    assert order_id_col["is_identifier"] is True
    print("E-commerce 'Order ID' correctly identified as Identifier, not numerical measure.")
    
    kpis_ecom = calculate_kpis(df_ecom, p_ecom["columns"], "Order Date")
    # Verify Total Orders is present
    assert any("Orders" in k["title"] for k in kpis_ecom)
    print("E-commerce KPIs correctly detected 'Total Orders' metric.")
    
    # 4. HR Analytics Test (no sales, different schema with Age, Income, Attrition)
    df_hr = generate_hr_analytics()
    p_hr = profile_dataset(df_hr)
    kpis_hr = calculate_kpis(df_hr, p_hr["columns"])
    charts_hr = generate_dashboard_charts(df_hr, p_hr["columns"])
    print(f"HR Analytics: {len(df_hr)} rows, {len(kpis_hr)} KPIs, {len(charts_hr)} charts.")
    for k in kpis_hr:
        print(f"  - HR KPI: {k['title']}: {k['formatted_value']}")
        
    # 5. Cleaning Service Test
    clean_preview = preview_cleaning_operations(df_retail, {"drop_duplicates": True, "handle_outliers": True})
    assert clean_preview["final_rows"] > 0
    print("Cleaning operations preview successfully executed.")
    
    print("\n>>> ALL BACKEND CORE VERIFICATIONS PASSED 100%! <<<")

if __name__ == "__main__":
    run_tests()
