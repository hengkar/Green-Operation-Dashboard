import React, { useState, useMemo } from 'react';
import { DailyTrendPoint, LineSummary } from '../types';
import { Layers, Calendar, Sparkles, Activity } from 'lucide-react';

interface DailyTrendChartProps {
  dailyTrends: DailyTrendPoint[];
  lines: LineSummary[];
  emissionFactor: number;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  dailyTrends,
  lines,
  emissionFactor,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<string | null>(null);

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Maximum cumulative kWh across all days for Y-scale
  const { maxVal, peakPoint, avgVal } = useMemo(() => {
    if (dailyTrends.length === 0) {
      return { maxVal: 100, peakPoint: null, avgVal: 0 };
    }

    let max = 0;
    let sum = 0;
    let peak = dailyTrends[0];

    for (const d of dailyTrends) {
      if (d.totalKwh > max) {
        max = d.totalKwh;
        peak = d;
      }
      sum += d.totalKwh;
    }

    const avg = sum / dailyTrends.length;
    return {
      maxVal: max <= 0 ? 100 : max * 1.15, // Headroom for stacked peaks
      peakPoint: peak,
      avgVal: avg,
    };
  }, [dailyTrends]);

  // Coordinate mappers
  const getX = (index: number) => {
    if (dailyTrends.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (dailyTrends.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    if (maxVal === 0) return padding.top + chartH;
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    return padding.top + chartH - ratio * chartH;
  };

  // Compute stacked layers for each line
  const stackedLayers = useMemo(() => {
    if (dailyTrends.length === 0 || lines.length === 0) return [];

    let prevCumulative = new Array(dailyTrends.length).fill(0);

    return lines.map((line) => {
      const lineDailyVals = dailyTrends.map((d) => d.lineKwh[line.name] || 0);
      const currCumulative = prevCumulative.map((prev, i) => prev + lineDailyVals[i]);

      // Forward path along upper boundary
      const forwardPoints = currCumulative.map(
        (val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`
      );

      // Backward path along lower boundary
      const backwardPoints = prevCumulative
        .slice()
        .reverse()
        .map((val, rIdx) => {
          const origIdx = dailyTrends.length - 1 - rIdx;
          return `L ${getX(origIdx).toFixed(1)} ${getY(val).toFixed(1)}`;
        });

      const areaPath = `${forwardPoints.join(' ')} ${backwardPoints.join(' ')} Z`;
      const topLinePath = forwardPoints.join(' ');

      // Store lower and upper values for hover lookup
      const layerData = {
        line,
        areaPath,
        topLinePath,
        lowerVals: [...prevCumulative],
        upperVals: [...currCumulative],
      };

      // Advance baseline for next line
      prevCumulative = currCumulative;
      return layerData;
    });
  }, [dailyTrends, lines, maxVal]);

  // Y-axis grid ticks
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  // X-axis sample date indexes
  const xTickIndices = useMemo(() => {
    if (dailyTrends.length <= 7) return dailyTrends.map((_, i) => i);
    const step = Math.ceil(dailyTrends.length / 6);
    const result: number[] = [];
    for (let i = 0; i < dailyTrends.length; i += step) {
      result.push(i);
    }
    if (result[result.length - 1] !== dailyTrends.length - 1) {
      result.push(dailyTrends.length - 1);
    }
    return result;
  }, [dailyTrends.length]);

  const activeDay = hoveredIdx !== null && dailyTrends[hoveredIdx] ? dailyTrends[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Stacked Daily kWh by Line
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cumulative daily energy profile stacked by production line
          </p>
        </div>

        {/* Legend pills with interactive highlight */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {lines.map((line) => {
            const isSelected = highlightedLine === line.name;
            const isDimmed = highlightedLine !== null && !isSelected;

            return (
              <button
                key={line.name}
                type="button"
                onMouseEnter={() => setHighlightedLine(line.name)}
                onMouseLeave={() => setHighlightedLine(null)}
                onClick={() => setHighlightedLine(isSelected ? null : line.name)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : isDimmed
                    ? 'opacity-40 bg-white border-slate-200 text-slate-500'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title={`Highlight ${line.name}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: line.color }}
                />
                <span className="truncate max-w-[110px]">{line.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-slate-600">
          Daily Average: <strong className="text-slate-900 font-mono">{avgVal.toFixed(1)} kWh</strong>
        </div>
        {peakPoint && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-emerald-800">
            Peak Day: <strong className="font-mono">{peakPoint.displayDate}</strong> ({peakPoint.totalKwh.toFixed(1)} kWh)
          </div>
        )}
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1 text-teal-800">
          Stacked Lines: <strong>{lines.length}</strong>
        </div>
      </div>

      {/* Interactive Stacked Area SVG */}
      <div className="relative w-full aspect-[16/7] min-h-[240px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Y Axis Grid lines & Labels */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={i === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="sans-serif"
                >
                  {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : Math.round(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Average Total Line Reference */}
          {avgVal > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(avgVal)}
                x2={width - padding.right}
                y2={getY(avgVal)}
                stroke="#0f766e"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <text
                x={width - padding.right}
                y={getY(avgVal) - 4}
                textAnchor="end"
                fontSize="9"
                fill="#0f766e"
                fontWeight="700"
              >
                Avg Total ({avgVal.toFixed(0)} kWh)
              </text>
            </g>
          )}

          {/* Stacked Area Layers */}
          {stackedLayers.map((layer) => {
            const isHighlighted = highlightedLine === layer.line.name;
            const isDimmed = highlightedLine !== null && !isHighlighted;

            return (
              <g
                key={layer.line.name}
                className="transition-opacity duration-200"
                style={{ opacity: isDimmed ? 0.25 : 1 }}
              >
                {/* Area Fill */}
                <path
                  d={layer.areaPath}
                  fill={layer.line.color}
                  fillOpacity={isHighlighted ? 0.9 : 0.72}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHighlightedLine(layer.line.name)}
                  onMouseLeave={() => setHighlightedLine(null)}
                />

                {/* Top Stroke for Sharp Separation */}
                <path
                  d={layer.topLinePath}
                  fill="none"
                  stroke={layer.line.color}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {xTickIndices.map((idx) => {
            const p = dailyTrends[idx];
            if (!p) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontWeight="500"
              >
                {p.displayDate}
              </text>
            );
          })}

          {/* Interactive vertical hover trigger columns */}
          {dailyTrends.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIdx === idx;
            const colWidth = chartW / Math.max(1, dailyTrends.length);

            return (
              <g key={idx}>
                <rect
                  x={x - colWidth / 2}
                  y={padding.top}
                  width={colWidth}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onTouchStart={() => setHoveredIdx(idx)}
                />

                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartH}
                    stroke="#0f172a"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Breakdown */}
        {activeDay && hoveredIdx !== null && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white text-xs p-3.5 rounded-xl shadow-xl border border-slate-700 w-64 transform -translate-x-1/2 transition-all duration-75"
            style={{
              left: `${Math.max(18, Math.min(82, (getX(hoveredIdx) / width) * 100))}%`,
              top: `${Math.max(8, (getY(activeDay.totalKwh) / height) * 100 - 30)}%`,
            }}
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {activeDay.displayDate}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                {((activeDay.totalKwh * emissionFactor) / 1000).toFixed(2)} t CO2e
              </span>
            </div>

            {/* Total Daily Power */}
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-slate-400">Total Stacked:</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                {activeDay.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                <span className="text-xs font-normal">kWh</span>
              </span>
            </div>

            {/* Line-by-Line Breakdown for this day */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Line Breakdown:
              </span>
              {lines.map((l) => {
                const lineKwh = activeDay.lineKwh[l.name] || 0;
                const sharePercent =
                  activeDay.totalKwh > 0 ? (lineKwh / activeDay.totalKwh) * 100 : 0;

                return (
                  <div key={l.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="text-slate-300 truncate">{l.name}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-200 font-bold">{lineKwh.toFixed(1)} kWh</span>
                      <span className="text-[10px] text-slate-400 w-10 text-right">
                        ({sharePercent.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 mt-3 flex items-center justify-between">
        <span>Hover to inspect daily line proportions & carbon</span>
        <span>Click legend to highlight line</span>
      </div>
    </div>
  );
};
