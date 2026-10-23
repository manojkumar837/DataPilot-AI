import sqlite3
import json
from typing import Dict, Any, List, Optional
from app.config import DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Datasets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        col_count INTEGER NOT NULL,
        columns_json TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        storage_path TEXT NOT NULL
    )
    """)
    
    # Dashboards table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        theme TEXT DEFAULT 'light',
        layout_json TEXT NOT NULL,
        kpis_json TEXT NOT NULL,
        charts_json TEXT NOT NULL,
        filters_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

def save_dataset_meta(
    dataset_id: str,
    name: str,
    filename: str,
    file_type: str,
    row_count: int,
    col_count: int,
    columns: List[Dict[str, Any]],
    summary: Dict[str, Any],
    storage_path: str
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO datasets 
    (id, name, filename, file_type, row_count, col_count, columns_json, summary_json, storage_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        dataset_id,
        name,
        filename,
        file_type,
        row_count,
        col_count,
        json.dumps(columns),
        json.dumps(summary),
        storage_path
    ))
    conn.commit()
    conn.close()

def get_dataset_meta(dataset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    data["columns"] = json.loads(data["columns_json"])
    data["summary"] = json.loads(data["summary_json"])
    return data

def list_datasets() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, filename, file_type, row_count, col_count, created_at FROM datasets ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_dashboard(
    dashboard_id: str,
    dataset_id: str,
    title: str,
    description: str,
    theme: str,
    layout: List[Any],
    kpis: List[Any],
    charts: List[Any],
    filters: Dict[str, Any]
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO dashboards
    (id, dataset_id, title, description, theme, layout_json, kpis_json, charts_json, filters_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        dashboard_id,
        dataset_id,
        title,
        description,
        theme,
        json.dumps(layout),
        json.dumps(kpis),
        json.dumps(charts),
        json.dumps(filters)
    ))
    conn.commit()
    conn.close()

def get_dashboard(dashboard_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dashboards WHERE id = ?", (dashboard_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    data["layout"] = json.loads(data["layout_json"])
    data["kpis"] = json.loads(data["kpis_json"])
    data["charts"] = json.loads(data["charts_json"])
    data["filters"] = json.loads(data.get("filters_json") or "{}")
    return data

def list_dashboards() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT d.id, d.dataset_id, d.title, d.description, d.theme, d.created_at, d.updated_at, ds.name as dataset_name, ds.row_count, ds.col_count
    FROM dashboards d
    LEFT JOIN datasets ds ON d.dataset_id = ds.id
    ORDER BY d.updated_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_dashboard(dashboard_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM dashboards WHERE id = ?", (dashboard_id,))
    conn.commit()
    conn.close()
