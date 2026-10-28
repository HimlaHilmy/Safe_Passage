import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import {
  FileText,
  Shield,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Building2,
  Download,
  Info
} from 'lucide-react';

const ACTION_OPTIONS = [
  'INCIDENT_STATUS_UPDATE',
  'INCIDENT_ASSIGNMENT',
  'USER_STATUS_CHANGE',
  'USER_ROLE_CHANGE',
  'PROVIDER_VERIFIED',
  'PROVIDER_REJECTED',
  'SERVICE_CREATED',
  'SERVICE_UPDATED',
  'SERVICE_DELETED',
  'REPORT_EXPORTED',
  'ADMIN_LOGIN',
];

const ROLES = ['admin', 'provider', 'traveler', 'system'];

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [caseLogs, setCaseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'lifecycle'

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Inspection Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, selectedAction, selectedRole, startDate, endDate]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', 25);
    if (searchTerm) params.append('search', searchTerm);
    if (selectedAction) params.append('action', selectedAction);
    if (selectedRole) params.append('role', selectedRole);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const res = await fetch(`${apiUrl}/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data || []);
        if (data.caseLogs) setCaseLogs(data.caseLogs);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAction('');
    setSelectedRole('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const openInspectModal = (log) => {
    setSelectedLog(log);
    setInspectModalOpen(true);
  };

  const adminColumns = [
    {
      title: 'Timestamp (UTC / Local)',
      dataIndex: 'timestamp',
      render: (time) => (
        <div className="text-xs text-slate-500 font-mono">
          <div className="font-semibold text-slate-700">
            {new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-slate-400">
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      title: 'Action Identifier',
      dataIndex: 'action',
      render: (action) => {
        let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
        if (action?.includes('STATUS')) colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        if (action?.includes('VERIFIED')) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (action?.includes('REJECTED') || action?.includes('DELETED')) colorClass = 'bg-red-50 text-red-700 border-red-200';
        if (action?.includes('SERVICE')) colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        if (action?.includes('EXPORT')) colorClass = 'bg-teal-50 text-teal-700 border-teal-200';

        return (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${colorClass}`}>
            {action?.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      title: 'Actor (Operator)',
      dataIndex: 'performedByName',
      render: (name, row) => (
        <div className="text-xs">
          <div className="font-bold text-brand-navy">{name || 'Administrator'}</div>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5 inline-block">
            {row.performedByRole || 'admin'}
          </span>
        </div>
      ),
    },
    {
      title: 'Target Resource',
      dataIndex: 'targetTitle',
      render: (title, row) => (
        <div className="text-xs max-w-xs">
          <span className="font-bold text-brand-navy line-clamp-1">{title || 'Resource'}</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">
            Type: {row.targetType} {row.targetId ? `(#${String(row.targetId).slice(-6)})` : ''}
          </span>
        </div>
      ),
    },
    {
      title: 'Operational Notes',
      dataIndex: 'notes',
      render: (notes) => (
        <span className="text-xs text-slate-600 max-w-xs line-clamp-1">
          {notes || 'No notes provided'}
        </span>
      ),
    },
    {
      title: 'Audit Detail',
      dataIndex: '_id',
      render: (id, row) => (
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => openInspectModal(row)}
        >
          Inspect
        </Button>
      ),
    },
  ];

  const lifecycleColumns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      render: (time) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(time).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Related Incident',
      dataIndex: 'incidentId',
      render: (inc, row) => (
        <span className="font-bold text-xs text-brand-navy">
          {inc?.title || row.incidentTitle || 'Emergency Case'}
        </span>
      ),
    },
    {
      title: 'Actor Role',
      dataIndex: 'updaterRole',
      render: (role) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
          {role}
        </span>
      ),
    },
    {
      title: 'State Transition',
      dataIndex: 'newStatus',
      render: (newStatus, row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold">{row.previousStatus}</span>
          <span>&rarr;</span>
          <StatusBadge status={newStatus} size="sm" />
        </div>
      ),
    },
    {
      title: 'Transition Notes',
      dataIndex: 'notes',
      render: (notes) => <span className="text-xs text-slate-600">{notes || 'Automated transition'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Administrative & System Audit Logs"
        subtitle="Immutable chronological ledger recording all operator actions, credential approvals, status overrides, and security events."
        breadcrumbs={['Admin', 'Audit Logs']}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-500 hover:text-brand-navy'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-brand-teal" />
          Administrative Actions ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('lifecycle')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'lifecycle'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-500 hover:text-brand-navy'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emergency-red" />
          Incident Case Lifecycle Transitions ({caseLogs.length})
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      {activeTab === 'admin' && (
        <Card className="border border-slate-200">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <input
                  type="text"
                  placeholder="Search by action, operator, target, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-brand-text font-medium focus:ring-2 focus:ring-brand-teal focus:bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="md:col-span-3">
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="">All Action Types</option>
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="">All Roles</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Filter
                </Button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 font-semibold text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-brand-teal" />
                Date Window:
              </span>
              <div className="flex items-center gap-2">
                <span>From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                />
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Table */}
      {activeTab === 'admin' ? (
        <Table
          columns={adminColumns}
          data={logs}
          isLoading={loading}
          emptyMessage="No administrative actions found matching the filters."
        />
      ) : (
        <Table
          columns={lifecycleColumns}
          data={caseLogs}
          isLoading={loading}
          emptyMessage="No incident lifecycle transition logs found."
        />
      )}

      {/* Audit Log Inspection Modal */}
      {inspectModalOpen && selectedLog && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Audit Payload: ${selectedLog.action}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-400 uppercase">Actor:</span>
                <div className="font-bold text-brand-navy">{selectedLog.performedByName} ({selectedLog.performedByRole})</div>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase">Timestamp:</span>
                <div className="font-mono text-slate-700">{new Date(selectedLog.timestamp).toISOString()}</div>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase">Target Resource:</span>
                <div className="font-semibold text-slate-700">{selectedLog.targetType} — {selectedLog.targetTitle}</div>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase">IP Address:</span>
                <div className="font-mono text-slate-700">{selectedLog.ipAddress || '127.0.0.1'}</div>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase block mb-1">
                Operational Justification / Notes
              </span>
              <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {selectedLog.notes || 'No additional operator notes recorded.'}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-500 uppercase block mb-1">
                JSON Event Metadata
              </span>
              <pre className="bg-brand-navy text-teal-300 p-3 rounded-xl overflow-x-auto font-mono text-[11px] max-h-56">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setInspectModalOpen(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
