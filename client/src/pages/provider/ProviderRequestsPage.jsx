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
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Eye,
  Shield,
  Phone,
  ShieldAlert
} from 'lucide-react';

export default function ProviderRequestsPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [respondingId, setRespondingId] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    requestId: null,
    action: null,
    title: '',
    message: '',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const isAvailable = user?.providerDetails?.isAvailable !== false;

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${apiUrl}/assistance-requests?status=Pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setRequests(json.data || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const promptResponse = (requestId, action) => {
    if (action === 'accept') {
      if (!isAvailable) {
        addToast('You are currently OFF DUTY. Switch duty status to Available before accepting dispatches.', 'warning');
        return;
      }
      setConfirmDialog({
        isOpen: true,
        requestId,
        action: 'accept',
        title: 'Accept Emergency Dispatch Assignment',
        message:
          'Are you ready to dispatch your response unit to this incident? Traveler contact details and navigation routes will unlock immediately.',
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        requestId,
        action: 'decline',
        title: 'Decline Assistance Request',
        message:
          'Decline this request and release it back to the regional dispatch pool for other available units?',
      });
    }
  };

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
          addToast('Dispatch accepted! Job moved to Active Jobs.', 'success');
          navigate('/provider/jobs');
        } else {
          addToast('Dispatch request declined.', 'info');
          fetchRequests(true);
        }
      } else {
        if (res.status === 409) {
          addToast('Dispatch Conflict: This request was just claimed by another provider unit.', 'error');
        } else {
          addToast(data.message || 'Unable to update request.', 'error');
        }
        fetchRequests(true);
      }
    } catch {
      addToast('Network error during dispatch response.', 'error');
    } finally {
      setRespondingId(null);
    }
  };

  // Filter requests by search & category
  const filteredRequests = requests.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      r.serviceType?.toLowerCase().includes(s) ||
      r._id?.toLowerCase().includes(s) ||
      r.location?.address?.toLowerCase().includes(s) ||
      r.incidentId?.title?.toLowerCase().includes(s);

    const matchCategory =
      categoryFilter === 'All' ||
      r.incidentId?.category === categoryFilter ||
      r.serviceType?.includes(categoryFilter);

    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Checking Incoming Dispatch Requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Incoming Assistance Requests"
        subtitle="Eligible emergency dispatches requiring certified service provider assistance."
        breadcrumbs={['Provider', 'Incoming Requests']}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            loading={refreshing}
            onClick={() => fetchRequests(false)}
          >
            Refresh Pool
          </Button>
        }
      />

      {/* Duty Warning if Off-duty */}
      {!isAvailable && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Duty Mode is OFF.</strong> You must set your duty status to AVAILABLE on your dashboard before you can accept any dispatch.
            </span>
          </div>
          <Link to="/provider/dashboard">
            <Button size="sm" variant="primary">
              Open Dashboard
            </Button>
          </Link>
        </div>
      )}

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-brand-navy/5 border border-slate-200/90 flex items-center gap-3 text-xs text-slate-600">
        <Shield className="w-5 h-5 text-brand-teal shrink-0" />
        <span>
          <strong>Safe Passage Privacy Shield Active:</strong> Traveler personal contact details are protected under protocol and will automatically unlock upon successful dispatch acceptance.
        </span>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference ID, service type, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-brand-teal"
          >
            <option value="All">All Categories</option>
            <option value="Roadside & Vehicle Breakdown">Roadside Breakdown</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Lost & Stranded">Search & Rescue</option>
            <option value="Fire Emergency">Fire & Hazard</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-brand-navy">No Eligible Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              There are no pending requests matching your current filter criteria. New incoming dispatches will automatically broadcast here.
            </p>
          </Card>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:border-brand-teal/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {req.serviceType}
                  </span>
                  {req.incidentId?.category && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {req.incidentId.category}
                    </span>
                  )}
                  {req.distanceKm && (
                    <span className="text-xs font-extrabold text-brand-teal flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      {req.distanceKm} km from base
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    Ref #{req._id.substring(req._id.length - 8).toUpperCase()}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-brand-navy">
                  {req.incidentId?.title || req.serviceType}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {req.dispatchNotes || req.incidentId?.description || 'Assistance requested by traveler in distress.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                    <span>{req.location?.address || 'GPS Coordinates Provided'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Requested: {new Date(req.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                <Link to={`/provider/requests/${req._id}`}>
                  <Button variant="outline" size="sm" icon={Eye}>
                    Inspect
                  </Button>
                </Link>
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
                  Accept & Dispatch
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'accept' ? 'Claim Dispatch' : 'Decline'}
        confirmVariant={confirmDialog.action === 'accept' ? 'primary' : 'danger'}
        onConfirm={handleConfirmResponse}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, requestId: null, action: null, title: '', message: '' })
        }
      />
    </div>
  );
}
