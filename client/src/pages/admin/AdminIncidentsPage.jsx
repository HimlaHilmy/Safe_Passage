import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import SafePassageMap from '../../components/maps/MapContainer';
import {
  MapPin,
  Eye,
  AlertOctagon,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Map,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Edit3
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
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Quick Status Update Modal State
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [currentPage, selectedCategory, selectedSeverity, selectedStatus, startDate, endDate]);

  const fetchIncidents = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('limit', 15);
    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedSeverity) params.append('severity', selectedSeverity);
    if (selectedStatus) params.append('status', selectedStatus);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      const res = await fetch(`${apiUrl}/admin/incidents?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
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

  const handleExportCSV = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedStatus) params.append('status', selectedStatus);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    window.open(`${apiUrl}/admin/export/csv?${params.toString()}`, '_blank');
  };

  const openQuickUpdate = (inc) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    setUpdateNotes('');
    setUpdateModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setUpdating(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiUrl}/admin/incidents/${selectedIncident._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: updateNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: 'Incident Updated',
          message: `Status updated to ${newStatus}.`,
        });
        setUpdateModalOpen(false);
        fetchIncidents();
      } else {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.message || 'Could not update incident.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: err.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      title: 'Incident ID & Title',
      dataIndex: 'title',
      render: (title, row) => (
        <div className="max-w-xs">
          <Link
            to={`/admin/incidents/${row._id}`}
            className="font-bold text-brand-navy hover:text-brand-teal transition-colors line-clamp-1 text-sm"
          >
            {title}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[10px] text-slate-400">
              #{String(row._id).slice(-6)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-brand-teal shrink-0" />
              <span className="truncate">{row.location?.address || 'GPS Location'}</span>
            </span>
          </div>
        </div>
      ),
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
      title: 'Reported At',
      dataIndex: 'createdAt',
      render: (time) => (
        <div className="text-xs text-slate-500">
          <div className="font-semibold text-slate-700">
            {new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-slate-400">
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      title: 'Assigned Provider',
      dataIndex: 'assignedProviderId',
      render: (prov, row) => {
        const providerObj = prov || row.assignedProvider;
        return providerObj ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[140px]">{providerObj.name || 'Assigned Unit'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Unassigned
          </span>
        );
      },
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <Link to={`/admin/incidents/${id}`}>
            <Button variant="outline" size="sm" icon={Eye}>
              Audit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            icon={Edit3}
            onClick={() => openQuickUpdate(row)}
            className="text-slate-500 hover:text-brand-navy"
            title="Quick Status Update"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Incident Operations & Case Triage"
        subtitle="Manage, filter, triage, and review all emergency distress calls across Sri Lanka."
        breadcrumbs={['Admin', 'Incident Management']}
        actions={
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500 hover:text-brand-navy'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  viewMode === 'map' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500 hover:text-brand-navy'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Map View
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        }
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
