import React, { useState, useMemo } from 'react';
import { DailyTrendPoint, LineSummary } from '../types';
import { TrendingUp, Calendar, Filter, Sparkles } from 'lucide-react';

interface DailyTrendChartProps {
  dailyTrends: DailyTrendPoint[];
  lines: LineSummary[];
  emissionFactor: number;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({ dailyTrends, lines, emissionFactor }) => {
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute values based on selected line filter
  const points = useMemo(() => {
    return dailyTrends.map((d) => {
      let kwh = 0;
      if (selectedLine === 'ALL') {
        kwh = d.totalKwh;
      } else {
        kwh = d.lineKwh[selectedLine] || 0;
      }
      return {
        dateStr: d.dateStr,
        displayDate: d.displayDate,
        kwh,
        co2eKg: kwh * emissionFactor,
        allLineKwh: d.lineKwh,
      };
    });
  }, [dailyTrends, selectedLine, emissionFactor]);

  const { maxVal, minVal, avgVal, peakPoint } = useMemo(() => {
    if (points.length === 0) return { maxVal: 100, minVal: 0, avgVal: 0, peakPoint: null };

    let max = -Infinity;
    let min = Infinity;
    let sum = 0;
    let peak = points[0];

    for (const p of points) {
      if (p.kwh > max) {
        max = p.kwh;
        peak = p;
      }
      if (p.kwh < min) min = p.kwh;
      sum += p.kwh;
    }

    const avg = sum / points.length;
    return {
      maxVal: max <= 0 ? 100 : max * 1.15, // Headroom for chart
      minVal: 0,
      avgVal: avg,
      peakPoint: peak,
    };
  }, [points]);

  // SVG dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 30, right: 25, bottom: 40, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Coordinate mappers
  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (points.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    if (maxVal === 0) return padding.top + chartH;
    const ratio = (val - minVal) / (maxVal - minVal);
    return padding.top + chartH - ratio * chartH;
  };

  // Build SVG path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => {
      const x = getX(idx);
      const y = getY(p.kwh);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [points, maxVal]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(points.length - 1);
    const bottomY = padding.top + chartH;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, points.length]);

  // Y-axis grid ticks
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  // X-axis sample dates
  const xTickIndices = useMemo(() => {
    if (points.length <= 6) return points.map((_, i) => i);
    const step = Math.ceil(points.length / 6);
    const result: number[] = [];
    for (let i = 0; i < points.length; i += step) {
      result.push(i);
    }
    if (result[result.length - 1] !== points.length - 1) {
      result.push(points.length - 1);
    }
    return result;
  }, [points.length]);

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      {/* Header with Title and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Daily kWh Trend</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total daily electricity consumption trend over time
          </p>
        </div>

        {/* Line filter selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Line:
          </span>
          <select
            value={selectedLine}
            onChange={(e) => {
              setSelectedLine(e.target.value);
              setHoveredIdx(null);
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Lines Combined</option>
            {lines.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 text-slate-600">
          Daily Avg: <strong className="text-slate-900 font-mono">{avgVal.toFixed(1)} kWh</strong>
        </div>
        {peakPoint && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-emerald-800">
            Peak Day: <strong className="font-mono">{peakPoint.displayDate}</strong> ({peakPoint.kwh.toFixed(1)} kWh)
          </div>
        )}
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full aspect-[16/8] sm:aspect-[16/6] min-h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#059669" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y labels */}
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

          {/* Average Reference Line */}
          {avgVal > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={getY(avgVal)}
                x2={width - padding.right}
                y2={getY(avgVal)}
                stroke="#0d9488"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                opacity="0.8"
              />
              <text
                x={width - padding.right}
                y={getY(avgVal) - 4}
                textAnchor="end"
                fontSize="9"
                fill="#0d9488"
                fontWeight="600"
              >
                Avg ({avgVal.toFixed(0)} kWh)
              </text>
            </g>
          )}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#emeraldAreaGrad)" />}

          {/* Line stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Date Labels */}
          {xTickIndices.map((idx) => {
            const p = points[idx];
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
              >
                {p.displayDate}
              </text>
            );
          })}

          {/* Interactive vertical hover line & points */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const y = getY(p.kwh);
            const isHovered = hoveredIdx === idx;

            return (
              <g key={idx}>
                {/* Invisible hover trigger columns */}
                <rect
                  x={x - (chartW / points.length / 2)}
                  y={padding.top}
                  width={chartW / points.length}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onTouchStart={() => setHoveredIdx(idx)}
                />

                {/* Point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3}
                  fill={isHovered ? '#047857' : '#ffffff'}
                  stroke="#059669"
                  strokeWidth={isHovered ? 2.5 : 1.8}
                  className="transition-all duration-150 pointer-events-none"
                />

                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + chartH}
                    stroke="#059669"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && hoveredIdx !== null && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 w-56 transform -translate-x-1/2 transition-all duration-75"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${Math.max(10, (getY(activePoint.kwh) / height) * 100 - 35)}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5">
              <span className="font-semibold text-slate-200">{activePoint.displayDate}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {(activePoint.co2eKg / 1000).toFixed(2)} t CO2e
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-slate-400">Total Consumption:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {activePoint.kwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
              </span>
            </div>

            {selectedLine === 'ALL' && Object.keys(activePoint.allLineKwh).length > 0 && (
              <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Lines:</span>
                {Object.entries(activePoint.allLineKwh).slice(0, 4).map(([lineName, val]) => (
                  <div key={lineName} className="flex justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[120px]">{lineName}</span>
                    <span className="font-mono text-slate-200">{val.toFixed(0)} kWh</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 mt-2 text-right">
        Hover or tap any date to inspect daily kWh & carbon footprint
      </div>
    </div>
  );
};
