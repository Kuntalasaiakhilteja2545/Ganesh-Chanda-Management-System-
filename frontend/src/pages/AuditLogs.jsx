import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSync } from '../context/LiveSyncContext';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import {
  ShieldAlert,
  Activity,
  User,
  Globe,
  Search,
  Filter,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Laptop,
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function AuditLogs() {
  const { lang, t } = useLanguage();
  const { syncVersion } = useLiveSync();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, modelFilter, search, syncVersion]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (modelFilter) params.append('model_name', modelFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiClient.get(`/audit-logs/?${params.toString()}`);
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <PlusCircle className="w-3 h-3 text-emerald-600" />,
          label: 'Created / జోడించారు',
        };
      case 'UPDATE':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: <Edit3 className="w-3 h-3 text-amber-600" />,
          label: 'Updated / సవరించారు',
        };
      case 'DELETE':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: <Trash2 className="w-3 h-3 text-rose-600" />,
          label: 'Deleted / తొలగించారు',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <Activity className="w-3 h-3 text-slate-500" />,
          label: action,
        };
    }
  };

  const getModelBadge = (model) => {
    switch (model) {
      case 'Donation':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'Expense':
        return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
      case 'Donor':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'CommitteeMember':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'Festival':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 font-medium';
    }
  };

  // Metrics
  const totalLogs = logs.length;
  const createCount = logs.filter((l) => l.action === 'CREATE').length;
  const updateCount = logs.filter((l) => l.action === 'UPDATE').length;
  const deleteCount = logs.filter((l) => l.action === 'DELETE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="heading-font text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>🛡️ {t('auditLogs')}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Live Immutable Trace
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Forensic tracking of every single collection, expense, devotee registration, and administrative modification.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Refresh Trace Logs</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Total Recorded Actions</p>
            <h4 className="heading-font text-2xl font-black text-slate-900 mt-0.5">{totalLogs}</h4>
            <p className="text-[10px] text-slate-500">Security event history</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            📋
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">Creations (New Records)</p>
            <h4 className="heading-font text-2xl font-black text-emerald-800 mt-0.5">{createCount}</h4>
            <p className="text-[10px] text-emerald-600">Donations, expenses, donors</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
            <PlusCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">Modifications & Edits</p>
            <h4 className="heading-font text-2xl font-black text-amber-900 mt-0.5">{updateCount}</h4>
            <p className="text-[10px] text-amber-700">Amounts, statuses & details</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
            <Edit3 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase text-rose-800 tracking-wider">Deletions</p>
            <h4 className="heading-font text-2xl font-black text-rose-800 mt-0.5">{deleteCount}</h4>
            <p className="text-[10px] text-rose-600">Removed / soft-deleted</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, action, model or IP..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Action Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActionFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              actionFilter === ''
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setActionFilter('CREATE')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              actionFilter === 'CREATE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <PlusCircle className="w-3 h-3" />
            <span>Create ({createCount})</span>
          </button>
          <button
            onClick={() => setActionFilter('UPDATE')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              actionFilter === 'UPDATE'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Update ({updateCount})</span>
          </button>
          <button
            onClick={() => setActionFilter('DELETE')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              actionFilter === 'DELETE'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete ({deleteCount})</span>
          </button>

          {/* Model Filter Dropdown */}
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="">Target: All Models</option>
            <option value="Donation">Donation (చందా / వేలం పాట)</option>
            <option value="Expense">Expense (ఖర్చు / అడ్వాన్స్)</option>
            <option value="Donor">Donor (భక్తుడు / దాత)</option>
            <option value="PlannedExpense">Budget Plan (ప్రణాళిక)</option>
            <option value="Festival">Festival (పండుగ)</option>
            <option value="CommitteeMember">Committee Member (సభ్యుడు)</option>
            <option value="User">User Account (ఖాతా)</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent"></div>
            <p className="text-xs text-slate-400 mt-2">Loading audit trail...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp & Date</th>
                  <th className="py-3.5 px-6">Action Performed</th>
                  <th className="py-3.5 px-6">Actor / User</th>
                  <th className="py-3.5 px-6">Entity / Model</th>
                  <th className="py-3.5 px-6">Record Ref</th>
                  <th className="py-3.5 px-6">IP / Network</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const dateObj = new Date(log.timestamp);
                  const formattedDate = dateObj.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-slate-900">{formattedDate}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formattedTime}</div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.user_name || 'Admin Officer'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] border ${getModelBadge(log.model_name)}`}>
                          {log.model_name}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-slate-700">
                        #{log.record_id}
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-600 font-mono text-[11px] flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{log.ip_address || '127.0.0.1 (Localhost)'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Payload</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No matching audit events found.</p>
            <p className="text-xs text-slate-400 mt-1">Audit log records will automatically capture every action in real-time.</p>
          </div>
        )}
      </div>

      {/* Payload Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`🔍 Forensic Audit Details — Log #${selectedLog.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Action</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{selectedLog.action}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Target Entity</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{selectedLog.model_name} #{selectedLog.record_id}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Actor / User</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{selectedLog.user_name || 'Admin'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Timestamp</span>
                <p className="font-mono text-slate-900 mt-0.5 text-[11px]">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Changed Values Comparison */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Payload Changes:</h4>

              {selectedLog.old_values && (
                <div>
                  <div className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-t-xl border border-rose-200">
                    Previous Values (Before Action):
                  </div>
                  <pre className="p-3 bg-slate-900 text-rose-300 rounded-b-xl text-[11px] font-mono overflow-x-auto max-h-44">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-t-xl border border-emerald-200">
                    {selectedLog.action === 'CREATE' ? 'Created Record Payload:' : 'New Values (After Action):'}
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-b-xl text-[11px] font-mono overflow-x-auto max-h-44">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
