import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useLiveSync } from '../context/LiveSyncContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import ReceiptModal from '../components/ReceiptModal';
import { transliterateToTelugu } from '../utils/teluguTransliterate';
import {
  Search,
  Plus,
  Receipt as ReceiptIcon,
  AlertCircle,
  Edit2,
  Trash2,
  UserCheck,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  Building2,
  Printer,
  Trophy,
  Sparkles,
  Utensils,
  Flame,
  Languages,
  ArrowRight,
} from 'lucide-react';

export default function Donations() {
  const { activeFestival, isTreasurer } = useAuth();
  const { lang, t } = useLanguage();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const { notifyLiveUpdate, syncVersion } = useLiveSync();

  const [donations, setDonations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(''); // 'ALL', 'CHANDA', 'VELAM_PAATA', 'ANNADHANAM'
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState(null);

  // Form State
  const [donationType, setDonationType] = useState('CHANDA'); // 'CHANDA' | 'VELAM_PAATA' | 'ANNADHANAM' | 'POOJA'
  const [auctionItem, setAuctionItem] = useState('');
  const [auctionItemTeluguSuggestion, setAuctionItemTeluguSuggestion] = useState('');
  const [isPreviousYearAuction, setIsPreviousYearAuction] = useState(false);

  const [donorMode, setDonorMode] = useState('new'); // 'new' or 'existing'
  const [donorName, setDonorName] = useState('');
  const [donorNameTeluguSuggestion, setDonorNameTeluguSuggestion] = useState('');
  const [donorLocation, setDonorLocation] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [selectedDonorId, setSelectedDonorId] = useState('');
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [collectorMemberName, setCollectorMemberName] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentOptions = [
    { id: 'CASH', label: 'Cash (నగదు)', icon: Banknote },
    { id: 'PHONEPE', label: 'PhonePe', icon: Smartphone },
    { id: 'GPAY', label: 'Google Pay', icon: Smartphone },
    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
    { id: 'BANK', label: 'Bank Transfer', icon: Building2 },
  ];

  const popularAuctionItems = [
    { id: 'మహా లడ్డు (Maha Laddu)', label: '🟡 మహా లడ్డు (Maha Laddu)' },
    { id: 'చిన్న లడ్డు (Small Laddu)', label: '🟨 చిన్న లడ్డు (Small Laddu)' },
    { id: 'కుడి టెంకాయ (Right Coconut / Tinkayya)', label: '🥥 కుడి టెంకాయ (Right Tinkayya)' },
    { id: 'ఎడమ టెంకాయ (Left Coconut / Tinkayya)', label: '🥥 ఎడమ టెంకాయ (Left Tinkayya)' },
    { id: 'పండ్లు (Sacred Fruits Basket)', label: '🍎 పండ్లు (Sacred Fruits Basket)' },
    { id: 'వస్త్రాలు & పూజా వస్తువులు (Vigraha Vastra)', label: '🧣 వస్త్రాలు & పూజా వస్తువులు' },
  ];

  useEffect(() => {
    fetchDonations();
    fetchDonors();
    fetchCommittee();
  }, [activeFestival, searchQuery, selectedPaymentMethod, selectedTypeFilter, syncVersion]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFestival) params.append('festival', activeFestival.id);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedPaymentMethod) params.append('payment_method', selectedPaymentMethod);
      if (selectedTypeFilter) params.append('donation_type', selectedTypeFilter);

      const res = await apiClient.get(`/donations/?${params.toString()}`);
      setDonations(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      const res = await apiClient.get('/donors/');
      setDonors(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching donors:', err);
    }
  };

  const fetchCommittee = async () => {
    try {
      let url = '/committee-members/';
      if (activeFestival) url += `?festival=${activeFestival.id}`;
      const res = await apiClient.get(url);
      setCommitteeMembers(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching committee members:', err);
    }
  };

  const handleOpenAdd = (defaultType = 'CHANDA') => {
    setEditingDonation(null);
    setDonationType(defaultType);
    setAuctionItem(defaultType === 'VELAM_PAATA' ? 'మహా లడ్డు (Maha Laddu)' : '');
    setAuctionItemTeluguSuggestion('');
    setIsPreviousYearAuction(defaultType === 'VELAM_PAATA');
    setDonorMode('new');
    setDonorName('');
    setDonorNameTeluguSuggestion('');
    setDonorLocation('');
    setDonorMobile('');
    setSelectedDonorId('');
    setAmount('');
    setPaymentMethod('CASH');
    setTransactionId('');
    setCollectorMemberName(committeeMembers[0]?.name || '');
    setDonationDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDonation(d);
    setDonationType(d.donation_type || 'CHANDA');
    setAuctionItem(d.auction_item || '');
    setAuctionItemTeluguSuggestion('');
    setIsPreviousYearAuction(Boolean(d.notes?.includes('Last Year') || d.notes?.includes('గత సంవత్సరం')));
    setDonorMode('existing');
    setSelectedDonorId(d.donor || '');
    setDonorName(d.donor_name || '');
    setDonorNameTeluguSuggestion('');
    setDonorLocation(d.donor_address || '');
    setDonorMobile(d.donor_mobile || '');
    setAmount(d.amount || '');
    setPaymentMethod(d.payment_method || 'CASH');
    setTransactionId(d.transaction_id || '');
    setCollectorMemberName(d.collector_member_name || '');
    setDonationDate(d.donation_date || new Date().toISOString().split('T')[0]);
    setNotes(d.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Real-time Auto-Telugu transliteration for Custom Auction Item
  const handleAuctionItemChange = async (val) => {
    setAuctionItem(val);
    if (val.trim()) {
      const te = await transliterateToTelugu(val);
      if (te && te !== val) {
        setAuctionItemTeluguSuggestion(te);
      } else {
        setAuctionItemTeluguSuggestion('');
      }
    } else {
      setAuctionItemTeluguSuggestion('');
    }
  };

  const applyAuctionTelugu = (te) => {
    setAuctionItem(te);
    setAuctionItemTeluguSuggestion('');
  };

  // Real-time Auto-Telugu transliteration for Devotee Name
  const handleDonorNameChange = async (val) => {
    setDonorName(val);
    if (val.trim()) {
      const te = await transliterateToTelugu(val);
      if (te && te !== val) {
        setDonorNameTeluguSuggestion(te);
      } else {
        setDonorNameTeluguSuggestion('');
      }
    } else {
      setDonorNameTeluguSuggestion('');
    }
  };

  const applyDonorTelugu = (te) => {
    setDonorName(te);
    setDonorNameTeluguSuggestion('');
  };

  const handleDeleteDonation = async (id, receiptNo) => {
    if (!window.confirm(`Are you sure you want to delete entry ${receiptNo || `#${id}`}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/donations/${id}/`);
      showToastSuccess(`✓ Record #${receiptNo || id} deleted.`);
      notifyLiveUpdate();
      fetchDonations();
    } catch (err) {
      showToastError('Failed to delete donation.');
    }
  };

  const handleSaveDonation = async (e, autoOpenReceipt = true) => {
    if (e) e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      let finalNotes = notes.trim();
      if (donationType === 'VELAM_PAATA') {
        if (!auctionItem.trim()) {
          setFormError('Please select or specify the Velam Paata Auction Item.');
          setIsSubmitting(false);
          return;
        }
        if (isPreviousYearAuction && !finalNotes.includes('గత సంవత్సరం నిమజ్జనం వేలం పాట')) {
          finalNotes = `[గత సంవత్సరం నిమజ్జనం వేలం పాట వసూలు] ${finalNotes}`.trim();
        }
      }

      let payload = {
        festival: activeFestival?.id,
        amount: parseFloat(amount).toFixed(2),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        donation_type: donationType,
        auction_item: donationType === 'VELAM_PAATA' ? auctionItem.trim() : '',
        collector_member_name: collectorMemberName.trim(),
        donation_date: donationDate,
        notes: finalNotes,
      };

      if (editingDonation) {
        if (selectedDonorId) payload.donor = selectedDonorId;
      } else {
        if (donorMode === 'existing' && selectedDonorId) {
          payload.donor = selectedDonorId;
        } else {
          if (!donorName.trim()) {
            setFormError('Devotee / Donor name is required.');
            setIsSubmitting(false);
            return;
          }
          payload.donor_name = donorName.trim();
          payload.donor_mobile = donorMobile.trim();
          payload.donor_address = donorLocation.trim();
        }
      }

      let res;
      if (editingDonation) {
        res = await apiClient.patch(`/donations/${editingDonation.id}/`, payload);
        showToastSuccess(`✓ Record #${res.data.receipt?.receipt_number || res.data.id} updated.`);
      } else {
        res = await apiClient.post('/donations/', payload);
        showToastSuccess(`✓ Entry saved! Receipt ${res.data.receipt?.receipt_number || ''} generated.`);
      }

      notifyLiveUpdate();
      setIsModalOpen(false);
      fetchDonations();
      fetchDonors();

      if (autoOpenReceipt && res.data) {
        setSelectedDonationForReceipt(res.data);
      }
    } catch (err) {
      console.error('Error saving donation:', err);
      setFormError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Failed to save record.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  // Calculations for Summary
  const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const velamPaataAmount = donations
    .filter((d) => d.donation_type === 'VELAM_PAATA')
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  const chandaAmount = donations
    .filter((d) => d.donation_type !== 'VELAM_PAATA')
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('donations')} & Collections
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage door-to-door chanda collections, last year nimajjanam velam paata (వేలం పాట), and generate instant receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Record Velam Paata Button */}
          <button
            onClick={() => handleOpenAdd('VELAM_PAATA')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-800 hover:to-yellow-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-700/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            <span>+ Add Velam Paata (వేలం పాట)</span>
          </button>

          {/* Standard Add Donation Button */}
          <button
            onClick={() => handleOpenAdd('CHANDA')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Chanda (చందా)</span>
          </button>
        </div>
      </div>

      {/* Summary Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Collections</p>
            <h3 className="heading-font text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(totalAmount)}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{donations.length} Confirmed Entries</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">వేలం పాట వసూళ్లు (Velam Paata)</p>
            <h3 className="heading-font text-2xl font-black text-amber-800 mt-0.5">{formatCurrency(velamPaataAmount)}</h3>
            <p className="text-[10px] text-amber-700 mt-0.5">Laddu, Tinkayya, Fruits Auction</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">General Chanda (సాధారణ చందా)</p>
            <h3 className="heading-font text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(chandaAmount)}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Door-to-door colony collections</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by devotee name, colony/location, or receipt number..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedTypeFilter('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedTypeFilter === ''
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedTypeFilter('VELAM_PAATA')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedTypeFilter === 'VELAM_PAATA'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span>వేలం పాట (Auction)</span>
            </button>
            <button
              onClick={() => setSelectedTypeFilter('CHANDA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedTypeFilter === 'CHANDA'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              సాధారణ చందా
            </button>
          </div>
        </div>
      </div>

      {/* Donations Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
            <p className="text-xs text-slate-400 mt-2">{t('loading')}</p>
          </div>
        ) : donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Receipt #</th>
                  <th className="py-3.5 px-6">Devotee / Donor (దాత)</th>
                  <th className="py-3.5 px-6">Type & Item</th>
                  <th className="py-3.5 px-6">{t('amount')}</th>
                  <th className="py-3.5 px-6">{t('paymentMethod')}</th>
                  <th className="py-3.5 px-6">{t('donationDate')}</th>
                  <th className="py-3.5 px-6">Collector</th>
                  <th className="py-3.5 px-6 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {donations.map((d) => {
                  const isVelam = d.donation_type === 'VELAM_PAATA';
                  return (
                    <tr key={d.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {d.receipt?.receipt_number || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900 text-sm">{d.donor_name}</div>
                        {d.donor_address && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{d.donor_address}</span>
                          </div>
                        )}
                        {d.donor_mobile && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            📞 {d.donor_mobile}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isVelam ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-950 font-black text-[11px] rounded-xl border border-amber-300 shadow-2xs">
                            <Trophy className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>{d.auction_item || 'వేలం పాట'}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">
                            {d.donation_type_display || 'చందా'}
                          </span>
                        )}
                        {d.notes && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                            {d.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 heading-font text-sm font-black text-amber-800">
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {d.payment_method_display || d.payment_method}
                        </span>
                        {d.transaction_id && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                            {d.transaction_id}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{d.donation_date}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>{d.collector_member_name || d.collected_by_name || 'Admin'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDonationForReceipt(d)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                          >
                            <ReceiptIcon className="w-3.5 h-3.5" />
                            <span>Receipt 🖨️</span>
                          </button>
                          {isTreasurer && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(d)}
                                className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDonation(d.id, d.receipt?.receipt_number)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <ReceiptIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">{t('noData')}</p>
          </div>
        )}
      </div>

      {/* Record Donation / Velam Paata Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingDonation
            ? 'Edit Contribution'
            : donationType === 'VELAM_PAATA'
            ? '🏆 Record Velam Paata / Auction (వేలం పాట రికార్డు)'
            : t('addDonation')
        }
        maxWidth="max-w-xl"
      >
        <form onSubmit={(e) => handleSaveDonation(e, true)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Contribution Category Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Contribution Category (విరాళం రకం) *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDonationType('CHANDA')}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-all cursor-pointer ${
                  donationType === 'CHANDA'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>సాధారణ చందా</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDonationType('VELAM_PAATA');
                  if (!auctionItem) setAuctionItem('మహా లడ్డు (Maha Laddu)');
                  setIsPreviousYearAuction(true);
                }}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-all cursor-pointer ${
                  donationType === 'VELAM_PAATA'
                    ? 'bg-amber-800 text-white border-amber-900 shadow-sm'
                    : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>వేలం పాట (Auction)</span>
              </button>

              <button
                type="button"
                onClick={() => setDonationType('ANNADHANAM')}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-extrabold transition-all cursor-pointer ${
                  donationType === 'ANNADHANAM'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>అన్నదానం</span>
              </button>
            </div>
          </div>

          {/* Specialized Velam Paata Item Selection Section */}
          {donationType === 'VELAM_PAATA' && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-700" />
                  వేలం పాట వస్తువు (Auction Item) *
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  నిమజ్జనం వేలం పాట
                </span>
              </div>

              {/* 1-Click Popular Auction Items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {popularAuctionItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAuctionItem(item.id);
                      setAuctionItemTeluguSuggestion('');
                    }}
                    className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer truncate ${
                      auctionItem === item.id
                        ? 'bg-amber-700 text-white border-amber-800 shadow-2xs'
                        : 'bg-white text-slate-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Auction Item Input with Real-time Auto-Telugu Generation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <span>Custom Auction Item (టైప్ చేయండి / Type in English):</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-extrabold flex items-center gap-1 bg-amber-200/70 px-2 py-0.5 rounded-md">
                    <Languages className="w-3 h-3 text-amber-900" /> ✨ Auto-Telugu Active
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. garika / silver coin / pattu vastralu / kudi tinkayya"
                  value={auctionItem}
                  onChange={(e) => handleAuctionItemChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {/* Live Auto-Telugu Suggestion Pill */}
                {auctionItemTeluguSuggestion && (
                  <div className="mt-1.5 flex items-center gap-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-amber-900">తెలుగు సూచన:</span>
                    <button
                      type="button"
                      onClick={() => applyAuctionTelugu(auctionItemTeluguSuggestion)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black rounded-lg shadow-2xs transition-all cursor-pointer transform hover:scale-105"
                      title="Click to apply Telugu name"
                    >
                      <span>{auctionItemTeluguSuggestion}</span>
                      <ArrowRight className="w-3 h-3 text-amber-200" />
                      <span className="text-[10px] font-bold text-amber-100">(Apply ✓)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Previous Year Nimajjanam Collection Indicator */}
              <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPreviousYearAuction}
                  onChange={(e) => setIsPreviousYearAuction(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>గత సంవత్సరం నిమజ్జనం వేలం పాట బకాయి వసూలు (Previous Year Nimajjanam Auction)</span>
              </label>
            </div>
          )}

          {/* Devotee / Winning Bidder Info Section with Auto-Telugu */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" />
                {donationType === 'VELAM_PAATA' ? 'Winning Bidder / Devotee Details (వేలం పాడిన దాత)' : 'Devotee / Donor Information'}
              </span>
              {!editingDonation && (
                <button
                  type="button"
                  onClick={() => setDonorMode(donorMode === 'new' ? 'existing' : 'new')}
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  {donorMode === 'new' ? '🔍 Choose Existing Devotee' : '✏️ Enter New Devotee'}
                </button>
              )}
            </div>

            {donorMode === 'new' && !editingDonation ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-slate-700">
                      Devotee Full Name (దాత పేరు) *
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                      <Languages className="w-3 h-3" /> Auto-Telugu
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy / K. Shiva / వెంకటేష్"
                    value={donorName}
                    onChange={(e) => handleDonorNameChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />

                  {/* Devotee Name Auto-Telugu Suggestion Pill */}
                  {donorNameTeluguSuggestion && (
                    <div className="mt-1.5 flex items-center gap-2 animate-in fade-in duration-150">
                      <span className="text-[11px] font-bold text-slate-600">తెలుగు పేరు:</span>
                      <button
                        type="button"
                        onClick={() => applyDonorTelugu(donorNameTeluguSuggestion)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black rounded-lg border border-amber-300 shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{donorNameTeluguSuggestion}</span>
                        <span className="text-[10px] text-amber-700 font-bold ml-1">(Apply ✓)</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Colony / Location / Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 302 / Sai Colony"
                      value={donorLocation}
                      onChange={(e) => setDonorLocation(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile"
                      value={donorMobile}
                      onChange={(e) => setDonorMobile(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Select Devotee from Directory *
                </label>
                <select
                  required
                  value={selectedDonorId}
                  onChange={(e) => setSelectedDonorId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Devotee / Winning Bidder --</option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.address ? `• ${d.address}` : ''} {d.mobile_number ? `(${d.mobile_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              {donationType === 'VELAM_PAATA' ? 'Winning Auction Amount (వేలం పాట మొత్తం) *' : `${t('amount')} *`}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 15000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              {t('paymentMethod')} *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-800 text-white border-amber-900 shadow-sm scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Youth Committee Collector Selection */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Collected By Youth Member / Organizer (వసూలు చేసిన యువకుడు)
            </label>
            {committeeMembers.length > 0 ? (
              <select
                value={collectorMemberName}
                onChange={(e) => setCollectorMemberName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="">-- Select Youth Committee Member --</option>
                {committeeMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.designation_display || m.designation})
                  </option>
                ))}
                <option value="Other / Volunteer">Other Volunteer (Specify in notes)</option>
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. K. Shiva Kumar (Youth Leader)"
                value={collectorMemberName}
                onChange={(e) => setCollectorMemberName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            )}
          </div>

          {/* Payment Date & Transaction Ref */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Collection Date *
              </label>
              <input
                type="date"
                required
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Txn Ref / UPI No (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / Cash"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Collected at youth meeting / Paid via PhonePe"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : 'Save & Generate Receipt 🖨️'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedDonationForReceipt)}
        onClose={() => setSelectedDonationForReceipt(null)}
        donation={selectedDonationForReceipt}
      />
    </div>
  );
}
