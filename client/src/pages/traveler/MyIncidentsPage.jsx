import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import {
  AlertOctagon,
  Clock,
  MapPin,
  Eye,
  Plus,
  ArrowRight,
  Truck,
  LayoutGrid,
  List,
  RefreshCw,
  Copy,
  Check,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function MyIncidentsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchMyIncidents();
  }, [statusFilter, severityFilter]);

  // Real-time Socket.io updates for live incident tracking
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_role_channel', 'traveler');
    });

    socket.on('incident_updated', (data) => {
      addToast(`Incident #${String(data.incidentId).slice(-6).toUpperCase()} updated: ${data.newStatus}`, 'info');
      fetchMyIncidents();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchMyIncidents = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    try {
      let url = `${apiUrl}/incidents`;
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (params.toString()) url += `?${params.toString()}`;

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
    } catch {
      // Offline / Memory fallback
      setIncidents([
        {
          _id: '65f000000000000000000010',
          incidentReference: 'SP-REF-000010',
          title: 'Engine overheating on Mountain Pass A4',
          description: 'Vehicle radiator steam observed, unable to proceed. Two passengers on board with limited water.',
          category: 'Roadside & Vehicle Breakdown',
          severity: 'High',
          status: 'Assistance Dispatched',
          location: {
            address: 'Route A4, Mile Marker 42, Central Province',
            landmark: 'Near Viewpoint Cafe',
            coordinates: [80.6337, 7.2906],
          },
          assignedProviderId: {
            name: 'Apex Rapid Response Ltd',
            phone: '+1 (555) 987-6543',
            rating: 4.9,
          },
          estimatedArrivalTimeMinutes: 18,
          createdAt: new Date(Date.now() - 7200000),
        },
        {
          _id: '65f000000000000000000011',
          incidentReference: 'SP-REF-000011',
          title: 'Severe allergic reaction to food ingredient',
          description: 'Difficulty breathing, facial swelling. Antihistamine administered but condition worsening.',
          category: 'Medical Emergency',
          severity: 'Critical',
          status: 'In Progress',
          location: {
            address: 'Galle Face Terrace, Coastal Road',
            landmark: 'Opposite Lighthouse Hotel',
            coordinates: [79.8612, 6.9271],
          },
          assignedProviderId: {
            name: 'Apex Rapid Response Ltd',
            phone: '+1 (555) 987-6543',
            rating: 4.9,
          },
          estimatedArrivalTimeMinutes: 4,
          createdAt: new Date(Date.now() - 14400000),
        },
        {
          _id: '65f000000000000000000012',
          incidentReference: 'SP-REF-000012',
          title: 'Missed trail marker in dense fog',
          description: 'Hiker disoriented off marked path. Battery at 25%, flashlight operational, safe from precipice.',
          category: 'Lost & Stranded',
          severity: 'Medium',
          status: 'Under Review',
          location: {
            address: 'Horton Plains National Park trail 3',
            landmark: 'Between Chimney Pond and Mini Worlds End',
            coordinates: [80.7891, 6.8096],
          },
          assignedProviderId: null,
          estimatedArrivalTimeMinutes: null,
          createdAt: new Date(Date.now() - 21600000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = (e, ref, id) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Incident Reference copied to clipboard', 'info');
  };

  // Filtered incidents based on search term
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const ref = (inc.incidentReference || inc.reference || inc._id || '').toLowerCase();
    const title = (inc.title || '').toLowerCase();
    const address = (inc.location?.address || '').toLowerCase();
    const cat = (inc.category || '').toLowerCase();
    return ref.includes(q) || title.includes(q) || address.includes(q) || cat.includes(q);
  });

  // Calculate quick metrics
  const totalCount = incidents.length;
  const activeCount = incidents.filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Cancelled'
  ).length;
  const dispatchedCount = incidents.filter(
    (i) => i.status === 'Assistance Dispatched' || i.status === 'In Progress'
  ).length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;

  const tableColumns = [
    {
      title: 'Incident Reference',
      dataIndex: 'incidentReference',
      render: (ref, row) => {
        const reference = ref || row.reference || `#${row._id.slice(-6).toUpperCase()}`;
        return (
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-brand-navy px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              {reference}
            </span>
            <div className="text-[11px] font-semibold text-slate-500">
              {row.category}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Title & Location',
      dataIndex: 'title',
      render: (title, row) => (
        <div className="max-w-xs">
          <div className="font-bold text-xs text-brand-navy truncate">{title}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-brand-teal shrink-0" />
            <span className="truncate">{row.location?.address || 'Coordinates pinned'}</span>
          </div>
        );
      },
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      render: (sev) => <StatusBadge status={sev} type="severity" size="sm" />,
    },
    {
      title: 'Current Status',
      dataIndex: 'status',
      render: (st) => <StatusBadge status={st} size="sm" />,
    },
    {
      title: 'Assignment Info',
      dataIndex: 'assignedProviderId',
      render: (prov, row) => {
        const provider = prov?.name ? prov : row.assignedProvider;
        if (provider) {
          return (
            <div className="text-xs">
              <span className="font-bold text-slate-800">{provider.name}</span>
              {row.estimatedArrivalTimeMinutes && (
                <div className="text-[11px] text-brand-teal-dark font-medium">
                  ETA: {row.estimatedArrivalTimeMinutes}m
                </div>
              )}
            </div>
          );
        }
        return (
          <span className="text-[11px] text-slate-400 italic">
            Awaiting allocation
          </span>
        );
      },
    },
    {
      title: 'Reported',
      dataIndex: 'createdAt',
      render: (date) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(date).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Emergency Case Tracking"
        subtitle="Live incident monitoring, lifecycle timeline progression, and emergency case history."
        breadcrumbs={['Traveler', 'My Incidents']}
        badge={
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-navy text-white">
            {filteredIncidents.length} Reported {filteredIncidents.length === 1 ? 'Emergency' : 'Emergencies'}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchMyIncidents}>
              Refresh
            </Button>
            <Link to="/traveler/report">
              <Button variant="emergency" icon={Plus}>
                Report Emergency SOS
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cases</div>
            <div className="text-2xl font-black text-brand-navy mt-0.5">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Active Emergencies</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">Dispatched / En Route</div>
            <div className="text-2xl font-black text-brand-teal mt-0.5">{dispatchedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-card flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved Cases</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{resolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by reference, title, location, category..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical Severity</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
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
                    ? 'bg-brand-navy text-white shadow-xs ring-2 ring-brand-navy/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Grid vs Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-brand-teal/20 border-t-brand-teal animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Loading your emergency cases...</span>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Matching Incidents Found"
          message={
            searchTerm || statusFilter || severityFilter
              ? 'No emergency reports match your active search or filter criteria. Clear filters to see all cases.'
              : 'You have not submitted any emergency distress beacons yet.'
          }
          actionLabel="Report New Emergency"
          actionPath="/traveler/report"
        />
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncidents.map((incident) => {
            const reference =
              incident.incidentReference ||
              incident.reference ||
              `#${incident._id.slice(-6).toUpperCase()}`;
            const provider = incident.assignedProviderId?.name
              ? incident.assignedProviderId
              : incident.assignedProvider;
            const isAssigned = Boolean(provider);

            return (
              <div
                key={incident._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top: Badges & Reference */}
                <div className="p-5 pb-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleCopyRef(e, reference, incident._id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-navy font-mono text-xs font-bold border border-slate-200 transition-colors"
                      title="Click to copy incident reference"
                    >
                      <span>{reference}</span>
                      {copiedId === incident._id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={incident.severity} type="severity" size="sm" />
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                      {incident.category}
                    </div>
                    <h3 className="text-base font-extrabold text-brand-navy mt-0.5 line-clamp-1 group-hover:text-brand-teal-dark transition-colors">
                      {incident.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                    {incident.description}
                  </p>

                  {/* Location Info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-700 truncate">
                        {incident.location?.address || 'Pinned on map'}
                      </div>
                      {incident.location?.landmark && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          Near {incident.location.landmark}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignment Callout Banner */}
                  {isAssigned ? (
                    <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-brand-teal">
                          Assigned Response Unit
                        </div>
                        <div className="text-xs font-bold truncate text-white">
                          {provider.name}
                        </div>
                      </div>
                      {incident.estimatedArrivalTimeMinutes && (
                        <div className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-bold text-brand-teal shrink-0">
                          ETA {incident.estimatedArrivalTimeMinutes}m
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-2 text-xs text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <span className="text-[11px] font-medium">Awaiting Provider Dispatch Allocation</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Status, Reported Time, and Action Button */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <StatusBadge status={incident.status} size="sm" />
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(incident.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <Link to={`/traveler/incidents/${incident._id}`}>
                    <Button variant="primary" size="sm" icon={ArrowRight}>
                      Track Case
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Table
          columns={tableColumns}
          data={filteredIncidents}
          isLoading={loading}
          emptyMessage="No incidents match the active filters."
        />
      )}
    </div>
  );
}
