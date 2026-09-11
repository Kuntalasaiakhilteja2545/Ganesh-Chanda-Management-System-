import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import {
  Search,
  LayoutDashboard,
  HandCoins,
  Users,
  Receipt,
  PieChart,
  FileSpreadsheet,
  Calendar,
  Users2,
  Settings,
  ShieldAlert,
  Globe2,
  Plus,
  Languages,
  LogOut,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, role, logout, isAdmin, isTreasurer, activeFestival } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [donorResults, setDonorResults] = useState([]);
  const [searchingDonors, setSearchingDonors] = useState(false);
  const inputRef = useRef(null);

  // Default Quick Navigation Pages
  const pages = [
    { label: t('dashboard'), to: '/dashboard', icon: LayoutDashboard, category: 'Pages' },
    { label: t('donations'), to: '/donations', icon: HandCoins, category: 'Pages' },
    { label: t('donors'), to: '/donors', icon: Users, category: 'Pages' },
    { label: t('committee'), to: '/committee', icon: Users2, category: 'Pages' },
    ...(isTreasurer ? [
      { label: t('expenses'), to: '/expenses', icon: Receipt, category: 'Pages' },
      { label: t('planning'), to: '/planning', icon: PieChart, category: 'Pages' },
      { label: t('reports'), to: '/reports', icon: FileSpreadsheet, category: 'Pages' },
    ] : []),
    ...(isAdmin ? [
      { label: t('festivals'), to: '/festivals', icon: Calendar, category: 'Pages' },
      { label: t('settings'), to: '/settings', icon: Settings, category: 'Pages' },
      { label: t('auditLogs'), to: '/audit-logs', icon: ShieldAlert, category: 'Pages' },
    ] : []),
  ];

  // Quick Action Shortcuts
  const quickActions = [
    { label: 'Record New Donation', action: () => navigate('/donations?action=add'), icon: Plus, category: 'Actions' },
    ...(isTreasurer ? [
      { label: 'Add New Expense', action: () => navigate('/expenses?action=add'), icon: Plus, category: 'Actions' },
      { label: 'View Financial Reports', action: () => navigate('/reports'), icon: FileSpreadsheet, category: 'Actions' },
    ] : []),
    { label: `Switch Language (${lang === 'en' ? 'తెలుగు' : 'English'})`, action: toggleLanguage, icon: Languages, category: 'Preferences' },
    { label: 'Logout Organizers Account', action: logout, icon: LogOut, category: 'Account' },
  ];

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search Donors dynamically when query has 2+ characters
  useEffect(() => {
    if (query.trim().length >= 2) {
      const delayDebounce = setTimeout(async () => {
        setSearchingDonors(true);
        try {
          const res = await apiClient.get(`/donors/?search=${encodeURIComponent(query.trim())}`);
          const list = res.data.results || res.data;
          setDonorResults(list.slice(0, 4));
        } catch (err) {
          console.error('Error searching donors in command palette:', err);
        } finally {
          setSearchingDonors(false);
        }
      }, 200);
      return () => clearTimeout(delayDebounce);
    } else {
      setDonorResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  // Filter Pages & Actions matching search query
  const filteredPages = pages.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );
  const filteredActions = quickActions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredPages.map((p) => ({ ...p, type: 'page' })),
    ...filteredActions.map((a) => ({ ...a, type: 'action' })),
    ...donorResults.map((d) => ({
      label: `${d.name} ${d.address ? `(${d.address})` : ''}`,
      to: `/donations?search=${encodeURIComponent(d.name)}`,
      icon: Users,
      category: 'Devotee / Donor',
      type: 'donor',
      details: d.mobile ? `📞 ${d.mobile}` : undefined,
    })),
  ];

  const handleSelect = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.isExternal) {
      window.open(item.to, '_blank');
    } else if (item.to) {
      navigate(item.to);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(allItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-amber-700 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page name, or devotee name (e.g. Donations, Ramesh, Receipt)..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-lg shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
          {allItems.length > 0 ? (
            allItems.map((item, index) => {
              const Icon = item.icon || Sparkles;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${item.category}-${item.label}-${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{item.label}</p>
                      {item.details && (
                        <p className="text-[10px] text-slate-400 font-mono">{item.details}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-4 h-4 text-amber-700" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs font-semibold">No matching results found for "{query}".</p>
              <p className="text-[10px] text-slate-400 mt-1">Try typing "Donation", "Expense", "Report", or a devotee name.</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Ganesh Chanda Spotlight</span>
        </div>
      </div>
    </div>
  );
}
