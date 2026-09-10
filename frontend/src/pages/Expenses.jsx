import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import {
  Plus,
  Search,
  Receipt,
  AlertCircle,
  Edit2,
  Trash2,
  Sparkles,
  Banknote,
  Smartphone,
  QrCode,
  Building2,
  Tag,
  ChevronDown,
  Check,
  Clock,
  CheckCircle2,
  ArrowRight,
  Phone,
  Store,
  DollarSign,
} from 'lucide-react';

export default function Expenses() {
  const { activeFestival, isTreasurer } = useAuth();
  const { lang, t } = useLanguage();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const { notifyLiveUpdate, syncVersion } = useLiveSync();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(''); // '', 'ADVANCE_PAID', 'FULLY_PAID'
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Quick Settle Modal State
  const [settlingExpense, setSettlingExpense] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('CASH');
  const [settleTransactionId, setSettleTransactionId] = useState('');
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State
  const [categoryName, setCategoryName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState('FULLY_PAID'); // 'FULLY_PAID' | 'ADVANCE_PAID'
  const [amount, setAmount] = useState('');
  const [totalEstimatedAmount, setTotalEstimatedAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
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

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [activeFestival, selectedCategory, selectedStatusFilter, search, syncVersion]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFestival) params.append('festival', activeFestival.id);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatusFilter) params.append('payment_status', selectedStatusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiClient.get(`/expenses/?${params.toString()}`);
      setExpenses(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/expense-categories/');
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenAdd = (defaultType = 'FULLY_PAID') => {
    setEditingExpense(null);
    setCategoryName('');
    setIsDropdownOpen(false);
    setDescription('');
    setPaymentType(defaultType);
    setAmount('');
    setTotalEstimatedAmount('');
    setVendorName('');
    setVendorContact('');
    setPaymentMethod('CASH');
    setTransactionId('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setCategoryName(exp.category_name || '');
    setIsDropdownOpen(false);
    setDescription(exp.description || '');
    setPaymentType(exp.payment_status || 'FULLY_PAID');
    setAmount(exp.amount || '');
    setTotalEstimatedAmount(exp.total_estimated_amount || '');
    setVendorName(exp.vendor_name || '');
    setVendorContact(exp.vendor_contact || '');
    setPaymentMethod(exp.payment_method || 'CASH');
    setTransactionId(exp.transaction_id || '');
    setExpenseDate(exp.expense_date || new Date().toISOString().split('T')[0]);
    setNotes(exp.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenSettle = (exp) => {
    setSettlingExpense(exp);
    const balance = parseFloat(exp.pending_balance || (exp.total_estimated_amount ? exp.total_estimated_amount - exp.amount : 0));
    setSettleAmount(balance > 0 ? balance.toFixed(2) : '0.00');
    setSettlePaymentMethod('CASH');
    setSettleTransactionId('');
    setSettleDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!settlingExpense) return;

    try {
      const additionalPaid = parseFloat(settleAmount || 0);
      const currentPaid = parseFloat(settlingExpense.amount || 0);
      const newTotalPaid = (currentPaid + additionalPaid).toFixed(2);
      const totalAgreed = settlingExpense.total_estimated_amount || newTotalPaid;

      const isComplete = parseFloat(newTotalPaid) >= parseFloat(totalAgreed);

      const payload = {
        amount: newTotalPaid,
        total_estimated_amount: totalAgreed,
        payment_status: isComplete ? 'FULLY_PAID' : 'PARTIAL_PAID',
        notes: `${settlingExpense.notes || ''} [Final Settlement: Paid ₹${additionalPaid} via ${settlePaymentMethod} on ${settleDate}]`.trim(),
      };

      await apiClient.patch(`/expenses/${settlingExpense.id}/`, payload);
      showToastSuccess(`✓ Payment recorded! Balance updated for "${settlingExpense.description}".`);
      setSettlingExpense(null);
      notifyLiveUpdate();
      fetchExpenses();
    } catch (err) {
      console.error('Error settling payment:', err);
      alert('Failed to update settlement. Please check network connection.');
    }
  };

  const handleDeleteExpense = async (id, desc) => {
    if (!window.confirm(`Are you sure you want to delete expense "${desc}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/expenses/${id}/`);
      showToastSuccess(`✓ Expense "${desc}" deleted.`);
      notifyLiveUpdate();
      fetchExpenses();
    } catch (err) {
      showToastError('Failed to delete expense.');
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!categoryName.trim()) {
      setFormError('Please enter or select an expense category.');
      return;
    }

    const paidAmt = parseFloat(amount);
    if (!paidAmt || paidAmt <= 0) {
      setFormError('Please enter a valid amount paid.');
      return;
    }

    let finalTotalEstimated = null;
    let finalStatus = paymentType;

    if (paymentType === 'ADVANCE_PAID') {
      const totalAmt = parseFloat(totalEstimatedAmount);
      if (!totalAmt || totalAmt < paidAmt) {
        setFormError('Total agreed cost must be equal to or greater than the advance paid.');
        return;
      }
      finalTotalEstimated = totalAmt.toFixed(2);
      if (paidAmt >= totalAmt) {
        finalStatus = 'FULLY_PAID';
      }
    } else {
      finalTotalEstimated = paidAmt.toFixed(2);
    }

    setIsSubmitting(true);

    const payload = {
      festival: activeFestival?.id,
      category_name: categoryName.trim(),
      description: description.trim(),
      amount: paidAmt.toFixed(2),
      total_estimated_amount: finalTotalEstimated,
      payment_status: finalStatus,
      vendor_name: vendorName.trim(),
      vendor_contact: vendorContact.trim(),
      payment_method: paymentMethod,
      transaction_id: transactionId.trim(),
      expense_date: expenseDate,
      notes: notes.trim(),
    };

    try {
      if (editingExpense) {
        await apiClient.patch(`/expenses/${editingExpense.id}/`, payload);
        showToastSuccess('✓ Expense updated successfully.');
      } else {
        await apiClient.post('/expenses/', payload);
        showToastSuccess('✓ Expense / Advance payment recorded.');
      }

      setIsModalOpen(false);
      notifyLiveUpdate();
      await fetchExpenses();
      await fetchCategories();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data?.errors || err.response?.data) ||
        'Failed to save expense.'
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
  const totalPaidOut = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const advanceExpenses = expenses.filter((e) => e.payment_status === 'ADVANCE_PAID' || e.payment_status === 'PARTIAL_PAID');
  const totalPendingLiabilities = advanceExpenses.reduce((acc, curr) => {
    const total = parseFloat(curr.total_estimated_amount || curr.amount || 0);
    const paid = parseFloat(curr.amount || 0);
    return acc + Math.max(0, total - paid);
  }, 0);

  // Filter categories matching user typing
  const filteredCategories = categories.filter((c) => {
    if (!categoryName.trim()) return true;
    const q = categoryName.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.name_telugu && c.name_telugu.toLowerCase().includes(q))
    );
  });

  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
  );

  const pendingBalancePreview = (parseFloat(totalEstimatedAmount || 0) - parseFloat(amount || 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('expenses')} & Vendor Advances
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Record advance token payments (Ganesh idol, lighting, sound, tent), track pending vendor balances, and complete final settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Add Advance Button */}
          <button
            onClick={() => handleOpenAdd('ADVANCE_PAID')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-200" />
            <span>+ Pay Advance (అడ్వాన్స్ చెల్లింపు)</span>
          </button>

          {/* Standard Add Expense Button */}
          <button
            onClick={() => handleOpenAdd('FULLY_PAID')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Summary Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Money Paid Out</p>
            <h3 className="heading-font text-2xl font-black text-rose-700 mt-0.5">{formatCurrency(totalPaidOut)}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Actual treasury cash outflow</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">Active Advance Bookings</p>
            <h3 className="heading-font text-2xl font-black text-amber-900 mt-0.5">{advanceExpenses.length} Vendors</h3>
            <p className="text-[10px] text-amber-700 mt-0.5">Idol, Tent, Lighting, Sound advances</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-orange-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-orange-800">Pending Vendor Balance Due</p>
            <h3 className="heading-font text-2xl font-black text-orange-800 mt-0.5">{formatCurrency(totalPendingLiabilities)}</h3>
            <p className="text-[10px] text-orange-700 mt-0.5">Remaining cash needed on delivery</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-800 font-bold">
            ⚠️
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense description, vendor, or category..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedStatusFilter === ''
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Bills ({expenses.length})
          </button>
          <button
            onClick={() => setSelectedStatusFilter('ADVANCE_PAID')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedStatusFilter === 'ADVANCE_PAID'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Advance & Pending Balance ({advanceExpenses.length})</span>
          </button>
          <button
            onClick={() => setSelectedStatusFilter('FULLY_PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedStatusFilter === 'FULLY_PAID'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fully Settled ✓
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            <option value="">Category: All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-600 border-t-transparent"></div>
            <p className="text-xs text-slate-400 mt-2">{t('loading')}</p>
          </div>
        ) : expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">{t('category')}</th>
                  <th className="py-3.5 px-6">{t('description')} & Vendor</th>
                  <th className="py-3.5 px-6">Payment Stage</th>
                  <th className="py-3.5 px-6">Paid Out (Cash)</th>
                  <th className="py-3.5 px-6">Total Agreed Cost</th>
                  <th className="py-3.5 px-6">Remaining Balance</th>
                  <th className="py-3.5 px-6">{t('expenseDate')}</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {expenses.map((exp) => {
                  const isAdvance = exp.payment_status === 'ADVANCE_PAID' || exp.payment_status === 'PARTIAL_PAID';
                  const balance = parseFloat(exp.pending_balance || 0);

                  return (
                    <tr key={exp.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <Tag className="w-3 h-3 text-amber-700" />
                          <span>{exp.category_name}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{exp.description}</div>
                        {exp.vendor_name && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>Vendor: <strong>{exp.vendor_name}</strong></span>
                            {exp.vendor_contact && <span className="text-slate-400 font-mono">({exp.vendor_contact})</span>}
                          </div>
                        )}
                        {exp.notes && (
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic">{exp.notes}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {isAdvance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>అడ్వాన్స్ చెల్లింపు (Advance)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Fully Settled ✓</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 heading-font text-sm font-black text-rose-700">
                        {formatCurrency(exp.amount)}
                        <span className="block text-[10px] text-slate-400 font-normal font-sans">
                          via {exp.payment_method_display || exp.payment_method}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {exp.total_estimated_amount ? formatCurrency(exp.total_estimated_amount) : formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6">
                        {balance > 0 ? (
                          <div className="space-y-1">
                            <span className="font-mono font-black text-orange-700 text-sm">
                              {formatCurrency(balance)}
                            </span>
                            <button
                              onClick={() => handleOpenSettle(exp)}
                              className="block text-[10px] font-extrabold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                            >
                              Pay Balance ➔
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold">₹0.00 (Nil)</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">{exp.expense_date}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.description)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">{t('noData')}</p>
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal with Advance Payment Support */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : paymentType === 'ADVANCE_PAID' ? '🟡 Record Vendor Advance (అడ్వాన్స్ చెల్లింపు)' : t('addExpense')}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Payment Type Selector (Full Settlement vs Advance Payment) */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Payment Stage / Type (చెల్లింపు రకం) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('ADVANCE_PAID')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-extrabold transition-all cursor-pointer ${
                  paymentType === 'ADVANCE_PAID'
                    ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                    : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>🟡 Advance Token (అడ్వాన్స్ చెల్లింపు)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('FULLY_PAID')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-extrabold transition-all cursor-pointer ${
                  paymentType === 'FULLY_PAID'
                    ? 'bg-rose-700 text-white border-rose-800 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>🟢 Full Settlement (పూర్తి బిల్లు)</span>
              </button>
            </div>
          </div>

          {/* Category Combobox */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-600" />
              <span>Expense Category / Item Name *</span>
            </label>

            <div className="relative">
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Ganesh Idol (విగ్రహం), Sound, Lighting, Tent..."
                value={categoryName}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* Custom Dropdown Suggestions Panel */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {categoryName.trim() && !exactMatch && (
                  <div
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-3 bg-rose-50/70 hover:bg-rose-100/80 cursor-pointer flex items-center justify-between text-xs font-extrabold text-rose-900 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>Use Custom Category: <strong>"{categoryName}"</strong></span>
                    </span>
                    <span className="text-[10px] bg-rose-200/80 px-2 py-0.5 rounded-full uppercase">New</span>
                  </div>
                )}

                {filteredCategories.map((c) => {
                  const isSelected = c.name.toLowerCase() === categoryName.trim().toLowerCase();
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCategoryName(c.name);
                        setIsDropdownOpen(false);
                      }}
                      className={`p-2.5 px-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-amber-50/70' : ''
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.name}</p>
                        {c.name_telugu && (
                          <p className="text-[10px] text-slate-500 font-medium">{c.name_telugu}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Description / Item Specifics *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 11 Feet Clay Ganesh Idol Booking / DJ & Sound Set"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Amount Inputs: Split by Advance vs Full */}
          {paymentType === 'ADVANCE_PAID' ? (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                    Total Agreed Cost (మొత్తం ఖర్చు) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 25000.00"
                      value={totalEstimatedAmount}
                      onChange={(e) => setTotalEstimatedAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-amber-950 mb-1">
                    Advance Paid Now (అడ్వాన్స్ చెల్లింపు) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="e.g. 5000.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-black text-rose-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Pending Balance Calculation Pill */}
              {totalEstimatedAmount && amount && (
                <div className="flex items-center justify-between p-2.5 bg-amber-100/80 rounded-xl text-xs font-bold text-amber-950">
                  <span>మిగిలిన బకాయి (Remaining Due on Delivery):</span>
                  <span className="font-mono font-black text-sm text-orange-800">
                    {formatCurrency(pendingBalancePreview > 0 ? pendingBalancePreview : 0)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Amount Paid (చెల్లించిన మొత్తం) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="5000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Vendor Details (Optional / Highly Recommended for Advance Bookings) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Vendor / Shop / Artist Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dhoolpet Murti Kendra"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Vendor Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={vendorContact}
                onChange={(e) => setVendorContact(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
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
                        ? 'bg-rose-700 text-white border-rose-800 shadow-sm scale-[1.02]'
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

          {/* Expense Date & Transaction ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Receipt / UTR / Bill Ref
              </label>
              <input
                type="text"
                placeholder="e.g. Advance Token #42 / UPI Ref"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Delivery expected 1 day before Chavithi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
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
              className="px-6 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : 'Save Payment Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Pay Remaining Balance Settlement Modal */}
      {settlingExpense && (
        <Modal
          isOpen={Boolean(settlingExpense)}
          onClose={() => setSettlingExpense(null)}
          title="💳 Settle Remaining Vendor Balance (బకాయి చెల్లింపు)"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmSettle} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
              <h4 className="font-extrabold text-sm">{settlingExpense.description}</h4>
              {settlingExpense.vendor_name && <p>🏪 Vendor: <strong>{settlingExpense.vendor_name}</strong></p>}
              <div className="flex justify-between pt-1 border-t border-amber-200/80 font-mono">
                <span>Total Agreed: {formatCurrency(settlingExpense.total_estimated_amount)}</span>
                <span>Already Paid: {formatCurrency(settlingExpense.amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Remaining Amount to Pay Now *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Payment Mode *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = settlePaymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSettlePaymentMethod(opt.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Final Settlement Date *
              </label>
              <input
                type="date"
                required
                value={settleDate}
                onChange={(e) => setSettleDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSettlingExpense(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Mark as Settled / Fully Paid ✓
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
