import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Factory,
  Zap,
  Leaf,
  CheckCircle2,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import { generateSamplePlantCsv, downloadCsvFile } from '../utils/csvParser';

interface EmptyStateProps {
  onFileLoaded: (csvText: string, fileName: string) => void;
  parseErrors: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onFileLoaded, parseErrors }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setLocalError('Please upload a valid .csv file.');
      return;
    }

    setLocalError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        setLocalError('The selected file is empty.');
        setIsProcessing(false);
        return;
      }
      onFileLoaded(text, file.name);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setLocalError('Failed to read the file. Please try again.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = `timestamp,line,kWh
2025-05-01 08:00,Line 1,42.5
2025-05-01 08:00,Line 2,36.2
2025-05-01 08:00,Packaging,18.4
2025-05-01 09:00,Line 1,48.1
2025-05-01 09:00,Line 2,39.0
2025-05-01 09:00,Packaging,19.2
2025-05-01 10:00,Line 1,51.3
2025-05-01 10:00,Line 2,41.7
2025-05-01 10:00,Packaging,20.5`;
    downloadCsvFile(templateContent, 'green_ops_hourly_template.csv');
  };

  const handleLoadDemoData = () => {
    setIsProcessing(true);
    const demoCsv = generateSamplePlantCsv();
    onFileLoaded(demoCsv, 'demo_plant_14d_hourly.csv');
    setIsProcessing(false);
  };

  const allErrors = localError ? [localError, ...parseErrors] : parseErrors;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-14 animate-fadeIn">
      {/* Hero header */}
      <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Factory className="w-3.5 h-3.5 text-emerald-600" />
          Manufacturing Energy Intelligence
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Green Ops Dashboard
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Upload your plant's hourly energy logs to analyze production line power consumption,
          track carbon emissions in real-time, and generate targeted AI energy-saving recommendations.
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-emerald-950/5 overflow-hidden">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 md:p-12 text-center border-2 border-dashed rounded-xl m-4 md:m-6 transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept=".csv,text/csv,application/vnd.ms-excel"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/25">
            <UploadCloud className="w-8 h-8 animate-bounce-subtle" />
          </div>

          <h3 className="text-lg md:text-xl font-bold text-slate-800">
            {isProcessing ? 'Processing CSV...' : 'Drop your hourly energy CSV here'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Drag and drop your file, or <span className="text-emerald-600 font-semibold underline">browse local files</span>. Supports .csv format.
          </p>

          {/* Expected format pills */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="font-semibold text-slate-700">Required CSV Columns:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
              timestamp
            </span>
            <span className="text-slate-400">+</span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono font-medium border border-teal-200">
              line
            </span>
            <span className="text-slate-400">+</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono font-medium border border-amber-200">
              kWh
            </span>
          </div>
        </div>

        {/* Error notification */}
        {allErrors.length > 0 && (
          <div className="mx-6 mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <div className="flex items-center gap-2 font-semibold text-sm mb-1 text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Unable to parse CSV file
            </div>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {allErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer actions & Sample Helpers */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Default carbon conversion: <strong>0.740 kg CO2e / kWh</strong> (customizable)</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Template CSV
            </button>

            <button
              type="button"
              onClick={handleLoadDemoData}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-200" />
              Load Demo Plant Data
            </button>
          </div>
        </div>
      </div>

      {/* CSV Specification Details & Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Hourly Granularity</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Provides daily trend line charts and calculates peak/off-peak shift usage from hourly readings.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            e.g. 2025-05-12 14:00
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
              <Factory className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Line Attribution</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bar chart of energy totals by manufacturing line to instantly isolate energy hogs and baseline draws.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            e.g. Extrusion Line 1, CNC Booth
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Leaf className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">CO2e & AI Optimization</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Real-time conversion to carbon emissions and 3 custom AI recommendations for plant efficiency.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Editable factor (0.740 kg/kWh)
          </div>
        </div>
      </div>
    </div>
  );
};
