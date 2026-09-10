import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { transliterateToTelugu } from '../utils/teluguTransliterate';
import {
  Users2,
  Plus,
  Phone,
  Crown,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  Languages,
  Upload,
  Camera,
  X,
  User,
  Sparkles,
} from 'lucide-react';

const DESIGNATIONS = [
  { value: 'PRESIDENT', labelEn: 'President', labelTe: 'అధ్యక్షుడు', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'VICE_PRESIDENT', labelEn: 'Vice President', labelTe: 'ఉపాధ్యక్షుడు', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'SECRETARY', labelEn: 'General Secretary', labelTe: 'ప్రధాన కార్యదర్శి', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'TREASURER', labelEn: 'Treasurer', labelTe: 'కోశాధికారి', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'JOINT_SECRETARY', labelEn: 'Joint Secretary', labelTe: 'సహాయ కార్యదర్శి', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'YOUTH_LEADER', labelEn: 'Youth Leader', labelTe: 'యువజన నాయకుడు', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'EXECUTIVE_MEMBER', labelEn: 'Executive Member', labelTe: 'కార్యవర్గ సభ్యుడు', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'MEMBER', labelEn: 'Member', labelTe: 'సభ్యుడు', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { value: 'VOLUNTEER', labelEn: 'Volunteer', labelTe: 'స్వచ్ఛంద సేవకుడు', color: 'bg-teal-100 text-teal-800 border-teal-200' },
];

export default function Committee() {
  const { activeFestival, isTreasurer, isAdmin } = useAuth();
  const { lang, t } = useLanguage();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [nameTelugu, setNameTelugu] = useState('');
  const [designation, setDesignation] = useState('MEMBER');
  const [mobileNumber, setMobileNumber] = useState('');
  const [photo, setPhoto] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const fileInputRef = useRef();

  useEffect(() => {
    fetchMembers();
  }, [activeFestival, search, selectedDesignation]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let url = '/committee-members/?';
      if (activeFestival) url += `festival=${activeFestival.id}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedDesignation) url += `designation=${selectedDesignation}&`;

      const res = await apiClient.get(url);
      setMembers(res.data.results || res.data);
    } catch (err) {
      console.error('Error loading committee members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setName('');
    setNameTelugu('');
    setDesignation('MEMBER');
    setMobileNumber('');
    setPhoto('');
    setDisplayOrder(String(members.length + 1));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingMember(m);
    setName(m.name || '');
    setNameTelugu(m.name_telugu || '');
    setDesignation(m.designation || 'MEMBER');
    setMobileNumber(m.mobile_number || '');
    setPhoto(m.photo || '');
    setDisplayOrder(String(m.display_order || 1));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteMember = async (id, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the committee?`)) {
      return;
    }
    try {
      await apiClient.delete(`/committee-members/${id}/`);
      fetchMembers();
    } catch (err) {
      alert('Failed to delete member.');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setFormError('Please select a photo under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      // Compress image via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhoto(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = async (val) => {
    setName(val);
    if (val.trim()) {
      setIsTranslating(true);
      const telugu = await transliterateToTelugu(val);
      if (telugu) {
        setNameTelugu(telugu);
      }
      setIsTranslating(false);
    } else {
      setNameTelugu('');
    }
  };

  const handleManualTranslate = async () => {
    if (!name.trim()) return;
    setIsTranslating(true);
    const telugu = await transliterateToTelugu(name);
    if (telugu) {
      setNameTelugu(telugu);
    }
    setIsTranslating(false);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      festival: activeFestival?.id,
      name: name.trim(),
      name_telugu: nameTelugu.trim(),
      designation,
      mobile_number: mobileNumber.trim(),
      photo: photo || '',
      display_order: parseInt(displayOrder) || 1,
    };

    try {
      if (editingMember) {
        await apiClient.patch(`/committee-members/${editingMember.id}/`, payload);
      } else {
        await apiClient.post('/committee-members/', payload);
      }

      setIsModalOpen(false);
      fetchMembers();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Error saving committee member.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDesignationMeta = (val) => {
    return DESIGNATIONS.find((d) => d.value === val) || DESIGNATIONS[7];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="heading-font text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('committee')}
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
              {members.length} Members
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeFestival?.association_name || 'Ganesh Youth Association'} — Add, edit, photo upload & manage organizers.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addMember')}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name or mobile..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Role:</span>
          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
          >
            <option value="">All Roles ({members.length})</option>
            {DESIGNATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {lang === 'te' ? d.labelTe : d.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Committee Grid with Member Photos & Rich Animations */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((m) => {
            const meta = getDesignationMeta(m.designation);
            const isLeader = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER'].includes(m.designation);

            return (
              <div
                key={m.id}
                className={`group bg-white rounded-3xl border p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                  isLeader
                    ? 'border-amber-300/80 shadow-md shadow-amber-600/5 ring-1 ring-amber-400/30'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Decorative background glow for leaders */}
                {isLeader && (
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  {/* Top Badge & Crown */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${meta.color}`}>
                      {lang === 'te' ? meta.labelTe : meta.labelEn}
                    </span>
                    {isLeader && <Crown className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />}
                  </div>

                  {/* Member Photo or Avatar */}
                  <div className="mt-4 flex flex-col items-center text-center">
                    <div className="relative">
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="w-20 h-20 rounded-full object-cover border-3 border-amber-500 shadow-md transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center text-white font-extrabold text-2xl shadow-md border-2 border-white">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-slate-200">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full block" title="Active Member" />
                      </div>
                    </div>

                    <h3 className="heading-font text-base font-extrabold text-slate-900 mt-3 leading-snug">
                      {m.name}
                    </h3>
                    {m.name_telugu && (
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{m.name_telugu}</p>
                    )}
                  </div>

                  {m.mobile_number && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{m.mobile_number}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions (Edit & Delete) */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-bold">Order #{m.display_order}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Member"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 shadow-xs">
          <Users2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">No committee members added yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Committee Member" above to record organizers and upload their photos!</p>
        </div>
      )}

      {/* Add / Edit Member Modal with Photo Upload */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Committee Member' : t('addMember')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Member Photo Upload */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="relative group">
              {photo ? (
                <div className="relative">
                  <img
                    src={photo}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-slate-200 border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[9px] font-bold mt-1">Add Photo</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
            >
              {photo ? 'Change Member Photo 📷' : 'Upload Member Photo 📷'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase text-slate-700">
                Member Name (English) *
              </label>
              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <Languages className="w-3 h-3" /> Auto-translates to Telugu
              </span>
            </div>
            <input
              type="text"
              required
              placeholder="Type English (e.g. Ramesh Kumar)"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase text-slate-700">
                Member Name in Telugu (తెలుగు పేరు)
              </label>
              <button
                type="button"
                onClick={handleManualTranslate}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
              >
                {isTranslating ? 'Translating...' : '🔄 Re-Translate'}
              </button>
            </div>
            <input
              type="text"
              placeholder="ఆటోమేటిక్ తెలుగు అనువాదం (e.g. రమేష్ కుమార్)"
              value={nameTelugu}
              onChange={(e) => setNameTelugu(e.target.value)}
              className="w-full p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Designation / Role *
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.labelEn} ({d.labelTe})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Contact Phone Number
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
