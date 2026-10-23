export type DataType = 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'identifier';
export type SemanticType = 'currency' | 'percentage' | 'rating' | 'discrete_numeric' | 'numeric' | 'datetime' | 'categorical' | 'boolean' | 'identifier';

export interface ColumnMeta {
  name: string;
  data_type: DataType;
  semantic_type: SemanticType;
  is_identifier: boolean;
  is_measure: boolean;
  is_dimension: boolean;
  null_count: number;
  null_percentage: number;
  distinct_count: number;
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    std: number;
    sum: number;
    q25: number;
    q75: number;
    outlier_count: number;
    outlier_pct: number;
  };
  top_values?: Array<{ value: string; count: number; pct: number }>;
  date_summary?: {
    min_date: string;
    max_date: string;
    span_days: number;
  };
}

export interface QualityIssue {
  column: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface QualityReport {
  score: number;
  grade: string;
  completeness_score: number;
  uniqueness_score: number;
  total_missing: number;
  total_missing_pct: number;
  duplicate_rows: number;
  issues: QualityIssue[];
}

export interface DataSummary {
  row_count: number;
  col_count: number;
  duplicate_rows: number;
  total_missing: number;
  quality_report: QualityReport;
}

export interface Dataset {
  dataset_id: string;
  id?: string;
  name: string;
  filename: string;
  file_type: string;
  row_count: number;
  col_count: number;
  columns: ColumnMeta[];
  summary: DataSummary;
  preview?: Record<string, any>[];
  created_at?: string;
  is_sample?: boolean;
}

export interface KpiCard {
  id: string;
  title: string;
  value: number;
  formatted_value: string;
  format_type: 'currency' | 'number' | 'percentage' | 'decimal';
  aggregation: 'sum' | 'avg' | 'count' | 'distinct_count';
  column: string;
  icon?: string;
  sparkline?: number[];
  change_pct?: number;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter' | 'histogram';
  title: string;
  x_column: string;
  y_column?: string | null;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
  group_column?: string | null;
  x_label?: string;
  y_label?: string;
  format_type?: string;
  width?: '1/3' | '1/2' | '2/3' | 'full';
  data?: any[];
}

export interface InsightItem {
  id: string;
  category: 'performance' | 'trend' | 'anomaly' | 'correlation' | 'concentration' | 'data_quality';
  badge: string;
  severity: 'positive' | 'warning' | 'info';
  title: string;
  measured_fact: string;
  detail: string;
  recommendation?: string;
}

export interface InsightsData {
  dataset_name: string;
  executive_summary?: string;
  insights_count: number;
  insights: InsightItem[];
}

export interface Dashboard {
  id: string;
  dataset_id: string;
  title: string;
  description?: string;
  theme: 'light' | 'dark' | 'indigo';
  layout: any[];
  kpis: KpiCard[];
  charts: ChartConfig[];
  columns: ColumnMeta[];
  insights?: InsightsData;
  filters?: FilterState;
  table?: {
    records: Record<string, any>[];
    total_records: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface FilterState {
  date_range?: {
    column: string;
    start?: string;
    end?: string;
  };
  categories?: Record<string, string[]>;
  numeric_ranges?: Record<string, { min?: number; max?: number }>;
  search_query?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  chart?: {
    type: string;
    title: string;
    data: any[];
    x_column?: string;
    y_column?: string;
  };
  table?: Record<string, any>[];
  suggested_followups?: string[];
}
