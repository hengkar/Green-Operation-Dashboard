import { EnergyRecord, LineSummary, DailyTrendPoint, HourlyProfilePoint, PlantSummary } from '../types';

export const LINE_COLORS = [
  '#059669', // Emerald 600
  '#0284c7', // Sky 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#e11d48', // Rose 600
  '#0d9488', // Teal 600
  '#4f46e5', // Indigo 600
  '#ca8a04', // Yellow 600
];

export interface ParseResult {
  records: EnergyRecord[];
  errors: string[];
  warnings: string[];
  fileName: string;
}

export function parseCSV(csvText: string, fileName = 'upload.csv', emissionFactor = 0.74): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const records: EnergyRecord[] = [];

  const rawLines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (rawLines.length < 2) {
    return {
      records: [],
      errors: ['The CSV file is empty or does not have at least one header and one data row.'],
      warnings: [],
      fileName,
    };
  }

  // Detect delimiter
  const firstLine = rawLines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  const splitRow = (row: string) => {
    // Simple regex CSV splitter handling quotes
    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
    const result: string[] = [];
    let match;
    while ((match = regex.exec(row)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      result.push((val || '').trim());
      if (regex.lastIndex >= row.length) break;
    }
    return result;
  };

  const headers = splitRow(firstLine).map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));

  // Find column indexes
  let timestampIdx = headers.findIndex((h) => h.includes('time') || h.includes('date'));
  let lineIdx = headers.findIndex((h) => h.includes('line') || h.includes('machine') || h.includes('equip') || h.includes('unit'));
  let kwhIdx = headers.findIndex((h) => h.includes('kwh') || h.includes('energy') || h.includes('power') || h.includes('watt'));

  // Fallback if index wasn't found by keyword
  if (timestampIdx === -1 && headers.length >= 3) timestampIdx = 0;
  if (lineIdx === -1 && headers.length >= 3) lineIdx = 1;
  if (kwhIdx === -1 && headers.length >= 3) kwhIdx = 2;

  if (timestampIdx === -1 || lineIdx === -1 || kwhIdx === -1) {
    return {
      records: [],
      errors: [
        `Could not detect required columns in header: "timestamp", "line", "kWh". Found headers: ${splitRow(firstLine).join(', ')}`,
      ],
      warnings: [],
      fileName,
    };
  }

  let skippedCount = 0;

  for (let i = 1; i < rawLines.length; i++) {
    const row = splitRow(rawLines[i]);
    if (row.length < 3) continue;

    const rawTimestamp = row[timestampIdx];
    const rawLine = row[lineIdx];
    const rawKwh = row[kwhIdx];

    if (!rawTimestamp || !rawLine || !rawKwh) {
      skippedCount++;
      continue;
    }

    // Clean kwh number (remove commas, currency, spaces)
    const cleanKwh = parseFloat(rawKwh.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    if (isNaN(cleanKwh) || cleanKwh < 0) {
      skippedCount++;
      continue;
    }

    // Parse date
    const dateObj = new Date(rawTimestamp);
    let dateStr = '';
    let displayDate = '';
    let hour = 0;

    if (isNaN(dateObj.getTime())) {
      // Try parsing formats like YYYY-MM-DD HH:mm or DD/MM/YYYY HH:mm
      const parts = rawTimestamp.split(/[\sT]+/);
      if (parts.length >= 2) {
        const timePart = parts[1];
        const hourPart = parseInt(timePart.split(':')[0], 10);
        hour = isNaN(hourPart) ? 0 : hourPart;
        dateStr = parts[0];
        displayDate = parts[0];
      } else {
        dateStr = rawTimestamp;
        displayDate = rawTimestamp;
        hour = 0;
      }
    } else {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
      displayDate = dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      hour = dateObj.getHours();
    }

    const co2eKg = cleanKwh * emissionFactor;

    records.push({
      id: `rec-${i}`,
      timestamp: rawTimestamp,
      dateStr,
      displayDate,
      hour,
      line: rawLine.trim(),
      kwh: cleanKwh,
      co2eKg,
    });
  }

  if (skippedCount > 0) {
    warnings.push(`Skipped ${skippedCount} rows due to invalid formatting or missing numbers.`);
  }

  if (records.length === 0) {
    errors.push('No valid energy rows could be parsed. Please check that kWh contains numerical values.');
  }

  return {
    records,
    errors,
    warnings,
    fileName,
  };
}

