import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SafePassageMap from '../../components/maps/MapContainer';
import {
  Inbox,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Phone,
  Mail,
  User,
  ShieldAlert,
  Navigation,
  FileText
} from 'lucide-react';

export default function ProviderRequestDetailsPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [responding, setResponding] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null,
    title: '',
    message: '',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const isAvailable = user?.providerDetails?.isAvailable !== false;

  const fetchRequestDetails = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/assistance-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setRequest(json.data);
      } else if (res.status === 404) {
        addToast('Assistance request not found.', 'error');
        navigate('/provider/requests');
      } else if (res.status === 403) {
        addToast('Access denied: Job is assigned to another provider.', 'error');
        navigate('/provider/requests');
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }, [apiUrl, id, token, addToast, navigate]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  const promptResponse = (action) => {
    if (action === 'accept') {
      if (!isAvailable) {
        addToast('You are currently OFF DUTY. Please switch to Available before accepting dispatches.', 'warning');
        return;
      }
      setConfirmDialog({
        isOpen: true,
        action: 'accept',
        title: 'Confirm Dispatch Assignment',
        message:
          'Accepting this dispatch assignment will immediately notify the traveler, unlock full contact info, and transition the incident into Assistance Dispatched status.',
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        action: 'decline',
        title: 'Decline Dispatch Request',
        message: 'Are you sure you want to decline this request and return it to the regional emergency pool?',
      });
    }
  };

  const handleConfirmResponse = async () => {
    const { action } = confirmDialog;
    setConfirmDialog({ isOpen: false, action: null, title: '', message: '' });
    setResponding(true);

    try {
      const res = await fetch(`${apiUrl}/assistance-requests/${id}/respond`, {
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
          navigate('/provider/requests');
        }
      } else {
        if (res.status === 409) {
          addToast('Dispatch Conflict: Another provider just accepted this request.', 'error');
          navigate('/provider/requests');
        } else {
          addToast(data.message || 'Unable to update request.', 'error');
        }
      }
    } catch {
      addToast('Network error during dispatch response.', 'error');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Request Details...</p>
      </div>
    );
  }

  if (!request) return null;

  // Extract coordinates for Map
  const coordinates = request.location?.coordinates || [79.8612, 6.9271];
  const centerLat = coordinates[1] || 6.9271;
  const centerLng = coordinates[0] || 79.8612;

  const isAssignedToMe =
    request.providerId &&
    String(request.providerId._id || request.providerId) === String(user?.id || user?._id);

  const isPending = request.status === 'Pending';

  const mapMarkers = [
    {
      _id: request._id,
      title: request.incidentId?.title || request.serviceType,
      type: request.serviceType.includes('Medical') ? 'Hospital & Medical' : 'Roadside & Towing',
      lat: centerLat,
      lng: centerLng,
      address: request.location?.address,
      distanceKm: request.distanceKm,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link
          to="/provider/requests"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-brand-navy hover:bg-slate-50 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={`Dispatch Request #${request._id.substring(request._id.length - 8).toUpperCase()}`}
          subtitle="Assistance request technical appraisal and field coordinates assessment."
          breadcrumbs={['Provider', 'Requests', request._id.substring(request._id.length - 8).toUpperCase()]}
        />
      </div>

      {/* Grid: Details on Left, Map & Eligibility on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={request.incidentId?.title || request.serviceType}
            subtitle="Incident Overview & Required Emergency Services"
            icon={Inbox}
            action={<StatusBadge status={request.status} />}
          >
            <div className="space-y-6">
              {/* Service & Category tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {request.serviceType}
                </span>
                {request.incidentId?.category && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    Category: {request.incidentId.category}
                  </span>
                )}
                {request.incidentId?.severity && (
                  <StatusBadge status={request.incidentId.severity} type="severity" size="sm" />
                )}
                {request.distanceKm && (
                  <span className="text-xs font-extrabold text-brand-teal flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    {request.distanceKm} km from current provider base
                  </span>
                )}
              </div>

              {/* Dispatch Notes / Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-brand-teal" />
                  <span>Incident Description & Dispatch Notes</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {request.dispatchNotes ||
                    request.incidentId?.description ||
                    'Traveler in need of immediate emergency assistance at designated coordinates.'}
                </p>
              </div>

              {/* Exact Location Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Incident Destination
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-brand-navy">
                  <MapPin className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{request.location?.address || 'Designated Coordinates'}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      GPS: [{centerLat.toFixed(5)}, {centerLng.toFixed(5)}]
                    </div>
                  </div>
                </div>
              </div>

              {/* Traveler Privacy vs Contact Info Box */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Traveler Contact Information
                </div>

                {isPending && !isAssignedToMe ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Shield className="w-4 h-4 text-amber-700" />
                      <span>Traveler Identity Shielded</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      To protect traveler safety and prevent unauthorized contact, the traveler's full phone number and personal identity are masked until your unit formally accepts and confirms this dispatch assignment.
                    </p>
                    <div className="text-xs font-mono text-slate-500">
                      Client ID: {request.travelerId?._id?.substring(0, 8)} • Phone: +***-***-****
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Traveler Identity Unlocked
                      </span>
                      {request.travelerId?.phone && (
                        <a
                          href={`tel:${request.travelerId.phone}`}
                          className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Direct</span>
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Name:</span>{' '}
                        <strong className="text-brand-navy">{request.travelerId?.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span>{' '}
                        <strong className="text-brand-navy font-mono">{request.travelerId?.phone}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Email:</span>{' '}
                        <span className="text-slate-700">{request.travelerId?.email}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Timestamp: {new Date(request.createdAt).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      disabled={responding}
                      onClick={() => promptResponse('decline')}
                    >
                      Decline Request
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      loading={responding}
                      onClick={() => promptResponse('accept')}
                    >
                      Accept & Dispatch Unit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Interactive Map & Eligibility Checks */}
        <div className="space-y-6">
          {/* Map Preview */}
          <Card title="Incident Location Map" subtitle="Coordinates view with OpenStreetMap" icon={MapPin}>
            <SafePassageMap
              center={[centerLat, centerLng]}
              zoom={14}
              markers={mapMarkers}
              height="280px"
            />
            <div className="mt-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${centerLat},${centerLng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-light transition-all shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-brand-teal" />
                <span>Open in Google Maps Navigation</span>
              </a>
            </div>
          </Card>

          {/* Eligibility Validation Card */}
          <Card title="Provider Eligibility Checks" subtitle="Server-side dispatch protocol" icon={Shield}>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Account Authorization</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certified Provider
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Duty Availability</span>
                {isAvailable ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> On Duty & Active
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Marked Off Duty
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Concurrency Lock</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Single Claim Enforced
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600">Incident Lifecycle Sync</span>
                <span className="text-brand-teal font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Member 3 Coordinated
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'accept' ? 'Claim Dispatch' : 'Decline'}
        confirmVariant={confirmDialog.action === 'accept' ? 'primary' : 'danger'}
        onConfirm={handleConfirmResponse}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null, title: '', message: '' })}
      />
    </div>
  );
}
