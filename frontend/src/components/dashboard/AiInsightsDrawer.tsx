import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Award,
  ShieldCheck,
  Lightbulb,
  CheckCircle,
  Copy,
  Share2
} from 'lucide-react';
import { InsightsData, InsightItem } from '../../types';

interface AiInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  insightsData?: InsightsData;
}

export const AiInsightsDrawer: React.FC<AiInsightsDrawerProps> = ({
  isOpen,
  onClose,
  insightsData
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const insights = insightsData?.insights || [];
  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(i => i.category === selectedCategory);

  const handleCopy = (item: InsightItem) => {
    const text = `${item.title}\nFact: ${item.measured_fact}\nDetail: ${item.detail}\nRecommendation: ${item.recommendation || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = [
    { id: 'all', label: 'All Insights' },
    { id: 'performance', label: 'Top Performers' },
    { id: 'trend', label: 'Trends' },
    { id: 'anomaly', label: 'Anomalies' },
    { id: 'correlation', label: 'Correlations' },
    { id: 'data_quality', label: 'Quality' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-brand-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>DataPilot AI Insights</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold uppercase">
                Verified
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rigorous analytical findings from real dataset computations
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

      {/* Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        
        {/* Executive Summary */}
        {insightsData?.executive_summary && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-brand-50 dark:from-navy-850 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Executive Summary</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {insightsData.executive_summary}
            </p>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Insights List */}
        <div className="space-y-3.5">
          {filteredInsights.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No insights in this category.
            </div>
          ) : (
            filteredInsights.map(item => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm hover:border-brand-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.severity === 'positive'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.severity === 'warning'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {item.badge}
                    </span>
                    <button
                      onClick={() => handleCopy(item)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
                      title="Copy insight"
                    >
                      {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                      {item.measured_fact}
                    </p>
                  </div>

                  {item.detail && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      Context: {item.detail}
                    </div>
                  )}

                  {item.recommendation && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start space-x-1.5 text-[11px] text-brand-700 dark:text-brand-300 font-medium">
                      <Lightbulb className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                      <span>{item.recommendation}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
