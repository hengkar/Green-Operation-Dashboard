import React from 'react';
import { Clock, Sun, Moon, Zap, ArrowRight } from 'lucide-react';
import { HourlyProfilePoint, PlantSummary } from '../types';

interface PeakHourHeatmapProps {
  summary: PlantSummary;
}

export const PeakHourHeatmap: React.FC<PeakHourHeatmapProps> = ({ summary }) => {
  const { hourlyProfile, highestLoadHour, lowestLoadHour, offPeakVsOnPeak } = summary;
  const maxKwh = Math.max(...hourlyProfile.map((h) => h.totalKwh), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">24-Hour Load Distribution</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Diurnal aggregate power profile across plant operating shifts
          </p>
        </div>

        {/* Shift summary chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
            <Sun className="w-3 h-3 text-amber-600" />
            Day Shift (08-20h): <strong>{offPeakVsOnPeak.peakHoursKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</strong>
          </span>
          <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <Moon className="w-3 h-3 text-slate-500" />
            Night Idle (00-06h): <strong>{offPeakVsOnPeak.nightIdleKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh</strong>
          </span>
        </div>
      </div>

      {/* 24-hour bar columns visualizer */}
      <div className="relative pt-6 pb-2">
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-36">
          {hourlyProfile.map((item) => {
            const heightPercent = (item.totalKwh / maxKwh) * 100;
            const isHighest = item.hour === highestLoadHour.hour;
            const isNight = item.hour < 6 || item.hour >= 22;

            return (
              <div
                key={item.hour}
                className="group relative flex flex-col items-center h-full justify-end"
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-200 group-hover:brightness-110 ${
                    isHighest
                      ? 'bg-amber-500 shadow-sm shadow-amber-500/40'
                      : isNight
                      ? 'bg-slate-300 hover:bg-slate-400'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                  style={{ height: `${Math.max(6, heightPercent)}%` }}
                />

                {/* X axis hour label */}
                <span className="text-[9px] font-mono text-slate-400 mt-1.5 select-none hidden sm:block">
                  {item.hour % 3 === 0 ? `${item.hour}h` : ''}
                </span>

                {/* Floating tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap border border-slate-700 font-mono">
                    <div className="font-bold text-amber-400">{item.displayHour}</div>
                    <div>{item.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh aggregate</div>
                    <div className="text-[9px] text-slate-400">Avg: {item.avgKwh.toFixed(1)} kWh/hr</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footnote notes */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>Active Production Hours</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span>Peak Demand Hour ({highestLoadHour.hour}:00)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" />
            <span>Off-Peak / Night Base Load</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          Night idle consumes{' '}
          <strong className="text-slate-700">
            {summary.totalKwh > 0 ? ((offPeakVsOnPeak.nightIdleKwh / summary.totalKwh) * 100).toFixed(1) : 0}%
          </strong>{' '}
          of all electricity
        </div>
      </div>
    </div>
  );
};
