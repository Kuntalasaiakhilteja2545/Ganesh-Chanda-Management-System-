import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSync } from '../context/LiveSyncContext';
import apiClient from '../api/client';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarRange,
} from 'lucide-react';

export default function Reports() {
  const { activeFestival } = useAuth();
  const { t } = useLanguage();
  const { syncVersion } = useLiveSync();

  const [tab, setTab] = useState('daily'); // 'daily' | 'monthly' | 'comparison'
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [year1, setYear1] = useState('2025');
  const [year2, setYear2] = useState('2026');

  useEffect(() => {
    if (tab === 'daily') fetchDailyReport();
    if (tab === 'monthly') fetchMonthlyReport();
    if (tab === 'comparison') fetchComparisonReport();
  }, [tab, reportDate, reportMonth, activeFestival, syncVersion]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFestival) params.append('festival_id', activeFestival.id);
      params.append('date', reportDate);
      const res = await apiClient.get(`/reports/daily/?${params.toString()}`);
      setDailyData(res.data);
    } catch (err) {
      console.error('Error loading daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFestival) params.append('festival_id', activeFestival.id);
      params.append('month', reportMonth);
      const res = await apiClient.get(`/reports/monthly/?${params.toString()}`);
      setMonthlyData(res.data);
    } catch (err) {
      console.error('Error loading monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('year1', year1);
      params.append('year2', year2);
      const res = await apiClient.get(`/reports/comparison/?${params.toString()}`);
      setComparisonData(res.data);
    } catch (err) {
      console.error('Error loading comparison report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async (type) => {
    try {
      const festivalId = activeFestival ? activeFestival.id : 1;
      const res = await apiClient.get(`/exports/${type}/?festival_id=${festivalId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_festival_${festivalId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exporting ${type} excel:`, err);
      alert(`Could not export ${type} excel file.`);
    }
  };

  const handleDownloadAuditPdf = async () => {
    try {
      const festivalId = activeFestival ? activeFestival.id : 1;
      const res = await apiClient.get(`/reports/audit-statement-pdf/?festival_id=${festivalId}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Festival_Audit_Statement_${activeFestival?.year || '2026'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading audit PDF:', err);
      alert('Could not download Audit Statement PDF. Please check server connection.');
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl font-extrabold text-slate-900">
            {t('reports')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily audits, monthly breakdowns, annual comparisons, official audit PDFs, and Excel exports.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAuditPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-900/20 transition-all cursor-pointer hover:scale-105"
            title="Download official 1-page financial balance sheet & audit statement"
          >
            <Download className="w-3.5 h-3.5 text-amber-200" />
            <span>Official Audit PDF 📄</span>
          </button>
          <button
            onClick={() => handleExportExcel('donations')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Donations Excel</span>
          </button>
          <button
            onClick={() => handleExportExcel('expenses')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Expenses Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'daily'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('dailyReport')}
        </button>
        <button
          onClick={() => setTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'monthly'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('monthlyReport')}
        </button>
        <button
          onClick={() => setTab('comparison')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'comparison'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('comparisonReport')}
        </button>
      </div>

      {/* TAB 1: DAILY REPORT */}
      {tab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Select Date:</span>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
            {dailyData && (
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-amber-700">
                  Collections: {formatCurrency(dailyData.total_donations)}
                </span>
                <span className="text-rose-700">
                  Expenses: {formatCurrency(dailyData.total_expenses)}
                </span>
                <span className="text-emerald-700">
                  Net: {formatCurrency(dailyData.daily_net)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donations for the day */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="heading-font text-base font-bold text-slate-900 mb-4">
                Donations on {reportDate} ({dailyData?.donations?.length || 0})
              </h3>
              {dailyData?.donations?.length > 0 ? (
                <div className="space-y-2">
                  {dailyData.donations.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{d.donor__name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {d.payment_method} • by {d.collected_by__full_name || 'Admin'}
                        </p>
                      </div>
                      <span className="font-mono font-extrabold text-amber-700 text-sm">
                        {formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">No donations recorded on this date.</p>
              )}
            </div>

            {/* Expenses for the day */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="heading-font text-base font-bold text-slate-900 mb-4">
                Expenses on {reportDate} ({dailyData?.expenses?.length || 0})
              </h3>
              {dailyData?.expenses?.length > 0 ? (
                <div className="space-y-2">
                  {dailyData.expenses.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{e.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {e.category__name} • Paid by {e.paid_by__full_name || 'Admin'}
                        </p>
                      </div>
                      <span className="font-mono font-extrabold text-rose-700 text-sm">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">No expenses recorded on this date.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY REPORT */}
      {tab === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarRange className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Select Month:</span>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
            {monthlyData && (
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="text-amber-700">
                  Month Total: {formatCurrency(monthlyData.total_donations)}
                </span>
                <span className="text-rose-700">
                  Month Expense: {formatCurrency(monthlyData.total_expenses)}
                </span>
                <span className="text-emerald-700">
                  Month Balance: {formatCurrency(monthlyData.balance)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="heading-font text-base font-bold text-slate-900 mb-4">
              Daily Aggregations in {reportMonth}
            </h3>
            {monthlyData?.daily_donations?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Donation Collections</th>
                      <th className="py-3 px-4">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData.daily_donations.map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-800">{d.day}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          {formatCurrency(d.total)}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{d.count} receipt(s)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">{t('noData')}</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: YEAR-OVER-YEAR COMPARISON */}
      {tab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Year 1:</span>
              <input
                type="number"
                value={year1}
                onChange={(e) => setYear1(e.target.value)}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Year 2:</span>
              <input
                type="number"
                value={year2}
                onChange={(e) => setYear2(e.target.value)}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
            <button
              onClick={fetchComparisonReport}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Compare
            </button>
          </div>

          {comparisonData?.comparison ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="heading-font text-base font-bold text-slate-900">
                  Category Expense Comparison ({year1} vs {year2})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3.5 px-6">Category</th>
                      <th className="py-3.5 px-6">{year1} Spent</th>
                      <th className="py-3.5 px-6">{year2} Spent</th>
                      <th className="py-3.5 px-6">Difference</th>
                      <th className="py-3.5 px-6">% Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonData.comparison.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 font-bold text-slate-900">{c.category}</td>
                        <td className="py-3.5 px-6 font-mono font-semibold">
                          {formatCurrency(c[`year_${year1}`])}
                        </td>
                        <td className="py-3.5 px-6 font-mono font-semibold">
                          {formatCurrency(c[`year_${year2}`])}
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold">
                          {formatCurrency(c.difference)}
                        </td>
                        <td className="py-3.5 px-6 font-semibold">
                          {c.percentage_change != null ? `${c.percentage_change}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">Click compare to view multi-year festival metrics.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
