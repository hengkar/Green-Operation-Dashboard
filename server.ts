import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface EnergySummaryPayload {
  totalKwh: number;
  totalCo2eKg: number;
  totalCo2eTons: number;
  emissionFactor: number;
  recordsCount: number;
  dateRange: { start: string; end: string };
  lines: Array<{
    name: string;
    totalKwh: number;
    sharePercent: number;
    avgKwhPerHour: number;
    peakKwh: number;
    peakTimestamp: string;
  }>;
  peakHourOfDay?: { hour: number; totalKwh: number };
  offPeakVsOnPeak?: {
    peakHoursKwh: number;
    offPeakHoursKwh: number;
    nightIdleKwh: number;
  };
  dailyAverages?: Array<{ date: string; kwh: number }>;
}

app.post('/api/recommendations', async (req: Request, res: Response) => {
  try {
    const summary: EnergySummaryPayload = req.body;

    if (!summary || typeof summary.totalKwh !== 'number' || summary.totalKwh <= 0) {
      return res.status(400).json({
        error: 'Valid energy consumption data is required to generate recommendations.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.',
      });
    }

    const prompt = `Analyze the following manufacturing plant energy audit summary and generate exactly 3 plain-language, practical, and highly impactful energy-saving recommendations:

Summary Data:
- Total Consumption: ${summary.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
- Total Carbon Emissions: ${summary.totalCo2eKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO2e (${summary.totalCo2eTons.toFixed(2)} metric tons CO2e)
- Applied Grid Emission Factor: ${summary.emissionFactor} kg CO2e/kWh
- Time Period Covered: ${summary.dateRange.start} to ${summary.dateRange.end} (${summary.recordsCount} hourly logs)
- Production Lines Breakdown:
${summary.lines
  .map(
    (l) =>
      `  * ${l.name}: ${l.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh (${l.sharePercent.toFixed(1)}% of plant total). Peak record: ${l.peakKwh.toFixed(1)} kWh at ${l.peakTimestamp}`
  )
  .join('\n')}
${
  summary.peakHourOfDay
    ? `- Highest load hour of day: ${summary.peakHourOfDay.hour}:00 with ${summary.peakHourOfDay.totalKwh.toFixed(1)} kWh aggregate`
    : ''
}
${
  summary.offPeakVsOnPeak
    ? `- Peak vs Off-Peak / Night Idle: Daytime/Peak: ${summary.offPeakVsOnPeak.peakHoursKwh.toFixed(1)} kWh, Night/Off-peak: ${summary.offPeakVsOnPeak.offPeakHoursKwh.toFixed(1)} kWh, Midnight-5am Idle Base Load: ${summary.offPeakVsOnPeak.nightIdleKwh.toFixed(1)} kWh`
    : ''
}

Requirements:
1. Provide exactly 3 clear, distinct, and realistic energy-saving recommendations tailored to this plant's specific data (e.g., targeting the highest-consuming line, off-peak load shifting, nighttime base load / vampire draw reduction, equipment maintenance/VFDs, or motor scheduling).
2. Use plain, accessible manufacturing operations language (avoid vague generic fluff).
3. Specify realistic estimated impact and difficulty level for plant floor supervisors and facility engineers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior industrial energy auditor and sustainability consultant for manufacturing plants. You provide clear, concrete, actionable, and mathematically grounded energy efficiency recommendations based on real hourly consumption data.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveOverview: {
              type: Type.STRING,
              description: 'A 1-2 sentence high-level observation of the plant profile.',
            },
            recommendations: {
              type: Type.ARRAY,
              description: 'Exactly 3 plain-language energy saving recommendations.',
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Concise, action-oriented title.',
                  },
                  targetLine: {
                    type: Type.STRING,
                    description: 'Specific line targeted (e.g. "Line 2", "All Lines", or "Facility Wide").',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Category such as "Load Shifting", "Idle Mitigation", "Equipment Tuning", or "Peak Shaving".',
                  },
                  recommendation: {
                    type: Type.STRING,
                    description: 'Plain-language explanation of the problem and the specific action step to take.',
                  },
                  estimatedSavings: {
                    type: Type.STRING,
                    description: 'Quantified estimate (e.g. "~8-14% on Line 1", "Saves ~450 kWh/week").',
                  },
                  co2Impact: {
                    type: Type.STRING,
                    description: 'Estimated CO2 reduction in kg or metric tons.',
                  },
                  implementationTime: {
                    type: Type.STRING,
                    description: 'e.g. "Immediate (0-2 weeks)", "1-3 months", "Next scheduled turnaround".',
                  },
                },
                required: ['title', 'targetLine', 'category', 'recommendation', 'estimatedSavings', 'co2Impact', 'implementationTime'],
              },
            },
          },
          required: ['executiveOverview', 'recommendations'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    const message = error?.message || 'Failed to generate recommendations.';
    return res.status(500).json({ error: message });
  }
});

// Setup Vite middleware in dev or static serve in prod
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Green Ops Dashboard server running on port ${PORT}`);
  });
}

startServer();
