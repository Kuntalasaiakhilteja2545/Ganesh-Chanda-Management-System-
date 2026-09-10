import React, { useEffect, useState } from 'react';
import { useLiveSync } from '../context/LiveSyncContext';
import apiClient from '../api/client';
import { Trophy, Sparkles, Crown, Award, Flame, CheckCircle2 } from 'lucide-react';

export default function VelamLeaderboard({ activeFestival }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { syncVersion } = useLiveSync();

  useEffect(() => {
    fetchLeaderboard();
  }, [activeFestival, syncVersion]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const festivalParam = activeFestival ? `?festival_id=${activeFestival.id}` : '';
      const res = await apiClient.get(`/donations/auction-leaderboard/${festivalParam}`);
      setAuctions(res.data || []);
    } catch (err) {
      console.error('Error loading auction leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const getItemBadge = (itemStr) => {
    const item = (itemStr || '').toString();
    if (item.includes('మహా లడ్డు') || item.toLowerCase().includes('maha')) {
      return { icon: '🟡', label: 'Maha Laddu (మహా లడ్డు)', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    if (item.includes('చిన్న లడ్డు') || item.toLowerCase().includes('small')) {
      return { icon: '🟨', label: 'Small Laddu (చిన్న లడ్డు)', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' };
    }
    if (item.includes('టెంకాయ') || item.toLowerCase().includes('coconut') || item.toLowerCase().includes('tinkayya')) {
      return { icon: '🥥', label: 'Tinkayya / Coconut (పవిత్ర టెంకాయ)', color: 'bg-amber-50 text-amber-950 border-amber-200' };
    }
    if (item.includes('పండ్లు') || item.toLowerCase().includes('fruit')) {
      return { icon: '🍎', label: 'Sacred Fruits (పండ్ల రథం)', color: 'bg-rose-100 text-rose-900 border-rose-200' };
    }
    return { icon: '🧣', label: item || 'Sacred Item', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
  };

  return (
    <div className="bg-gradient-to-br from-amber-900 via-orange-900 to-amber-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-amber-700/50 relative overflow-hidden">
      {/* Background Decorative Sparkles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-amber-700/40 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            <h3 className="heading-font text-xl sm:text-2xl font-black text-amber-200 tracking-tight">
              🏆 వేలం పాట ప్రత్యక్ష విజేతలు (Velam Paata Leaderboard)
            </h3>
          </div>
          <p className="text-xs text-amber-200/80 mt-1 font-medium">
            Ganesh Navaratri Sacred Auction Winning Bidders & High Contributions
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Synchronized</span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="mt-4 space-y-3 relative z-10">
        {loading ? (
          <div className="py-8 text-center text-amber-300/60 text-xs font-semibold">
            Loading auction standings...
          </div>
        ) : Array.isArray(auctions) && auctions.length > 0 ? (
          auctions.map((item, idx) => {
            const itemMeta = getItemBadge(item?.auction_item);
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;

            return (
              <div
                key={item?.id || idx}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTop1
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-orange-500/20 border-amber-400/60 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Left: Rank & Winner Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                      isTop1
                        ? 'bg-amber-400 text-amber-950 border border-amber-200'
                        : isTop2
                        ? 'bg-slate-300 text-slate-900'
                        : isTop3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {isTop1 ? <Crown className="w-5 h-5" /> : `#${idx + 1}`}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                        {item?.donor_name || 'Devotee'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${itemMeta.color}`}>
                        {itemMeta.icon} {item?.auction_item || 'Sacred Item'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-amber-200/70 mt-1 font-medium">
                      {item?.donor_address && <span>📍 {item.donor_address}</span>}
                      <span>🧾 Receipt {item?.receipt_number || `#${item?.id}`}</span>
                      {item?.donation_date && <span>📅 {item.donation_date}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Winning Amount */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-800/40 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-amber-300/80 hidden sm:block">
                    Winning Bid
                  </span>
                  <span className="text-lg sm:text-xl font-black text-amber-300 tracking-tight">
                    {formatCurrency(item?.amount)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-amber-200/60 text-xs font-semibold bg-white/5 rounded-2xl border border-white/10">
            <p>No auction entries recorded yet for this festival year.</p>
            <p className="text-[11px] text-amber-300/40 mt-1">
              Add a donation with type "Velam Paata (వేలం పాట)" to see it appear live on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
