import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  History,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  RotateCw,
  Eye,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';

export default function ProviderHistoryPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${apiUrl}/assistance-requests?filter=history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setHistoryJobs(json.data || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Multi-parameter filter
  const filteredJobs = historyJobs.filter((job) => {
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      job.serviceType?.toLowerCase().includes(s) ||
      job._id?.toLowerCase().includes(s) ||
      job.location?.address?.toLowerCase().includes(s) ||
      job.travelerId?.name?.toLowerCase().includes(s) ||
      job.dispatchNotes?.toLowerCase().includes(s);

    const matchStatus =
      statusFilter === 'all' || job.status === statusFilter;

    // Time filter
    let matchTime = true;
    if (timeFilter !== 'all') {
      const jobDate = new Date(job.completedAt || job.createdAt).getTime();
      const now = Date.now();
      if (timeFilter === 'today') {
        matchTime = now - jobDate <= 86400000;
      } else if (timeFilter === 'week') {
        matchTime = now - jobDate <= 86400000 * 7;
      } else if (timeFilter === 'month') {
        matchTime = now - jobDate <= 86400000 * 30;
      }
    }

    return matchSearch && matchStatus && matchTime;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filteredJobs.length === 0) {
      addToast('No historical records to export.', 'info');
      return;
    }

    const headers = ['Reference ID', 'Service Type', 'Client Name', 'Address', 'Status', 'Date', 'Notes'];
    const rows = filteredJobs.map((j) => [
      j._id,
      `"${j.serviceType || ''}"`,
      `"${j.travelerId?.name || 'Traveler'}"`,
      `"${j.location?.address || ''}"`,
      j.status,
      new Date(j.completedAt || j.createdAt).toISOString(),
      `"${j.dispatchNotes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafePassage_JobHistory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Historical dispatch records exported to CSV.', 'success');
  };

  const columns = [
    {
      title: 'Dispatch Details',
      dataIndex: 'serviceType',
      render: (serviceType, row) => (
        <div className="space-y-0.5">
          <div className="font-bold text-brand-navy">{serviceType}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            Ref #{row._id.substring(row._id.length - 8).toUpperCase()}
          </div>
        </div>
      ),
    },
    {
      title: 'Traveler Client',
      dataIndex: 'travelerId',
      render: (traveler) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-700">{traveler?.name || 'Traveler Client'}</div>
          {traveler?.phone && <div className="text-slate-400 font-mono text-[11px]">{traveler.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      render: (loc) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
          <span className="truncate">{loc?.address || 'Incident coordinates'}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Completion Date',
      dataIndex: 'completedAt',
      render: (completedAt, row) => {
        const date = completedAt || row.createdAt;
        return (
          <div className="text-xs text-slate-500">
            <div>{new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="text-[11px] text-slate-400">
              {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Audit Logs',
      dataIndex: '_id',
      render: (_, row) => (
        <button
          onClick={() => setSelectedJob(row)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-brand-navy hover:bg-slate-50 hover:border-brand-teal flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5 text-brand-teal" />
          <span>Timeline</span>
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Completed Mission Archives...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Dispatch Job History"
        subtitle="Chronological archive of all fulfilled emergency assistance dispatches, case logs, and response metrics."
        breadcrumbs={['Provider', 'Job History']}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              loading={refreshing}
              onClick={() => fetchHistory(false)}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search archive by reference ID, service, client, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-teal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-brand-teal"
          >
            <option value="all">All Statuses ({historyJobs.length})</option>
            <option value="Completed">Completed Only</option>
            <option value="Declined">Declined</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-brand-teal"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      {filteredJobs.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <History className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-brand-navy">No Historical Records Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            There are no completed or archived jobs matching your filter parameters.
          </p>
        </Card>
      ) : (
        <Table columns={columns} data={filteredJobs} />
      )}

      {/* Timeline Modal Drawer */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={`Job Lifecycle Timeline #${selectedJob._id.substring(selectedJob._id.length - 8).toUpperCase()}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-extrabold text-sm text-brand-navy">{selectedJob.serviceType}</div>
                <div className="text-xs text-slate-500">
                  Client: <strong className="text-brand-navy">{selectedJob.travelerId?.name}</strong>
                </div>
              </div>
              <StatusBadge status={selectedJob.status} />
            </div>

            {/* Chronological Event Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Audit Log & Milestones
              </div>

              {selectedJob.timeline && selectedJob.timeline.length > 0 ? (
                <div className="space-y-3 pl-2 border-l-2 border-brand-teal/40 ml-2">
                  {selectedJob.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-4 space-y-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-teal absolute -left-[21px] top-1 border-2 border-white" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-navy">{event.status}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(event.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{event.notes || 'Status recorded in case logs.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50">
                  Created on {new Date(selectedJob.createdAt).toLocaleString()} • Completed on {new Date(selectedJob.completedAt || selectedJob.updatedAt).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedJob(null)}>
                Close Timeline
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
