import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Database,
  ArrowRight,
  Trash2,
  Plus
} from 'lucide-react';

interface MyDashboardsViewProps {
  dashboards: any[];
  onOpenDashboard: (dashboardId: string) => void;
  onDeleteDashboard: (dashboardId: string) => void;
  onOpenUpload: () => void;
}

export const MyDashboardsView: React.FC<MyDashboardsViewProps> = ({
  dashboards,
  onOpenDashboard,
  onDeleteDashboard,
  onOpenUpload
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <LayoutDashboard className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>My Dashboards</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage and reopen previously generated business intelligence dashboards
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Dashboard</span>
        </button>
      </div>

      {dashboards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No saved dashboards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload any dataset to immediately generate and save your first dashboard.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Dashboard</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboards.map((dash) => (
            <div
              key={dash.id}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-sm flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this dashboard?')) {
                        onDeleteDashboard(dash.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {dash.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {dash.description || 'Interactive business dashboard'}
                  </p>
                </div>

                <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dash.dataset_name || 'Uploaded Data'}</span>
                  <span>•</span>
                  <span>{dash.row_count || 0} rows</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(dash.updated_at || dash.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onOpenDashboard(dash.id)}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
