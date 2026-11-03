/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EnergyRecord, PlantSummary, ShiftFilter } from './types';
import { parseCSV, aggregatePlantData } from './utils/csvParser';
import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { KpiCards } from './components/KpiCards';
import { DailyTrendChart } from './components/DailyTrendChart';
import { LineBarChart } from './components/LineBarChart';
import { PeakHourHeatmap } from './components/PeakHourHeatmap';
import { AiRecommendationsSection } from './components/AiRecommendationsSection';
import { DataTable } from './components/DataTable';
import {
  Leaf,
  Calendar,
  AlertCircle,
  Filter,
  Sun,
  Moon,
  Info,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  // Default emission factor: 0.740 kg CO2e / kWh as specified
  const [emissionFactor, setEmissionFactor] = useState<number>(0.74);
  // Shift filter: Production / Non-production / All (Production = Mon–Sat 07:00–23:00)
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('ALL');

  // Compute shift counts across the entire uploaded dataset
  const { productionCount, nonProductionCount, productionKwh, nonProductionKwh } = useMemo(() => {
    let prodCount = 0;
    let nonProdCount = 0;
    let prodKwh = 0;
    let nonProdKwh = 0;

    for (const r of records) {
      if (r.isProduction) {
        prodCount++;
        prodKwh += r.kwh;
      } else {
        nonProdCount++;
        nonProdKwh += r.kwh;
      }
    }

    return {
      productionCount: prodCount,
      nonProductionCount: nonProdCount,
      productionKwh: prodKwh,
      nonProductionKwh: nonProdKwh,
    };
  }, [records]);

  // Filter records based on active shift filter
  const filteredRecords = useMemo(() => {
    if (shiftFilter === 'PRODUCTION') {
      return records.filter((r) => r.isProduction);
    }
    if (shiftFilter === 'NON_PRODUCTION') {
      return records.filter((r) => !r.isProduction);
    }
    return records;
  }, [records, shiftFilter]);

  // Compute aggregated summary dynamically from filtered records
  const summary: PlantSummary | null = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return aggregatePlantData(filteredRecords, emissionFactor);
  }, [filteredRecords, emissionFactor]);

  const handleFileLoaded = (csvText: string, name: string) => {
    const result = parseCSV(csvText, name, emissionFactor);
    if (result.errors.length > 0) {
      setParseErrors(result.errors);
      setParseWarnings(result.warnings);
      setRecords([]);
      setFileName('');
      return;
    }

    setParseErrors([]);
    setParseWarnings(result.warnings);
    setRecords(result.records);
    setFileName(name);
  };

  const handleReset = () => {
    setRecords([]);
    setFileName('');
    setParseErrors([]);
    setParseWarnings([]);
    setShiftFilter('ALL');
  };

  const hasData = records.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        hasData={hasData}
        fileName={fileName}
        recordsCount={records.length}
        emissionFactor={emissionFactor}
        onEmissionFactorChange={(val) => setEmissionFactor(val)}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {!hasData ? (
          /* Empty State: Shown until user uploads CSV or loads sample */
          <EmptyState onFileLoaded={handleFileLoaded} parseErrors={parseErrors} />
        ) : (
          /* Active Dashboard View */
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Top Operational Header & Shift Filter Toggle */}
            <div className="space-y-3">
              {/* Audit period & Grid factor info bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Audit Period:{' '}
                      <span className="font-mono">
                        {summary?.dateRange.start} to {summary?.dateRange.end}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      {records.length.toLocaleString()} total hourly interval logs across{' '}
                      <strong className="text-slate-700">{summary?.lines.length || 0} production lines</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-medium">
                    {summary?.dateRange.daysCount} Operating Days
                  </span>
                  <span className="bg-teal-50 text-teal-800 px-3 py-1 rounded-full border border-teal-200 font-medium">
                    Grid Factor: {emissionFactor} kg/kWh
                  </span>
                </div>
              </div>

              {/* Shift Filter Control: Production / Non-production / All */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Filter className="w-4 h-4 text-emerald-600" />
                    <span>Shift Filter:</span>
                  </div>

                  {/* Segmented Toggle Control */}
                  <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 w-full sm:w-auto">
                    {/* All Button */}
                    <button
                      type="button"
                      onClick={() => setShiftFilter('ALL')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        shiftFilter === 'ALL'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>All</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-200/60 text-slate-700 ml-0.5">
                        {records.length}
                      </span>
                    </button>

                    {/* Production Button */}
                    <button
                      type="button"
                      onClick={() => setShiftFilter('PRODUCTION')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        shiftFilter === 'PRODUCTION'
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-700/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Production</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ml-0.5 ${
                          shiftFilter === 'PRODUCTION'
                            ? 'bg-emerald-700/60 text-emerald-100'
                            : 'bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        {productionCount}
                      </span>
                    </button>

                    {/* Non-production Button */}
                    <button
                      type="button"
                      onClick={() => setShiftFilter('NON_PRODUCTION')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        shiftFilter === 'NON_PRODUCTION'
                          ? 'bg-amber-600 text-white shadow-xs shadow-amber-700/20'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Non-production</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ml-0.5 ${
                          shiftFilter === 'NON_PRODUCTION'
                            ? 'bg-amber-700/60 text-amber-100'
                            : 'bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        {nonProductionCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Filter definition helper text */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 w-full md:w-auto">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    <strong>Production:</strong> Mon–Sat 07:00–23:00 •{' '}
                    <strong>Non-production:</strong> Mon–Sat 23:00–07:00 & Sun
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings notification if rows were skipped */}
            {parseWarnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  {parseWarnings.map((w, idx) => (
                    <span key={idx}>{w} </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filter Notice if filtered */}
            {shiftFilter !== 'ALL' && (
              <div
                className={`p-3 px-4 rounded-xl text-xs flex items-center justify-between border ${
                  shiftFilter === 'PRODUCTION'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {shiftFilter === 'PRODUCTION' ? (
                    <Sun className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Moon className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    All charts currently filtered to{' '}
                    <strong>
                      {shiftFilter === 'PRODUCTION'
                        ? 'Production Shifts (Mon–Sat 07:00–23:00)'
                        : 'Non-production / Idle Hours (Mon–Sat 23:00–07:00 & Sun)'}
                    </strong>
                    . Showing {filteredRecords.length.toLocaleString()} matching hourly logs (
                    {summary?.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 }) || 0} kWh).
                  </span>
                </div>

                <button
                  onClick={() => setShiftFilter('ALL')}
                  className="font-bold underline text-xs hover:opacity-80 cursor-pointer ml-2 whitespace-nowrap"
                >
                  Clear filter (Show All)
                </button>
              </div>
            )}

            {summary ? (
              <>
                {/* 1. Top KPI Row: Total kWh, Total t CO2e, Peak hour of the month, Top consuming line */}
                <KpiCards summary={summary} />

                {/* 2. Charts Section: Daily Trend Line Chart & Line Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Trend Line Chart */}
                  <DailyTrendChart
                    dailyTrends={summary.dailyTrends}
                    lines={summary.lines}
                    emissionFactor={emissionFactor}
                  />

                  {/* Bar chart of total kWh by line */}
                  <LineBarChart
                    lines={summary.lines}
                    totalPlantKwh={summary.totalKwh}
                    emissionFactor={emissionFactor}
                  />
                </div>

                {/* 3. AI Recommendations Section (Gemini 3.8 Flash) */}
                <AiRecommendationsSection summary={summary} />

                {/* 4. 24-Hour Diurnal Load Distribution */}
                <PeakHourHeatmap summary={summary} />

                {/* 5. Raw Hourly Data Table */}
                <DataTable
                  records={filteredRecords}
                  lines={summary.lines}
                  emissionFactor={emissionFactor}
                />
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                <p className="text-slate-500 text-sm">
                  No records match the selected shift filter.
                </p>
                <button
                  onClick={() => setShiftFilter('ALL')}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Reset Filter to All
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Green Ops Dashboard</span>
            <span>• Manufacturing Energy & Carbon Intelligence</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <span>
              Shift Definition: <code className="font-mono text-emerald-800">Mon–Sat 07:00–23:00</code>
            </span>
            <span>•</span>
            <span>
              Formula: <code className="font-mono text-emerald-800">CO2e = kWh × {emissionFactor}</code>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
