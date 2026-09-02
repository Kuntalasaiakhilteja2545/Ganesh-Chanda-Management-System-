import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import StatCard from '../components/StatCard';
import ReceiptModal from '../components/ReceiptModal';
import CountUpNumber from '../components/ui/CountUpNumber';
import {
  HandCoins,
  Receipt,
  Wallet,
  Users,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  UserCheck,
  FileSpreadsheet,
  PieChart,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, role, isTreasurer, activeFestival } = useAuth();
  const { lang, t } = useLanguage();

  const [summary, setSummary] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [activeFestival]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const festivalParam = activeFestival ? `?festival_id=${activeFestival.id}` : '';
      const [summaryRes, donationsRes] = await Promise.all([
        apiClient.get(`/dashboard/summary/${festivalParam}`),
        apiClient.get(`/donations/${festivalParam}`),
      ]);
      setSummary(summaryRes.data);
      const list = donationsRes.data.results || donationsRes.data;
      setRecentDonations(list.slice(0, 6));
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const balanceNum = parseFloat(summary?.balance || 0);
  const isNegative = balanceNum < 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Auspicious Festive Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#701a1e] via-[#881337] to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 border border-white/25 backdrop-blur-md rounded-full text-xs font-bold text-amber-200 shadow-xs">
              <span>🕉️</span>
              <span>{activeFestival?.association_name || 'Jai Hind Ganesh Youth Association'}</span>
            </div>
            <h2 className="heading-font text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {t('welcome')}, {user?.full_name || user?.username}!
            </h2>
            <p className="text-xs sm:text-sm text-amber-100/90 max-w-xl font-medium">
              Real-time treasury tracking, devotee chanda receipts, and accounting transparency for{' '}
              <span className="font-black text-amber-300">{activeFestival?.name || 'Ganesh Chanda 2026'}</span>.
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/donations"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-amber-950 hover:bg-amber-50 font-extrabold text-sm rounded-2xl shadow-lg transition-all transform hover:scale-105 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-700" />
              <span>{t('addDonation')}</span>
            </Link>
            {isTreasurer && (
              <Link
                to="/expenses"
                className="inline-flex items-center gap-2 px-5 py-3 bg-black/40 hover:bg-black/60 border border-white/30 text-white font-extrabold text-sm rounded-2xl backdrop-blur-md transition-all transform hover:scale-105 cursor-pointer shadow-md"
              >
                <Receipt className="w-4 h-4 text-amber-300" />
                <span>{t('addExpense')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Metric Cards with Smooth Financial Count-Up Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('totalDonations')}</p>
              <h3 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                <CountUpNumber value={summary?.total_donations || 0} />
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">{summary?.donation_count || 0} Total receipts</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-600/30 shrink-0">
              <HandCoins className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-rose-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('totalExpenses')}</p>
              <h3 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                <CountUpNumber value={summary?.total_expenses || 0} />
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">{summary?.expense_count || 0} Pandal expenses</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 shrink-0">
              <Receipt className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* FOCAL CARD: Net Treasury Balance */}
        <div
          className={`p-6 rounded-3xl border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${
            isNegative
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-600">{t('netBalance')}</p>
              <h3 className="heading-font text-2xl sm:text-3xl font-black mt-1 text-slate-900">
                <CountUpNumber value={summary?.balance || 0} />
              </h3>
              <p className={`text-xs font-extrabold mt-1 ${isNegative ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isNegative ? '⚠️ Budget Deficit Warning' : '✅ Available in Treasury'}
              </p>
            </div>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                isNegative
                  ? 'bg-gradient-to-tr from-rose-700 to-red-600 shadow-rose-600/30'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-600/30'
              }`}
            >
              <Wallet className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-blue-200/80 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{t('todayCollection')}</p>
              <h3 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                <CountUpNumber value={summary?.today?.donations || 0} />
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">Net: {formatCurrency(summary?.today?.net)} today</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/donations"
          className="p-4 bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-2xl transition-all text-left flex items-center gap-3 shadow-2xs group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Record Chanda</p>
            <p className="text-[10px] text-slate-500">Quick Receipt</p>
          </div>
        </Link>

        {isTreasurer && (
          <>
            <Link
              to="/expenses"
              className="p-4 bg-white hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 rounded-2xl transition-all text-left flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Add Expense</p>
                <p className="text-[10px] text-slate-500">Pandal Bills</p>
              </div>
            </Link>

            <Link
              to="/planning"
              className="p-4 bg-white hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-2xl transition-all text-left flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Plan Budget</p>
                <p className="text-[10px] text-slate-500">Future Outlay</p>
              </div>
            </Link>

            <Link
              to="/reports"
              className="p-4 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all text-left flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Reports</p>
                <p className="text-[10px] text-slate-500">PDF & Excel</p>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Grid: Payment Method Breakdown & Recent Live Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Methods */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-font text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span>Payment Method Breakdown</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {summary?.donation_count || 0} Transactions
              </span>
            </div>

            {summary?.payment_breakdown?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {summary.payment_breakdown.map((pm, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/40 border border-slate-100 hover:border-amber-200 transition-all flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {pm.payment_method}
                    </span>
                    <p className="heading-font text-lg font-extrabold text-slate-800 mt-2">
                      <CountUpNumber value={pm.total || 0} />
                    </p>
                    <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {pm.count} donation{pm.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">{t('noData')}</p>
            )}
          </div>

          {/* Top Expense Categories */}
          {isTreasurer && (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="heading-font text-base font-bold text-slate-900">
                  Expense Category Distribution
                </h3>
                <Link to="/expenses" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
                  <span>View All Expenses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {summary?.category_breakdown?.length > 0 ? (
                <div className="space-y-4">
                  {summary.category_breakdown.map((cat, idx) => {
                    const totalExp = parseFloat(summary.total_expenses || 1);
                    const catAmt = parseFloat(cat.total || 0);
                    const pct = Math.round((catAmt / (totalExp || 1)) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800">{cat.category__name}</span>
                          <span className="text-slate-900 font-mono">
                            {formatCurrency(cat.total)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">{t('noData')}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Recent Donations Live Feed */}
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-font text-base font-bold text-slate-900">
                {t('recentDonations')}
              </h3>
              <Link to="/donations" className="text-xs font-bold text-amber-700 hover:underline">
                View All →
              </Link>
            </div>

            {recentDonations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentDonations.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDonation(d)}
                    className="py-3.5 flex items-center justify-between hover:bg-amber-50/50 -mx-3 px-3 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                        {d.donor_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>{d.receipt?.receipt_number || '#'+d.id}</span>
                        <span>•</span>
                        <span>{d.payment_method_display || d.payment_method}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="heading-font text-sm font-extrabold text-amber-800 group-hover:scale-105 transition-transform">
                        {formatCurrency(d.amount)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{d.donation_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">{t('noData')}</p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                to="/donations"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl transition-colors"
              >
                <span>Record New Contribution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Donation Receipt Modal */}
      {selectedDonation && (
        <ReceiptModal
          isOpen={!!selectedDonation}
          onClose={() => setSelectedDonation(null)}
          donation={selectedDonation}
        />
      )}
    </div>
  );
}
