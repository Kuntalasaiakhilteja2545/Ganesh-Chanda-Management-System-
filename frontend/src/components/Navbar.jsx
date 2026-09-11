import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSidebar } from '../context/SidebarContext';
import CommandPalette from './CommandPalette';
import {
  Languages,
  LogOut,
  Sparkles,
  ExternalLink,
  Menu,
  UserCheck,
  Shield,
  Search,
  Download,
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout, activeFestival } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { toggleCollapse, toggleMobile } = useSidebar();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 768) {
      toggleCollapse();
    } else {
      toggleMobile();
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold';
      case 'TREASURER':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold';
      case 'COLLECTOR':
        return 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left Section: 3-Lines Toggle + Association Name Badge */}
          <div className="flex items-center space-x-3 overflow-hidden">
            <button
              onClick={handleToggle}
              className="p-2 text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-amber-300 shadow-2xs hover:scale-105"
              title="Toggle Menu (☰)"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="heading-font text-sm sm:text-base font-black text-slate-900 truncate">
                  {activeFestival?.association_name || 'Jai Hind Ganesh Youth Association'}
                </span>
                {activeFestival && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    {activeFestival.year}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {activeFestival
                  ? lang === 'te' && activeFestival.name_telugu
                    ? activeFestival.name_telugu
                    : activeFestival.name
                  : t('noActiveFestival')}
              </p>
            </div>
          </div>

          {/* Center / Right: Quick Search Bar Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Spotlight Command Trigger Button */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Search anything (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white text-slate-400 border border-slate-200 rounded">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="sm:hidden p-2 text-slate-600 hover:text-amber-900 hover:bg-amber-50 rounded-xl border border-slate-200 transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 rounded-xl border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
              title="Switch Language"
            >
              <Languages className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-extrabold">{lang === 'en' ? 'తెలుగు' : 'English'}</span>
            </button>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-none">
                    <span className="text-[11px] font-extrabold text-slate-900 max-w-[100px] truncate">
                      {user.full_name || user.username}
                    </span>
                    <span className={`text-[8px] uppercase font-bold tracking-wider px-1 py-0.2 rounded mt-0.5 ${getRoleBadge(role)}`}>
                      {role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
