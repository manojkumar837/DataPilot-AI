import React from 'react';
import {
  Upload,
  Sparkles,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  Database,
  Layers,
  CheckCircle2,
  Users2,
  ShoppingBag,
  Truck
} from 'lucide-react';
import { Dataset, Dashboard } from '../../types';

interface HomeViewProps {
  onOpenUpload: () => void;
  onSelectSample: (sampleId: string) => void;
  onOpenDashboard: (dashboardId: string) => void;
  recentDashboards: Dashboard[];
  datasetsCount: number;
  isLoadingSample: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenUpload,
  onSelectSample,
  onOpenDashboard,
  recentDashboards,
  datasetsCount,
  isLoadingSample,
}) => {
  const sampleDatasets = [
    {
      id: 'sample_retail_sales',
      title: 'Retail Sales & Profit',
      description: 'Multi-region omnichannel retail sales, profit margins, discounts, product categories, and buyer segments.',
      icon: ShoppingBag,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Sales & Profit',
      metrics: '350 Records • 10 Fields'
    },
    {
      id: 'sample_ecommerce_orders',
      title: 'E-Commerce Global Logistics',
      description: 'Order fulfillment tracking, delivery speed, sub-category performance, order IDs, and margin distributions.',
      icon: Truck,
      color: 'from-indigo-600 to-purple-600',
      badge: 'Logistics & Orders',
      metrics: '400 Records • 15 Fields'
    },
    {
      id: 'sample_hr_analytics',
      title: 'HR Talent & Workforce',
      description: 'Workforce attrition risk, compensation tiers, performance ratings, work-life balance, and departmental tenure.',
      icon: Users2,
      color: 'from-emerald-600 to-teal-600',
      badge: 'HR & Retention',
      metrics: '300 Records • 12 Fields'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-indigo-950 text-white p-8 md:p-10 shadow-xl border border-navy-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Autonomous Business Intelligence</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Turn Any Raw Dataset into an Interactive Dashboard
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Upload CSV, Excel, or JSON files. DataPilot AI automatically profiles schemas, calculates verified KPIs, recommends charts, and enables cross-filtering without manual setup.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition-all transform active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Custom Dataset</span>
            </button>
            <button
              onClick={() => onSelectSample('sample_retail_sales')}
              disabled={isLoadingSample}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-navy-800/80 hover:bg-navy-700/80 border border-slate-700 text-slate-200 font-semibold text-xs shadow transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isLoadingSample ? 'Generating...' : 'Try Retail Sample'}</span>
            </button>
          </div>
        </div>

        {/* Live System Stats */}
        <div className="mt-8 pt-6 border-t border-navy-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400">Supported Formats</div>
            <div className="text-base font-bold text-white mt-0.5">CSV • XLSX • JSON</div>
          </div>
          <div>
            <div className="text-slate-400">Dashboards Generated</div>
            <div className="text-base font-bold text-white mt-0.5">{recentDashboards.length} Active</div>
          </div>
          <div>
            <div className="text-slate-400">Data Profiling Engine</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">Zero Configuration</div>
          </div>
          <div>
            <div className="text-slate-400">Analytical Rules</div>
            <div className="text-base font-bold text-indigo-300 mt-0.5">100% Calculated Facts</div>
          </div>
        </div>
      </div>

      {/* 1-Click Ready Sample Datasets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Ready-to-Use Sample Datasets</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any sample to immediately experience automatic dashboard generation and cross-filtering.
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            Synthetic Datasets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {sampleDatasets.map((sample) => {
            const Icon = sample.icon;
            return (
              <div
                key={sample.id}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${sample.color} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sample.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {sample.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {sample.metrics}
                  </span>
                  <button
                    onClick={() => onSelectSample(sample.id)}
                    disabled={isLoadingSample}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-transform disabled:opacity-50"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Dashboards or Quick Start Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Dashboards List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Recent Dashboards</span>
            </h2>
            {recentDashboards.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {recentDashboards.length} saved
              </span>
            )}
          </div>

          {recentDashboards.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No dashboards generated yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload a dataset or pick one of the sample datasets above to build your first dashboard in seconds.
                </p>
              </div>
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First Dataset</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDashboards.slice(0, 5).map((dash) => (
                <div
                  key={dash.id}
                  onClick={() => onOpenDashboard(dash.id)}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-sm cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {dash.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{dash.kpis?.length || 4} KPIs</span>
                        <span>•</span>
                        <span>{dash.charts?.length || 5} Charts</span>
                        {dash.dataset_id && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Synced</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 rounded-lg text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Guide */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>How DataPilot Works</span>
          </h2>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-start space-x-3 text-xs">
              <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <strong className="block text-slate-900 dark:text-slate-100 font-semibold">Upload Dataset</strong>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Drag and drop your CSV, Excel (.xlsx) or JSON file.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <strong className="block text-slate-900 dark:text-slate-100 font-semibold">Automatic Profiling</strong>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Engine categorizes metrics, dimensions, keys & outliers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <strong className="block text-slate-900 dark:text-slate-100 font-semibold">Instant Dashboard</strong>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  KPI cards and interactive charts render dynamically.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs">
              <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <strong className="block text-slate-900 dark:text-slate-100 font-semibold">Cross-Filter & Chat</strong>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Click charts to filter, ask natural language questions & export.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
