import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ChartConfig } from '../../types';

interface ChartRendererProps {
  chart: ChartConfig;
  onCrossFilter?: (categoryColumn: string, value: string) => void;
  activeFilterValue?: string;
  isDarkMode?: boolean;
}

const COLOR_PALETTE = [
  '#4f46e5', // Brand Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
];

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  chart,
  onCrossFilter,
  activeFilterValue,
  isDarkMode = false
}) => {
  const data = chart.data || [];
  const chartType = chart.type;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
        <p>No data available for current filter selection.</p>
        <span className="text-[11px] text-slate-500">Try adjusting your filters.</span>
      </div>
    );
  }

  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';
  const axisTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  // Number format helper for tooltips & ticks
  const formatTick = (val: any) => {
    if (typeof val !== 'number') return String(val);
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl text-xs z-50">
          <div className="font-bold text-slate-800 dark:text-slate-100 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">
            {label || payload[0]?.name || ''}
          </div>
          {payload.map((entry: any, index: number) => {
            const isCurr = chart.format_type === 'currency' || chart.title.toLowerCase().includes('sales') || chart.title.toLowerCase().includes('revenue') || chart.title.toLowerCase().includes('profit');
            const formatted = typeof entry.value === 'number'
              ? (isCurr ? `$${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : entry.value.toLocaleString())
              : entry.value;
            return (
              <div key={index} className="flex items-center space-x-2 py-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {entry.name || chart.y_column || 'Value'}:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatted}
                </span>
              </div>
            );
          })}
          {onCrossFilter && (chartType === 'bar' || chartType === 'donut' || chartType === 'pie') && (
            <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
              Click to cross-filter dashboard
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 1. AREA CHART
  if (chartType === 'area') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad_${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="period"
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad_${chart.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 2. LINE CHART
  if (chartType === 'line') {
    const keys = Object.keys(data[0] || {}).filter(k => k !== 'period');
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="period" stroke={axisTextColor} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={axisTextColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatTick} />
            <Tooltip content={<CustomTooltip />} />
            {keys.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
            {keys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 3. BAR CHART (with cross-filtering click!)
  if (chartType === 'bar') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={axisTextColor}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTick}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              cursor={onCrossFilter ? 'pointer' : 'default'}
              onClick={(entry: any) => {
                if (onCrossFilter && entry && entry.name) {
                  onCrossFilter(chart.x_column, entry.name);
                }
              }}
            >
              {data.map((entry: any, index: number) => {
                const isSelected = activeFilterValue === entry.name;
                const hasAnyActive = Boolean(activeFilterValue);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isSelected ? '#4f46e5' : hasAnyActive ? '#cbd5e1' : COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    opacity={hasAnyActive && !isSelected ? 0.4 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 4. DONUT & PIE CHART (with cross-filtering click!)
  if (chartType === 'donut' || chartType === 'pie') {
    const isDonut = chartType === 'donut';
    const totalVal = data.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0);
    return (
      <div className="h-72 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? 60 : 0}
              outerRadius={95}
              paddingAngle={isDonut ? 3 : 1}
              cursor={onCrossFilter ? 'pointer' : 'default'}
              onClick={(entry: any) => {
                if (onCrossFilter && entry && entry.name) {
                  onCrossFilter(chart.x_column, entry.name);
                }
              }}
            >
              {data.map((entry: any, index: number) => {
                const isSelected = activeFilterValue === entry.name;
                const hasAnyActive = Boolean(activeFilterValue);
                return (
                  <Cell
                    key={`pie-${index}`}
                    fill={isSelected ? '#4f46e5' : COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    opacity={hasAnyActive && !isSelected ? 0.35 : 1}
                    stroke={isSelected ? '#312e81' : isDarkMode ? '#0f172a' : '#ffffff'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                );
              })}
            </Pie>
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {isDonut && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {formatTick(totalVal)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 5. SCATTER PLOT
  if (chartType === 'scatter') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey="x"
              name={chart.x_column}
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTick}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={chart.y_column || 'Value'}
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTick}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={data} fill="#6366f1" fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 6. HISTOGRAM
  if (chartType === 'histogram') {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="bin" stroke={axisTextColor} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={axisTextColor} fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatTick} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};
