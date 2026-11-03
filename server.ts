import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required because Nginx on 8080 proxies to 3000
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize GoogleGenAI with current key
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface EnergySummaryPayload {
  totalKwh: number;
  totalCo2eKg?: number;
  totalCo2eTons?: number;
  emissionFactor?: number;
  recordsCount?: number;
  dateRange?: { start: string; end: string };
  peakHourStr?: string;
  lines?: Array<{
    name: string;
    totalKwh: number;
    sharePercent: number;
    avgKwhPerHour: number;
    peakKwh: number;
    peakTimestamp: string;
    nonProductionKwh?: number;
    nonProductionSharePercent?: number;
  }>;
  peakHourOfDay?: { hour: number; totalKwh: number };
  offPeakVsOnPeak?: {
    peakHoursKwh: number;
    offPeakHoursKwh: number;
    nightIdleKwh: number;
  };
  dailyAverages?: Array<{ date: string; kwh: number }>;
}

/**
 * Intelligent deterministic plant audit heuristic fallback
 * Quotes ONLY the computed numbers: kWh per line, non-production share per line,
 * peak hour, and total t CO2e. If not available, writes "not available".
 * Output format: Title · Evidence (with the number) · Est. kWh/month saved · Effort (L/M/H)
 */
function generateHeuristicRecommendations(summary: EnergySummaryPayload) {
  const lines = summary.lines || [];
  const top = lines.length > 0 ? lines[0] : null;
  const second = lines.length > 1 ? lines[1] : null;
  const third = lines.length > 2 ? lines[2] : null;

  const peakHour = summary.peakHourStr || (summary.peakHourOfDay ? `${summary.peakHourOfDay.hour.toString().padStart(2, '0')}:00` : 'not available');
  const totalCo2e = summary.totalCo2eTons !== undefined ? `${summary.totalCo2eTons.toFixed(2)} t CO2e` : 'not available';

  const recommendations = [];

  // Item 1: Top line off-shift evidence
  if (top) {
    const evidence = top.nonProductionSharePercent !== undefined && top.nonProductionKwh !== undefined
      ? `${top.nonProductionSharePercent.toFixed(1)}% of ${top.name} kWh is off-shift (${top.nonProductionKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh)`
      : (top.totalKwh !== undefined ? `${top.name} consumes ${top.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh` : 'not available');
    const title = `Eliminate off-shift idle load on ${top.name}`;
    const estSaved = top.nonProductionKwh ? Math.round(top.nonProductionKwh * 0.25).toLocaleString() : '1,500';
    const effort = 'L';
    recommendations.push({
      title,
      evidence,
      estKwhMonthSaved: estSaved,
      effort,
      formattedLine: `${title} · ${evidence} · ${estSaved} · ${effort}`,
    });
  } else {
    recommendations.push({
      title: 'Automate off-shift auxiliary power down',
      evidence: 'not available',
      estKwhMonthSaved: '1,000',
      effort: 'L',
      formattedLine: 'Automate off-shift auxiliary power down · not available · 1,000 · L',
    });
  }

  // Item 2: Peak hour and total t CO2e evidence
  {
    const title = 'Stagger batch operations during peak demand hour';
    const evidence = `Plant peak hour is ${peakHour} contributing to ${totalCo2e}`;
    const estSaved = top && top.totalKwh ? Math.round(top.totalKwh * 0.08).toLocaleString() : '2,000';
    const effort = 'M';
    recommendations.push({
      title,
      evidence,
      estKwhMonthSaved: estSaved,
      effort,
      formattedLine: `${title} · ${evidence} · ${estSaved} · ${effort}`,
    });
  }

  // Item 3: Second line non-production or total consumption evidence
  if (second) {
    const evidence = second.nonProductionSharePercent !== undefined && second.nonProductionKwh !== undefined
      ? `${second.nonProductionSharePercent.toFixed(1)}% of ${second.name} kWh is off-shift (${second.nonProductionKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh)`
      : (second.totalKwh !== undefined ? `${second.name} totals ${second.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh` : 'not available');
    const title = `Tune drive cycles and standby sleep on ${second.name}`;
    const estSaved = second.nonProductionKwh ? Math.round(second.nonProductionKwh * 0.3).toLocaleString() : '800';
    const effort = 'L';
    recommendations.push({
      title,
      evidence,
      estKwhMonthSaved: estSaved,
      effort,
      formattedLine: `${title} · ${evidence} · ${estSaved} · ${effort}`,
    });
  } else if (third) {
    const evidence = third.totalKwh !== undefined ? `${third.name} consumes ${third.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh` : 'not available';
    const title = `Optimize run scheduling on ${third.name}`;
    const estSaved = '600';
    const effort = 'L';
    recommendations.push({
      title,
      evidence,
      estKwhMonthSaved: estSaved,
      effort,
      formattedLine: `${title} · ${evidence} · ${estSaved} · ${effort}`,
    });
  } else {
    const evidence = `Total plant emissions currently at ${totalCo2e}`;
    const title = 'Install sub-metering on auxiliary distribution panels';
    const estSaved = '500';
    const effort = 'L';
    recommendations.push({
      title,
      evidence,
      estKwhMonthSaved: estSaved,
      effort,
      formattedLine: `${title} · ${evidence} · ${estSaved} · ${effort}`,
    });
  }

  return {
    recommendations: recommendations.slice(0, 3),
  };
}

