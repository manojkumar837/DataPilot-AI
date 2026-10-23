import React from 'react';
import {
  Database,
  Upload,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface DataSourcesViewProps {
  datasets: any[];
  onOpenUpload: () => void;
  onGenerateForDataset: (datasetId: string) => void;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({
  datasets,
  onOpenUpload,
  onGenerateForDataset
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Database className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Data Sources</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Uploaded datasets, synthetic catalogs, schemas and data quality ratings
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Dataset</span>
        </button>
      </div>

      {datasets.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No data sources uploaded yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload a CSV, Excel, or JSON file to start profiling and visualizing.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Dataset</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    .{ds.file_type || 'csv'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {ds.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {ds.row_count?.toLocaleString()} rows • {ds.col_count} columns
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(ds.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onGenerateForDataset(ds.id)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build Dashboard</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
