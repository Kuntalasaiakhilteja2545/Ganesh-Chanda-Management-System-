import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Layout() {
  const { activeFestival } = useAuth();
  const { lang } = useLanguage();

  const assocNameEn = activeFestival?.association_name || 'Jai Hind Ganesh Youth Association';
  const assocNameTe = activeFestival?.association_name_telugu || 'జై హింద్ గణేష్ యువజన సంఘం';

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#fcfbf9] flex relative">
      {/* Background Subtle Watermark Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 flex flex-col items-center justify-center select-none overflow-hidden opacity-[0.02]">
        <div className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] flex items-center justify-center">
          <svg viewBox="0 0 400 400" className="w-full h-full text-amber-950 fill-current">
            <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="12 12" />
            <path d="M 200 60 Q 150 140 170 200 Q 185 240 150 260 Q 130 270 135 250 Q 140 240 155 242 Q 165 245 168 220 L 190 195 Z" />
            <ellipse cx="200" cy="180" rx="45" ry="40" />
            <path d="M 160 150 C 110 130, 80 180, 130 220 Z" />
            <path d="M 240 150 C 290 130, 320 180, 270 220 Z" />
            <path d="M 165 130 L 200 60 L 235 130 Z" />
          </svg>
        </div>
        <div className="text-center font-black tracking-widest text-2xl sm:text-3xl text-amber-950 uppercase mt-2">
          {lang === 'te' ? assocNameTe : assocNameEn}
        </div>
      </div>

      {/* Full-Height Left Sidebar (Unified with Shell) */}
      <Sidebar />

      {/* Right Column: Sticky Top Navbar + Smoothly Scrolling Main Content */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
