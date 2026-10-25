import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Briefcase,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Truck,
  Activity,
  Clock,
  RotateCw,
  Search,
  MessageSquare,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

export default function ProviderJobsPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [confirmComplete, setConfirmComplete] = useState({
    isOpen: false,
    jobId: null,
    jobTitle: '',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchJobs = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${apiUrl}/assistance-requests?filter=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setJobs(json.data || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Advance Job Status
  const handleUpdateStatus = async (jobId, targetStatus, customNotes) => {
    setUpdatingId(jobId);
    try {
      const res = await fetch(`${apiUrl}/assistance-requests/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: targetStatus,
          notes: customNotes || `Advanced to ${targetStatus}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Job milestone advanced to '${targetStatus}'. Incident history updated.`, 'success');
        fetchJobs(true);
      } else {
        addToast(data.message || 'Status update failed.', 'error');
      }
    } catch {
      addToast('Network error during status update.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (jobId) => {
    if (!notesInput.trim()) {
      setEditingNotesId(null);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/assistance-requests/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: notesInput }),
      });
      if (res.ok) {
        addToast('Operational dispatch note saved.', 'success');
        setEditingNotesId(null);
        setNotesInput('');
        fetchJobs(true);
      }
    } catch {
      addToast('Error saving dispatch notes.', 'error');
    }
  };

  const promptComplete = (jobId, title) => {
    setConfirmComplete({
      isOpen: true,
      jobId,
      jobTitle: title,
    });
  };

  const handleConfirmComplete = async () => {
    const { jobId } = confirmComplete;
    setConfirmComplete({ isOpen: false, jobId: null, jobTitle: '' });
    await handleUpdateStatus(jobId, 'Completed', 'Job completed and resolved by service provider unit.');
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      job.serviceType?.toLowerCase().includes(s) ||
      job._id?.toLowerCase().includes(s) ||
      job.location?.address?.toLowerCase().includes(s) ||
      job.travelerId?.name?.toLowerCase().includes(s);

    const matchStatus =
      statusFilter === 'all' ||
      job.status === statusFilter ||
      (statusFilter === 'On Scene' && (job.status === 'Arrived' || job.status === 'On Scene'));

    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Active Operations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Active Emergency Jobs"
        subtitle="Coordinate live field operations, advance status milestones, and log dispatch progress."
        breadcrumbs={['Provider', 'Active Jobs']}
        action={
          <div className="flex items-center gap-2">
            <Link to="/provider/map">
              <Button variant="secondary" size="sm" icon={Navigation}>
                Dispatch Map
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              loading={refreshing}
              onClick={() => fetchJobs(false)}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Active ({jobs.length})
          </button>
          <button
            onClick={() => setStatusFilter('Accepted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'Accepted'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Accepted ({jobs.filter((j) => j.status === 'Accepted').length})
          </button>
          <button
            onClick={() => setStatusFilter('En Route')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'En Route'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            En Route ({jobs.filter((j) => j.status === 'En Route').length})
          </button>
          <button
            onClick={() => setStatusFilter('On Scene')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'On Scene'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Arrived / On Scene ({jobs.filter((j) => ['Arrived', 'On Scene'].includes(j.status)).length})
          </button>
          <button
            onClick={() => setStatusFilter('In Progress')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'In Progress'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({jobs.filter((j) => j.status === 'In Progress').length})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search active jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-teal"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-brand-navy">No Active Jobs Under Current Filter</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You currently have no jobs requiring field status updates. Check incoming requests to claim new emergency dispatches.
            </p>
            <div className="mt-4">
              <Link to="/provider/requests">
                <Button size="sm" variant="primary">
                  View Incoming Requests Queue
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          filteredJobs.map((job) => {
            const traveler = job.travelerId;
            const coords = job.location?.coordinates;
            const directionsUrl = coords
              ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
              : null;

            return (
              <div
                key={job._id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-6"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-brand-navy">
                        {job.serviceType}
                      </h3>
                      <StatusBadge status={job.status} size="sm" />
                      <span className="text-xs font-mono text-slate-400">
                        Ref #{job._id.substring(job._id.length - 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Traveler Client:</span>
                      <strong className="text-brand-navy">{traveler?.name || 'Verified Traveler'}</strong>
                      {traveler?.phone && (
                        <span className="font-mono text-slate-700 font-bold">({traveler.phone})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {traveler?.phone && (
                      <a
                        href={`tel:${traveler.phone}`}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-brand-teal" />
                        <span>Direct Call</span>
                      </a>
                    )}
                    {directionsUrl && (
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-light flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Navigation className="w-3.5 h-3.5 text-brand-teal" />
                        <span>GPS Navigation</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Location and Notes Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-teal" /> Dispatch Coordinates
                    </span>
                    <p className="font-semibold text-brand-navy">
                      {job.location?.address || 'Incident Location Coordinates Provided'}
                    </p>
                    {coords && (
                      <p className="text-[11px] font-mono text-slate-400">
                        Latitude: {coords[1].toFixed(5)}, Longitude: {coords[0].toFixed(5)}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-teal" /> Operational Notes
                    </span>
                    <p className="text-slate-700">
                      {job.dispatchNotes || 'Standard emergency protocol active.'}
                    </p>
                  </div>
                </div>

                {/* Requirement 9 & 11: Milestone Progress Tracker */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Milestone Progress Lifecycle
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {/* Step 1: Accepted */}
                    <div
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        job.acceptedAt
                          ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>1. Accepted</span>
                      </div>
                      <div className="text-[10px] mt-1 text-slate-500">
                        {job.acceptedAt
                          ? new Date(job.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </div>
                    </div>

                    {/* Step 2: En Route */}
                    <div
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        job.enRouteAt || job.status === 'En Route'
                          ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-teal-600" />
                        <span>2. En Route</span>
                      </div>
                      <div className="text-[10px] mt-1 text-slate-500">
                        {job.enRouteAt
                          ? new Date(job.enRouteAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </div>
                    </div>

                    {/* Step 3: Arrived On Scene */}
                    <div
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        job.arrivedAt || ['Arrived', 'On Scene', 'In Progress', 'Completed'].includes(job.status)
                          ? 'bg-cyan-50/70 border-cyan-200 text-cyan-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                        <span>3. On Scene</span>
                      </div>
                      <div className="text-[10px] mt-1 text-slate-500">
                        {job.arrivedAt
                          ? new Date(job.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </div>
                    </div>

                    {/* Step 4: In Progress */}
                    <div
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                        job.inProgressAt || ['In Progress', 'Completed'].includes(job.status)
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        <span>4. In Progress</span>
                      </div>
                      <div className="text-[10px] mt-1 text-slate-500">
                        {job.inProgressAt
                          ? new Date(job.inProgressAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Notes Editor Drawer */}
                {editingNotesId === job._id ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-600">
                      Add Field Log / Dispatch Remark:
                    </label>
                    <textarea
                      rows={2}
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="e.g., Arrived at vehicle location, replacement coolant added..."
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-brand-teal"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNotesId(null);
                          setNotesInput('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => handleSaveNotes(job._id)}>
                        Save Note
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <button
                      onClick={() => {
                        setEditingNotesId(job._id);
                        setNotesInput(job.dispatchNotes || '');
                      }}
                      className="text-brand-teal font-bold hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Append Operational Log</span>
                    </button>
                    <span className="text-slate-400">
                      Last Updated: {new Date(job.updatedAt || job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Milestone Advance Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <div className="text-xs font-bold text-brand-navy">
                    Next Action Required:
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {job.status === 'Accepted' && (
                      <Button
                        size="sm"
                        icon={Truck}
                        loading={updatingId === job._id}
                        onClick={() => handleUpdateStatus(job._id, 'En Route')}
                      >
                        Depart Unit as En Route
                      </Button>
                    )}

                    {job.status === 'En Route' && (
                      <Button
                        size="sm"
                        icon={MapPin}
                        loading={updatingId === job._id}
                        onClick={() => handleUpdateStatus(job._id, 'Arrived')}
                      >
                        Mark Arrived On Scene
                      </Button>
                    )}

                    {(job.status === 'Arrived' || job.status === 'On Scene') && (
                      <Button
                        size="sm"
                        icon={Activity}
                        loading={updatingId === job._id}
                        onClick={() => handleUpdateStatus(job._id, 'In Progress')}
                      >
                        Commence Assistance Work
                      </Button>
                    )}

                    {job.status === 'In Progress' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={CheckCircle2}
                        loading={updatingId === job._id}
                        onClick={() => promptComplete(job._id, job.serviceType)}
                      >
                        Complete & Resolve Job
                      </Button>
                    )}

                    {job.status === 'Completed' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Job Completed & Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmComplete.isOpen}
        title="Confirm Job Completion"
        message={`Are you sure you want to mark '${confirmComplete.jobTitle}' as fully completed? This will transition the traveler's incident to Resolved and archive this assignment in your job history.`}
        confirmText="Confirm Job Completion"
        confirmVariant="secondary"
        onConfirm={handleConfirmComplete}
        onCancel={() => setConfirmComplete({ isOpen: false, jobId: null, jobTitle: '' })}
      />
    </div>
  );
}