export function aggregatePlantData(records: EnergyRecord[], emissionFactor = 0.74): PlantSummary {
  let totalKwh = 0;
  let totalCo2eKg = 0;
  let peakKwh = -1;
  let peakRecord = { kwh: 0, line: 'N/A', timestamp: 'N/A' };

  const lineMap: Record<
    string,
    { totalKwh: number; count: number; peakKwh: number; peakTimestamp: string }
  > = {};
  const dailyMap: Record<string, { displayDate: string; totalKwh: number; lineKwh: Record<string, number> }> = {};
  const hourMap: Record<number, { totalKwh: number; count: number }> = {};

  for (let h = 0; h < 24; h++) {
    hourMap[h] = { totalKwh: 0, count: 0 };
  }

  for (const r of records) {
    totalKwh += r.kwh;
    const co2 = r.kwh * emissionFactor;
    totalCo2eKg += co2;

    if (r.kwh > peakKwh) {
      peakKwh = r.kwh;
      peakRecord = {
        kwh: r.kwh,
        line: r.line,
        timestamp: r.timestamp,
      };
    }

    // Line map
    if (!lineMap[r.line]) {
      lineMap[r.line] = { totalKwh: 0, count: 0, peakKwh: 0, peakTimestamp: '' };
    }
    lineMap[r.line].totalKwh += r.kwh;
    lineMap[r.line].count += 1;
    if (r.kwh > lineMap[r.line].peakKwh) {
      lineMap[r.line].peakKwh = r.kwh;
      lineMap[r.line].peakTimestamp = r.timestamp;
    }

    // Daily map
    if (!dailyMap[r.dateStr]) {
      dailyMap[r.dateStr] = {
        displayDate: r.displayDate || r.dateStr,
        totalKwh: 0,
        lineKwh: {},
      };
    }
    dailyMap[r.dateStr].totalKwh += r.kwh;
    dailyMap[r.dateStr].lineKwh[r.line] = (dailyMap[r.dateStr].lineKwh[r.line] || 0) + r.kwh;

    // Hourly map
    if (hourMap[r.hour] !== undefined) {
      hourMap[r.hour].totalKwh += r.kwh;
      hourMap[r.hour].count += 1;
    }
  }

  // Build sorted lines
  const lineNames = Object.keys(lineMap).sort((a, b) => lineMap[b].totalKwh - lineMap[a].totalKwh);
  const lines: LineSummary[] = lineNames.map((name, idx) => {
    const item = lineMap[name];
    const sharePercent = totalKwh > 0 ? (item.totalKwh / totalKwh) * 100 : 0;
    const co2e = item.totalKwh * emissionFactor;
    return {
      name,
      totalKwh: item.totalKwh,
      sharePercent,
      avgKwhPerHour: item.count > 0 ? item.totalKwh / item.count : 0,
      peakKwh: item.peakKwh,
      peakTimestamp: item.peakTimestamp,
      co2eKg: co2e,
      co2eTons: co2e / 1000,
      color: LINE_COLORS[idx % LINE_COLORS.length],
    };
  });

  // Build daily trends sorted chronologically
  const sortedDates = Object.keys(dailyMap).sort();
  const dailyTrends: DailyTrendPoint[] = sortedDates.map((dateStr) => {
    const d = dailyMap[dateStr];
    return {
      dateStr,
      displayDate: d.displayDate,
      totalKwh: d.totalKwh,
      co2eKg: d.totalKwh * emissionFactor,
      lineKwh: d.lineKwh,
    };
  });

  // Hourly profile
  const hourlyProfile: HourlyProfilePoint[] = [];
  let highestLoadHour = { hour: 0, totalKwh: -1 };
  let lowestLoadHour = { hour: 0, totalKwh: Infinity };

  let peakHoursKwh = 0; // 8:00 - 19:59
  let offPeakHoursKwh = 0; // 20:00 - 23:59 and 6:00 - 7:59
  let nightIdleKwh = 0; // 0:00 - 5:59

  for (let h = 0; h < 24; h++) {
    const item = hourMap[h];
    const avg = item.count > 0 ? item.totalKwh / item.count : 0;
    const displayHour = `${h.toString().padStart(2, '0')}:00`;

    hourlyProfile.push({
      hour: h,
      displayHour,
      totalKwh: item.totalKwh,
      avgKwh: avg,
      recordsCount: item.count,
    });

    if (item.totalKwh > highestLoadHour.totalKwh) {
      highestLoadHour = { hour: h, totalKwh: item.totalKwh };
    }
    if (item.totalKwh < lowestLoadHour.totalKwh) {
      lowestLoadHour = { hour: h, totalKwh: item.totalKwh };
    }

    if (h >= 8 && h < 20) {
      peakHoursKwh += item.totalKwh;
    } else if (h >= 0 && h < 6) {
      nightIdleKwh += item.totalKwh;
    } else {
      offPeakHoursKwh += item.totalKwh;
    }
  }

  const dateRange = {
    start: sortedDates.length > 0 ? sortedDates[0] : 'N/A',
    end: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : 'N/A',
    daysCount: sortedDates.length,
  };

  return {
    totalKwh,
    totalCo2eKg,
    totalCo2eTons: totalCo2eKg / 1000,
    emissionFactor,
    recordsCount: records.length,
    dateRange,
    lines,
    dailyTrends,
    hourlyProfile,
    peakRecord,
    highestLoadHour,
    lowestLoadHour: lowestLoadHour.totalKwh === Infinity ? { hour: 0, totalKwh: 0 } : lowestLoadHour,
    offPeakVsOnPeak: {
      peakHoursKwh,
      offPeakHoursKwh,
      nightIdleKwh,
    },
  };
}

