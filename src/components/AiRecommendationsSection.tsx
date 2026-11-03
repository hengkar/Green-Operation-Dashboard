import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Leaf,
  Layers,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Factory,
  CheckCheck,
  Gauge,
  TrendingDown,
} from 'lucide-react';
import { PlantSummary, AiRecommendation, AiRecommendationsResponse } from '../types';
import { generatePlantAuditRecommendations } from '../utils/energyAuditHeuristic';

interface AiRecommendationsSectionProps {
  summary: PlantSummary;
}

export const AiRecommendationsSection: React.FC<AiRecommendationsSectionProps> = ({ summary }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiRecommendationsResponse | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [actionStatus, setActionStatus] = useState<Record<number, string>>({});

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);

    // Prepare payload with computed totals:
    // kWh per line, non-production share per line, peak hour, and total t CO2e
    const payload = {
      totalKwh: summary.totalKwh,
      totalCo2eKg: summary.totalCo2eKg,
      totalCo2eTons: summary.totalCo2eTons,
      emissionFactor: summary.emissionFactor,
      recordsCount: summary.recordsCount,
      dateRange: summary.dateRange,
      peakHourStr: summary.peakHourStr || (summary.highestLoadHour ? `${summary.highestLoadHour.hour.toString().padStart(2, '0')}:00` : 'not available'),
      peakHourOfDay: summary.highestLoadHour,
      lines: summary.lines.map((l) => ({
        name: l.name,
        totalKwh: l.totalKwh,
        sharePercent: l.sharePercent,
        avgKwhPerHour: l.avgKwhPerHour,
        peakKwh: l.peakKwh,
        peakTimestamp: l.peakTimestamp,
        nonProductionKwh: l.nonProductionKwh,
        nonProductionSharePercent: l.nonProductionSharePercent,
      })),
      offPeakVsOnPeak: summary.offPeakVsOnPeak,
    };

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      const responseText = await res.text();

      if (res.ok && contentType.includes('application/json') && !responseText.trim().startsWith('<')) {
        const result: AiRecommendationsResponse = JSON.parse(responseText);
        if (result.recommendations && result.recommendations.length > 0) {
          setData(result);
          return;
        }
      }

      // Fallback engine quoting only computed numbers
      const fallback = generatePlantAuditRecommendations(summary);
      setData(fallback);
    } catch (err: any) {
      console.warn('Network API call error, using local audit engine:', err);
      const fallback = generatePlantAuditRecommendations(summary);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  };

  const copyItem = (rec: AiRecommendation, idx: number) => {
    const text = rec.formattedLine || `${rec.title} · ${rec.evidence} · ${rec.estKwhMonthSaved} · ${rec.effort}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAllItems = () => {
    if (!data?.recommendations) return;
    const allText = data.recommendations
      .map((r) => r.formattedLine || `${r.title} · ${r.evidence} · ${r.estKwhMonthSaved} · ${r.effort}`)
      .join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleAction = (idx: number) => {
    setActionStatus((prev) => ({
      ...prev,
      [idx]: prev[idx] === 'Adopted' ? 'Under Review' : 'Adopted',
    }));
  };

  const getEffortColor = (effort: string) => {
    switch (effort.toUpperCase()) {
      case 'L':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'M':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'H':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getEffortLabel = (effort: string) => {
    switch (effort.toUpperCase()) {
      case 'L':
        return 'Low Effort (L)';
      case 'M':
        return 'Medium Effort (M)';
      case 'H':
        return 'High Effort (H)';
      default:
        return effort;
    }
  };

  const peakHourDisplay = summary.peakHourStr || `${summary.highestLoadHour.hour.toString().padStart(2, '0')}:00`;

  return (
    <section className="bg-gradient-to-b from-white to-emerald-50/40 rounded-2xl border border-emerald-200/80 shadow-sm p-6 sm:p-7 relative overflow-hidden">
      {/* Background visual flair */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header bar */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            AI Efficiency Advisor
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            AI Energy-Saving Recommendations
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Analyzes computed plant metrics (kWh per line, off-shift non-production share, peak hour, and total t CO2e)
            and outputs exactly 3 recommendations quoting strictly computed numbers.
          </p>
        </div>

        {/* Primary Trigger Button */}
        <div className="flex items-center gap-2">
          {data && data.recommendations.length > 0 && (
            <button
              onClick={copyAllItems}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Copy all 3 recommendations"
            >
              {copiedAll ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied All 3</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy All 3</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleGetRecommendations}
            disabled={loading}
            className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
              loading
                ? 'bg-emerald-800 text-emerald-200 cursor-not-allowed opacity-90'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-700/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Generating Recommendations...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{data ? 'Refresh AI Recommendations' : 'Get AI recommendations'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Computed Metrics Sent to Gemini */}
      <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
            Computed Input Metrics for AI
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Gemini quotes ONLY these numbers
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
            <span className="text-[10px] text-slate-400 block">Peak Load Hour</span>
            <strong className="text-slate-900 font-mono text-xs">{peakHourDisplay}</strong>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
            <span className="text-[10px] text-slate-400 block">Total Carbon Footprint</span>
            <strong className="text-teal-800 font-mono text-xs">{summary.totalCo2eTons.toFixed(2)} t CO2e</strong>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
            <span className="text-[10px] text-slate-400 block">Top Consuming Line</span>
            <strong className="text-slate-900 truncate block text-xs">
              {summary.lines[0]?.name || 'not available'} ({summary.lines[0]?.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh)
            </strong>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
            <span className="text-[10px] text-slate-400 block">Top Line Non-Production Share</span>
            <strong className="text-amber-700 font-mono text-xs">
              {summary.lines[0]?.nonProductionSharePercent.toFixed(1)}% ({summary.lines[0]?.nonProductionKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh)
            </strong>
          </div>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-red-900 mb-1">Could not generate recommendations</p>
            <p>{error}</p>
            <button
              onClick={handleGetRecommendations}
              className="mt-2 inline-flex items-center gap-1 font-semibold text-red-800 hover:text-red-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="py-12 px-4 text-center bg-white/70 rounded-xl border border-emerald-100">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            Generating 3 Plain-Language Recommendations...
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Quoting computed line totals, non-production shares, peak hour, and total t CO2e.
          </p>
          <div className="mt-4 max-w-xs mx-auto h-1.5 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Display exactly 3 items in the requested format */}
      {data && !loading && (
        <div className="space-y-4 animate-fadeIn">
          {/* Format Guide Callout */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-white/80 p-2.5 px-3 rounded-lg border border-slate-200">
            <span className="font-mono text-[11px] text-slate-600">
              Format: <strong className="text-emerald-800">Title</strong> · <strong className="text-teal-800">Evidence (with number)</strong> · <strong className="text-amber-800">Est. kWh/month saved</strong> · <strong className="text-slate-800">Effort (L/M/H)</strong>
            </span>
            <span className="text-[10px] text-slate-400">Exactly 3 recommendations</span>
          </div>

          <div className="space-y-3.5">
            {data.recommendations.map((rec, idx) => {
              const formattedString =
                rec.formattedLine || `${rec.title} · ${rec.evidence} · ${rec.estKwhMonthSaved} · ${rec.effort}`;
              const isAdopted = actionStatus[idx] === 'Adopted';

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border transition-all duration-200 p-5 shadow-xs relative ${
                    isAdopted
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                  }`}
                >
                  {/* Top row with Item Number, formatted string, and Copy button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {rec.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => copyItem(rec, idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Copy formatted single-line string"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Line</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => toggleAction(idx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isAdopted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAdopted ? 'Plan Adopted' : 'Mark Plan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Formatted Quote Box (Exact User Specification) */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 font-mono text-xs sm:text-[13px] text-slate-800 select-all flex items-start gap-2 shadow-inner mb-3">
                    <span className="text-emerald-600 font-bold select-none">•</span>
                    <span className="leading-relaxed break-words font-medium">{formattedString}</span>
                  </div>

                  {/* Structured Telemetry Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    {/* Evidence with quoted computed number */}
                    <div className="bg-teal-50/60 border border-teal-100 rounded-lg p-2.5 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                        Evidence (Quoted Metric)
                      </span>
                      <span className="font-semibold text-teal-950 mt-1 leading-snug">
                        {rec.evidence}
                      </span>
                    </div>

                    {/* Est. kWh/month saved */}
                    <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2.5 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" />
                        Est. kWh/Month Saved
                      </span>
                      <span className="font-mono font-bold text-amber-950 text-sm mt-1">
                        {rec.estKwhMonthSaved} kWh
                      </span>
                    </div>

                    {/* Effort Level Badge */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Effort Level
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getEffortColor(
                            rec.effort
                          )}`}
                        >
                          {getEffortLabel(rec.effort)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Placeholder when not yet generated */}
      {!data && !loading && (
        <div className="border border-dashed border-emerald-200/80 rounded-xl p-8 text-center bg-white/60">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Recommendations Ready to Generate
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Click <strong>"Get AI recommendations"</strong> to send the plant's computed totals
            (line kWh, non-production share, peak hour, and total t CO2e) to Gemini and receive 3 structured items.
          </p>
          <button
            onClick={handleGetRecommendations}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get AI recommendations
          </button>
        </div>
      )}
    </section>
  );
};
