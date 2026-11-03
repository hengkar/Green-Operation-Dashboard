export type ShiftFilter = 'ALL' | 'PRODUCTION' | 'NON_PRODUCTION';

export interface RawEnergyRow {
  timestamp: string;
  line: string;
  kwh: number;
}

export interface EnergyRecord {
  id: string;
  timestamp: string;
  dateStr: string; // YYYY-MM-DD
  displayDate: string;
  hour: number; // 0-23
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  line: string;
  kwh: number;
  co2eKg: number;
  isProduction: boolean;
}

export interface LineSummary {
  name: string;
  totalKwh: number;
  sharePercent: number;
  avgKwhPerHour: number;
  peakKwh: number;
  peakTimestamp: string;
  co2eKg: number;
  co2eTons: number;
  color: string;
  nonProductionKwh: number;
  nonProductionSharePercent: number;
}

export interface DailyTrendPoint {
  dateStr: string;
  displayDate: string;
  totalKwh: number;
  co2eKg: number;
  lineKwh: Record<string, number>;
}

export interface HourlyProfilePoint {
  hour: number;
  displayHour: string;
  totalKwh: number;
  avgKwh: number;
  recordsCount: number;
}

export interface PlantSummary {
  totalKwh: number;
  totalCo2eKg: number;
  totalCo2eTons: number;
  emissionFactor: number;
  recordsCount: number;
  dateRange: {
    start: string;
    end: string;
    daysCount: number;
  };
  lines: LineSummary[];
  dailyTrends: DailyTrendPoint[];
  hourlyProfile: HourlyProfilePoint[];
  peakRecord: {
    kwh: number;
    line: string;
    timestamp: string;
  };
  highestLoadHour: {
    hour: number;
    totalKwh: number;
  };
  lowestLoadHour: {
    hour: number;
    totalKwh: number;
  };
  peakHourStr: string;
  offPeakVsOnPeak: {
    peakHoursKwh: number; // 8am - 8pm
    offPeakHoursKwh: number; // 8pm - midnight
    nightIdleKwh: number; // midnight - 6am
  };
}

export interface AiRecommendation {
  title: string;
  evidence: string;
  estKwhMonthSaved: string;
  effort: 'L' | 'M' | 'H';
  formattedLine: string;
  targetLine?: string;
  category?: string;
}

export interface AiRecommendationsResponse {
  executiveOverview?: string;
  recommendations: AiRecommendation[];
}
