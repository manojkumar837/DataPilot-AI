import React from 'react';
import {
  Home,
  LayoutDashboard,
  Database,
  Sparkles,
  Settings,
  HelpCircle,
  TrendingUp,
  Layers
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  savedDashboardsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  savedDashboardsCount
}) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboards', label: 'My Dashboards', icon: LayoutDashboard, badge: savedDashboardsCount > 0 ? savedDashboardsCount : undefined },
    { id: 'datasources', label: 'Data Sources', icon: Database },
    { id: 'insights', label: 'AI Insights', icon: Sparkles, highlight: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-800 text-slate-300 flex flex-col justify-between select-none shrink-0 transition-all z-20">
      <div>
        {/* Workspace Brand / Header */}
        <div className="p-5 border-b border-navy-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-navy-800 border border-slate-700/50 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </h2>
              <p className="text-sm font-semibold text-white truncate max-w-[140px]">
                Main Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'dashboards' && currentView === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-navy-800 text-slate-300 border border-navy-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pro Box */}
      <div className="p-4 border-t border-navy-800/80">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-navy-800 to-navy-850 border border-slate-700/40 text-xs">
          <div className="flex items-center space-x-2 text-indigo-300 mb-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Power BI Engine</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Auto-inferring schemas, metrics & cross-filtering without configuration.
          </p>
        </div>
      </div>
    </aside>
  );
};