/**
 * Generates sample CSV string for a realistic small manufacturing plant
 * 14 days of hourly data across 4 production lines
 */
export function generateSamplePlantCsv(): string {
  const lines = ['Extrusion Line 1', 'CNC Milling Line 2', 'Paint & Curing Booth', 'Packaging & Palletizing'];
  const baseLoads: Record<string, { day: number; night: number; noise: number }> = {
    'Extrusion Line 1': { day: 85, night: 42, noise: 12 },
    'CNC Milling Line 2': { day: 55, night: 15, noise: 8 },
    'Paint & Curing Booth': { day: 70, night: 8, noise: 10 },
    'Packaging & Palletizing': { day: 35, night: 4, noise: 5 },
  };

  const rows: string[] = ['timestamp,line,kWh'];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 14);
  startDate.setMinutes(0, 0, 0);

  for (let day = 0; day < 14; day++) {
    for (let h = 0; h < 24; h++) {
      const current = new Date(startDate);
      current.setDate(current.getDate() + day);
      current.setHours(h);

      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      const isWorkHours = h >= 7 && h <= 18;
      const isPeakShift = h >= 10 && h <= 15;

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const hr = String(h).padStart(2, '0');
      const timestamp = `${year}-${month}-${d} ${hr}:00`;

      for (const lineName of lines) {
        const config = baseLoads[lineName];
        let kwh = 0;

        if (isWeekend) {
          // Weekend minimal maintenance/idle
          kwh = config.night * 0.5 + Math.random() * config.noise * 0.3;
        } else if (isWorkHours) {
          kwh = config.day + (isPeakShift ? 15 : 0) + (Math.random() * config.noise * 2 - config.noise);
          // Occasional surge on extrusion
          if (lineName === 'Extrusion Line 1' && h === 14 && day % 3 === 0) {
            kwh += 28;
          }
        } else {
          // Night idle or second shift
          kwh = config.night + (Math.random() * config.noise - config.noise * 0.5);
        }

        kwh = Math.max(1.2, Math.round(kwh * 10) / 10);
        rows.push(`${timestamp},${lineName},${kwh}`);
      }
    }
  }

  return rows.join('\n');
}

export function downloadCsvFile(content: string, filename = 'green_ops_energy_data.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
