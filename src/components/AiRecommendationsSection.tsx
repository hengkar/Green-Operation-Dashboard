import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Leaf,
  Layers,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Factory,
  Share2,
} from 'lucide-react';
import { PlantSummary, AiRecommendation, AiRecommendationsResponse } from '../types';

interface AiRecommendationsSectionProps {
  summary: PlantSummary;
}

export const AiRecommendationsSection: React.FC<AiRecommendationsSectionProps> = ({ summary }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiRecommendationsResponse | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<Record<number, string>>({});

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      totalKwh: summary.totalKwh,
      totalCo2eKg: summary.totalCo2eKg,
      totalCo2eTons: summary.totalCo2eTons,
      emissionFactor: summary.emissionFactor,
      recordsCount: summary.recordsCount,
      dateRange: summary.dateRange,
      lines: summary.lines.map((l) => ({
        name: l.name,
        totalKwh: l.totalKwh,
        sharePercent: l.sharePercent,
        avgKwhPerHour: l.avgKwhPerHour,
        peakKwh: l.peakKwh,
        peakTimestamp: l.peakTimestamp,
      })),
      peakHourOfDay: summary.highestLoadHour,
      offPeakVsOnPeak: summary.offPeakVsOnPeak,
    };

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned error (${res.status})`);
      }

      const result: AiRecommendationsResponse = await res.json();
      if (!result.recommendations || result.recommendations.length === 0) {
        throw new Error('Received empty recommendations from Gemini.');
      }
      setData(result);
    } catch (err: any) {
      console.error('Failed to get recommendations:', err);
      setError(err?.message || 'Failed to communicate with recommendation service.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (rec: AiRecommendation, idx: number) => {
    const text = `${rec.title}\nTarget Line: ${rec.targetLine}\nCategory: ${rec.category}\nAction: ${rec.recommendation}\nEstimated Savings: ${rec.estimatedSavings}\nCarbon Impact: ${rec.co2Impact}\nTimeframe: ${rec.implementationTime}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggleAction = (idx: number) => {
    setActionStatus((prev) => ({
      ...prev,
      [idx]: prev[idx] === 'Adopted' ? 'Under Review' : 'Adopted',
    }));
  };

  return (
    <section className="bg-gradient-to-b from-white to-emerald-50/40 rounded-2xl border border-emerald-200/80 shadow-sm p-6 sm:p-7 relative overflow-hidden">
      {/* Background visual flair */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header bar */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            AI Efficiency Advisor
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            AI Energy-Saving Recommendations
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Synthesizes your hourly energy logs, peak demand spikes, and line-by-line power distribution
            to generate 3 actionable, plain-language engineering steps.
          </p>
        </div>

        {/* Primary Trigger Button */}
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
              <span>Analyzing Plant Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>{data ? 'Refresh AI Recommendations' : 'Get AI recommendations'}</span>
            </>
          )}
        </button>
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
            Consulting Gemini Energy Engine...
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Evaluating line consumption distributions, off-peak shifts, and idle-load reduction potential
            for {summary.lines.length} lines.
          </p>
          <div className="mt-4 max-w-xs mx-auto h-1.5 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Display 3 Plain-Language Recommendations */}
      {data && !loading && (
        <div className="space-y-5 animate-fadeIn">
          {/* Executive Overview banner */}
          {data.executiveOverview && (
            <div className="bg-emerald-900/90 text-emerald-100 rounded-xl p-4 text-xs border border-emerald-800/80 flex items-start gap-3 shadow-inner">
              <Factory className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px] block mb-0.5">
                  Plant Profile Assessment
                </span>
                <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                  {data.executiveOverview}
                </p>
              </div>
            </div>
          )}

          {/* 3 Actionable Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.recommendations.map((rec, idx) => {
              const isAdopted = actionStatus[idx] === 'Adopted';

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between p-5 shadow-sm relative ${
                    isAdopted
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Priority badge & category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Priority {idx + 1}
                      </span>

                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider truncate max-w-[130px]">
                        {rec.category}
                      </span>
                    </div>

                    {/* Recommendation Title */}
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {rec.title}
                    </h4>

                    {/* Target Line tag */}
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Target: <strong className="text-slate-800">{rec.targetLine}</strong></span>
                    </div>

                    {/* Plain language explanation */}
                    <p className="text-xs sm:text-[13px] text-slate-600 mt-3 leading-relaxed">
                      {rec.recommendation}
                    </p>
                  </div>

                  {/* Impact telemetry boxes */}
                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <span className="flex items-center gap-1 text-emerald-800 font-medium">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        Expected Savings:
                      </span>
                      <strong className="text-emerald-950 font-semibold">{rec.estimatedSavings}</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 px-1 text-[11px]">
                      <span className="flex items-center gap-1 text-teal-800">
                        <Leaf className="w-3 h-3 text-teal-600" />
                        Carbon Impact:
                      </span>
                      <span className="font-semibold text-slate-700">{rec.co2Impact}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 px-1 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Implementation:
                      </span>
                      <span className="text-slate-700 font-medium">{rec.implementationTime}</span>
                    </div>

                    {/* Actions: Copy & Mark */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyToClipboard(rec, idx)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        title="Copy recommendation text"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => toggleAction(idx)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                          isAdopted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isAdopted ? 'Plan Adopted' : 'Mark Plan'}</span>
                      </button>
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
            Click <strong>"Get AI recommendations"</strong> to run an energy audit on this dataset
            and surface the top 3 actionable efficiency measures for your facility.
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
