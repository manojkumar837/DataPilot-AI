import React from 'react';
import {
  BarChart3,
  Upload,
  PlusCircle,
  Sun,
  Moon,
  Sparkles,
  Database
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onOpenUpload: () => void;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeDatasetName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onOpenUpload,
  onNavigate,
  isDarkMode,
  onToggleDarkMode,
  activeDatasetName
}) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-200 dark:to-indigo-300 bg-clip-text text-transparent">
                DataPilot
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-brand-500 text-white uppercase tracking-wider">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
              Automated Business Intelligence
            </p>
          </div>
        </div>

        {activeDatasetName && currentView === 'dashboard' && (
          <div className="hidden md:flex items-center ml-6 pl-6 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-200">
              <Database className="w-3.5 h-3.5 mr-1.5 text-brand-600 dark:text-brand-400" />
              Dataset: <strong className="ml-1 font-semibold">{activeDatasetName}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Upload Dataset</span>
        </button>

        {/* Create Dashboard Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition-all transform active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Dashboard</span>
        </button>
      </div>
    </header>
  );
};
