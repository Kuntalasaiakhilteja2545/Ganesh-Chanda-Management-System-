import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSync } from '../context/LiveSyncContext';
import apiClient from '../api/client';
import VelamLeaderboard from '../components/VelamLeaderboard';
import {
  Languages,
  MapPin,
  Users2,
  Phone,
  Crown,
  Building,
  CreditCard,
  CheckCircle2,
  Utensils,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicPortal() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { syncVersion } = useLiveSync();
  const [data, setData] = useState(null);
  const [festival, setFestival] = useState(null);
  const [committee, setCommittee] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
  }, [syncVersion]);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const festId = searchParams.get('festival_id');
      const assoc = searchParams.get('association');

      const params = new URLSearchParams();
      if (festId) params.append('festival_id', festId);
      if (assoc) params.append('association', assoc);

      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const [dashRes, festRes, commRes] = await Promise.all([
        apiClient.get(`/public/dashboard/${queryStr}`),
        apiClient.get(`/festivals/${queryStr}`),
        apiClient.get(`/committee-members/${queryStr}`),
      ]);

      setData(dashRes.data);
      const fList = festRes.data.results || festRes.data;
      const activeF = fList.find((f) => f.is_active) || fList[0] || null;
      setFestival(activeF);

      const cList = commRes.data.results || commRes.data;
      setCommittee(cList);
    } catch (err) {
      console.error('Error fetching public data:', err);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <span className="text-xl font-bold">🕉️</span>
            </div>
            <div>
              <h1 className="heading-font text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {t('appTitle')}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {t('publicNotice')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Languages className="w-4 h-4 text-amber-700" />
              <span className="font-extrabold">{lang === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            <Link
              to="/login"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg border border-amber-200 transition-colors"
            >
              Committee Login →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Festival & Youth Association Hero Card */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-amber-600/20 text-center relative overflow-hidden">
          <span className="text-4xl mb-2 inline-block">🕉️</span>
          <p className="text-xs font-extrabold uppercase tracking-widest text-amber-200 mb-1">
            {lang === 'te' && festival?.association_name_telugu
              ? festival.association_name_telugu
              : festival?.association_name || 'Ganesh Youth Association'}
          </p>
          <h2 className="heading-font text-3xl sm:text-4xl font-black">
            {festival?.name || 'Ganesh Chanda 2026'}
          </h2>
          {festival?.name_telugu && (
            <p className="text-lg text-amber-100 font-semibold mt-1">
              {festival.name_telugu}
            </p>
          )}

          {/* Location & Landmark badge */}
          {festival?.location && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-xs font-semibold text-amber-100 mt-4">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>
                📍 Pandal: {festival.location} {festival.landmark ? `(${festival.landmark})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('totalDonations')}
            </p>
            <h3 className="heading-font text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              {formatCurrency(data?.total_donations)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">From {data?.donor_count || 0} Devotees 🙏</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xs text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('totalExpenses')}
            </p>
            <h3 className="heading-font text-2xl sm:text-3xl font-black text-rose-700 mt-1">
              {formatCurrency(data?.total_expenses)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Pandal & Cultural Costs</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('netBalance')}
            </p>
            <h3 className="heading-font text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {formatCurrency(data?.balance)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Remaining in Treasury</p>
          </div>

          {/* Feature 4: Annadhanam Prasadam Meal Tracker Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-100/60 p-6 rounded-3xl border border-amber-300 shadow-xs text-center">
            <p className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-700" />
              <span>అన్నదానం (Annadhanam Feast)</span>
            </p>
            <h3 className="heading-font text-2xl sm:text-3xl font-black text-amber-950 mt-1">
              {(data?.annadhanam?.meals_sponsored || 0).toLocaleString('en-IN')} Meals 🍲
            </h3>
            <p className="text-xs font-bold text-amber-800 mt-1">
              {formatCurrency(data?.annadhanam?.total_amount || 0)} Sponsored
            </p>
          </div>
        </div>

        {/* Feature 1: Velam Paata Live Leaderboard */}
        <VelamLeaderboard activeFestival={festival} />

        {/* Online UPI Donation & Real QR Code Card */}
        {(festival?.qr_code_image || festival?.upi_id) && (
          <div className="bg-gradient-to-r from-[#701a1e] via-[#881337] to-amber-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-amber-500/20">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-amber-200 rounded-full text-xs font-bold">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Online Chanda / Devotee UPI Payment</span>
              </div>
              <h3 className="heading-font text-xl sm:text-2xl font-black">
                Contribute directly via PhonePe / Google Pay / Paytm / UPI
              </h3>
              <p className="text-xs text-amber-100/90 max-w-lg">
                Scan the official youth association QR code to make your blessed festival contribution instantly.
              </p>
              {festival?.upi_id && (
                <div className="pt-1">
                  <span className="text-[11px] text-amber-300 font-bold">Official UPI ID: </span>
                  <span className="font-mono font-black text-white bg-black/25 px-2.5 py-1 rounded-lg text-xs">
                    {festival.upi_id}
                  </span>
                </div>
              )}
            </div>

            {/* QR Code Scanner Image Display */}
            {festival?.qr_code_image ? (
              <div className="bg-white p-3 rounded-2xl shadow-xl text-center shrink-0 border-2 border-amber-400/80">
                <img
                  src={festival.qr_code_image}
                  alt="Devotee UPI QR Code Scanner"
                  className="w-40 h-40 object-contain rounded-xl mx-auto"
                />
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider mt-1.5">
                  Scan to Donate 📲
                </p>
              </div>
            ) : festival?.upi_id ? (
              <div className="px-6 py-3 bg-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg uppercase tracking-wider shrink-0">
                UPI: {festival.upi_id}
              </div>
            ) : null}
          </div>
        )}

        {/* Youth Committee Members Display */}
        {committee.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-6">
              <Users2 className="w-5 h-5 text-amber-600" />
              <h3 className="heading-font text-lg font-bold text-slate-900">
                {lang === 'te' ? 'యువజన సంఘం నిర్వహణ కమిటీ' : 'Youth Organizing Committee'}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {committee.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:border-amber-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between items-center text-center group"
                >
                  <div className="flex flex-col items-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 mb-3 border border-amber-200">
                      {m.designation_display || m.designation}
                    </span>

                    {m.photo ? (
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-sm mb-2 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-extrabold text-xl shadow-sm mb-2 border-2 border-white">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <p className="font-bold text-sm text-slate-900 mt-1">{m.name}</p>
                    {m.name_telugu && (
                      <p className="text-xs text-slate-500 font-semibold">{m.name_telugu}</p>
                    )}
                  </div>
                  {m.mobile_number && (
                    <p className="text-[11px] text-slate-600 mt-3 font-mono flex items-center justify-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-100 w-full">
                      <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{m.mobile_number}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense Category Breakdown */}
        {data?.category_breakdown?.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="heading-font text-lg font-bold text-slate-900 mb-6">
              Festival Expenditure Details
            </h3>
            <div className="space-y-4">
              {data.category_breakdown.map((cat, i) => {
                const totalExp = parseFloat(data.total_expenses || 1);
                const amt = parseFloat(cat.total || 0);
                const pct = Math.round((amt / (totalExp || 1)) * 100);

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800">{cat.category__name}</span>
                      <span className="font-mono text-slate-900">
                        {formatCurrency(cat.total)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Devotee Blessings Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center text-xs text-amber-900 font-medium space-y-1">
          <p className="font-bold text-sm text-amber-950">
            🙏 గణేష్ మహారాజ్ కి జై! Ganpati Bappa Morya! 🙏
          </p>
          <p className="text-amber-800">
            All accounts are strictly maintained and verified by the Ganesh Youth Committee.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} {festival?.association_name || 'Ganesh Youth Association'} • Built with DRF & React</p>
      </footer>
    </div>
  );
}
