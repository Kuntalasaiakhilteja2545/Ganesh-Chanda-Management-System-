import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSync } from '../context/LiveSyncContext';
import apiClient from '../api/client';
import { transliterateToTelugu } from '../utils/teluguTransliterate';
import {
  Settings as SettingsIcon,
  MapPin,
  Building,
  CreditCard,
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  Languages,
  Sparkles,
  ExternalLink,
  QrCode,
  Eye,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { activeFestival, setActiveFestival } = useAuth();
  const { t } = useLanguage();
  const { notifyLiveUpdate } = useLiveSync();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [nameTelugu, setNameTelugu] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [associationNameTelugu, setAssociationNameTelugu] = useState('');
  const [location, setLocation] = useState('');
  const [landmark, setLandmark] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Feature 5: Customizable WhatsApp Message & Receipt Template State
  const [waTemplate, setWaTemplate] = useState(() => {
    return (
      localStorage.getItem('gms_whatsapp_template') ||
      `🕉️ *|| ॐ శ్రీ గణేశాయ నమః ||* 🕉️\n\n*{association_name}*\n*{festival_name} - అధికారిక చందా రసీదు*\n━━━━━━━━━━━━━━━━━━━━\n👤 *దాత పేరు (Devotee):* {devotee_name}\n🧾 *రసీదు నెం (Receipt No):* {receipt_no}\n💰 *విరాళం మొత్తం (Amount):* ₹{amount}\n📅 *తేదీ (Date):* {date}\n━━━━━━━━━━━━━━━━━━━━\n🙏 *మీ పవిత్ర విరాళానికి హృదయపూర్వక ధన్యవాదాలు! గణనాథుని ఆశీస్సులు మీకు సదా ఉండాలని కోరుకుంటున్నాము!* 🙏\n\n🌐 *పారదర్శక పోర్టల్:* {portal_url}`
    );
  });

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeFestival) {
      setName(activeFestival.name || '');
      setNameTelugu(activeFestival.name_telugu || '');
      setAssociationName(activeFestival.association_name || '');
      setAssociationNameTelugu(activeFestival.association_name_telugu || '');
      setLocation(activeFestival.location || '');
      setLandmark(activeFestival.landmark || '');
      setUpiId(activeFestival.upi_id || '');
      setQrCodeImage(activeFestival.qr_code_image || '');
      setStartDate(activeFestival.start_date || '');
      setEndDate(activeFestival.end_date || '');
    }
  }, [activeFestival]);

  const handleAssociationNameChange = async (val) => {
    setAssociationName(val);
    if (val.trim()) {
      const te = await transliterateToTelugu(val);
      if (te) setAssociationNameTelugu(te);
    }
  };

  const handleFestivalNameChange = async (val) => {
    setName(val);
    if (val.trim()) {
      const te = await transliterateToTelugu(val);
      if (te) setNameTelugu(te);
    }
  };

  // Image upload with browser canvas compression
  const handleQrImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setQrCodeImage(compressedBase64);
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrCode = () => {
    setQrCodeImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSavedSuccess(false);

    try {
      let res;
      if (activeFestival) {
        res = await apiClient.patch(`/festivals/${activeFestival.id}/`, {
          name: name || `Ganesh Chanda ${new Date().getFullYear()}`,
          name_telugu: nameTelugu,
          association_name: associationName || 'Ganesh Youth Association',
          association_name_telugu: associationNameTelugu,
          location,
          landmark,
          upi_id: upiId,
          qr_code_image: qrCodeImage,
          start_date: startDate || null,
          end_date: endDate || null,
        });
      } else {
        res = await apiClient.post('/festivals/', {
          name: name || `Ganesh Chanda ${new Date().getFullYear()}`,
          name_telugu: nameTelugu,
          association_name: associationName || 'Ganesh Youth Association',
          association_name_telugu: associationNameTelugu,
          year: new Date().getFullYear(),
          location,
          landmark,
          upi_id: upiId,
          qr_code_image: qrCodeImage,
          start_date: startDate || null,
          end_date: endDate || null,
          is_active: true,
        });
      }

      localStorage.setItem('gms_whatsapp_template', waTemplate);
      setActiveFestival(res.data);
      notifyLiveUpdate();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.response?.data ? JSON.stringify(err.response.data) : null) ||
        'Failed to save settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('settings')} & Pandal Details
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure Ganesh Youth association details, pandal venue location, and upload your real PhonePe / GPay QR code.
          </p>
        </div>

        <Link
          to="/public"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 shadow-2xs transition-all"
        >
          <Eye className="w-3.5 h-3.5 text-amber-700" />
          <span>View Live Public Portal ↗</span>
        </Link>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Association & Pandal settings updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout filling full screen width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Main Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          {/* Card 1: Association & Festival Names */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-amber-600" />
              <h3 className="heading-font text-base font-extrabold text-slate-900">
                Youth Association Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700">
                    Youth Association Name (English) *
                  </label>
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <Languages className="w-3 h-3" /> Auto-Telugu
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={associationName}
                  onChange={(e) => handleAssociationNameChange(e.target.value)}
                  placeholder="e.g. Jai Hind Ganesh Youth Association"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Youth Association Name (తెలుగు పేరు)
                </label>
                <input
                  type="text"
                  value={associationNameTelugu}
                  onChange={(e) => setAssociationNameTelugu(e.target.value)}
                  placeholder="e.g. జై హింద్ గణేష్ యువజన సంఘం"
                  className="w-full p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-slate-700">
                    Festival Event Title (English) *
                  </label>
                  <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                    <Languages className="w-3 h-3" /> Auto-Telugu
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleFestivalNameChange(e.target.value)}
                  placeholder="e.g. Ganesh Chanda 2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Festival Event Title (తెలుగు శీర్షిక)
                </label>
                <input
                  type="text"
                  value={nameTelugu}
                  onChange={(e) => setNameTelugu(e.target.value)}
                  placeholder="e.g. గణేష్ చందా 2026"
                  className="w-full p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pandal Venue Location */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h3 className="heading-font text-base font-extrabold text-slate-900">
                Pandal Venue & Location Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Colony / Street / Area *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. BC Colony, Main Road"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Specific Stage Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Basavayya Temple / Community Hall"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Festival Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Festival Nimajjanam / End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Real UPI QR Code Image Upload & UPI ID */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-amber-600" />
              <h3 className="heading-font text-base font-extrabold text-slate-900">
                Official UPI Scanner QR Code Upload
              </h3>
            </div>

            {/* Direct Image Upload Field */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {qrCodeImage ? (
                  <div className="relative group shrink-0">
                    <img
                      src={qrCodeImage}
                      alt="Uploaded UPI QR Code"
                      className="w-32 h-32 object-contain bg-white rounded-xl border border-slate-200 shadow-sm p-1"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveQrCode}
                      className="absolute top-1 right-1 p-1.5 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 shadow-sm transition-opacity cursor-pointer"
                      title="Remove QR Code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                    <span className="text-[10px] font-bold">No QR Uploaded</span>
                  </div>
                )}

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Upload your Youth Association QR Code Photo:
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Take a screenshot or photo of your PhonePe, Google Pay, Paytm, or Bank QR code and upload it here.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrImageUpload}
                    className="hidden"
                    id="qr-upload-input"
                  />
                  <label
                    htmlFor="qr-upload-input"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{qrCodeImage ? 'Change QR Image' : 'Upload QR Code Image 📸'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Optional Text UPI ID */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Optional UPI ID / VPA (e.g. veerabadhraswamy@ybl)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. veerabadhraswamy@ybl / 9876543210@phonepe"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Feature 5: WhatsApp Receipt Message Customizer */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-black uppercase text-slate-800 flex items-center justify-between">
                <span>💬 WhatsApp Receipt Message Customizer</span>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  Live Custom Template
                </span>
              </label>
              <p className="text-[11px] text-slate-500">
                Customize the default WhatsApp text layout sent to devotees when sharing receipts. Available tags:
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {['{devotee_name}', '{amount}', '{receipt_no}', '{date}', '{association_name}', '{festival_name}', '{portal_url}'].map((chip) => (
                  <span
                    key={chip}
                    onClick={() => setWaTemplate((prev) => `${prev} ${chip}`)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-md cursor-pointer transition-colors"
                  >
                    + {chip}
                  </span>
                ))}
              </div>
              <textarea
                rows={5}
                value={waTemplate}
                onChange={(e) => setWaTemplate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-amber-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? t('loading') : 'Save All Settings'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Live Devotee Preview & Quick Info Card */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-extrabold uppercase text-slate-700">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Live Public Portal Preview</span>
            </div>

            <div className="bg-gradient-to-r from-[#701a1e] via-[#881337] to-amber-700 text-white p-5 rounded-2xl space-y-2 shadow-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/15 rounded-full text-[10px] font-bold text-amber-200">
                <span>🕉️</span>
                <span>{associationName || 'Youth Association'}</span>
              </div>
              <h4 className="heading-font font-black text-base leading-tight">
                {name || 'Ganesh Chanda 2026'}
              </h4>
              {nameTelugu && (
                <p className="text-xs text-amber-200 font-medium">{nameTelugu}</p>
              )}
              <div className="pt-2 text-[11px] text-amber-100/90 space-y-1">
                <p>📍 {location || 'Pandal Location'}</p>
                {landmark && <p className="text-[10px] text-amber-300">🏛️ {landmark}</p>}
                {startDate && <p className="text-[10px]">📅 {startDate} to {endDate || 'Ongoing'}</p>}
              </div>
            </div>

            {/* Live Uploaded QR Preview Box */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider block">
                Devotee Contribution QR Code
              </span>
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="Devotee UPI QR Code"
                  className="w-36 h-36 object-contain mx-auto rounded-xl border border-amber-300 shadow-2xs bg-white p-1"
                />
              ) : (
                <div className="w-36 h-36 mx-auto rounded-xl border-2 border-dashed border-amber-300 bg-white flex flex-col items-center justify-center text-amber-800/60 p-2">
                  <QrCode className="w-10 h-10 mb-1" />
                  <span className="text-[10px] font-bold">Upload QR Code image above</span>
                </div>
              )}
              {upiId && (
                <p className="text-[10px] font-mono text-slate-600 font-bold truncate">
                  {upiId}
                </p>
              )}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Smart Features Active:</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-500">
              <li>Direct QR image upload supports PhonePe, GPay, Paytm & UPI.</li>
              <li>Auto-compression keeps photos lightweight and fast.</li>
              <li>Devotees scanning the QR code on the Public Portal will send money directly to your account.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
