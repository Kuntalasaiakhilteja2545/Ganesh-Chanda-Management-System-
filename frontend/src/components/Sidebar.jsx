import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSidebar } from '../context/SidebarContext';
import {
  Trophy,
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
  X,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const { user, role, logout, isAdmin, isTreasurer, activeFestival } = useAuth();
  const { lang, t } = useLanguage();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();

  const navItems = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, show: true },
    { to: '/velam-paata', label: lang === 'te' ? '🏆 వేలం పాట (Auction)' : '🏆 Velam Paata (Auction)', icon: Trophy, show: true },
    { to: '/donations', label: t('donations'), icon: HandCoins, show: true },
    { to: '/donors', label: t('donors'), icon: Users, show: true },
    { to: '/committee', label: t('committee'), icon: Users2, show: true },
    { to: '/expenses', label: t('expenses'), icon: Receipt, show: true },
    { to: '/planning', label: t('planning'), icon: PieChart, show: true },
    { to: '/reports', label: t('reports'), icon: FileSpreadsheet, show: true },
    { to: '/festivals', label: t('festivals'), icon: Calendar, show: true },
    { to: '/settings', label: t('settings'), icon: Settings, show: true },
    { to: '/audit-logs', label: t('auditLogs'), icon: ShieldAlert, show: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white text-slate-700 select-none overflow-hidden border-r border-slate-200">
      {/* Top Header & Brand Area (Clean White with Logo Badge & 3-Line Menu) */}
      <div>
        <div className="h-16 px-3.5 flex items-center justify-between border-b border-slate-200 bg-white">
          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 flex items-center justify-center text-white shadow-sm mx-auto transition-transform hover:scale-105 cursor-pointer"
              title="Expand Sidebar"
            >
              <span className="text-lg font-bold">🕉️</span>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <span className="text-lg font-bold">🕉️</span>
                </div>
                <div className="truncate">
                  <h1 className="heading-font text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                    {lang === 'te' ? 'గణేష్ చందా' : 'Ganesh Chanda'}
                  </h1>
                  <p className="text-[10px] text-amber-700 font-bold tracking-wider uppercase">
                    {activeFestival ? `${activeFestival.year} Season` : 'Management'}
                  </p>
                </div>
              </div>

              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Clean Modern Navigation Items List */}
        <div className={`p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)] ${isCollapsed ? 'px-2' : ''}`}>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    isCollapsed
                      ? `w-11 h-11 mx-auto rounded-xl flex items-center justify-center transition-all duration-150 group relative ${
                          isActive
                            ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      : `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                          isActive
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate text-xs font-bold">{item.label}</span>}

                  {/* Floating Tooltip in Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
        </div>
      </div>

      {/* Bottom Footer Area */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/50 space-y-1.5">
        {isCollapsed ? (
          <div className="space-y-1.5">
            {user && (
              <button
                onClick={logout}
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer group relative"
                title={t('logout')}
              >
                <LogOut className="w-4.5 h-4.5" />
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {t('logout')}
                </div>
              </button>
            )}
          </div>
        ) : (
          <>
            {user && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-[9px] font-extrabold uppercase text-amber-800 leading-none mt-0.5">
                      {role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Clean Light Sidebar */}
      <aside
        className={`hidden md:block shrink-0 sticky top-0 h-screen transition-all duration-200 ease-in-out z-30 ${
          isCollapsed ? 'w-18' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sliding Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sliding Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-68 bg-white z-50 md:hidden shadow-2xl transition-transform duration-200 ease-in-out flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕉️</span>
            <span className="heading-font font-bold text-slate-900 text-base">Ganesh Chanda</span>
          </div>
          <button
            onClick={closeMobile}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
      </aside>
    </>
  );
}
