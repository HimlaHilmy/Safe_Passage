import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL, SOCKET_BASE_URL } from '../../config/api';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import SafePassageMap from '../../components/maps/MapContainer';
import SharedIncidentDetailsModal from '../../components/case-lifecycle/SharedIncidentDetailsModal';
import {
  MapPin,
  Eye,
  RefreshCw,
  ExternalLink,
  Edit3,
  Download,
  Calendar,
  Layers,
  Map as MapIcon,
  RotateCcw,
  UserCheck,
  Clock,
  Shield,
} from 'lucide-react';

const CATEGORIES = [
  'Medical Emergency',
  'Roadside & Vehicle Breakdown',
  'Crime & Theft',
  'Natural Hazard & Weather',
  'Fire Emergency',
  'Lost & Stranded',
  'Other Emergency',
];

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

const STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'Assistance Dispatched',
  'In Progress',
  'Resolved',
  'Cancelled',
];

export default function AdminIncidentsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15, page: 1 });

  // Shared Case Lifecycle Audit Modal State
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Quick Status Update Modal State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [etaMinutes, setEtaMinutes] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, [currentPage, selectedCategory, selectedSeverity, selectedStatus, startDate, endDate]);

  useEffect(() => {
    fetchProviders();
  }, []);

  // Real-time socket listener for admin channel
  useEffect(() => {
    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_role_channel', 'admin');
    });

    socket.on('incident_updated', () => {
      fetchIncidents();
    });

    socket.on('new_incident_alert', (data) => {
      addToast(`New Emergency Reported: ${data.title || 'Distress Beacon'}`, 'warning');
      fetchIncidents();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchProviders = async () => {
    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/admin/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProviders(data.data || []);
      } else {
        setProviders([]);
      }
    } catch (err) {
      console.warn('[Admin Providers Fetch Notice]', err.message);
      setProviders([]);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    const apiUrl = API_BASE_URL;

    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '15');
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSeverity) params.append('severity', selectedSeverity);
      if (selectedStatus) params.append('status', selectedStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${apiUrl}/admin/incidents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        } else {
          setPagination({
            total: data.count || (data.data ? data.data.length : 0),
            page: currentPage,
            limit: 15,
            totalPages: 1,
          });
        }
      } else {
        throw new Error(data.message || 'Failed to fetch incidents');
      }
    } catch (err) {
      console.error('[Admin Incidents Fetch Error]', err.message);
      setIncidents([]);
      setPagination({
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 15,
      });
      addToast(err.message || 'Could not load incidents from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCurrentPage(1);
    fetchIncidents();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSeverity('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = async () => {
    const apiUrl = API_BASE_URL;
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedStatus) params.append('status', selectedStatus);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const res = await fetch(`${apiUrl}/admin/export/csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `incident-operations-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        addToast('Incident report CSV exported successfully.', 'success');
      } else {
        addToast('Failed to export CSV report.', 'error');
      }
    } catch {
      addToast('Error downloading CSV report.', 'error');
    }
  };

  const openAuditModal = (id) => {
    setSelectedIncidentId(id);
    setIsAuditModalOpen(true);
  };

  const openQuickUpdate = (inc) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    const provId = inc.assignedProviderId?._id || (typeof inc.assignedProviderId === 'string' ? inc.assignedProviderId : '') || inc.assignedProvider?._id || '';
    setSelectedProviderId(provId);
    setEtaMinutes(inc.estimatedArrivalTimeMinutes || '');
    setUpdateNotes('');
    setUpdateModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setUpdating(true);
    const apiUrl = API_BASE_URL;

    try {
      const payload = {
        status: newStatus,
        notes: updateNotes || `Status updated to ${newStatus} from Incident Operations Console.`,
      };
      if (selectedProviderId) {
        payload.assignedProviderId = selectedProviderId;
      }
      if (etaMinutes !== '') {
        payload.estimatedArrivalTimeMinutes = Number(etaMinutes) || null;
      }

      const res = await fetch(`${apiUrl}/admin/incidents/${selectedIncident._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Incident #${String(selectedIncident._id).slice(-6)} updated to ${newStatus}`, 'success');
        setUpdateModalOpen(false);
        fetchIncidents();
      } else {
        addToast(data.message || 'Status update failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Status transition network error.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: 'Incident Ref',
      dataIndex: 'incidentReference',
      render: (ref, row) => (
        <span className="font-mono text-xs font-bold text-brand-navy px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
          {ref || row.reference || `#${String(row._id).slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      title: 'Incident Title & Location',
      dataIndex: 'title',
      render: (title, row) => (
        <div className="max-w-xs">
          <div className="font-bold text-xs text-brand-navy truncate">{title}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-brand-teal shrink-0" />
            <span className="truncate">{row.location?.address || 'Pinned location'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Reporter',
      dataIndex: 'travelerId',
      render: (traveler, row) => {
        const rep = traveler?.name ? traveler : (row.traveler?.name ? row.traveler : null);
        return (
          <div className="text-xs">
            <div className="font-semibold text-slate-700">{rep?.name || 'Verified Traveler'}</div>
            {rep?.phone && <div className="text-[10px] text-slate-400">{rep.phone}</div>}
          </div>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (cat) => <span className="text-xs font-semibold text-slate-700">{cat}</span>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      render: (sev) => <StatusBadge status={sev} type="severity" size="sm" />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Assigned Crew',
      dataIndex: 'assignedProviderId',
      render: (prov, row) => {
        const provider = prov?.name ? prov : row.assignedProvider;
        if (provider) {
          return (
            <div className="text-xs">
              <span className="font-bold text-slate-800">{provider.name}</span>
              {row.estimatedArrivalTimeMinutes && (
                <div className="text-[10px] text-brand-teal-dark font-semibold">
                  ETA: {row.estimatedArrivalTimeMinutes}m
                </div>
              )}
            </div>
          );
        }
        return <span className="text-xs text-slate-400 italic">Unassigned</span>;
      },
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => openAuditModal(id)}
            title="Open Case Lifecycle Audit Modal"
          >
            Audit
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserCheck}
            onClick={() => openQuickUpdate(row)}
            title="Assign Response Crew or Update Incident Status"
          >
            Assign / Status
          </Button>
          <Link to={`/admin/incidents/${id}`}>
            <button
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-brand-navy hover:bg-slate-50 transition-colors"
              title="Open full dedicated case dispatch room"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Incident Operations Management"
        subtitle="Centralized command console for incident triage, finite state progression, provider allocation, and full lifecycle audit trails."
        breadcrumbs={['Admin', 'Incident Management']}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Table / Map Mode Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-brand-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-brand-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              title="Export operational incident log to CSV"
            >
              Export CSV
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={fetchIncidents}
              title="Refresh incident list"
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Control & Filter Card */}
      <Card className="border border-slate-200/90 shadow-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                placeholder="Search ref, title, traveler, location..."
                className="max-w-none"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Select */}
            <div className="md:col-span-2">
              <select
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="">All Severities</option>
                {SEVERITIES.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev} Priority
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="md:col-span-2">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="md:col-span-1 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors border border-slate-200"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Range & Status Chips Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Quick Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { label: 'All', val: '' },
                { label: 'Submitted', val: 'Submitted' },
                { label: 'Under Review', val: 'Under Review' },
                { label: 'Assigned', val: 'Assigned' },
                { label: 'Dispatched', val: 'Assistance Dispatched' },
                { label: 'In Progress', val: 'In Progress' },
                { label: 'Resolved', val: 'Resolved' },
                { label: 'Cancelled', val: 'Cancelled' },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.val}
                  onClick={() => {
                    setSelectedStatus(tab.val);
                    setCurrentPage(1);
                  }}
                  className={`
                    px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0
                    ${
                      selectedStatus === tab.val
                        ? 'bg-brand-navy text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Date Range Controls */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
              <Calendar className="w-3.5 h-3.5 text-brand-teal" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white"
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white"
              />
              {(selectedCategory || selectedSeverity || selectedStatus || searchTerm || startDate || endDate) && (
                <span className="text-xs font-bold text-brand-teal pl-2">
                  ({pagination.total || incidents.length} Matches)
                </span>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Main View: Table vs Map */}
      {viewMode === 'table' ? (
        <div className="space-y-4">
          <Table
            columns={columns}
            data={incidents}
            isLoading={loading}
            emptyMessage="No incidents match the selected search or filter criteria."
          />

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500 font-medium">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total Cases)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <SafePassageMap
            markers={incidents}
            height="560px"
            className="w-full shadow-card border border-slate-200 rounded-3xl overflow-hidden"
          />
          <div className="text-xs text-slate-500 text-center">
            Click on any marker pin to preview emergency details and open the comprehensive case audit room.
          </div>
        </div>
      )}

      {/* Shared Case Lifecycle Details & Audit Modal (Member 3) */}
      <SharedIncidentDetailsModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedIncidentId(null);
        }}
        incidentId={selectedIncidentId}
        onIncidentUpdated={fetchIncidents}
      />

      {/* Quick Status Update Modal */}
      {updateModalOpen && selectedIncident && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Assign Crew & Update Status: #${String(selectedIncident._id).slice(-6).toUpperCase()}`}
          subtitle="Allocate emergency responders and advance incident lifecycle state"
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Incident Title
              </label>
              <div className="text-sm font-bold text-brand-navy bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {selectedIncident.title}
              </div>
            </div>

            {/* Provider Allocation Selection */}
            <div className="p-3 bg-brand-teal/5 rounded-2xl border border-brand-teal/20 space-y-3">
              <div>
                <label className="text-xs font-bold text-brand-navy flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
                    Assign Emergency Response Provider
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {providers.length} registered providers available
                  </span>
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setSelectedProviderId(chosen);
                    if (chosen && (newStatus === 'Submitted' || newStatus === 'Under Review')) {
                      setNewStatus('Assigned');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-bold focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="">-- Unassigned (No Provider Selected) --</option>
                  {providers.map((p) => {
                    const services = p.providerDetails?.serviceTypes?.length
                      ? `(${p.providerDetails.serviceTypes.join(', ')})`
                      : '';
                    const phone = p.phone ? `• ${p.phone}` : '';
                    return (
                      <option key={p._id} value={p._id}>
                        {p.name} {services} {phone}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecting a provider automatically transitions the status to <strong className="text-brand-teal">Assigned</strong>.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-brand-teal" />
                  Estimated Arrival Time (ETA Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  placeholder="e.g. 15"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Target Lifecycle Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-brand-teal"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Operator Override Notes
              </label>
              <textarea
                rows={3}
                placeholder="Operational notes explaining why this status was modified..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-brand-teal"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUpdateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={updating}
              >
                Confirm Assignment & Status
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
