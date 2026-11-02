import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import SharedIncidentDetailsModal from '../../components/case-lifecycle/SharedIncidentDetailsModal';
import {
  MapPin,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AdminIncidentsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  // Real-time socket listener for admin channel
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_role_channel', 'admin');
    });

    socket.on('incident_updated', (data) => {
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

  const fetchIncidents = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    try {
      let url = `${apiUrl}/incidents`;
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch {
      // Fallback
      setIncidents([
        {
          _id: '65f000000000000000000010',
          incidentReference: 'SP-REF-000010',
          title: 'Engine overheating on Mountain Pass A4',
          category: 'Roadside & Vehicle Breakdown',
          severity: 'High',
          status: 'Assistance Dispatched',
          travelerId: { name: 'Sarah Jenkins', phone: '+1 (555) 234-5678' },
          location: { address: 'Route A4, Mile Marker 42, Central Province' },
          assignedProviderId: { name: 'Apex Rapid Response Ltd' },
          estimatedArrivalTimeMinutes: 18,
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          _id: '65f000000000000000000011',
          incidentReference: 'SP-REF-000011',
          title: 'Severe allergic reaction to food ingredient',
          category: 'Medical Emergency',
          severity: 'Critical',
          status: 'In Progress',
          travelerId: { name: 'Sarah Jenkins', phone: '+1 (555) 234-5678' },
          location: { address: 'Galle Face Terrace, Coastal Road' },
          assignedProviderId: { name: 'Apex Rapid Response Ltd' },
          estimatedArrivalTimeMinutes: 4,
          createdAt: new Date(Date.now() - 14400000),
        },
        {
          _id: '65f000000000000000000012',
          incidentReference: 'SP-REF-000012',
          title: 'Missed trail marker in dense fog',
          category: 'Lost & Stranded',
          severity: 'Medium',
          status: 'Under Review',
          travelerId: { name: 'Marcus Vance', phone: '+44 7700 900123' },
          location: { address: 'Horton Plains National Park trail 3' },
          assignedProviderId: null,
          estimatedArrivalTimeMinutes: null,
          createdAt: new Date(Date.now() - 21600000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openAuditModal = (id) => {
    setSelectedIncidentId(id);
    setIsModalOpen(true);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const ref = (inc.incidentReference || inc.reference || inc._id || '').toLowerCase();
    const title = (inc.title || '').toLowerCase();
    const reporter = (inc.travelerId?.name || inc.traveler?.name || '').toLowerCase();
    return ref.includes(q) || title.includes(q) || reporter.includes(q);
  });

  const columns = [
    {
      title: 'Incident Ref',
      dataIndex: 'incidentReference',
      render: (ref, row) => (
        <span className="font-mono text-xs font-bold text-brand-navy px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
          {ref || row.reference || `#${row._id.slice(-6).toUpperCase()}`}
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
        const rep = traveler?.name ? traveler : row.traveler;
        return (
          <span className="text-xs font-semibold text-slate-700">
            {rep?.name || 'Verified Traveler'}
          </span>
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
      render: (id) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => openAuditModal(id)}
          >
            Audit & Manage
          </Button>
          <Link to={`/traveler/incidents/${id}`} target="_blank" rel="noopener noreferrer">
            <button
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-brand-navy hover:bg-slate-50 transition-colors"
              title="Open full tracking page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Incident Operations Management"
        subtitle="Centralized command console for incident triage, finite state progression, provider allocation, and full lifecycle audit trails."
        breadcrumbs={['Admin', 'Incident Management']}
        badge={
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-50 text-brand-teal-dark border border-teal-200">
            Case Lifecycle Manager: Member 3
          </span>
        }
        action={
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchIncidents}>
            Refresh
          </Button>
        }
      />

      {/* Control & Filter Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Filter by ref, title, reporter name..."
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Status:
          </span>
          {[
            { label: 'All Incidents', val: '' },
            { label: 'Submitted', val: 'Submitted' },
            { label: 'Under Review', val: 'Under Review' },
            { label: 'Assigned', val: 'Assigned' },
            { label: 'Dispatched', val: 'Assistance Dispatched' },
            { label: 'In Progress', val: 'In Progress' },
            { label: 'Resolved', val: 'Resolved' },
            { label: 'Cancelled', val: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`
                px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0
                ${
                  statusFilter === tab.val
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredIncidents}
        isLoading={loading}
        emptyMessage="No incidents match the active search and filter settings."
      />

      {/* Shared Incident Details and Status Management Modal */}
      <SharedIncidentDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIncidentId(null);
        }}
        incidentId={selectedIncidentId}
        onIncidentUpdated={fetchIncidents}
      />

      {/* Filter and Search Bar Card */}
      <Card className="border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <input
                type="text"
                placeholder="Search by title, location, or traveler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-brand-text font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
                {STATUSES.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
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
              Date Filter:
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
            {(selectedCategory || selectedSeverity || selectedStatus || searchTerm || startDate || endDate) && (
              <span className="ml-auto text-xs font-semibold text-brand-teal">
                Active Filter: Showing {pagination.total || incidents.length} Cases
              </span>
            )}
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
            className="w-full shadow-card border border-slate-200"
          />
          <div className="text-xs text-slate-500 text-center">
            Click on any marker pin to preview emergency details and open the comprehensive case audit room.
          </div>
        </div>
      )}

      {/* Quick Status Update Modal */}
      {updateModalOpen && selectedIncident && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Quick Status Update: #${String(selectedIncident._id).slice(-6)}`}
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
                Confirm Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
