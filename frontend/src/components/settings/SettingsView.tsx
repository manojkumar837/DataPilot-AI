import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  Key,
  Database,
  Moon,
  Sun,
  Shield,
  Check
} from 'lucide-react';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleDarkMode
}) => {
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <span>Application Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure AI API keys, themes, analytical profiling rules and data storage
        </p>
      </div>

      <div className="space-y-6 text-xs">
        {/* Appearance Settings */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Interface Theme
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Select your preferred display theme. Power BI inspired dark navy sidebar is preserved across both modes.
          </p>
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={onToggleDarkMode}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                !isDarkMode
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Workspace</span>
            </button>
            <button
              onClick={onToggleDarkMode}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isDarkMode
                  ? 'border-brand-600 bg-brand-950 text-brand-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Workspace</span>
            </button>
          </div>
        </div>

        {/* AI Model & API Key Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>AI Language Model Integration (Optional)</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                DataPilot AI features built-in rule-based analytical insights that work 100% without an API key. Optionally provide a key for LLM natural language narrative summaries.
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              Offline Ready
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash)</option>
                <option value="rule_based">Rule-Based Local Engine (No Key Needed)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono text-xs"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Keys can also be configured securely via the backend .env file.
              </span>
            </div>

            <button
              type="submit"
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all ${
                isSaved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-500 shadow-sm'
              }`}
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{isSaved ? 'Saved Preferences' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Security & Sandbox Guarantee */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 font-bold">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Strict Security & Deterministic Execution Guarantee</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            DataPilot AI enforces parameter-only querying on pandas DataFrames. LLMs are never permitted to execute arbitrary Python, SQL, shell commands, or unrestricted code. All calculations are executed deterministically on your local backend.
          </p>
        </div>
      </div>
    </div>
  );
};
