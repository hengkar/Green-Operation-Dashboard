import React, { useState } from 'react';
import { Leaf, Factory, Settings2, RefreshCw, Upload, Check, AlertCircle } from 'lucide-react';

interface NavbarProps {
  hasData: boolean;
  fileName?: string;
  recordsCount?: number;
  emissionFactor: number;
  onEmissionFactorChange: (val: number) => void;
  onReset: () => void;
  onOpenUploadModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasData,
  fileName,
  recordsCount,
  emissionFactor,
  onEmissionFactorChange,
  onReset,
}) => {
  const [isEditingFactor, setIsEditingFactor] = useState(false);
  const [factorInput, setFactorInput] = useState(emissionFactor.toString());
  const [factorError, setFactorError] = useState('');

  const handleSaveFactor = () => {
    const val = parseFloat(factorInput);
    if (isNaN(val) || val <= 0) {
      setFactorError('Must be > 0');
      return;
    }
    setFactorError('');
    onEmissionFactorChange(val);
    setIsEditingFactor(false);
  };

  const presets = [
    { label: 'Default / Coal-heavy', value: 0.74 },
    { label: 'US Grid Avg (eGRID)', value: 0.386 },
    { label: 'EU Average', value: 0.23 },
    { label: 'Clean / Hydro-Mix', value: 0.12 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-emerald-950/95 backdrop-blur-md border-b border-emerald-800/60 text-white px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/40 flex items-center justify-center">
              <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Green Ops Dashboard
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Plant Ops
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">Hourly Energy & Carbon Monitoring</p>
            </div>
          </div>

          {/* Mobile Status */}
          {hasData && (
            <div className="md:hidden flex items-center gap-1.5 text-xs bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-700/50 text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {recordsCount?.toLocaleString()} logs
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Emission factor controller */}
          <div className="relative bg-emerald-900/70 border border-emerald-700/60 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-emerald-100 shadow-sm">
            <span className="text-emerald-400 font-medium whitespace-nowrap">Emission Factor:</span>

            {isEditingFactor ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={factorInput}
                  onChange={(e) => {
                    setFactorInput(e.target.value);
                    setFactorError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveFactor()}
                  className="w-20 px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 rounded text-emerald-100 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                  autoFocus
                />
                <span className="text-emerald-300 text-[11px]">kg/kWh</span>
                <button
                  onClick={handleSaveFactor}
                  className="p-1 hover:bg-emerald-700 rounded text-emerald-300 hover:text-white"
                  title="Apply"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setFactorInput(emissionFactor.toString());
                  setIsEditingFactor(true);
                }}
                className="group flex items-center gap-1.5 font-mono font-semibold text-emerald-200 hover:text-emerald-50 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/40 hover:border-emerald-500 transition-colors"
                title="Click to edit emission factor"
              >
                <span>{emissionFactor.toFixed(3)}</span>
                <span className="text-[10px] text-emerald-400">kg/kWh</span>
                <Settings2 className="w-3 h-3 text-emerald-400 group-hover:text-emerald-200" />
              </button>
            )}

            {/* Presets dropdown selector */}
            <select
              value={presets.some((p) => Math.abs(p.value - emissionFactor) < 0.001) ? emissionFactor : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  const val = parseFloat(e.target.value);
                  onEmissionFactorChange(val);
                  setFactorInput(val.toString());
                  setIsEditingFactor(false);
                } else {
                  setIsEditingFactor(true);
                }
              }}
              className="bg-emerald-950 text-emerald-200 text-[11px] border border-emerald-700/50 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {presets.map((p) => (
                <option key={p.value} value={p.value} className="bg-emerald-950 text-emerald-100">
                  {p.label} ({p.value})
                </option>
              ))}
              <option value="custom" className="bg-emerald-950 text-emerald-100">
                Custom...
              </option>
            </select>
          </div>

          {/* Reset / Upload new file */}
          {hasData && (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-300/90 bg-emerald-900/50 px-2.5 py-1.5 rounded-lg border border-emerald-800">
                <Factory className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[140px] truncate" title={fileName}>
                  {fileName}
                </span>
                <span className="text-emerald-500">•</span>
                <span>{recordsCount?.toLocaleString()} rows</span>
              </div>

              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs bg-emerald-800/60 hover:bg-emerald-700/80 border border-emerald-600/50 text-emerald-100 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="Clear current data and upload a new CSV file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload New CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