async function callGeminiWithRetry(ai: GoogleGenAI, prompt: string, modelName = 'gemini-3.8-flash', retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an industrial energy efficiency consultant for small manufacturing plants. You provide clear, concrete recommendations that quote ONLY the provided computed numbers from the energy audit. If a number is not provided, you must say "not available". Return exactly 3 items, each formatted as Title · Evidence (with the number) · Est. kWh/month saved · Effort (L/M/H).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                description: 'Exactly 3 items, each as: Title · Evidence (with the number) · Est. kWh/month saved · Effort (L/M/H)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: 'Action title, e.g. "Fix compressed-air leaks"',
                    },
                    evidence: {
                      type: Type.STRING,
                      description:
                        'Evidence quoting ONLY the computed numbers provided (e.g. "30% of air kWh is off-shift (7,286 kWh)"). If a number is not provided, write "not available".',
                    },
                    estKwhMonthSaved: {
                      type: Type.STRING,
                      description: 'Estimated kWh saved per month, e.g. "2,000"',
                    },
                    effort: {
                      type: Type.STRING,
                      description: 'Effort level, strictly "L", "M", or "H"',
                    },
                    formattedLine: {
                      type: Type.STRING,
                      description:
                        'Full line formatted as: "Title · Evidence · Est. kWh/month saved · Effort (L/M/H)", e.g. "Fix compressed-air leaks · 30% of air kWh is off-shift (7,286 kWh) · 2,000 · L"',
                    },
                  },
                  required: ['title', 'evidence', 'estKwhMonthSaved', 'effort', 'formattedLine'],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (err: any) {
      const isUnavailable =
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.status === 503;

      if (isUnavailable && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      if (isUnavailable && modelName === 'gemini-3.8-flash') {
        try {
          return await callGeminiWithRetry(ai, prompt, 'gemini-3.1-flash-lite', 1);
        } catch {
          // bubble up
        }
      }

      throw err;
    }
  }
  throw new Error('Gemini models unavailable after retries.');
}

app.post('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const summary: EnergySummaryPayload = req.body;

    if (!summary || typeof summary.totalKwh !== 'number' || summary.totalKwh <= 0) {
      return res.status(400).json({
        error: 'Valid energy consumption data is required to generate recommendations.',
      });
    }

    const ai = getGeminiClient();

    // If Gemini client cannot be initialized, use heuristic engine quoting only computed numbers
    if (!ai) {
      const heuristic = generateHeuristicRecommendations(summary);
      return res.json(heuristic);
    }

    // Format computed numbers specifically requested:
    // 1. kWh per line
    const kwhPerLineText = (summary.lines || [])
      .map(
        (l) =>
          `* ${l.name}: ${l.totalKwh !== undefined ? `${Number(l.totalKwh).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh` : 'not available'}`
      )
      .join('\n') || 'not available';

    // 2. Non-production share per line
    const nonProductionShareText = (summary.lines || [])
      .map((l) => {
        if (l.nonProductionSharePercent !== undefined && l.nonProductionKwh !== undefined) {
          return `* ${l.name}: ${Number(l.nonProductionSharePercent).toFixed(1)}% of ${l.name} kWh is off-shift (${Number(l.nonProductionKwh).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh)`;
        }
        return `* ${l.name}: not available`;
      })
      .join('\n') || 'not available';

    // 3. Peak hour
    const peakHourText = summary.peakHourStr || (summary.peakHourOfDay ? `${summary.peakHourOfDay.hour.toString().padStart(2, '0')}:00` : 'not available');

    // 4. Total t CO2e
    const totalCo2eText = summary.totalCo2eTons !== undefined ? `${Number(summary.totalCo2eTons).toFixed(2)} t CO2e` : 'not available';

    const prompt = `The plant energy monitoring app has already computed the following totals:

Computed Data:
1. kWh per line:
${kwhPerLineText}

2. Non-production share per line:
${nonProductionShareText}

3. Peak hour:
${peakHourText}

4. Total t CO2e:
${totalCo2eText}

MANDATORY RULES:
1. The "Evidence" field must quote ONLY the computed numbers above (e.g. "32.3% of Extrusion Line 1 kWh is off-shift (2,100 kWh)" or "Plant peak hour is 14:00 with 10.73 t CO2e"). If a number is not provided in the computed data, write "not available".
2. "Est. kWh/month saved" must be a realistic estimated monthly savings number (e.g. "2,000", "1,500", "800") derived from the off-shift or peak reduction.
3. Return exactly 3 items, each as:
   Title · Evidence (with the number) · Est. kWh/month saved · Effort (L/M/H)
   Example: "Fix compressed-air leaks · 30% of air kWh is off-shift (7,286 kWh) · 2,000 · L"
4. Effort must be strictly "L", "M", or "H".`;

    try {
      const result = await callGeminiWithRetry(ai, prompt, 'gemini-3.8-flash', 2);
      return res.json(result);
    } catch (geminiError: any) {
      console.warn('Gemini API call failed, falling back to data heuristic audit:', geminiError?.message);
      const heuristic = generateHeuristicRecommendations(summary);
      return res.json(heuristic);
    }
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return res.status(200).json(generateHeuristicRecommendations(req.body || { totalKwh: 1000 }));
  }
});

// Setup Vite middleware in dev or static serve in prod
const isProd = process.env.NODE_ENV === 'production';
const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(distPath);

async function startServer() {
  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Green Ops Dashboard server running on port ${PORT}`);
  });
}

startServer();
