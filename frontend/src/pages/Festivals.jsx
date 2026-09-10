import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { transliterateToTelugu } from '../utils/teluguTransliterate';
import { Calendar, Plus, CheckCircle2, AlertCircle, Languages, Edit2, Trash2 } from 'lucide-react';

export default function Festivals() {
  const { activeFestival, setActiveFestival, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [nameTelugu, setNameTelugu] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/festivals/');
      setFestivals(res.data.results || res.data);
    } catch (err) {
      console.error('Error fetching festivals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFestival(null);
    setName('');
    setNameTelugu('');
    setYear(new Date().getFullYear() + 1);
    setStartDate('');
    setEndDate('');
    setLocation('');
    setUpiId('');
    setIsActive(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setEditingFestival(f);
    setName(f.name || '');
    setNameTelugu(f.name_telugu || '');
    setYear(f.year || new Date().getFullYear());
    setStartDate(f.start_date || '');
    setEndDate(f.end_date || '');
    setLocation(f.location || '');
    setUpiId(f.upi_id || '');
    setIsActive(f.is_active || false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteFestival = async (id, fName) => {
    if (!window.confirm(`Are you sure you want to delete festival "${fName}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/festivals/${id}/`);
      fetchFestivals();
    } catch (err) {
      alert('Failed to delete festival.');
    }
  };

  const handleNameChange = async (val) => {
    setName(val);
    if (val.trim()) {
      const te = await transliterateToTelugu(val);
      if (te) setNameTelugu(te);
    }
  };

  const handleSaveFestival = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      name_telugu: nameTelugu.trim(),
      year: parseInt(year),
      start_date: startDate || null,
      end_date: endDate || null,
      location: location.trim(),
      upi_id: upiId.trim(),
      is_active: isActive,
    };

    try {
      if (editingFestival) {
        await apiClient.patch(`/festivals/${editingFestival.id}/`, payload);
      } else {
        await apiClient.post('/festivals/', payload);
      }

      setIsModalOpen(false);
      fetchFestivals();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Error saving festival.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (fest) => {
    try {
      await apiClient.patch(`/festivals/${fest.id}/`, { is_active: true });
      setActiveFestival(fest);
      fetchFestivals();
    } catch (err) {
      console.error('Error setting active festival:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('festivals')} (Pandal & Seasons)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage Ganesh Chanda festival years, pandal venues, and switch the active event season.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Festival Year</span>
        </button>
      </div>

      {/* Festivals Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
        </div>
      ) : festivals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {festivals.map((f) => (
            <div
              key={f.id}
              className={`bg-white p-6 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                f.is_active
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-lg shadow-amber-600/10'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              {f.is_active && (
                <div className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-xs">
                  Active Year
                </div>
              )}

              <div>
                <span className="text-xs font-mono font-bold text-amber-700">{f.year}</span>
                <h3 className="heading-font text-lg font-bold text-slate-900 mt-1">{f.name}</h3>
                {f.name_telugu && (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{f.name_telugu}</p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  {f.location && <p>📍 Location: {f.location}</p>}
                  {f.start_date && (
                    <p>
                      📅 Dates: {f.start_date} to {f.end_date || 'Ongoing'}
                    </p>
                  )}
                  {f.upi_id && <p>💳 UPI: {f.upi_id}</p>}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {f.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Currently Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetActive(f)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                    >
                      Set as Active
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(f)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Festival"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!f.is_active && (
                    <button
                      onClick={() => handleDeleteFestival(f.id, f.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Festival"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm">No festivals created yet.</p>
        </div>
      )}

      {/* Add / Edit Festival Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFestival ? 'Edit Festival Year' : 'Add Festival Year'}
      >
        <form onSubmit={handleSaveFestival} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase text-slate-700">
                Festival Name (English) *
              </label>
              <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <Languages className="w-3 h-3" /> Auto-Telugu
              </span>
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Ganesh Chanda 2027"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Festival Name in Telugu (తెలుగు శీర్షిక)
            </label>
            <input
              type="text"
              value={nameTelugu}
              onChange={(e) => setNameTelugu(e.target.value)}
              placeholder="ఆటోమేటిక్ తెలుగు అనువాదం (e.g. గణేష్ చందా 2027)"
              className="w-full p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Pandal Location"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              UPI ID for Donations
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. ganeshchanda@upi"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
              Set as current active festival immediately
            </label>
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
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
