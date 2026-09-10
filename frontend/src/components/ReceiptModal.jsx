import React, { useRef } from 'react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Download, Printer, Sparkles, CheckCircle2, QrCode, Share2, Send, Trophy } from 'lucide-react';
import apiClient from '../api/client';

export default function ReceiptModal({ isOpen, onClose, donation }) {
  const { lang, t } = useLanguage();
  const { activeFestival } = useAuth();
  const printRef = useRef();

  if (!donation) return null;

  const handleDownloadPdf = async () => {
    try {
      const response = await apiClient.get(`/receipts/${donation.id}/pdf/`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${donation.receipt?.receipt_number || 'receipt'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt PDF:', err);
      alert('Could not download PDF receipt. Please check server connection.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amt || 0);
  };

  // Convert amount to words in English
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    let n = Math.floor(parseFloat(num || 0));
    if (n === 0) return 'Zero Rupees Only';
    let str = '';
    if (n >= 10000000) {
      str += numberToWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += numberToWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += numberToWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += numberToWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) str += a[n];
      else str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    }
    return (str.trim() + ' Rupees Only').replace(/\s+/g, ' ');
  };

  // 1-Click WhatsApp Receipt Sharing
  const handleShareWhatsApp = () => {
    const receiptNo = donation.receipt?.receipt_number || `#${donation.id}`;
    const amountStr = formatCurrency(donation.amount);
    const devotee = donation.donor_name || 'Devotee';
    const festival = donation.festival_name || activeFestival?.name || 'Ganesh Chanda 2026';
    const assoc = activeFestival?.association_name || 'Jai Hind Ganesh Youth Association';
    const portalUrl = `${window.location.origin}/public`;
    const isVelam = donation.donation_type === 'VELAM_PAATA';

    const savedTemplate = localStorage.getItem('gms_whatsapp_template');
    let text = '';
    if (savedTemplate) {
      text = savedTemplate
        .replace('{devotee_name}', devotee)
        .replace('{amount}', donation.amount)
        .replace('{receipt_no}', receiptNo)
        .replace('{date}', donation.donation_date)
        .replace('{association_name}', assoc)
        .replace('{festival_name}', festival)
        .replace('{portal_url}', portalUrl);
    } else {
      text = `🕉️ *|| ॐ శ్రీ గణేశాయ నమః ||* 🕉️\n\n*${assoc}*\n*${festival} - ${isVelam ? '🏆 పవిత్ర వేలం పాట రసీదు (Auction Receipt)' : 'అధికారిక చందా రసీదు (Official Receipt)'}*\n━━━━━━━━━━━━━━━━━━━━\n👤 *దాత పేరు (Devotee):* ${devotee}\n${isVelam && donation.auction_item ? `🏆 *వేలం పాట వస్తువు (Auction Item):* ${donation.auction_item}\n` : ''}${donation.donor_address ? `📍 *Location:* ${donation.donor_address}\n` : ''}🧾 *రసీదు నెం (Receipt No):* ${receiptNo}\n💰 *విరాళం మొత్తం (Amount):* ${amountStr}\n📅 *తేదీ (Date):* ${donation.donation_date}\n💳 *చెల్లింపు విధానం (Payment):* ${donation.payment_method_display || donation.payment_method}\n${donation.collector_member_name ? `🤝 *వసూలు చేసిన యువకుడు (Collected By):* ${donation.collector_member_name}\n` : ''}━━━━━━━━━━━━━━━━━━━━\n🙏 *గణేష్ మహోత్సవానికి మీ పవిత్ర సహకారం అందించినందుకు హృదయపూర్వక ధన్యవాదాలు! గణనాథుని ఆశీస్సులు మీకు మీ కుటుంబానికి సదా ఉండాలని కోరుకుంటున్నాము!* 🙏\n\n🌐 *పారదర్శక లెక్కల వివరాలు (Public Portal):* ${portalUrl}`;
    }

    let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (donation.donor_mobile) {
      const cleanMobile = donation.donor_mobile.replace(/\D/g, '');
      const mobileWithCountry = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
      url = `https://api.whatsapp.com/send?phone=${mobileWithCountry}&text=${encodeURIComponent(text)}`;
    }
    window.open(url, '_blank');
  };

  const assocNameEn = activeFestival?.association_name || 'Jai Hind Ganesh Youth Association';
  const assocNameTe = activeFestival?.association_name_telugu || 'జై హింద్ గణేష్ యువజన సంఘం';
  const locationText = activeFestival?.location || 'Main Colony Road, Ameerpet, Hyderabad';
  const landmarkText = activeFestival?.landmark || 'Near Community Hall Stage';
  const isVelam = donation.donation_type === 'VELAM_PAATA';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isVelam ? 'వేలం పాట రసీదు (Auction Receipt)' : t('printReceipt')} maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Printable Traditional Indian Receipt Paper */}
        <div
          ref={printRef}
          id="printable-receipt"
          className="bg-amber-50/70 border-4 border-double border-amber-500/80 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-amber-600/10 text-slate-900 transition-all duration-300 hover:shadow-2xl print:border-2 print:shadow-none print:m-0 print:p-4"
        >
          {/* Subtle Decorative Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <span className="text-[180px] font-bold">🕉️</span>
          </div>

          {/* Top Invocations */}
          <div className="text-center border-b-2 border-amber-300/80 pb-4 relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-amber-200/80 text-amber-950 font-bold rounded-full text-[10px] tracking-wider uppercase">
              <span>🕉️ || ॐ శ్రీ గణేశాయ నమః || 🕉️</span>
            </div>

            {/* Youth Association Name */}
            <h3 className="heading-font text-xl sm:text-2xl font-black text-amber-950 uppercase tracking-tight mt-1">
              {lang === 'te' ? assocNameTe : assocNameEn}
            </h3>
            {lang === 'en' && assocNameTe && (
              <p className="text-xs font-bold text-amber-800">{assocNameTe}</p>
            )}

            {/* Festival Title & Location */}
            <p className="text-xs font-extrabold text-orange-700 uppercase tracking-wider">
              {donation.festival_name || activeFestival?.name || 'Ganesh Chanda 2026'} • Navaratri Mahotsavam
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              📍 Pandal: {locationText} {landmarkText ? `(${landmarkText})` : ''}
            </p>

            {/* Official Badge */}
            <div className="pt-1.5 flex justify-center">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1 text-white font-black text-[11px] uppercase tracking-widest rounded-lg shadow-sm ${
                isVelam
                  ? 'bg-gradient-to-r from-amber-700 to-yellow-600'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600'
              }`}>
                {isVelam ? <Trophy className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isVelam ? '🏆 Sacred Velam Paata (Auction) Receipt' : 'Official Donation Receipt'}</span>
              </span>
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div className="py-4 space-y-3 text-xs relative z-10">
            {/* Meta Row: Receipt Number & Date */}
            <div className="flex justify-between items-center bg-white/90 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
              <div>
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Receipt No:</span>
                <span className="font-mono font-extrabold text-amber-900 text-sm">
                  {donation.receipt?.receipt_number || 'GCH-2026-0001'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Date:</span>
                <span className="font-semibold text-slate-800">{donation.donation_date}</span>
              </div>
            </div>

            {/* Donor Name & Contact */}
            <div className="bg-white/90 p-3 rounded-xl border border-amber-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">
                    {isVelam ? 'Auction Winner / Devotee (వేలం పాడిన దాత):' : 'Received With Thanks From (దాత పేరు):'}
                  </span>
                  <h4 className="heading-font text-base font-black text-slate-900 mt-0.5">
                    {donation.donor_name}
                  </h4>
                  {isVelam && donation.auction_item && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-950 font-black text-xs rounded-lg mt-1 border border-amber-300">
                      <span>🏆 వేలం పాట వస్తువు:</span>
                      <span>{donation.auction_item}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600 font-medium">
                    {donation.donor_address && (
                      <p className="flex items-center gap-1 text-slate-700">
                        <span>📍 Location:</span>
                        <span className="font-semibold text-slate-900">{donation.donor_address}</span>
                      </p>
                    )}
                    {donation.donor_mobile && (
                      <p className="font-mono text-slate-500">
                        📞 {donation.donor_mobile}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <span className="text-sm font-bold">{isVelam ? '🏆' : '🙏'}</span>
                </div>
              </div>
            </div>

            {/* Main Contribution Amount Box (Gold Saffron Gradient) */}
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-4 text-center shadow-md relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-15">
                <span className="text-4xl">🕉️</span>
              </div>
              <p className="text-[11px] uppercase tracking-widest font-extrabold text-amber-200">
                {isVelam ? 'Winning Bid Amount (వేలం పాట మొత్తం)' : 'Blessed Contribution Amount'}
              </p>
              <h2 className="heading-font text-3xl sm:text-4xl font-black mt-0.5 tracking-tight">
                {formatCurrency(donation.amount)}
              </h2>
              <p className="text-xs text-amber-100 font-medium italic mt-1 bg-black/15 py-1 px-3 rounded-lg inline-block">
                {numberToWords(donation.amount)}
              </p>
            </div>

            {/* Payment Details Row */}
            <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Payment Mode:
                </span>
                <span className="font-extrabold text-slate-800">
                  {donation.payment_method_display || donation.payment_method}
                </span>
              </div>
              {donation.transaction_id && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Txn Reference:
                  </span>
                  <span className="font-mono font-semibold text-slate-700 truncate block">
                    {donation.transaction_id}
                  </span>
                </div>
              )}
            </div>

            {/* Collector Signature Row */}
            {donation.collector_member_name && (
              <div className="bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/80 text-[11px] flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase block">
                    Collected By (వసూలు చేసిన యువకుడు):
                  </span>
                  <span className="font-bold text-amber-950">
                    🤝 {donation.collector_member_name}
                  </span>
                </div>
                <div className="text-right text-[10px] text-amber-800 font-semibold italic">
                  Verified Committee Collector ✓
                </div>
              </div>
            )}

            {/* Bottom Footer Note */}
            <div className="text-center pt-2 border-t border-amber-200/60">
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                ఈ రసీదు కంప్యూటర్ ద్వారా రూపొందించబడింది. గణేష్ మహోత్సవ లెక్కల పారదర్శకత కోసం సంప్రదించండి.
              </p>
              <p className="text-[11px] font-bold text-amber-900 mt-0.5">
                🌸 శ్రీ వరసిద్ధి వినాయక స్వామి కృపా కటాక్షములు మీపై ఉండుగాక! 🌸
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Share + Download PDF + Print */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          {/* 1-Click WhatsApp Receipt Share */}
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Share on WhatsApp 📲</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadReceipt')}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
