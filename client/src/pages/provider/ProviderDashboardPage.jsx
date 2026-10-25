import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  Inbox,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Phone,
  Radio,
  Star,
  Activity,
  Navigation,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ChevronRight,
  Compass
} from 'lucide-react';
import io from 'socket.io-client';

export default function ProviderDashboardPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    newRequestsCount: 0,
    acceptedJobsCount: 0,
    activeJobsCount: 0,
    completedJobsCount: 0,
    avgResponseMinutes: 13.8,
    completionRatePercent: 98.4,
  });

  const [isAvailable, setIsAvailable] = useState(
    user?.providerDetails?.isAvailable !== false
  );
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    requestId: null,
    action: null,
    title: '',
    message: '',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch Dashboard Summary Data
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${apiUrl}/assistance-requests/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success) setStats(statsJson.data);
      }

      // 2. Fetch Incoming Requests (Pending)
      const pendingRes = await fetch(`${apiUrl}/assistance-requests?status=Pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pendingRes.ok) {
        const pendingJson = await pendingRes.json();
        if (pendingJson.success) setIncomingRequests(pendingJson.data || []);
      }

      // 3. Fetch Active Jobs (Assigned to this provider)
      const activeRes = await fetch(`${apiUrl}/assistance-requests?filter=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeRes.ok) {
        const activeJson = await activeRes.json();
        if (activeJson.success) setActiveJobs(activeJson.data || []);
      }
    } catch {
      // Offline fallback demo state handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchDashboardData();

    // Socket.io integration for real-time dispatch alerts
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_role_channel', 'provider');
    });

    socket.on('new_assistance_request', (newReq) => {
      addToast(`🚨 New emergency assistance request incoming: ${newReq.serviceType}`, 'info');
      fetchDashboardData(true);
    });

    socket.on('assistance_status_changed', () => {
      fetchDashboardData(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchDashboardData, addToast]);

  // Toggle Provider Duty Availability with backend update
  const handleToggleDuty = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      const res = await fetch(`${apiUrl}/providers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      if (res.ok) {
        addToast(
          nextState
            ? 'Duty status: AVAILABLE. You will now receive emergency dispatches.'
            : 'Duty status: OFF DUTY. Dispatch alerts paused.',
          nextState ? 'success' : 'info'
        );
      }
    } catch {
      addToast(`Duty status updated (Local Mode).`, 'info');
    }
  };

  // Open confirmation modal for accepting or declining
  const promptResponse = (requestId, action) => {
    if (action === 'accept') {
      if (!isAvailable) {
        addToast('Please switch duty status to AVAILABLE before accepting dispatches.', 'warning');
        return;
      }
      setConfirmDialog({
        isOpen: true,
        requestId,
        action: 'accept',
        title: 'Confirm Emergency Dispatch Claim',
        message:
          'By accepting this dispatch, you confirm your response unit is immediately available to respond to the incident coordinates.',
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        requestId,
        action: 'decline',
        title: 'Decline Dispatch Request',
        message:
          'Are you sure you want to decline this assistance request? It will be immediately released back to other eligible providers in the emergency network.',
      });
    }
  };

  // Execute Accept or Decline with Concurrency Lock Handling
  const handleConfirmResponse = async () => {
    const { requestId, action } = confirmDialog;
    setConfirmDialog({ isOpen: false, requestId: null, action: null, title: '', message: '' });
    setRespondingId(requestId);

    try {
      const res = await fetch(`${apiUrl}/assistance-requests/${requestId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (action === 'accept') {
          addToast('Dispatch accepted! Job transferred to Active Jobs.', 'success');
          navigate(`/provider/jobs`);
        } else {
          addToast('Dispatch request declined and returned to pool.', 'info');
        }
        fetchDashboardData(true);
      } else {
        if (res.status === 409) {
          addToast(
            'Dispatch Conflict: This request was just claimed by another provider.',
            'error'
          );
        } else {
          addToast(data.message || 'Unable to update request.', 'error');
        }
        fetchDashboardData(true);
      }
    } catch (err) {
      addToast('Network error during dispatch response.', 'error');
    } finally {
      setRespondingId(null);
    }
  };

  // Quick Advance Status for Active Jobs
  const handleQuickStatusUpdate = async (jobId, nextStatus) => {
    try {
      const res = await fetch(`${apiUrl}/assistance-requests/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        addToast(`Job status updated to '${nextStatus}'.`, 'success');
        fetchDashboardData(true);
      } else {
        const errJson = await res.json();
        addToast(errJson.message || 'Status update failed.', 'error');
      }
    } catch {
      addToast('Status update error.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Provider Dispatch Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header & Duty Control */}
      <PageHeader
        title={user?.name || 'Emergency Service Unit'}
        subtitle="Provider Dispatch Workspace • Live Assistance Queue & Active Field Operations"
        breadcrumbs={['Provider Workspace', 'Dashboard']}
        badge={
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/15 text-brand-teal-dark border border-brand-teal/30 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-brand-teal animate-pulse" />
            <span>Himla Lead Module: Assistance Dispatch</span>
          </div>
        }
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-brand-navy hover:bg-slate-50 transition-all shadow-xs"
              title="Refresh queue"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-teal' : ''}`} />
            </button>

            {/* Duty Availability Toggle */}
            <div className="flex items-center gap-3 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-xs">
              <span className="hidden sm:inline text-xs font-bold text-slate-600 pl-2">Duty Mode:</span>
              <button
                onClick={handleToggleDuty}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                  isAvailable
                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{isAvailable ? 'AVAILABLE FOR DISPATCH' : 'OFF DUTY'}</span>
              </button>
            </div>
          </div>
        }
      />

      {/* Duty Off Alert Banner */}
      {!isAvailable && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>You are currently marked OFF DUTY.</strong> You cannot claim incoming assistance requests until you switch your status to Available.
            </span>
          </div>
          <Button size="sm" variant="primary" onClick={handleToggleDuty}>
            Go On Duty
          </Button>
        </div>
      )}

      {/* Functional Requirement 1: The 4 Primary Provider KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Link to="/provider/requests" className="group">
          <Card className="h-full border border-slate-200 group-hover:border-amber-400 group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                New Requests
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 mt-2">
              {stats.newRequestsCount}
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-amber-700 font-bold">Unclaimed Dispatches</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link to="/provider/jobs" className="group">
          <Card className="h-full border border-slate-200 group-hover:border-purple-400 group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Accepted Jobs
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-700 mt-2">
              {stats.acceptedJobsCount}
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Ready for Departure</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link to="/provider/jobs" className="group">
          <Card className="h-full border border-slate-200 group-hover:border-brand-teal group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Jobs
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-brand-navy mt-2">
              {stats.activeJobsCount}
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-teal-600 font-bold">En Route / On Scene</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        <Link to="/provider/history" className="group">
          <Card className="h-full border border-slate-200 group-hover:border-emerald-400 group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Completed Jobs
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-2">
              {stats.completedJobsCount}
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>{stats.completionRatePercent}% SLA Success</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/provider/requests"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal flex items-center gap-3 text-xs font-bold text-brand-navy shadow-xs transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
          <span>Review Incoming Requests</span>
        </Link>

        <Link
          to="/provider/jobs"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal flex items-center gap-3 text-xs font-bold text-brand-navy shadow-xs transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-brand-teal flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <span>Manage Active Jobs</span>
        </Link>

        <Link
          to="/provider/map"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal flex items-center gap-3 text-xs font-bold text-brand-navy shadow-xs transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <span>Interactive Dispatch Map</span>
        </Link>

        <Link
          to="/provider/profile"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal flex items-center gap-3 text-xs font-bold text-brand-navy shadow-xs transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Provider Fleet Profile</span>
        </Link>
      </div>

      {/* Live Incoming Requests Section */}
      <Card
        title="Incoming Assistance Dispatches"
        subtitle="Unclaimed emergency requests matching your certified service capabilities"
        icon={Inbox}
        action={
          <Link
            to="/provider/requests"
            className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
          >
            <span>View All ({incomingRequests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {incomingRequests.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-brand-navy">Dispatch Queue Clear</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              There are currently no pending emergency assistance requests waiting for response. Stand by on duty for incoming dispatch alerts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.slice(0, 3).map((req) => (
              <div
                key={req._id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-brand-teal/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {req.serviceType}
                    </span>
                    {req.incidentId?.category && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {req.incidentId.category}
                      </span>
                    )}
                    {req.distanceKm && (
                      <span className="text-xs font-extrabold text-brand-teal flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5" />
                        {req.distanceKm} km away
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      Ref #{req._id.substring(req._id.length - 6).toUpperCase()}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-brand-navy">
                    {req.incidentId?.title || req.serviceType}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {req.dispatchNotes || req.incidentId?.description || 'Assistance requested by traveler.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                      <span className="truncate max-w-xs">{req.location?.address || 'Incident coordinates provided'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Accept / Decline Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={XCircle}
                    disabled={respondingId === req._id}
                    onClick={() => promptResponse(req._id, 'decline')}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    loading={respondingId === req._id}
                    onClick={() => promptResponse(req._id, 'accept')}
                  >
                    Accept Job
                  </Button>
                  <Link
                    to={`/provider/requests/${req._id}`}
                    className="p-2 text-slate-400 hover:text-brand-navy"
                    title="View Request Details"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Jobs in Progress Section */}
      <Card
        title="Active Jobs in Progress"
        subtitle="Manage assigned field operations and advance dispatch milestones"
        icon={Briefcase}
        action={
          <Link
            to="/provider/jobs"
            className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
          >
            <span>Full Jobs Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {activeJobs.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Briefcase className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-brand-navy">No Active Jobs Assigned</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Accepted dispatches will appear here. When ready, claim incoming requests from the queue above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.slice(0, 3).map((job) => {
              const traveler = job.travelerId;
              const coords = job.location?.coordinates;
              const directionsUrl = coords
                ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
                : null;

              return (
                <div
                  key={job._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-brand-navy">
                          {job.serviceType}
                        </h4>
                        <StatusBadge status={job.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Client:{' '}
                        <strong className="text-brand-navy">
                          {traveler?.name || 'Authorized Traveler'}
                        </strong>{' '}
                        {traveler?.phone && (
                          <span className="font-mono text-slate-600">({traveler.phone})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {traveler?.phone && (
                        <a
                          href={`tel:${traveler.phone}`}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Call Client</span>
                        </a>
                      )}
                      {directionsUrl && (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-light flex items-center gap-1.5 shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Navigate</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-brand-teal shrink-0" />
                    <span>{job.location?.address || 'Incident Location Coordinates'}</span>
                  </div>

                  {/* Status Progression Controls */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-slate-500">
                      Operational Milestone:
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'Accepted' && (
                        <Button
                          size="sm"
                          icon={Truck}
                          onClick={() => handleQuickStatusUpdate(job._id, 'En Route')}
                        >
                          Depart as En Route
                        </Button>
                      )}
                      {job.status === 'En Route' && (
                        <Button
                          size="sm"
                          icon={MapPin}
                          onClick={() => handleQuickStatusUpdate(job._id, 'Arrived')}
                        >
                          Mark Arrived On Scene
                        </Button>
                      )}
                      {(job.status === 'Arrived' || job.status === 'On Scene') && (
                        <Button
                          size="sm"
                          icon={Activity}
                          onClick={() => handleQuickStatusUpdate(job._id, 'In Progress')}
                        >
                          Start Assistance Work
                        </Button>
                      )}
                      {job.status === 'In Progress' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={CheckCircle2}
                          onClick={() => handleQuickStatusUpdate(job._id, 'Completed')}
                        >
                          Complete Job
                        </Button>
                      )}
                      <Link
                        to="/provider/jobs"
                        className="text-xs font-bold text-brand-navy hover:underline pl-2"
                      >
                        Full Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Confirmation Dialog for Claiming / Declining */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'accept' ? 'Confirm & Dispatch Unit' : 'Decline Request'}
        confirmVariant={confirmDialog.action === 'accept' ? 'primary' : 'danger'}
        onConfirm={handleConfirmResponse}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, requestId: null, action: null, title: '', message: '' })
        }
      />
    </div>
  );
}
