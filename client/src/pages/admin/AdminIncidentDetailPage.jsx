import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SafePassageMap from '../../components/maps/MapContainer';
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Eye
} from 'lucide-react';

const STATUS_OPTIONS = [
  'Submitted',
  'Under Review',
  'Assigned',
  'Assistance Dispatched',
  'In Progress',
  'Resolved',
  'Cancelled',
];

export default function AdminIncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToast } = useToast();

  const [incident, setIncident] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State for Dispatcher Override
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [etaMinutes, setEtaMinutes] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');

  useEffect(() => {
    fetchIncidentAndProviders();
  }, [id]);

  const fetchIncidentAndProviders = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      // 1. Fetch Incident by ID
      const incRes = await fetch(`${apiUrl}/admin/incidents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const incData = await incRes.json();
      if (incRes.ok && incData.success && incData.data) {
        const item = incData.data;
        setIncident(item);
        setSelectedStatus(item.status);
        setSelectedProviderId(
          item.assignedProviderId?._id || item.assignedProviderId || item.assignedProvider?._id || ''
        );
        setEtaMinutes(item.estimatedArrivalTimeMinutes !== null ? String(item.estimatedArrivalTimeMinutes) : '');
        setOperatorNotes(item.notes || '');
      }

      // 2. Fetch Available Providers for Assignment Dropdown
      const provRes = await fetch(`${apiUrl}/admin/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const provData = await provRes.json();
      if (provRes.ok && provData.success) {
        setProviders(provData.data || []);
      }
    } catch (err) {
      console.warn('[Admin Incident Detail] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCase = async (e) => {
    e.preventDefault();
    setSaving(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const payload = {
        status: selectedStatus,
        assignedProviderId: selectedProviderId || null,
        estimatedArrivalTimeMinutes: etaMinutes ? parseInt(etaMinutes, 10) : null,
        notes: operatorNotes,
      };

      const res = await fetch(`${apiUrl}/admin/incidents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast({
          type: 'success',
          title: 'Case Updated',
          message: 'Incident status and provider assignment saved successfully.',
        });
        fetchIncidentAndProviders();
      } else {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.message || 'Could not update incident case.',
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold">Loading Incident Command Room...</span>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-brand-navy">Incident Case Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested emergency incident record may have been archived or removed.
        </p>
        <Link to="/admin/incidents">
          <Button variant="primary">Return to Incident Table</Button>
        </Link>
      </div>
    );
  }

  const traveler = incident.travelerId || incident.traveler || {};
  const currentProvider = incident.assignedProviderId || incident.assignedProvider || null;
  const coordinates = incident.location?.coordinates || [79.8612, 6.9271];
  const caseLogs = incident.caseLogs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div>
        <Link
          to="/admin/incidents"
          className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Incident Management
        </Link>
        <PageHeader
          title={incident.title}
          subtitle={`Case ID #${String(incident._id).slice(-8)} • Emergency Category: ${incident.category}`}
          breadcrumbs={['Admin', 'Incidents', `Case #${String(incident._id).slice(-6)}`]}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={incident.severity} type="severity" size="lg" />
              <StatusBadge status={incident.status} size="lg" />
            </div>
          }
        />
      </div>

      {/* Main Grid: Details & Map on Left, Operations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Incident Details, Map, Traveler Info, Case Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Incident Overview Card */}
          <Card title="Distress Report Summary" icon={AlertTriangle}>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Incident Description
                </div>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {incident.description}
                </p>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Physical Street Address
                  </div>
                  <div className="text-sm font-semibold text-brand-navy mt-1 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                    <span>{incident.location?.address || 'Street address unavailable'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Nearest Landmark / Notes
                  </div>
                  <div className="text-sm font-semibold text-slate-700 mt-1">
                    {incident.location?.landmark || 'None recorded'}
                  </div>
                </div>
              </div>

              {/* Media Attachments */}
              {incident.media && incident.media.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Attached Photographs / Media ({incident.media.length})
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {incident.media.map((m, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 w-36 h-28 bg-slate-100"
                      >
                        <img
                          src={m.url}
                          alt={m.caption || 'Incident Attachment'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {m.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-brand-navy/80 text-[10px] text-white p-1 truncate">
                            {m.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Incident Geospatial Map */}
          <Card title="Geospatial Coordinates & Location" icon={MapPin}>
            <div className="space-y-3">
              <SafePassageMap
                center={[coordinates[1], coordinates[0]]}
                zoom={13}
                markers={[incident]}
                height="320px"
                className="w-full shadow-card border border-slate-200"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
                <span>Latitude: {coordinates[1]?.toFixed(5)}</span>
                <span>Longitude: {coordinates[0]?.toFixed(5)}</span>
              </div>
            </div>
          </Card>

          {/* Traveler Reporter Profile Card */}
          <Card title="Traveler Contact Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Reporter Name</div>
                <div className="text-sm font-bold text-brand-navy mt-1">
                  {traveler.name || 'Anonymous Traveler'}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Contact Phone</div>
                <div className="text-sm font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-teal" />
                  <span>{traveler.phone || 'Not provided'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Email Address</div>
                <div className="text-sm font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-teal" />
                  <span className="truncate">{traveler.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Chronological Case History & Audit Trail */}
          <Card title="Case History & Lifecycle Timeline" icon={FileText}>
            {caseLogs.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                No intermediate status updates recorded yet.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {caseLogs.map((log, index) => (
                  <div key={log._id || index} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-brand-teal/20 text-brand-teal shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand-navy">
                            {log.updatedBy?.name || 'System Operator'}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {log.updaterRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mt-1">
                        <span className="text-slate-400">{log.previousStatus}</span>
                        <span>&rarr;</span>
                        <StatusBadge status={log.newStatus} size="sm" />
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-700 mt-1.5 italic bg-white p-2 rounded-lg border border-slate-100">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): Dispatcher Override Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dispatcher Command Panel */}
          <Card
            title="Dispatcher Command Center"
            subtitle="Manual triage, provider dispatch assignment, and ETA overrides"
            icon={ShieldAlert}
            className="border-2 border-brand-teal/40"
          >
            <form onSubmit={handleSaveCase} className="space-y-4 pt-2">
              {/* Lifecycle Status Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Incident Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-bold focus:ring-2 focus:ring-brand-teal"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Assignment */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Assigned Response Provider
                </label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="">-- Unassigned / Pending Fleet --</option>
                  {providers.map((prov) => (
                    <option key={prov._id} value={prov._id}>
                      {prov.name} {prov.providerDetails?.verified ? '✓ (Verified)' : '(Pending)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Arrival Time */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Estimated Arrival Time (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  placeholder="e.g. 15"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-brand-navy font-semibold focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              {/* Operator Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Operator Dispatch Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Instructions for provider unit, medical notes, or reason for override..."
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Save}
                loading={saving}
                className="w-full justify-center shadow-md font-bold"
              >
                Save Operational Changes
              </Button>
            </form>
          </Card>

          {/* Current Assigned Provider Card */}
          {currentProvider && (
            <Card title="Assigned Fleet Unit" icon={Truck}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-brand-navy">
                    {currentProvider.name || 'Response Unit'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-teal" />
                  <span>{currentProvider.phone || 'Phone on file'}</span>
                </div>

                {incident.estimatedArrivalTimeMinutes !== null && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-semibold">
                    <span className="text-slate-500">Provider ETA:</span>
                    <span className="font-bold text-brand-teal">
                      {incident.estimatedArrivalTimeMinutes} Minutes
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

