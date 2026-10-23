import { Dataset, Dashboard, InsightsData, FilterState } from './types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function listDatasets(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  return res.json();
}

export async function listSamples(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/datasets/samples`);
  return res.json();
}

export async function loadSample(sampleId: string): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/datasets/sample/${sampleId}`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDataset(file: File, sheetName?: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) {
    formData.append('sheet_name', sheetName);
  }
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function previewCleaning(datasetId: string, operations: any) {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/clean-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(operations),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function applyCleaning(datasetId: string, operations: any): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/clean-apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(operations),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateDashboard(datasetId: string): Promise<Dashboard> {
  const res = await fetch(`${API_BASE}/dashboards/generate/${datasetId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDashboards(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/dashboards`);
  return res.json();
}

export async function loadDashboard(dashboardId: string): Promise<Dashboard> {
  const res = await fetch(`${API_BASE}/dashboards/${dashboardId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveDashboard(dashboard: Partial<Dashboard>): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/dashboards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dashboard),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteDashboard(dashboardId: string) {
  const res = await fetch(`${API_BASE}/dashboards/${dashboardId}`, { method: 'DELETE' });
  return res.json();
}

export async function queryDashboard(
  dashboardId: string,
  filters: FilterState,
  charts: any[],
  page: number = 1,
  pageSize: number = 50
) {
  const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters, charts, page, page_size: pageSize }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function previewChart(dashboardId: string, chartConfig: any, filters: FilterState) {
  const res = await fetch(`${API_BASE}/dashboards/${dashboardId}/chart-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...chartConfig, filters }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchInsights(datasetId: string): Promise<InsightsData> {
  const res = await fetch(`${API_BASE}/insights/${datasetId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function askDataQuestion(datasetId: string, query: string) {
  const res = await fetch(`${API_BASE}/query/${datasetId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchQuerySuggestions(datasetId: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/query/${datasetId}/suggestions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

export async function exportCsv(datasetId: string, filters: FilterState) {
  const res = await fetch(`${API_BASE}/export/${datasetId}/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters }),
  });
  if (!res.ok) throw new Error('Export CSV failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `datapilot_export_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportDashboardJson(dashboardId: string) {
  window.open(`${API_BASE}/export/dashboard/${dashboardId}/json`, '_blank');
}
