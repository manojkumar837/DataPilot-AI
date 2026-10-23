import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { HomeView } from './components/home/HomeView';
import { DashboardView } from './components/dashboard/DashboardView';
import { MyDashboardsView } from './components/dashboards/MyDashboardsView';
import { DataSourcesView } from './components/datasources/DataSourcesView';
import { SettingsView } from './components/settings/SettingsView';
import { UploadModal } from './components/upload/UploadModal';
import { Dataset, Dashboard } from './types';
import {
  listDashboards,
  loadDashboard,
  deleteDashboard,
  listDatasets,
  loadSample,
  generateDashboard
} from './api';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);

  const [savedDashboards, setSavedDashboards] = useState<any[]>([]);
  const [datasetsList, setDatasetsList] = useState<any[]>([]);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load initial data
  const refreshDashboards = async () => {
    try {
      const dashes = await listDashboards();
      setSavedDashboards(dashes);
    } catch (e) {}
  };

  const refreshDatasets = async () => {
    try {
      const dsets = await listDatasets();
      setDatasetsList(dsets);
    } catch (e) {}
  };

  useEffect(() => {
    refreshDashboards();
    refreshDatasets();
  }, []);

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // 1-Click Sample Generation
  const handleSelectSample = async (sampleId: string) => {
    setIsLoadingSample(true);
    setGlobalLoading(true);
    try {
      const dataset = await loadSample(sampleId);
      setActiveDataset(dataset);
      const dash = await generateDashboard(dataset.dataset_id);
      setActiveDashboard(dash);
      setCurrentView('dashboard');
      refreshDashboards();
      refreshDatasets();
    } catch (err) {
      alert('Failed to generate sample dashboard');
    } finally {
      setIsLoadingSample(false);
      setGlobalLoading(false);
    }
  };

  // Upload modal dataset ready handler
  const handleDatasetReady = async (dataset: Dataset) => {
    setActiveDataset(dataset);
    setGlobalLoading(true);
    try {
      const dash = await generateDashboard(dataset.dataset_id);
      setActiveDashboard(dash);
      setCurrentView('dashboard');
      refreshDashboards();
      refreshDatasets();
    } catch (err) {
      alert('Failed to generate dashboard from dataset');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleOpenDashboard = async (dashboardId: string) => {
    setGlobalLoading(true);
    try {
      const dash = await loadDashboard(dashboardId);
      setActiveDashboard(dash);
      setCurrentView('dashboard');
    } catch (err) {
      alert('Failed to load dashboard');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      await deleteDashboard(dashboardId);
      if (activeDashboard?.id === dashboardId) {
        setActiveDashboard(null);
        setCurrentView('dashboards');
      }
      refreshDashboards();
    } catch (err) {
      alert('Failed to delete dashboard');
    }
  };

  const handleGenerateForDataset = async (datasetId: string) => {
    setGlobalLoading(true);
    try {
      const dash = await generateDashboard(datasetId);
      setActiveDashboard(dash);
      setCurrentView('dashboard');
      refreshDashboards();
    } catch (err) {
      alert('Failed to generate dashboard');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onOpenUpload={() => setIsUploadOpen(true)}
        onNavigate={setCurrentView}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        activeDatasetName={activeDataset?.name || activeDashboard?.title}
      />

      {/* Main Layout: Navy Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'insights') {
              if (activeDashboard) {
                // If on dashboard, view remains and opens insights
                setCurrentView('dashboard');
              } else {
                setCurrentView('home');
              }
            } else {
              setCurrentView(view);
            }
          }}
          savedDashboardsCount={savedDashboards.length}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {globalLoading && (
            <div className="p-4 bg-brand-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 animate-pulse">
              <span>Generating and profiling analytical dashboard...</span>
            </div>
          )}

          {currentView === 'home' && (
            <HomeView
              onOpenUpload={() => setIsUploadOpen(true)}
              onSelectSample={handleSelectSample}
              onOpenDashboard={handleOpenDashboard}
              recentDashboards={savedDashboards}
              datasetsCount={datasetsList.length}
              isLoadingSample={isLoadingSample}
            />
          )}

          {currentView === 'dashboard' && activeDashboard && (
            <DashboardView
              dashboard={activeDashboard}
              onUpdateDashboard={setActiveDashboard}
              isDarkMode={isDarkMode}
            />
          )}

          {currentView === 'dashboards' && (
            <MyDashboardsView
              dashboards={savedDashboards}
              onOpenDashboard={handleOpenDashboard}
              onDeleteDashboard={handleDeleteDashboard}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentView === 'datasources' && (
            <DataSourcesView
              datasets={datasetsList}
              onOpenUpload={() => setIsUploadOpen(true)}
              onGenerateForDataset={handleGenerateForDataset}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
            />
          )}
        </main>
      </div>

      {/* Upload & Data Profiling Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetReady={handleDatasetReady}
      />
    </div>
  );
};

export default App;
