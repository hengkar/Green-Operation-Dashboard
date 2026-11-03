import React, { useState, useMemo } from 'react';
import { EnergyRecord, LineSummary } from '../types';
import { Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { downloadCsvFile } from '../utils/csvParser';

interface DataTableProps {
  records: EnergyRecord[];
  lines: LineSummary[];
  emissionFactor: number;
}

export const DataTable: React.FC<DataTableProps> = ({ records, lines, emissionFactor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [sortField, setSortField] = useState<'timestamp' | 'kwh' | 'line'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.line.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLine = selectedLine === 'ALL' || r.line === selectedLine;
      return matchesSearch && matchesLine;
    });
  }, [records, searchTerm, selectedLine]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = a.timestamp.localeCompare(b.timestamp);
      } else if (sortField === 'kwh') {
        comparison = a.kwh - b.kwh;
      } else if (sortField === 'line') {
        comparison = a.line.localeCompare(b.line);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentRecords = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: 'timestamp' | 'kwh' | 'line') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleExportFiltered = () => {
    const csvContent = [
      'timestamp,line,kWh,co2e_kg',
      ...sorted.map((r) => `${r.timestamp},"${r.line}",${r.kwh},${(r.kwh * emissionFactor).toFixed(3)}`),
    ].join('\n');
    downloadCsvFile(csvContent, 'green_ops_exported_logs.csv');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Hourly Log Records</h3>
            <p className="text-xs text-slate-500">
              Showing {sorted.length} matching rows of {records.length} total
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search date or line..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Line filter */}
          <select
            value={selectedLine}
            onChange={(e) => {
              setSelectedLine(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-300 text-slate-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Lines</option>
            {lines.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExportFiltered}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th
                onClick={() => handleSort('timestamp')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('line')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Line Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">
                Shift
              </th>
              <th
                onClick={() => handleSort('kwh')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Consumption (kWh)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">
                Carbon (kg CO2e)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                  No records match your filters.
                </td>
              </tr>
            ) : (
              currentRecords.map((r) => {
                const co2 = r.kwh * emissionFactor;
                return (
                  <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-4 text-slate-800">{r.timestamp}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{r.line}</td>
                    <td className="py-2.5 px-4 font-sans">
                      {r.isProduction ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Production
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Non-prod
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {r.kwh.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-800 font-semibold">
                      {co2.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div className="p-3.5 px-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
        <div>
          Page <strong className="font-mono">{currentPage}</strong> of <strong className="font-mono">{totalPages}</strong>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
