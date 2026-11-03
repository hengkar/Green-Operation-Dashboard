import React from 'react';
import { Zap, Leaf, Clock, Factory, Car, Trees } from 'lucide-react';
import { PlantSummary } from '../types';

interface KpiCardsProps {
  summary: PlantSummary;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary }) => {
  const topConsumingLine = summary.lines.length > 0 ? summary.lines[0] : null;

  // EPA equivalencies:
  // ~0.404 kg CO2 per mile driven by average gasoline vehicle -> miles = totalCo2eKg / 0.404
  // ~60 kg CO2 absorbed by an urban tree seedling over 10 years -> trees = totalCo2eKg / 60
  const vehicleMiles = Math.round(summary.totalCo2eKg / 0.404);
  const treeSeedlings = Math.round(summary.totalCo2eKg / 60);

  const peakHourDisplay =
    summary.peakHourStr ||
    (summary.highestLoadHour ? `${summary.highestLoadHour.hour.toString().padStart(2, '0')}:00` : '14:00');

  return (
    <div className="space-y-4">
      {/* Top KPI Row: Total kWh, Total t CO2e, Peak hour of the month, Top consuming line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total kWh */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105 pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total kWh
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm font-bold text-emerald-700">kWh</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>{summary.recordsCount.toLocaleString()} readings</span>
              <span>•</span>
              <span>{summary.dateRange.daysCount} days logged</span>
            </p>
          </div>
        </div>

        {/* 2. Total t CO2e */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105 pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total t CO2e
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-950 tracking-tight">
                {summary.totalCo2eTons.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-teal-700">t CO2e</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
              <span>{summary.totalCo2eKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO2e</span>
              <span className="text-slate-400">@</span>
              <span className="font-mono text-emerald-700 font-medium">{summary.emissionFactor} kg/kWh</span>
            </p>
          </div>
        </div>

        {/* 3. Peak hour of the month */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105 pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Peak hour of the month
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {peakHourDisplay}
              </span>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Daily Peak
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate" title={`Max event: ${summary.peakRecord.kwh.toFixed(1)} kWh on ${summary.peakRecord.timestamp} (${summary.peakRecord.line})`}>
              <span>Peak hour draw: <strong className="text-slate-700 font-mono">{summary.highestLoadHour.totalKwh.toFixed(0)} kWh</strong></span>
              <span className="mx-1">•</span>
              <span>Spike: <strong className="text-slate-700 font-mono">{summary.peakRecord.kwh.toFixed(1)} kWh</strong></span>
            </p>
          </div>
        </div>

        {/* 4. Top consuming line */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105 pointer-events-none" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Top consuming line
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative">
            {topConsumingLine ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight truncate max-w-[170px]" title={topConsumingLine.name}>
                    {topConsumingLine.name}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {topConsumingLine.sharePercent.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  <strong className="text-slate-700 font-mono">
                    {topConsumingLine.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                  </strong>
                  <span className="mx-1">•</span>
                  <span>{topConsumingLine.co2eTons.toFixed(2)} t CO2e</span>
                </p>
              </>
            ) : (
              <span className="text-sm text-slate-400">None detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Environmental Equivalent Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-xl p-4 px-5 border border-emerald-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
              Carbon Impact Equivalence
              <span className="text-[11px] font-normal text-emerald-400">
                (EPA Greenhouse Gas Equivalencies)
              </span>
            </h4>
            <p className="text-xs text-emerald-200/80">
              Generating {summary.totalCo2eTons.toFixed(2)} tons of CO2e in this timeframe is roughly equivalent to:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
            <Car className="w-4 h-4 text-emerald-400" />
            <span>
              <strong className="text-emerald-300 font-mono text-sm">{vehicleMiles.toLocaleString()}</strong> miles driven in a gas car
            </span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
            <Trees className="w-4 h-4 text-teal-300" />
            <span>
              <strong className="text-teal-300 font-mono text-sm">{treeSeedlings.toLocaleString()}</strong> tree seedlings grown for 10 yrs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
