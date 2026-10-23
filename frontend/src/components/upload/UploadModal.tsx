import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Dataset } from '../../types';
import { uploadDataset, previewCleaning, applyCleaning } from '../../api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetReady: (dataset: Dataset) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetReady
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Sheet selection state for Excel
  const [excelSheets, setExcelSheets] = useState<string[] | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  // Dataset profile state after upload
  const [uploadedDataset, setUploadedDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'quality' | 'cleaning'>('preview');
  
  // Cleaning options
  const [cleaningOps, setCleaningOps] = useState({
    drop_duplicates: true,
    drop_high_null_columns: false,
    impute_strategy: 'median_mode',
    handle_outliers: false,
    outlier_method: 'clip'
  });
  const [cleaningPreview, setCleaningPreview] = useState<any>(null);
  const [isCleaningLoading, setIsCleaningLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File, sheetName?: string) => {
    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'json', 'txt'].includes(ext || '')) {
      setErrorMessage(`Unsupported format '.${ext}'. Please upload a CSV, XLSX, or JSON file.`);
      setIsLoading(false);
      return;
    }

    try {
      const res = await uploadDataset(file, sheetName);
      if (res.action_required === 'select_sheet') {
        setExcelSheets(res.sheets);
        setSelectedSheet(res.sheets[0]);
        setIsLoading(false);
        return;
      }
      setUploadedDataset(res);
      setExcelSheets(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload and parse dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSubmit = () => {
    if (selectedFile && selectedSheet) {
      handleFileSelected(selectedFile, selectedSheet);
    }
  };

  const handlePreviewCleaning = async () => {
    if (!uploadedDataset) return;
    setIsCleaningLoading(true);
    try {
      const prev = await previewCleaning(uploadedDataset.dataset_id, cleaningOps);
      setCleaningPreview(prev);
    } catch (err: any) {
      setErrorMessage('Failed to preview cleaning operations');
    } finally {
      setIsCleaningLoading(false);
    }
  };

  const handleApplyCleaning = async () => {
    if (!uploadedDataset) return;
    setIsCleaningLoading(true);
    try {
      const cleaned = await applyCleaning(uploadedDataset.dataset_id, cleaningOps);
      setUploadedDataset(cleaned);
      setCleaningPreview(null);
      setActiveTab('preview');
    } catch (err: any) {
      setErrorMessage('Failed to apply cleaning operations');
    } finally {
      setIsCleaningLoading(false);
    }
  };

  const handleProceedToDashboard = () => {
    if (uploadedDataset) {
      onDatasetReady(uploadedDataset);
      onClose();
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadedDataset(null);
    setExcelSheets(null);
    setErrorMessage(null);
    setCleaningPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {uploadedDataset ? 'Dataset Profile & Health Report' : 'Upload Your Dataset'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {uploadedDataset 
                  ? `${uploadedDataset.name} • ${uploadedDataset.row_count} rows, ${uploadedDataset.col_count} columns`
                  : 'Upload CSV, Excel, or JSON. AI will auto-profile and build your dashboard.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start space-x-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Upload Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Upload Dropzone (if no dataset uploaded yet) */}
          {!uploadedDataset && !excelSheets && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-850/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center shadow-inner">
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {isLoading ? 'Analyzing & Profiling Data...' : 'Choose a file or drag & drop here'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports CSV, Excel (.xlsx, .xls), and JSON tabular formats up to 50MB.
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2 pt-2">
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    .CSV
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    .XLSX
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    .JSON
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Excel Sheet Selection Dialog */}
          {excelSheets && (
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-slate-850 border border-indigo-100 dark:border-slate-700 space-y-4 text-xs">
              <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Multiple Worksheets Detected</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                This Excel workbook contains multiple sheets. Choose the sheet you want to profile and visualize:
              </p>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {excelSheets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSheetSubmit}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold shadow hover:bg-brand-500"
                >
                  Select & Profile Sheet
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Dataset Profile & Preview (After Successful Upload) */}
          {uploadedDataset && (
            <div className="space-y-6">
              {/* Quick Summary Pill Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Total Records</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {uploadedDataset.row_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Columns</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {uploadedDataset.col_count} Fields
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Data Quality Score</span>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {uploadedDataset.summary?.quality_report?.score ?? 100}% ({uploadedDataset.summary?.quality_report?.grade ?? 'Good'})
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Duplicates / Missing</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {uploadedDataset.summary?.duplicate_rows ?? 0} dups • {uploadedDataset.summary?.total_missing ?? 0} nulls
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Preview Data, Quality Report, Data Cleaning */}
              <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                    activeTab === 'preview'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Raw Preview (First 100 Rows)
                </button>
                <button
                  onClick={() => setActiveTab('quality')}
                  className={`px-4 py-2 font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'quality'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Quality & Schema</span>
                  {uploadedDataset.summary?.quality_report?.issues?.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('cleaning')}
                  className={`px-4 py-2 font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'cleaning'
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Clean Data (Optional)</span>
                </button>
              </div>

              {/* TAB 1: Preview Table */}
              {activeTab === 'preview' && (
                <div className="space-y-2">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 font-semibold text-slate-700 dark:text-slate-200">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200 dark:border-slate-800 w-12 text-center text-slate-400">#</th>
                          {uploadedDataset.columns?.map((col) => (
                            <th key={col.name} className="p-2.5 border-b border-slate-200 dark:border-slate-800 whitespace-nowrap">
                              <div className="flex items-center space-x-1.5">
                                <span>{col.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-mono text-slate-600 dark:text-slate-300">
                                  {col.data_type}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {uploadedDataset.preview?.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                            <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                            {uploadedDataset.columns?.map((col) => (
                              <td key={col.name} className="p-2 truncate max-w-[180px]">
                                {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : <span className="text-slate-300 italic">null</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Quality & Schema */}
              {activeTab === 'quality' && (
                <div className="space-y-4 text-xs">
                  {/* Column Schema Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                    {uploadedDataset.columns?.map((col) => (
                      <div key={col.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {col.name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            col.data_type === 'numeric' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                            col.data_type === 'datetime' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                            col.data_type === 'identifier' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-750 dark:text-slate-300'
                          }`}>
                            {col.semantic_type || col.data_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Distinct: {col.distinct_count}</span>
                          <span>Missing: {col.null_count} ({col.null_percentage}%)</span>
                        </div>
                        {col.stats && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                            <span>Min: {col.stats.min}</span>
                            <span>Mean: {col.stats.mean}</span>
                            <span>Max: {col.stats.max}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Issues List */}
                  {uploadedDataset.summary?.quality_report?.issues?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                      <strong className="text-amber-800 dark:text-amber-300 font-semibold block flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Data Health Observations</span>
                      </strong>
                      <ul className="list-disc pl-4 space-y-1 text-amber-700 dark:text-amber-400 text-[11px]">
                        {uploadedDataset.summary.quality_report.issues.map((iss, i) => (
                          <li key={i}>{iss.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Data Cleaning Drawer */}
              {activeTab === 'cleaning' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                    <p className="text-slate-600 dark:text-slate-300">
                      Configure non-destructive cleaning transformations. Preview rows before saving:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cleaningOps.drop_duplicates}
                          onChange={(e) => setCleaningOps({ ...cleaningOps, drop_duplicates: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span>Remove duplicate rows</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cleaningOps.handle_outliers}
                          onChange={(e) => setCleaningOps({ ...cleaningOps, handle_outliers: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span>Clip extreme statistical outliers (1.5 IQR)</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        onClick={handlePreviewCleaning}
                        disabled={isCleaningLoading}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 shadow-sm"
                      >
                        {isCleaningLoading ? 'Previewing...' : 'Preview Changes'}
                      </button>
                      {cleaningPreview && (
                        <button
                          onClick={handleApplyCleaning}
                          disabled={isCleaningLoading}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                        >
                          Apply Cleaned Dataset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cleaning Diff Preview */}
                  {cleaningPreview && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                        Preview of Cleaning Outcome:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-emerald-700 dark:text-emerald-400 text-[11px]">
                        {cleaningPreview.actions_taken.map((act: string, i: number) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        Rows: {cleaningPreview.original_rows} → {cleaningPreview.final_rows} (Difference: {cleaningPreview.rows_removed} removed)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {uploadedDataset ? (
            <>
              <button
                onClick={resetUpload}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Upload Different File
              </button>
              <button
                onClick={handleProceedToDashboard}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Dashboard Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
