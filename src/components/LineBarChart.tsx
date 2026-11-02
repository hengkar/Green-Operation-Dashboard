import React, { useState } from 'react';
import { LineSummary } from '../types';
import { BarChart3, ArrowDownUp, Zap, Leaf, Activity } from 'lucide-react';

interface LineBarChartProps {
  lines: LineSummary[];
  totalPlantKwh: number;
  emissionFactor: number;
}

export const LineBarChart: React.FC<LineBarChartProps> = ({ lines, totalPlantKwh, emissionFactor }) => {
  const [sortBy, setSortBy] = useState<'kwh' | 'name'>('kwh');
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const sortedLines = [...lines].sort((a, b) => {
    if (sortBy === 'kwh') return b.totalKwh - a.totalKwh;
    return a.name.localeCompare(b.name);
  });

  const maxLineKwh = lines.length > 0 ? Math.max(...lines.map((l) => l.totalKwh)) : 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Total kWh by Line</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of cumulative power and emissions per production line
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setSortBy(sortBy === 'kwh' ? 'name' : 'kwh')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowDownUp className="w-3 h-3 text-slate-400" />
            <span>Sort: {sortBy === 'kwh' ? 'Highest kWh' : 'Alphabetical'}</span>
          </button>
        </div>
      </div>

      {/* Bar List */}
      <div className="space-y-4 my-2">
        {sortedLines.map((line) => {
          const barWidthPercent = maxLineKwh > 0 ? (line.totalKwh / maxLineKwh) * 100 : 0;
          const isHovered = hoveredLine === line.name;

          return (
            <div
              key={line.name}
              onMouseEnter={() => setHoveredLine(line.name)}
              onMouseLeave={() => setHoveredLine(null)}
              className={`p-3 rounded-xl border transition-all duration-150 ${
                isHovered
                  ? 'bg-slate-50 border-emerald-300 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Row title & values */}
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="font-semibold text-slate-900 truncate text-sm" title={line.name}>
                    {line.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {line.sharePercent.toFixed(1)}% of plant
                  </span>
                </div>

                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {line.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
                  </span>
                  <span className="text-[11px] text-teal-700 font-medium">
                    ({line.co2eTons.toFixed(2)} t CO2e)
                  </span>
                </div>
              </div>

              {/* Bar track and fill */}
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(2, barWidthPercent)}%`,
                    backgroundColor: line.color,
                  }}
                />
              </div>

              {/* Sub-row telemetry */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-slate-400" />
                  Avg: <strong className="text-slate-600 font-mono">{line.avgKwhPerHour.toFixed(1)} kWh/hr</strong>
                </span>
                <span>
                  Peak spike: <strong className="text-slate-600 font-mono">{line.peakKwh.toFixed(1)} kWh</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Plant Total footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Combined Active Lines: <strong>{lines.length}</strong></span>
        <span>
          Total:{' '}
          <strong className="text-slate-900 font-mono text-sm">
            {totalPlantKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
          </strong>
        </span>
      </div>
    </div>
  );
};
