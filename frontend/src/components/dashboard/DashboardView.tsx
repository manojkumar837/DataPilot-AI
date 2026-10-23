import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  Plus,
  Download,
  Save,
  Filter,
  X,
  RefreshCw,
  Search,
  Maximize2,
  MoreVertical,
  Check,
  Edit2,
  FileText,
  Calendar,
  Layers,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  UserCheck,
  Star,
  Activity,
  Database,
  BarChart3,
  Eye,
  Trash2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dashboard, ChartConfig, FilterState, ColumnMeta } from '../../types';
import { ChartRenderer } from './ChartRenderer';
import { ChartExplorerModal } from './ChartExplorerModal';
import { AiInsightsDrawer } from './AiInsightsDrawer';
import { ChatWithDataDrawer } from './ChatWithDataDrawer';
import { queryDashboard, saveDashboard, exportCsv, exportDashboardJson } from '../../api';

interface DashboardViewProps {
  dashboard: Dashboard;
  onUpdateDashboard: (updated: Dashboard) => void;
  isDarkMode: boolean;
}

const ICON_MAP: Record<string, any> = {
  DollarSign,
  ShoppingCart,
  Users,
  UserCheck,
  Star,
  Activity,
  TrendingUp,
  Database,
  Layers,
  BarChart3
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboard,
  onUpdateDashboard,
  isDarkMode
}) => {
  const [activeFilters, setActiveFilters] = useState<FilterState>(dashboard.filters || {});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(dashboard.title);
  
  // Drawers & Modals
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  
  // Dashboard save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Cross-filter active category value tracker
  const [crossFilterKey, setCrossFilterKey] = useState<{ col: string; val: string } | null>(null);

  // Table pagination & search
  const [tablePage, setTablePage] = useState(1);
  const [tableSearch, setTableSearch] = useState('');
  
  // Query loading state
  const [isQuerying, setIsQuerying] = useState(false);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Dynamic filter columns available from dimensions
  const categoryCols = dashboard.columns?.filter(c => c.data_type === 'categorical' && !c.is_identifier && c.distinct_count <= 40) || [];
  const dateCols = dashboard.columns?.filter(c => c.data_type === 'datetime') || [];

  // Re-query whenever filters change or table page changes
  useEffect(() => {
    let isSubscribed = true;
    setIsQuerying(true);

    const mergedFilters: FilterState = {
      ...activeFilters,
      search_query: tableSearch || undefined
    };

    queryDashboard(dashboard.id, mergedFilters, dashboard.charts, tablePage, 25)
      .then(res => {
        if (isSubscribed) {
          onUpdateDashboard({
            ...dashboard,
            kpis: res.kpis,
            charts: res.charts,
            table: res.table,
            filters: activeFilters
          });
          setIsQuerying(false);
        }
      })
      .catch(err => {
        if (isSubscribed) setIsQuerying(false);
      });

    return () => { isSubscribed = false; };
  }, [activeFilters, tablePage, tableSearch]);

  // Cross-filtering click handler
  const handleCrossFilter = (columnName: string, value: string) => {
    setActiveFilters(prev => {
      const currentCats = { ...(prev.categories || {}) };
      if (currentCats[columnName]?.includes(value)) {
        // Toggle off
        delete currentCats[columnName];
        setCrossFilterKey(null);
      } else {
        // Set selection
        currentCats[columnName] = [value];
        setCrossFilterKey({ col: columnName, val: value });
      }
      return { ...prev, categories: currentCats };
    });
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setCrossFilterKey(null);
    setTableSearch('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveDashboard({
        ...dashboard,
        title: titleText,
        filters: activeFilters
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert('Failed to save dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomChart = (newChart: ChartConfig) => {
    const updatedCharts = [...dashboard.charts, newChart];
    onUpdateDashboard({
      ...dashboard,
      charts: updatedCharts
    });
  };

  const handleRemoveChart = (chartId: string) => {
    const updatedCharts = dashboard.charts.filter(c => c.id !== chartId);
    onUpdateDashboard({
      ...dashboard,
      charts: updatedCharts
    });
  };

  const handleChangeChartType = (chartId: string, newType: ChartConfig['type']) => {
    const updatedCharts = dashboard.charts.map(c => {
      if (c.id === chartId) {
        return { ...c, type: newType };
      }
      return c;
    });
    onUpdateDashboard({
      ...dashboard,
      charts: updatedCharts
    });
  };

  // PDF Export
  const handleExportPdf = async () => {
    if (!dashboardRef.current) return;
    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${dashboard.title.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (err) {
      alert('Failed to generate PDF. You can also print the page directly.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const activeCategoriesCount = Object.keys(activeFilters.categories || {}).length;
  const isFiltered = activeCategoriesCount > 0 || Boolean(activeFilters.date_range?.start) || Boolean(tableSearch);

  return (
    <div className="flex-1 overflow-y-auto">
      <div ref={dashboardRef} className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          {/* Title & Editable Heading */}
          <div className="flex items-center space-x-3">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="text-xl font-extrabold px-2.5 py-1 rounded-lg border border-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsEditingTitle(false);
                    onUpdateDashboard({ ...dashboard, title: titleText });
                  }}
                  className="p-1.5 rounded-lg bg-brand-600 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 group">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {dashboard.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
                  title="Rename Dashboard"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isQuerying && (
              <span className="flex items-center space-x-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing...</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs no-print">
            {/* AI Insights Button */}
            <button
              onClick={() => setIsInsightsOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Insights</span>
            </button>

            {/* Chat With Data */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chat with Data</span>
            </button>

            {/* Add Custom Chart */}
            <button
              onClick={() => setIsExplorerOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Chart</span>
            </button>

            {/* Save Configuration */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm'
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save Dashboard'}</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-1 hidden group-hover:block z-40">
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                >
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>{isExportingPdf ? 'Rendering PDF...' : 'Export as PDF'}</span>
                </button>
                <button
                  onClick={() => exportCsv(dashboard.dataset_id, activeFilters)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export Filtered CSV</span>
                </button>
                <button
                  onClick={() => exportDashboardJson(dashboard.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                >
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  <span>Export Config JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Filter Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Filters:</span>
              </span>

              {/* Category Dropdowns */}
              {categoryCols.slice(0, 3).map(cat => {
                const currentVal = activeFilters.categories?.[cat.name]?.[0] || '';
                return (
                  <div key={cat.name} className="flex items-center space-x-1">
                    <select
                      value={currentVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveFilters(prev => {
                          const cats = { ...(prev.categories || {}) };
                          if (val) {
                            cats[cat.name] = [val];
                          } else {
                            delete cats[cat.name];
                          }
                          return { ...prev, categories: cats };
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">All {cat.name}s</option>
                      {cat.top_values?.map(tv => (
                        <option key={tv.value} value={tv.value}>
                          {tv.value} ({tv.count})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {/* Date Column Range Filter (if available) */}
              {dateCols.length > 0 && (
                <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-500">From:</span>
                  <input
                    type="date"
                    value={activeFilters.date_range?.start || ''}
                    onChange={(e) => {
                      const start = e.target.value;
                      setActiveFilters(prev => ({
                        ...prev,
                        date_range: {
                          column: dateCols[0].name,
                          start,
                          end: prev.date_range?.end
                        }
                      }));
                    }}
                    className="bg-transparent text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">To:</span>
                  <input
                    type="date"
                    value={activeFilters.date_range?.end || ''}
                    onChange={(e) => {
                      const end = e.target.value;
                      setActiveFilters(prev => ({
                        ...prev,
                        date_range: {
                          column: dateCols[0].name,
                          start: prev.date_range?.start,
                          end
                        }
                      }));
                    }}
                    className="bg-transparent text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Reset / Live Count */}
            <div className="flex items-center space-x-3">
              {dashboard.table && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Showing <strong className="text-slate-900 dark:text-white">{dashboard.table.total_records}</strong> records
                </span>
              )}
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {isFiltered && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 font-semibold mr-1">Active Filters:</span>
              {Object.entries(activeFilters.categories || {}).map(([col, vals]) => (
                <span
                  key={col}
                  className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-medium border border-brand-200 dark:border-brand-900"
                >
                  <span>{col}: <strong>{vals.join(', ')}</strong></span>
                  <button
                    onClick={() => {
                      setActiveFilters(prev => {
                        const cats = { ...(prev.categories || {}) };
                        delete cats[col];
                        return { ...prev, categories: cats };
                      });
                      if (crossFilterKey?.col === col) setCrossFilterKey(null);
                    }}
                    className="hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {activeFilters.date_range?.start && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-900">
                  <span>Date: {activeFilters.date_range.start} → {activeFilters.date_range.end || 'Now'}</span>
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, date_range: undefined }))}
                    className="hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {tableSearch && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  <span>Search: "{tableSearch}"</span>
                  <button onClick={() => setTableSearch('')} className="hover:text-red-500 ml-1">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 1. TOP ROW: KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboard.kpis?.map((kpi) => {
            const Icon = ICON_MAP[kpi.icon || 'BarChart3'] || BarChart3;
            return (
              <div
                key={kpi.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {kpi.formatted_value}
                  </div>
                  
                  {/* Mini Sparkline & Change Indicator */}
                  <div className="flex items-center justify-between pt-2 text-[11px]">
                    <span className="font-mono text-slate-400 dark:text-slate-500">
                      Agg: {kpi.aggregation.toUpperCase()}
                    </span>
                    {kpi.change_pct !== undefined && (
                      <span className={`font-bold flex items-center space-x-0.5 ${
                        kpi.change_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span>{kpi.change_pct >= 0 ? '▲ +' : '▼ '}{kpi.change_pct}%</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. MAIN CHARTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {dashboard.charts?.map((chart) => {
            const widthClass = chart.width === '1/3'
              ? 'md:col-span-4'
              : chart.width === '2/3'
              ? 'md:col-span-8'
              : chart.width === 'full'
              ? 'md:col-span-12'
              : 'md:col-span-6'; // 1/2

            return (
              <div
                key={chart.id}
                className={`${widthClass} p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative group`}
              >
                {/* Chart Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {chart.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {chart.y_column ? `${chart.aggregation?.toUpperCase() || 'SUM'} of ${chart.y_column} by ${chart.x_column}` : `Grouped by ${chart.x_column}`}
                    </p>
                  </div>

                  {/* Chart Options Menu */}
                  <div className="flex items-center space-x-1 no-print">
                    <select
                      value={chart.type}
                      onChange={(e) => handleChangeChartType(chart.id, e.target.value as any)}
                      className="text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="bar">Bar</option>
                      <option value="line">Line</option>
                      <option value="area">Area</option>
                      <option value="donut">Donut</option>
                      <option value="pie">Pie</option>
                      <option value="scatter">Scatter</option>
                      <option value="histogram">Histogram</option>
                    </select>

                    <button
                      onClick={() => handleRemoveChart(chart.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                      title="Remove Chart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chart Visualizer */}
                <ChartRenderer
                  chart={chart}
                  onCrossFilter={handleCrossFilter}
                  activeFilterValue={crossFilterKey?.col === chart.x_column ? crossFilterKey.val : undefined}
                  isDarkMode={isDarkMode}
                />
              </div>
            );
          })}
        </div>

        {/* 3. DETAILED DATA TABLE */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Dataset Records</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live tabular preview updated with current filters and cross-filtering
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs no-print">
              {/* Search within table */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search table rows..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <button
                onClick={() => exportCsv(dashboard.dataset_id, activeFilters)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 font-semibold text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 w-12 text-center text-slate-400">#</th>
                  {dashboard.columns?.map(col => (
                    <th key={col.name} className="p-2.5 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                      <span>{col.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                {dashboard.table?.records?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                    <td className="p-2 text-center text-slate-400">{(tablePage - 1) * 25 + idx + 1}</td>
                    {dashboard.columns?.map(col => (
                      <td key={col.name} className="p-2 truncate max-w-[200px]">
                        {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : <span className="text-slate-300 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {dashboard.table && dashboard.table.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400 no-print">
              <span>
                Page <strong>{dashboard.table.page}</strong> of <strong>{dashboard.table.total_pages}</strong>
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={tablePage >= dashboard.table.total_pages}
                  onClick={() => setTablePage(p => p + 1)}
                  className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Slide-over Drawers & Modals */}
      <AiInsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        insightsData={dashboard.insights}
      />

      <ChatWithDataDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        datasetId={dashboard.dataset_id}
        columns={dashboard.columns}
        isDarkMode={isDarkMode}
      />

      <ChartExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        dashboardId={dashboard.id}
        columns={dashboard.columns}
        filters={activeFilters}
        onAddChart={handleAddCustomChart}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
