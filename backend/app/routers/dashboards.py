import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from app.services.file_service import get_dataframe
from app.services.kpi_service import calculate_kpis
from app.services.recommendation_service import generate_dashboard_charts, prepare_chart_data
from app.services.filter_service import execute_dashboard_query
from app.services.insights_service import get_insights_for_dataset
from app.database import (
    save_dashboard,
    get_dashboard,
    list_dashboards,
    delete_dashboard,
    get_dataset_meta
)

router = APIRouter(prefix="/api/dashboards", tags=["Dashboards"])

class SaveDashboardRequest(BaseModel):
    id: Optional[str] = None
    dataset_id: str
    title: str
    description: Optional[str] = ""
    theme: str = "light"
    layout: List[Any] = []
    kpis: List[Any] = []
    charts: List[Any] = []
    filters: Dict[str, Any] = {}

class QueryRequest(BaseModel):
    filters: Dict[str, Any] = {}
    charts: List[Dict[str, Any]] = []
    page: int = 1
    page_size: int = 50

class ChartPreviewRequest(BaseModel):
    chart_type: str
    x_column: str
    y_column: Optional[str] = None
    aggregation: str = "sum"
    group_column: Optional[str] = None
    filters: Dict[str, Any] = {}

@router.get("")
def get_all_dashboards():
    return list_dashboards()

@router.post("/generate/{dataset_id}")
def generate_automatic_dashboard(dataset_id: str):
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    meta = get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset metadata not found")
        
    columns_meta = meta["columns"]
    dataset_name = meta["name"]
    
    # 1. Automatic KPI Calculation
    date_cols = [c["name"] for c in columns_meta if c["data_type"] == "datetime"]
    date_col = date_cols[0] if date_cols else None
    kpis = calculate_kpis(df, columns_meta, date_col=date_col)
    
    # 2. Automatic Chart Generation
    charts = generate_dashboard_charts(df, columns_meta)
    
    # 3. Dynamic Layout arrangement
    layout = []
    # Row 1: KPIs
    layout.append({"type": "kpi_row", "kpi_ids": [k["id"] for k in kpis]})
    # Subsequent rows based on generated chart widths
    row_accumulator = []
    current_width = 0.0
    width_map = {"1/3": 0.333, "1/2": 0.5, "2/3": 0.667, "full": 1.0}
    
    for c in charts:
        w_val = width_map.get(c.get("width", "1/2"), 0.5)
        if current_width + w_val > 1.05 and row_accumulator:
            layout.append({"type": "chart_row", "chart_ids": row_accumulator})
            row_accumulator = [c["id"]]
            current_width = w_val
        else:
            row_accumulator.append(c["id"])
            current_width += w_val
    if row_accumulator:
        layout.append({"type": "chart_row", "chart_ids": row_accumulator})
    # Final row: Data table
    layout.append({"type": "table_row"})
    
    # 4. Generate initial AI Insights
    insights_data = get_insights_for_dataset(df, columns_meta, dataset_name)
    
    # 5. Save initial dashboard
    dashboard_id = str(uuid.uuid4())
    title = f"{dataset_name} Executive Dashboard"
    
    save_dashboard(
        dashboard_id=dashboard_id,
        dataset_id=dataset_id,
        title=title,
        description=f"Automatically synthesized business dashboard for {dataset_name}.",
        theme="light",
        layout=layout,
        kpis=kpis,
        charts=charts,
        filters={}
    )
    
    # Table initial records
    table_preview = df.head(50).fillna("").to_dict(orient="records")
    
    return {
        "id": dashboard_id,
        "dataset_id": dataset_id,
        "title": title,
        "theme": "light",
        "layout": layout,
        "kpis": kpis,
        "charts": charts,
        "columns": columns_meta,
        "insights": insights_data,
        "table": {
            "records": table_preview,
            "total_records": len(df),
            "page": 1,
            "page_size": 50,
            "total_pages": int((len(df) + 49) // 50)
        }
    }

@router.get("/{dashboard_id}")
def load_saved_dashboard(dashboard_id: str):
    dash = get_dashboard(dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    dataset_id = dash["dataset_id"]
    df = get_dataframe(dataset_id)
    meta = get_dataset_meta(dataset_id)
    
    if df is not None and meta is not None:
        dash["columns"] = meta["columns"]
        # Refresh chart data from current dataset state
        query_res = execute_dashboard_query(
            df=df,
            columns_meta=meta["columns"],
            charts_config=dash["charts"],
            filters=dash.get("filters", {}),
            table_page=1,
            table_page_size=50
        )
        dash["kpis"] = query_res["kpis"]
        dash["charts"] = query_res["charts"]
        dash["table"] = query_res["table"]
        dash["insights"] = get_insights_for_dataset(df, meta["columns"], meta["name"])
    return dash

@router.post("")
def save_custom_dashboard(req: SaveDashboardRequest):
    dashboard_id = req.id or str(uuid.uuid4())
    save_dashboard(
        dashboard_id=dashboard_id,
        dataset_id=req.dataset_id,
        title=req.title,
        description=req.description or "",
        theme=req.theme,
        layout=req.layout,
        kpis=req.kpis,
        charts=req.charts,
        filters=req.filters
    )
    return {"id": dashboard_id, "status": "saved"}

@router.delete("/{dashboard_id}")
def remove_dashboard(dashboard_id: str):
    delete_dashboard(dashboard_id)
    return {"status": "deleted"}

@router.post("/{dashboard_id}/query")
def query_dashboard_interactive(dashboard_id: str, req: QueryRequest):
    dash = get_dashboard(dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    dataset_id = dash["dataset_id"]
    df = get_dataframe(dataset_id)
    meta = get_dataset_meta(dataset_id)
    if df is None or not meta:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    charts_to_query = req.charts if req.charts else dash["charts"]
    
    result = execute_dashboard_query(
        df=df,
        columns_meta=meta["columns"],
        charts_config=charts_to_query,
        filters=req.filters,
        table_page=req.page,
        table_page_size=req.page_size
    )
    return result

@router.post("/{dashboard_id}/chart-preview")
def preview_custom_chart(dashboard_id: str, req: ChartPreviewRequest):
    dash = get_dashboard(dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    dataset_id = dash["dataset_id"]
    df = get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Apply active dashboard filters to preview
    from app.services.filter_service import apply_filters_to_dataframe
    filtered_df = apply_filters_to_dataframe(df, req.filters)
    
    chart_data = prepare_chart_data(
        df=filtered_df,
        chart_type=req.chart_type,
        x_col=req.x_column,
        y_col=req.y_column,
        agg=req.aggregation,
        group_col=req.group_column
    )
    
    return {
        "chart_type": req.chart_type,
        "x_column": req.x_column,
        "y_column": req.y_column,
        "aggregation": req.aggregation,
        "data": chart_data
    }
