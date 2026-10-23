import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  ScatterChart as ScatterIcon,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { ColumnMeta, ChartConfig, FilterState } from '../../types';
import { ChartRenderer } from './ChartRenderer';
import { previewChart } from '../../api';

interface ChartExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardId: string;
  columns: ColumnMeta[];
  filters: FilterState;
  onAddChart: (newChart: ChartConfig) => void;
  isDarkMode?: boolean;
}

export const ChartExplorerModal: React.FC<ChartExplorerModalProps> = ({
  isOpen,
  onClose,
  dashboardId,
  columns,
  filters,
  onAddChart,
  isDarkMode
}) => {
  const [chartType, setChartType] = useState<ChartConfig['type']>('bar');
  const [xCol, setXCol] = useState<string>('');
  const [yCol, setYCol] = useState<string>('');
  const [aggregation, setAggregation] = useState<any>('sum');
  const [chartTitle, setChartTitle] = useState<string>('');
  const [chartWidth, setChartWidth] = useState<'1/2' | 'full' | '1/3' | '2/3'>('1/2');

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Group columns
  const numericCols = columns.filter(c => c.data_type === 'numeric' && !c.is_identifier);
  const dimensionCols = columns.filter(c => c.data_type !== 'numeric' || c.is_dimension);

  // Initialize defaults
  useEffect(() => {
    if (columns.length > 0 && !xCol) {
      if (dimensionCols.length > 0) {
        setXCol(dimensionCols[0].name);
      } else {
        setXCol(columns[0].name);
      }
      if (numericCols.length > 0) {
        setYCol(numericCols[0].name);
      }
    }
  }, [columns]);

  // Update dynamic title
  useEffect(() => {
    if (xCol) {
      if (yCol && chartType !== 'histogram') {
        setChartTitle(`${aggregation.toUpperCase()} of ${yCol} by ${xCol}`);
      } else {
        setChartTitle(`Distribution of ${xCol}`);
      }
    }
  }, [chartType, xCol, yCol, aggregation]);

  // Fetch live chart preview
  useEffect(() => {
    if (!isOpen || !xCol) return;

    let isSubscribed = true;
    setIsLoading(true);

    const config = {
      chart_type: chartType,
      x_column: xCol,
      y_column: chartType === 'histogram' ? null : (yCol || null),
      aggregation: aggregation,
    };

    previewChart(dashboardId, config, filters)
      .then(res => {
        if (isSubscribed) {
          setPreviewData(res.data || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => { isSubscribed = false; };
  }, [isOpen, chartType, xCol, yCol, aggregation, dashboardId, filters]);

  if (!isOpen) return null;

  const handleCreate = () => {
    const newChart: ChartConfig = {
      id: `custom_chart_${Date.now()}`,
      type: chartType,
      title: chartTitle || 'Custom Chart',
      x_column: xCol,
      y_column: chartType === 'histogram' ? null : yCol,
      aggregation: aggregation,
      width: chartWidth,
      data: previewData,
    };
    onAddChart(newChart);
    onClose();
  };

  const chartTypesList = [
    { type: 'bar' as const, label: 'Bar', icon: BarChart2 },
    { type: 'line' as const, label: 'Line', icon: LineChartIcon },
    { type: 'area' as const, label: 'Area', icon: TrendingUp },
    { type: 'donut' as const, label: 'Donut', icon: PieChartIcon },
    { type: 'scatter' as const, label: 'Scatter', icon: ScatterIcon },
    { type: 'histogram' as const, label: 'Histogram', icon: BarChart2 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chart Explorer & Custom Visual Builder
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design custom analytical cards to add to your dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Controls Column */}
          <div className="space-y-4 text-xs">
            {/* Chart Type Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {chartTypesList.map(item => {
                  const Icon = item.icon;
                  const isSelected = chartType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setChartType(item.type)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Field */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {chartType === 'scatter' ? 'X-Axis Measure' : 'Dimension / Category (X-Axis)'}
              </label>
              <select
                value={xCol}
                onChange={(e) => setXCol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
              >
                {columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.data_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Y-Axis Field (if not histogram) */}
            {chartType !== 'histogram' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Numeric Measure (Y-Axis)
                </label>
                <select
                  value={yCol}
                  onChange={(e) => setYCol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
                >
                  {numericCols.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.semantic_type || c.data_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Aggregation */}
            {chartType !== 'scatter' && chartType !== 'histogram' && (
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aggregation Function
                </label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="sum">SUM</option>
                  <option value="avg">AVERAGE</option>
                  <option value="count">COUNT</option>
                  <option value="min">MIN</option>
                  <option value="max">MAX</option>
                </select>
              </div>
            )}

            {/* Title & Width */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chart Title
              </label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Card Width
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChartWidth('1/2')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                    chartWidth === '1/2' ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Half Width (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setChartWidth('full')}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-semibold ${
                    chartWidth === 'full' ? 'border-brand-600 bg-brand-50 dark:bg-brand-950 text-brand-600' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Full Width (100%)
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="md:col-span-2 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Live Interactive Preview
              </span>
              {isLoading && (
                <span className="text-[11px] text-brand-600 dark:text-brand-400 animate-pulse font-medium">
                  Updating preview...
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-center min-h-[300px]">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 text-center">
                {chartTitle}
              </h4>
              <ChartRenderer
                chart={{
                  id: 'preview',
                  type: chartType,
                  title: chartTitle,
                  x_column: xCol,
                  y_column: yCol,
                  data: previewData,
                }}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!xCol || previewData.length === 0}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
};
