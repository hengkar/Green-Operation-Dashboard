/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { EnergyRecord, PlantSummary } from './types';
import { parseCSV, aggregatePlantData } from './utils/csvParser';
import { Navbar } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { KpiCards } from './components/KpiCards';
import { DailyTrendChart } from './components/DailyTrendChart';
import { LineBarChart } from './components/LineBarChart';
import { PeakHourHeatmap } from './components/PeakHourHeatmap';
import { AiRecommendationsSection } from './components/AiRecommendationsSection';
import { DataTable } from './components/DataTable';
import { Leaf, Layers, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  // Default emission factor: 0.740 kg CO2e / kWh as specified
  const [emissionFactor, setEmissionFactor] = useState<number>(0.74);

  // Compute aggregated summary whenever records or emission factor change
  const summary: PlantSummary | null = useMemo(() => {
    if (records.length === 0) return null;
    return aggregatePlantData(records, emissionFactor);
  }, [records, emissionFactor]);

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
  };

  const hasData = records.length > 0 && summary !== null;

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
            {/* Header sub-banner with date range & warning toasts */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Audit Period: {summary.dateRange.start} to {summary.dateRange.end}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Logged {summary.recordsCount.toLocaleString()} hourly interval readings across{' '}
                    <strong className="text-slate-700">{summary.lines.length} production lines</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-medium">
                  {summary.dateRange.daysCount} Operating Days
                </span>
                <span className="bg-teal-50 text-teal-800 px-3 py-1 rounded-full border border-teal-200 font-medium">
                  Grid Factor: {emissionFactor} kg/kWh
                </span>
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

            {/* 1. KPI Cards */}
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
              records={records}
              lines={summary.lines}
              emissionFactor={emissionFactor}
            />
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

          <div className="flex items-center gap-4 text-slate-500">
            <span>Formula: <code className="font-mono text-emerald-700">CO2e (kg) = kWh × {emissionFactor}</code></span>
            <span>•</span>
            <span>CSV Spec: <code className="font-mono text-slate-600">timestamp, line, kWh</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
