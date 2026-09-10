import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import {
  PieChart,
  Plus,
  AlertTriangle,
  Wallet,
  TrendingDown,
  AlertCircle,
  Edit2,
  Trash2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Tag,
  Calculator,
  ArrowRight,
  ChevronDown,
  Check,
} from 'lucide-react';

export default function Planning() {
  const { activeFestival, isTreasurer } = useAuth();
  const { lang, t } = useLanguage();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State â€” category combobox
  const [categoryName, setCategoryName] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef(null);

  const [plannedAmount, setPlannedAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPlanningData();
    fetchCategories();
  }, [activeFestival]);

  const fetchPlanningData = async () => {
    setLoading(true);
    try {
      const festivalParam = activeFestival ? `?festival_id=${activeFestival.id}` : '';
      const res = await apiClient.get(`/planning/summary/${festivalParam}`);
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching planning summary:', err);
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

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCategoryName('');
    setIsCatDropdownOpen(false);
    setPlannedAmount('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setCategoryName(item.category || '');
    setIsCatDropdownOpen(false);
    setPlannedAmount(item.planned ? String(parseFloat(item.planned)) : '');
    setDescription(item.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (item) => {
    const catName = item.category || 'this category';
    if (!window.confirm(`Are you sure you want to remove the planned budget for "${catName}"?`)) return;

    try {
      if (item.id) {
        await apiClient.delete(`/planning/${item.id}/`);
        showToastSuccess(`âœ“ Removed budget for ${catName}.`);
        fetchPlanningData();
      } else if (item.category_id && activeFestival) {
        const plansRes = await apiClient.get(`/planning/?festival=${activeFestival.id}&category=${item.category_id}`);
        const plans = plansRes.data.results || plansRes.data;
        if (plans.length > 0) {
          await apiClient.delete(`/planning/${plans[0].id}/`);
          showToastSuccess(`âœ“ Removed budget for ${catName}.`);
          fetchPlanningData();
        }
      }
    } catch (err) {
      showToastError('Failed to delete planned budget.');
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!categoryName.trim()) {
      setFormError('Please enter or select an expense category.');
      return;
    }

    const amt = parseFloat(plannedAmount);
    if (!amt || amt <= 0) {
      setFormError('Please enter a valid planned budget amount.');
      return;
    }

    setIsSubmitting(true);

    // Find category ID if it matches an existing one, otherwise send category_name
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
    );

    const payload = {
      festival: activeFestival?.id,
      planned_amount: amt.toFixed(2),
      description: description.trim(),
    };

    if (matchedCategory) {
      payload.category = matchedCategory.id;
    } else {
      payload.category_name = categoryName.trim();
    }

    try {
      if (editingItem?.id) {
        await apiClient.patch(`/planning/${editingItem.id}/`, payload);
        showToastSuccess('âœ“ Budget updated successfully!');
      } else {
        await apiClient.post('/planning/', payload);
        showToastSuccess('âœ“ Category budget saved!');
      }
      setIsModalOpen(false);
      await fetchPlanningData();
      await fetchCategories();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Error saving budget item.'
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

  const isDeficit = summary?.warning != null || parseFloat(summary?.projected_balance || 0) < 0;

  // Filter categories matching user typing for combobox
  const filteredCategories = categories.filter((c) => {
    if (!categoryName.trim()) return true;
    const q = categoryName.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.name_telugu && c.name_telugu.toLowerCase().includes(q))
    );
  });

  const exactCatMatch = categories.some(
    (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>ðŸŽ¯ {t('planning')} & Budget Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pre-festival budget caps, planned vs actual expenditure tracking, and deficit / surplus financial forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>{showExplanation ? 'Hide Guide' : 'How Planning Works'}</span>
          </button>

          {isTreasurer && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-purple-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Set Category Budget (à°¬à°¡à±à°œà±†à°Ÿà± à°¨à°¿à°°à±à°£à°¯à°¿à°‚à°šà±)</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Explanation Card */}
      {showExplanation && (
        <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-3xl space-y-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2 text-purple-950 font-black text-sm">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>à°¬à°¡à±à°œà±†à°Ÿà± & à°ªà±à°°à°£à°¾à°³à°¿à°• (Budget & Planning) à°Žà°²à°¾ à°ªà°¨à°¿à°šà±‡à°¸à±à°¤à±à°‚à°¦à°¿? (How It Works):</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-purple-900">
            <div className="p-3.5 bg-white/80 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                1. Set Budget Ceiling (à°ªà°°à°¿à°®à°¿à°¤à±à°²à±):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Before festival starts, define planned limits for each category (e.g. â‚¹25,000 for Idol, â‚¹20,000 for Sound, â‚¹15,000 for Lighting).
              </p>
            </div>

            <div className="p-3.5 bg-white/80 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                2. Live Spend Tracking (à°¨à°¿à°œà°®à±ˆà°¨ à°–à°°à±à°šà±):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Whenever expenses or advances are entered in the Expenses tab, the system compares actual spent against planned budget in real-time.
              </p>
            </div>

            <div className="p-3.5 bg-white/80 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-pink-600" />
                3. Deficit Warning (à°²à±‹à°Ÿà± à°¹à±†à°šà±à°šà°°à°¿à°•):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Shows Projected Balance = (Total Chanda Collections) - (Total Planned Budget). Alerts the committee if more chanda is needed!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Deficit Alert Banner */}
      {isDeficit && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-3xl flex items-center gap-3 text-rose-900 text-sm font-semibold shadow-xs animate-in fade-in">
          <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0 animate-bounce" />
          <div>
            <p className="font-black text-base text-rose-950">âš ï¸ à°¬à°¡à±à°œà±†à°Ÿà± à°²à±‹à°Ÿà± à°¹à±†à°šà±à°šà°°à°¿à°• (Budget Deficit Alert)!</p>
            <p className="text-xs text-rose-800 font-medium mt-0.5">
              Total planned festival budget exceeds the current available chanda collections. Additional collections needed: <strong>{formatCurrency(Math.abs(parseFloat(summary?.projected_balance || 0)))}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget Planned"
          value={formatCurrency(summary?.total_planned)}
          subtitle="Allotted category limits"
          icon={PieChart}
          color="purple"
        />
        <StatCard
          title="Actual Spent So Far"
          value={formatCurrency(summary?.total_actual)}
          subtitle="Money spent out of treasury"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Current Available Balance"
          value={formatCurrency(summary?.current_balance)}
          subtitle="Chanda collected minus actual spent"
          icon={Wallet}
          color="amber"
        />
        <StatCard
          title={t('projectedBalance')}
          value={formatCurrency(summary?.projected_balance)}
          subtitle={isDeficit ? 'ðŸ”´ Deficit forecast (More chanda needed)' : 'ðŸŸ¢ Safe budget surplus'}
          icon={Wallet}
          color={isDeficit ? 'rose' : 'emerald'}
        />
      </div>

      {/* Planned vs Actual Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="heading-font text-base sm:text-lg font-black text-slate-900">
              {t('plannedVsActual')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Category-wise budget caps, actual spending, remaining allowances, and budget progress.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
            <p className="text-xs text-slate-400 mt-2">{t('loading')}</p>
          </div>
        ) : summary?.comparison?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Category Name</th>
                  <th className="py-3.5 px-6">Budget Planned</th>
                  <th className="py-3.5 px-6">Actual Spent</th>
                  <th className="py-3.5 px-6">Remaining Allowance</th>
                  <th className="py-3.5 px-6">Budget Utilization</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {summary.comparison.map((item, idx) => {
                  const p = parseFloat(item.planned || 0);
                  const a = parseFloat(item.actual || 0);
                  const pct = p > 0 ? Math.round((a / p) * 100) : 0;
                  const isOverBudget = a > p && p > 0;
                  const diff = parseFloat(item.difference || 0);

                  return (
                    <tr key={idx} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{item.category}</div>
                        {item.category_telugu && (
                          <div className="text-[11px] text-slate-500 font-medium">{item.category_telugu}</div>
                        )}
                        {item.description && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-purple-950 text-sm">
                        {p > 0 ? formatCurrency(item.planned) : <span className="text-slate-400 italic">Not set</span>}
                      </td>
                      <td className="py-4 px-6 font-mono font-black text-rose-700 text-sm">
                        {formatCurrency(item.actual)}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold">
                        {p > 0 ? (
                          <span className={isOverBudget ? 'text-red-600 font-black' : 'text-emerald-700 font-black'}>
                            {diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">--</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {p > 0 ? (
                          <div className="space-y-1 max-w-[180px]">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className={isOverBudget ? 'text-red-600 font-black' : 'text-slate-600'}>
                                {pct}% utilized
                              </span>
                              {isOverBudget && (
                                <span className="text-red-600 font-black">OVER BUDGET âš ï¸</span>
                              )}
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isOverBudget
                                    ? 'bg-red-500'
                                    : pct > 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No budget limit defined</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isTreasurer && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title={p > 0 ? 'Edit Budget' : 'Set Budget'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {p > 0 && (
                              <button
                                onClick={() => handleDeleteBudget(item)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Budget Plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <PieChart className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No planned budgets defined yet.</p>
          </div>
        )}
      </div>

      {/* Set / Edit Category Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem?.planned && parseFloat(editingItem.planned) > 0 ? 'âœï¸ Edit Category Budget (à°¬à°¡à±à°œà±†à°Ÿà± à°¸à°µà°°à°¿à°‚à°šà±)' : 'ðŸŽ¯ Set Category Budget (à°¬à°¡à±à°œà±†à°Ÿà± à°¨à°¿à°°à±à°£à°¯à°¿à°‚à°šà±)'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Category Combobox â€” supports typing custom names */}
          <div ref={catDropdownRef} className="relative">
            <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              <span>Expense Category (à°–à°°à±à°šà± à°µà°¿à°­à°¾à°—à°‚) *</span>
            </label>

            <div className="relative">
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Ganesh Idol (à°µà°¿à°—à±à°°à°¹à°‚), Sound, Lighting, Tent..."
                value={categoryName}
                onFocus={() => setIsCatDropdownOpen(true)}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setIsCatDropdownOpen(true);
                }}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCatDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
              </button>
            </div>

            {/* Custom Dropdown Suggestions Panel */}
            {isCatDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                {categoryName.trim() && !exactCatMatch && (
                  <div
                    onClick={() => setIsCatDropdownOpen(false)}
                    className="p-3 bg-purple-50/70 hover:bg-purple-100/80 cursor-pointer flex items-center justify-between text-xs font-extrabold text-purple-900 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Use Custom Category: <strong>"{categoryName}"</strong></span>
                    </span>
                    <span className="text-[10px] bg-purple-200/80 px-2 py-0.5 rounded-full uppercase">New</span>
                  </div>
                )}

                {filteredCategories.map((c) => {
                  const isSelected = c.name.toLowerCase() === categoryName.trim().toLowerCase();
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCategoryName(c.name);
                        setIsCatDropdownOpen(false);
                      }}
                      className={`p-2.5 px-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-purple-50/70' : ''
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.name}</p>
                        {c.name_telugu && (
                          <p className="text-[10px] text-slate-500 font-medium">{c.name_telugu}</p>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Planned Budget Amount (à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¿à°¨ à°¬à°¡à±à°œà±†à°Ÿà± à°®à±Šà°¤à±à°¤à°‚ â‚¹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">â‚¹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 25000.00"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-purple-950 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Notes / Description (à°µà°¿à°µà°°à°¾à°²à± / à°—à°®à°¨à°¿à°•à°²à±)
            </label>
            <input
              type="text"
              placeholder="e.g. Maximum estimated limit for Ganesh Idol & Transport"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : 'Save Budget (à°¬à°¡à±à°œà±†à°Ÿà± à°¦à°¾à°šà±)'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
