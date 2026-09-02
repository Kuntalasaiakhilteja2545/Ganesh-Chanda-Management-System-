import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Users,
  Phone,
  MapPin,
  AlertCircle,
  Edit2,
  Trash2,
  Send,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function Donors() {
  const { t, lang } = useLanguage();
  const { activeFestival } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);

  // Greetings Broadcast Modal State
  const [isGreetingsModalOpen, setIsGreetingsModalOpen] = useState(false);
  const [greetingText, setGreetingText] = useState('');
  const [copied, setCopied] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, [search]);

  useEffect(() => {
    const assoc = activeFestival?.association_name || 'Jai Hind Ganesh Youth Association';
    const fest = activeFestival?.name || 'Ganesh Chanda 2026';
    const portalUrl = `${window.location.origin}/public`;

    const defaultMsg = `🕉️ *|| ॐ శ్రీ గణేశాయ నమః ||* 🕉️\n\n*${assoc}* తరపున మీకు మరియు మీ కుటుంబ సభ్యులకు *శ్రీ వినాయక చవితి మరియు గణేష్ నవరాత్రి మహోత్సవ శుభాకాంక్షలు!* 🌸🙏\n\n*${fest}* సందర్భంగా నిర్వహించే పూజా కార్యక్రమాలు మరియు అన్నదాన వివరాలు క్రింది లింక్ ద్వారా చూడగలరు:\n🌐 *పారదర్శక పోర్టల్:* ${portalUrl}\n\nగణపతి బప్పా మోరియా! 🙏`;
    setGreetingText(defaultMsg);
  }, [activeFestival]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const url = search ? `/donors/?search=${encodeURIComponent(search)}` : '/donors/';
      const res = await apiClient.get(url);
      setDonors(res.data.results || res.data);
    } catch (err) {
      console.error('Error loading donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDonor(null);
    setName('');
    setMobile('');
    setAddress('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (donor) => {
    setEditingDonor(donor);
    setName(donor.name || '');
    setMobile(donor.mobile_number || '');
    setAddress(donor.address || '');
    setNotes(donor.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteDonor = async (id, donorName) => {
    if (!window.confirm(`Are you sure you want to remove donor "${donorName}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/donors/${id}/`);
      showToastSuccess(`✓ Donor "${donorName}" removed.`);
      fetchDonors();
    } catch (err) {
      showToastError('Failed to delete donor. They may have active donations associated.');
    }
  };

  const handleSaveDonor = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      mobile_number: mobile.trim(),
      address: address.trim(),
      notes: notes.trim(),
    };

    try {
      if (editingDonor) {
        await apiClient.patch(`/donors/${editingDonor.id}/`, payload);
        showToastSuccess('✓ Devotee details updated.');
      } else {
        await apiClient.post('/donors/', payload);
        showToastSuccess('✓ New devotee added.');
      }
      setIsModalOpen(false);
      fetchDonors();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Error saving donor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSingleWhatsApp = (donor) => {
    if (!donor.mobile_number) return;
    const cleanMobile = donor.mobile_number.replace(/\D/g, '');
    const phone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const personalizedText = greetingText.replace('మీకు మరియు', `శ్రీ ${donor.name} గారికి మరియు`);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(personalizedText)}`;
    window.open(url, '_blank');
  };

  const handleCopyGreeting = () => {
    navigator.clipboard.writeText(greetingText);
    setCopied(true);
    showToastSuccess('✓ Greeting message copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const donorsWithPhone = donors.filter((d) => Boolean(d.mobile_number));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('donors')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Devotee directory, contact book, and 1-click WhatsApp festival greeting broadcast.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Greetings Broadcast Button */}
          <button
            onClick={() => setIsGreetingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Festival Greetings (వాట్సాప్) 📲</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addDonor')}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by devotee name, colony/location, or phone number..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        <span className="text-xs font-bold text-slate-500 shrink-0 bg-slate-100 px-3 py-1.5 rounded-xl">
          {donors.length} Devotees
        </span>
      </div>

      {/* Donors Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
          <p className="text-xs text-slate-400 mt-2">{t('loading')}</p>
        </div>
      ) : donors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map((d) => (
            <div
              key={d.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="heading-font font-black text-slate-900 text-sm">{d.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    #{d.id}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {d.mobile_number ? (
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 font-mono text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{d.mobile_number}</span>
                      </p>
                      <button
                        onClick={() => handleSendSingleWhatsApp(d)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        title="Send WhatsApp Greeting"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No mobile number</p>
                  )}
                  {d.address && (
                    <p className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{d.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Added {new Date(d.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(d)}
                    className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Devotee"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDonor(d.id, d.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Devotee"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">{t('noData')}</p>
        </div>
      )}

      {/* Add / Edit Devotee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDonor ? 'Edit Devotee Details' : t('addDonor')}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDonor} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Devotee / Donor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Reddy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Location / Colony Address
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 302, Sai Residency, Colony Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Regular annual contributor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

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
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* WhatsApp Festival Greetings Broadcast Modal */}
      <Modal
        isOpen={isGreetingsModalOpen}
        onClose={() => setIsGreetingsModalOpen(false)}
        title="Send Vinayaka Chavithi Greetings (వాట్సాప్ శుభాకాంక్షలు)"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Send personalized Vinayaka Chavithi blessings and public transparency portal links to your devotees on WhatsApp with 1 tap.
            </p>
          </div>

          {/* Editable Greeting Message */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              WhatsApp Greeting Message Template:
            </label>
            <textarea
              rows={6}
              value={greetingText}
              onChange={(e) => setGreetingText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCopyGreeting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Message 📋'}</span>
              </button>
            </div>
          </div>

          {/* Devotees List with 1-Click WhatsApp Button */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-700 mb-2">
              Send to Devotees with Phone Numbers ({donorsWithPhone.length}):
            </h4>
            <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
              {donorsWithPhone.map((d) => (
                <div key={d.id} className="pt-1.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900">{d.name}</span>
                    <span className="text-slate-400 font-mono ml-2">📞 {d.mobile_number}</span>
                    {d.address && <span className="text-slate-500 text-[11px] ml-2">({d.address})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendSingleWhatsApp(d)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send WhatsApp 📲</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsGreetingsModalOpen(false)}
              className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
