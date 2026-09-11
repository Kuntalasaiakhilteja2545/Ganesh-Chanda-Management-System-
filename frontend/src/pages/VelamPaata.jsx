import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSync } from '../context/LiveSyncContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import CountUpNumber from '../components/ui/CountUpNumber';
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Crown,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Phone,
  MapPin,
  Sparkles,
  Award,
  AlertCircle,
  IndianRupee,
  Layers,
  ArrowUpRight,
  PieChart,
  HelpCircle,
} from 'lucide-react';

export default function VelamPaata() {
  const { user, isCollector, activeFestival } = useAuth();
  const { lang, t } = useLanguage();
  const { syncVersion, triggerSync } = useLiveSync();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [totalBidAmount, setTotalBidAmount] = useState('');
  const [partialPaidAmount, setPartialPaidAmount] = useState('');
  const [itemPreset, setItemPreset] = useState('మహా లడ్డు (MAHA LADDU)');
  const [customItem, setCustomItem] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('CONFIRMED');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    fetchAuctions();
  }, [activeFestival, syncVersion]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const festivalParam = activeFestival ? `?festival=${activeFestival.id}` : '';
      const res = await apiClient.get(`/donations/${festivalParam}`);
      const rawList = res.data.results || res.data;
      const list = Array.isArray(rawList) ? rawList : [];

      // Filter only VELAM_PAATA entries
      const velamList = list.filter((item) => item.donation_type === 'VELAM_PAATA');
      setAuctions(velamList);
    } catch (err) {
      console.error('Error fetching Velam Paata entries:', err);
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

  // Helper to extract partial paid amount from item
  const getPaidAndDueAmounts = (item) => {
    const total = parseFloat(item.amount || 0);
    let paid = 0;
    
    if (item.status === 'CONFIRMED') {
      paid = total;
    } else if (item.status === 'PENDING') {
      paid = 0;
    } else if (item.status === 'PARTIAL') {
      // Check notes for [PAID:xxx]
      const notes = item.notes || '';
      const match = notes.match(/\[PAID:(\d+(?:\.\d+)?)\]/);
      if (match) {
        paid = parseFloat(match[1]);
      } else {
        paid = Math.round(total / 2); // Default fallback
      }
    }

    const due = Math.max(0, total - paid);
    return { total, paid, due };
  };

  // Calculations
  let totalBidValue = 0;
  let totalCollectedCash = 0;
  let totalOutstandingDue = 0;

  auctions.forEach((a) => {
    const { total, paid, due } = getPaidAndDueAmounts(a);
    totalBidValue += total;
    totalCollectedCash += paid;
    totalOutstandingDue += due;
  });

  const confirmedAuctions = auctions.filter((a) => a.status === 'CONFIRMED');
  const partialAuctions = auctions.filter((a) => a.status === 'PARTIAL');
  const pendingAuctions = auctions.filter((a) => a.status === 'PENDING');

  const topWinner = auctions.length > 0
    ? [...auctions].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0]
    : null;

  // Filtered List
  const filteredAuctions = auctions.filter((item) => {
    const donor = (item.donor_name || item.notes || '').toLowerCase();
    const itemStr = (item.auction_item || '').toLowerCase();
    const matchesSearch = donor.includes(search.toLowerCase()) || itemStr.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && item.status === 'CONFIRMED') ||
      (statusFilter === 'PARTIAL' && item.status === 'PARTIAL') ||
      (statusFilter === 'PENDING' && item.status === 'PENDING');

    let matchesCategory = true;
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'MAHA_LADDU') matchesCategory = itemStr.includes('మహా లడ్డు') || itemStr.includes('maha');
      else if (categoryFilter === 'SMALL_LADDU') matchesCategory = itemStr.includes('చిన్న లడ్డు') || itemStr.includes('small');
      else if (categoryFilter === 'TINKAYYA') matchesCategory = itemStr.includes('టెంకాయ') || itemStr.includes('coconut') || itemStr.includes('tinkayya');
      else if (categoryFilter === 'FRUITS') matchesCategory = itemStr.includes('పండ్లు') || itemStr.includes('fruit');
      else if (categoryFilter === 'CUSTOM') {
        matchesCategory = !itemStr.includes('మహా లడ్డు') && !itemStr.includes('చిన్న లడ్డు') && !itemStr.includes('టెంకాయ') && !itemStr.includes('పండ్ల');
      }
    }

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleOpenModal = (auctionToEdit = null) => {
    setFormError('');
    if (auctionToEdit) {
      setEditingId(auctionToEdit.id);
      setDonorName(auctionToEdit.donor_name || '');
      setDonorMobile(auctionToEdit.donor_mobile || '');
      setDonorAddress(auctionToEdit.donor_address || '');
      setTotalBidAmount(auctionToEdit.amount || '');
      setDonationDate(auctionToEdit.donation_date || new Date().toISOString().split('T')[0]);

      const itemVal = auctionToEdit.auction_item || '';
      if (itemVal.includes('మహా లడ్డు')) setItemPreset('మహా లడ్డు (MAHA LADDU)');
      else if (itemVal.includes('చిన్న లడ్డు')) setItemPreset('చిన్న లడ్డు (SMALL LADDU)');
      else if (itemVal.includes('పవిత్ర టెంకాయ')) setItemPreset('పవిత్ర టెంకాయ (RIGHT COCONUT / TINKAYYA)');
      else if (itemVal.includes('పండ్ల రథం')) setItemPreset('పండ్ల రథం (SACRED FRUITS BASKET)');
      else {
        setItemPreset('CUSTOM');
        setCustomItem(itemVal);
      }

      const statusVal = auctionToEdit.status || 'CONFIRMED';
      setPaymentStatus(statusVal);

      const { paid } = getPaidAndDueAmounts(auctionToEdit);
      setPartialPaidAmount(statusVal === 'PARTIAL' ? paid : '');

      setPaymentMethod(auctionToEdit.payment_method || 'CASH');

      // Strip [PAID:xxx] tag from notes for display
      const cleanNotes = (auctionToEdit.notes || '').replace(/\[PAID:\d+(?:\.\d+)?\]\s*/g, '').trim();
      setNotesText(cleanNotes);
    } else {
      setEditingId(null);
      setDonorName('');
      setDonorMobile('');
      setDonorAddress('');
      setTotalBidAmount('');
      setPartialPaidAmount('');
      setDonationDate(new Date().toISOString().split('T')[0]);
      setItemPreset('మహా లడ్డు (MAHA LADDU)');
      setCustomItem('');
      setPaymentStatus('CONFIRMED');
      setPaymentMethod('CASH');
      setNotesText('');
    }
    setIsModalOpen(true);
  };

  const handleSaveAuction = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!donorName.trim()) {
      setFormError('Winning Devotee Name is required.');
      setIsSubmitting(false);
      return;
    }
    const totalBid = parseFloat(totalBidAmount);
    if (!totalBidAmount || totalBid <= 0) {
      setFormError('Please enter a valid total winning bid amount.');
      setIsSubmitting(false);
      return;
    }

    const finalAuctionItem = itemPreset === 'CUSTOM' ? customItem.trim() : itemPreset;
    if (!finalAuctionItem) {
      setFormError('Please specify the Velam Paata item/category.');
      setIsSubmitting(false);
      return;
    }

    let finalNotes = notesText.trim();
    if (paymentStatus === 'PARTIAL') {
      const pPaid = parseFloat(partialPaidAmount) || 0;
      if (pPaid <= 0 || pPaid >= totalBid) {
        setFormError('Partial Paid amount must be greater than 0 and less than the total winning bid.');
        setIsSubmitting(false);
        return;
      }
      finalNotes = `[PAID:${pPaid}] ${finalNotes}`.trim();
    }

    const payload = {
      donor_name: donorName.trim(),
      donor_mobile: donorMobile.trim(),
      donor_address: donorAddress.trim(),
      amount: totalBid,
      donation_type: 'VELAM_PAATA',
      auction_item: finalAuctionItem,
      payment_method: paymentMethod,
      status: paymentStatus,
      notes: finalNotes,
      donation_date: donationDate || new Date().toISOString().split('T')[0],
      ...(activeFestival && { festival: activeFestival.id }),
    };

    try {
      if (editingId) {
        await apiClient.patch(`/donations/${editingId}/`, payload);
        showToastSuccess('✓ Velam Paata record updated successfully!');
      } else {
        await apiClient.post('/donations/', payload);
        showToastSuccess('✓ Velam Paata auction bid recorded successfully!');
      }

      setIsModalOpen(false);
      triggerSync();
      fetchAuctions();
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save Velam Paata entry.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    // Cycle status: CONFIRMED -> PARTIAL -> PENDING -> CONFIRMED
    let nextStatus = 'CONFIRMED';
    if (item.status === 'CONFIRMED') nextStatus = 'PARTIAL';
    else if (item.status === 'PARTIAL') nextStatus = 'PENDING';
    else if (item.status === 'PENDING') nextStatus = 'CONFIRMED';

    try {
      await apiClient.patch(`/donations/${item.id}/`, { status: nextStatus });
      showToastSuccess(`✓ Status updated to ${nextStatus}`);
      triggerSync();
      fetchAuctions();
    } catch (err) {
      showToastError('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Velam Paata entry?')) return;
    try {
      await apiClient.delete(`/donations/${id}/`);
      showToastSuccess('✓ Velam Paata record deleted.');
      triggerSync();
      fetchAuctions();
    } catch (err) {
      showToastError('Failed to delete entry.');
    }
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
    return { icon: '🧣', label: item || 'Custom Auction Item', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 via-orange-950 to-amber-900 p-6 rounded-3xl text-white shadow-xl border border-amber-700/50 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h1 className="heading-font text-xl sm:text-2xl font-black text-amber-200 tracking-tight">
                🏆 వేలం పాట (Sacred Nimajjanam Velam Paata)
              </h1>
              <p className="text-xs text-amber-200/80 mt-0.5 font-medium">
                Maha Laddu, Small Laddu, Sacred Coconuts, Fruits, Full/Partial Bids & Nimajjanam Opening Balance
              </p>
            </div>
          </div>
        </div>

        {isCollector && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-amber-300 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Velam Paata Bid (వేలం పాట రికార్డు)</span>
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="వేలం పాట మొత్తం (TOTAL BID VALUE)"
          value={formatCurrency(totalBidValue)}
          subtitle={`${auctions.length} Total Auction Items`}
          icon={Trophy}
          iconColor="text-amber-600"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          title="లభించిన బ్యాలెన్స్ (PAID CAPITAL)"
          value={formatCurrency(totalCollectedCash)}
          subtitle="Full Paid & Partial Collected Cash"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          title="మిగిలిన బాకీలు (OUTSTANDING DUE)"
          value={formatCurrency(totalOutstandingDue)}
          subtitle={`${pendingAuctions.length + partialAuctions.length} Due Balances Awaiting Collection`}
          icon={Clock}
          iconColor="text-rose-600"
          bgColor="bg-rose-500/10"
        />
        <StatCard
          title="అగ్ర విజేత (TOP BIDDER)"
          value={topWinner ? topWinner.donor_name : 'No Bids Yet'}
          subtitle={topWinner ? `${formatCurrency(topWinner.amount)} (${topWinner.auction_item})` : 'Record auction items to see top winner'}
          icon={Crown}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-500/10"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search devotee, location, item..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Payment Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({auctions.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Full Paid ({confirmedAuctions.length})
            </button>
            <button
              onClick={() => setStatusFilter('PARTIAL')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'PARTIAL' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Partial Paid ({partialAuctions.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'PENDING' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Pending ({pendingAuctions.length})
            </button>
          </div>
        </div>

        {/* Item Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Items (అన్నీ)' },
            { id: 'MAHA_LADDU', label: '🟡 Maha Laddu (మహా లడ్డు)' },
            { id: 'SMALL_LADDU', label: '🟨 Small Laddu (చిన్న లడ్డు)' },
            { id: 'TINKAYYA', label: '🥥 Tinkayya (టెంకాయ)' },
            { id: 'FRUITS', label: '🍎 Fruits (పండ్లు)' },
            { id: 'CUSTOM', label: '✍️ Custom Items (ఇతర)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                categoryFilter === tab.id
                  ? 'bg-amber-500 text-amber-950 border-amber-400 font-black shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auction Entries Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs font-bold">
          Loading Velam Paata entries...
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="heading-font font-bold text-slate-800 text-base">
            No Velam Paata Entries Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Record winning bids for Maha Laddu, Small Laddu, Tinkayya, or Fruits auction items. Entries do NOT generate paper receipts and count towards your starting capital.
          </p>
          {isCollector && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Velam Paata Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAuctions.map((item) => {
            const itemMeta = getItemBadge(item.auction_item);
            const { total, paid, due } = getPaidAndDueAmounts(item);
            const isFullPaid = item.status === 'CONFIRMED';
            const isPartial = item.status === 'PARTIAL';
            const isPending = item.status === 'PENDING';

            const cleanNotes = (item.notes || '').replace(/\[PAID:\d+(?:\.\d+)?\]\s*/g, '').trim();

            return (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Item Badge & Status Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase border ${itemMeta.color}`}>
                      {itemMeta.icon} {item.auction_item || 'Velam Paata'}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(item)}
                      title="Click to cycle status (Paid -> Partial -> Pending)"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all cursor-pointer ${
                        isFullPaid
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                          : isPartial
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                          : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200 animate-pulse'
                      }`}
                    >
                      {isFullPaid ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : isPartial ? (
                        <PieChart className="w-3 h-3 text-amber-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-rose-600" />
                      )}
                      <span>
                        {isFullPaid
                          ? 'FULL PAID (పూర్తి)'
                          : isPartial
                          ? 'PARTIAL (పాక్షికం)'
                          : 'PENDING (బాకీ)'}
                      </span>
                    </button>
                  </div>

                  {/* Devotee Winner Name & Bid Amount Breakdown */}
                  <div>
                    <h3 className="heading-font font-black text-lg text-slate-900 tracking-tight">
                      {item.donor_name || 'Devotee Winner'}
                    </h3>

                    <div className="mt-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Total Winning Bid:</span>
                        <span className="text-amber-700 font-black text-sm">{formatCurrency(total)}</span>
                      </div>

                      {isPartial && (
                        <>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                            <span>Paid So Far (చెల్లించినది):</span>
                            <span className="font-extrabold">{formatCurrency(paid)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 border-t border-slate-200/60 pt-1">
                            <span>Remaining Due (బాకీ):</span>
                            <span className="font-black">{formatCurrency(due)}</span>
                          </div>
                        </>
                      )}

                      {isPending && (
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 border-t border-slate-200/60 pt-1">
                          <span>Entire Amount Due:</span>
                          <span className="font-black">{formatCurrency(total)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Devotee Details */}
                  <div className="space-y-1 text-xs text-slate-600 font-medium pt-1">
                    {item.donor_mobile && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.donor_mobile}</span>
                      </div>
                    )}
                    {item.donor_address && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.donor_address}</span>
                      </div>
                    )}
                    {cleanNotes && (
                      <div className="p-2 bg-amber-50/50 rounded-xl text-[11px] text-amber-900 italic mt-1 border border-amber-100">
                        "{cleanNotes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                {isCollector && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record / Edit Velam Paata Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? '✏️ Edit Velam Paata Entry' : '🏆 Record Velam Paata Bid (వేలం పాట రికార్డు)'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveAuction} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Item Category Selection */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
              Velam Paata Item / Category (వేలం పాట వస్తువు) *
            </label>
            <select
              value={itemPreset}
              onChange={(e) => setItemPreset(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="మహా లడ్డు (MAHA LADDU)">🟡 మహా లడ్డు (MAHA LADDU)</option>
              <option value="చిన్న లడ్డు (SMALL LADDU)">🟨 చిన్న లడ్డు (SMALL LADDU)</option>
              <option value="పవిత్ర టెంకాయ (RIGHT COCONUT / TINKAYYA)">🥥 పవిత్ర టెంకాయ (TINKAYYA / COCONUT)</option>
              <option value="పండ్ల రథం (SACRED FRUITS BASKET)">🍎 పండ్ల రథం (SACRED FRUITS BASKET)</option>
              <option value="CUSTOM">✍️ Custom Item / Specify Category (ఇతర వస్తువు)...</option>
            </select>
          </div>

          {itemPreset === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                Custom Item Name (వస్తువు పేరు టైప్ చేయండి) *
              </label>
              <input
                type="text"
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                placeholder="e.g. Ganesh Sacred Vastra / Silver Crown / Special Garland"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Devotee Winner Name */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
              Winning Bidder / Devotee Name (విజేత దాత పేరు) *
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="e.g. Polakal Ramesh / Friends Group"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Winning Bid Amount */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
              Total Winning Bid Amount (మొత్తం వేలం పాట పాట ₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold">₹</span>
              <input
                type="number"
                value={totalBidAmount}
                onChange={(e) => setTotalBidAmount(e.target.value)}
                placeholder="15000"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Status Selection */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
              Payment Status (చెల్లింపు స్థితి) *
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-amber-500"
            >
              <option value="CONFIRMED">✅ Full Paid (మొత్తం చెల్లించారు)</option>
              <option value="PARTIAL">🌗 Partial Paid (పాక్షికంగా చెల్లించారు)</option>
              <option value="PENDING">⏳ Unpaid / Pending (బాకీ / పెండింగ్)</option>
            </select>
          </div>

          {/* Partial Amount Paid (Only if PARTIAL status selected) */}
          {paymentStatus === 'PARTIAL' && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <label className="block text-xs font-extrabold uppercase text-amber-900 mb-1">
                Partial Paid Amount So Far (ఇప్పటివరకు చెల్లించిన మొత్తం ₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700 font-extrabold">₹</span>
                <input
                  type="number"
                  value={partialPaidAmount}
                  onChange={(e) => setPartialPaidAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-8 pr-4 py-2 bg-white border border-amber-300 rounded-xl text-sm font-extrabold text-amber-950 focus:outline-none focus:border-amber-500"
                />
              </div>
              {totalBidAmount && partialPaidAmount && (
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 pt-1">
                  <span>Remaining Due (మిగిలిన బాకీ):</span>
                  <span className="text-rose-700 font-black">
                    {formatCurrency(Math.max(0, parseFloat(totalBidAmount) - parseFloat(partialPaidAmount)))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mobile Number & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                Mobile Number (ఫోన్ నెంబర్)
              </label>
              <input
                type="tel"
                value={donorMobile}
                onChange={(e) => setDonorMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                Location / Village (గ్రామం / ప్రాంతం)
              </label>
              <input
                type="text"
                value={donorAddress}
                onChange={(e) => setDonorAddress(e.target.value)}
                placeholder="Colony / Village name"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                Payment Method (చెల్లింపు విధానం)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-amber-500"
              >
                <option value="CASH">💵 Cash (నగదు)</option>
                <option value="PHONEPE">📱 PhonePe / UPI</option>
                <option value="GOOGLEPAY">📱 Google Pay</option>
                <option value="PAYTM">📱 Paytm</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                Date (తేదీ) *
              </label>
              <input
                type="date"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Remarks / Notes */}
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
              Remarks / Notes (వివరాలు)
            </label>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={2}
              placeholder="e.g. Won at last year Nimajjanam evening auction..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Bid' : 'Save Velam Paata Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
