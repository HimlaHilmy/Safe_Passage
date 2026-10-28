import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import {
  AlertOctagon,
  Clock,
  MapPin,
  Eye,
  Plus,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function MyIncidentsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const STATUS_OPTIONS = [
    '',
    'Submitted',
    'Under Review',
    'Assigned',
    'Assistance Dispatched',
    'In Progress',
    'Resolved',
    'Cancelled',
  ];

  const CATEGORY_OPTIONS = [
    '',
    'Medical Emergency',
    'Lost Passport or Documents',
    'Theft or Security Incident',
    'Vehicle Breakdown',
    'Other Emergency',
  ];

  useEffect(() => {
    fetchMyIncidents();
  }, [statusFilter, categoryFilter]);

  const fetchMyIncidents = async () => {
    setLoading(true);
    setError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${apiUrl}/incidents${queryString}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to retrieve incidents');
      }
    } catch (err) {
      console.warn('[MyIncidents Fetch Note]:', err.message);
      setError(err.message || 'Could not load your incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMyIncidents();
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = inc.title?.toLowerCase().includes(q);
    const descMatch = inc.description?.toLowerCase().includes(q);
    const refMatch =
      inc.incidentReference?.toLowerCase().includes(q) ||
      inc.referenceNumber?.toLowerCase().includes(q);
    const addrMatch = inc.location?.address?.toLowerCase().includes(q);
    return titleMatch || descMatch || refMatch || addrMatch;
  });

  // Table Columns Definition for Desktop
  const columns = [
    {
      title: 'Reference & Title',
      dataIndex: 'title',
      render: (title, row) => {
        const ref = row.incidentReference || row.referenceNumber || `INC-${row._id.slice(-6).toUpperCase()}`;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-black text-brand-teal bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {ref}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {new Date(row.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="font-bold text-sm text-brand-navy line-clamp-1">{title}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emergency-red shrink-0" />
              <span className="truncate max-w-[240px]">{row.location?.address || 'Pinned on map'}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (cat) => (
        <span className="inline-block text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {cat}
        </span>
      ),
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
      title: 'Occurrence Date',
      dataIndex: 'incidentDate',
      render: (date, row) => {
        const targetDate = date || row.createdAt;
        return (
          <span className="text-xs text-slate-600 font-medium">
            {new Date(targetDate).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render: (id) => (
        <Link to={`/traveler/incidents/${id}`}>
          <Button variant="outline" size="sm" icon={Eye}>
            Track Case
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <PageHeader
        title="My Submitted Incidents"
        subtitle="Live tracking, official incident references, and dispatch history for your travel emergency reports."
        breadcrumbs={['Traveler', 'My Incidents']}
        badge={
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-navy text-white">
            {filteredIncidents.length} Reported {filteredIncidents.length === 1 ? 'Emergency' : 'Emergencies'}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={RefreshCw}
              onClick={fetchMyIncidents}
              title="Refresh incident list"
            >
              Refresh
            </Button>
            <Link to="/traveler/report-emergency">
              <Button variant="emergency" size="md" icon={Plus}>
                Report New Emergency
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar Cluster */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* Top: Search and Category Dropdown */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by incident reference (e.g. INC-...), title, address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal focus:bg-white transition-all"
            />
          </div>

          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.filter(Boolean).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </div>
        </form>

        {/* Bottom: Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1.5 shrink-0">Filter Status:</span>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`
                px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0
                ${
                  statusFilter === st
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {st || 'All Cases'}
            </button>
          ))}
        </div>
      </div>

      {/* STATE 1: LOADING STATE */}
      {loading && (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" text="Retrieving your emergency incidents..." />
        </div>
      )}

      {/* STATE 2: ERROR STATE */}
      {!loading && error && (
        <ErrorState
          title="Could not load incidents"
          message={error}
          onRetry={fetchMyIncidents}
        />
      )}

      {/* STATE 3: EMPTY STATE */}
      {!loading && !error && filteredIncidents.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-12">
          <EmptyState
            icon={AlertOctagon}
            title={
              statusFilter || categoryFilter || searchQuery
                ? 'No matching incidents found'
                : 'No emergency incidents reported'
            }
            description={
              statusFilter || categoryFilter || searchQuery
                ? 'Try adjusting your search query or removing active status filters.'
                : 'You have not reported any incidents yet. The Safe Passage network is active 24/7 if you ever require urgent assistance.'
            }
            actionLabel="Report New Emergency"
            onAction={() => navigate('/traveler/report-emergency')}
          />
        </div>
      )}

      {/* STATE 4: SUCCESS STATE (Desktop Table & Mobile Cards) */}
      {!loading && !error && filteredIncidents.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table
              columns={columns}
              data={filteredIncidents}
              emptyMessage="No incidents match your filter criteria."
            />
          </div>

          {/* Mobile Card Grid View */}
          <div className="md:hidden space-y-4">
            {filteredIncidents.map((incident) => {
              const ref =
                incident.incidentReference ||
                incident.referenceNumber ||
                `INC-${incident._id.slice(-6).toUpperCase()}`;

              return (
                <div
                  key={incident._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-card space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-brand-teal bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                      {ref}
                    </span>
                    <StatusBadge status={incident.status} size="sm" />
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-brand-navy mb-1">
                      {incident.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {incident.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {incident.category}
                    </span>
                    <StatusBadge status={incident.severity} type="severity" size="sm" />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-emergency-red shrink-0" />
                    <span className="truncate">{incident.location?.address || 'Pinned on map'}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(incident.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <Link to={`/traveler/incidents/${incident._id}`}>
                      <Button variant="primary" size="sm" icon={Eye} iconPosition="right">
                        Track Case
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
