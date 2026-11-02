import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import IncidentLifecycleStepper from './IncidentLifecycleStepper';
import CaseAuditTimeline from './CaseAuditTimeline';
import IncidentAssignmentCard from './IncidentAssignmentCard';
import IncidentLocationMapCard from './IncidentLocationMapCard';
import ConfirmDialog from '../common/ConfirmDialog';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Send,
  Copy,
  Check,
} from 'lucide-react';

export default function SharedIncidentDetailsModal({
  isOpen,
  onClose,
  incidentId,
  onIncidentUpdated = null,
}) {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [incident, setIncident] = useState(null);
  const [caseLogs, setCaseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [newNoteInput, setNewNoteInput] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'audit' | 'management'

  useEffect(() => {
    if (isOpen && incidentId) {
      fetchIncidentAndLogs();
    }
  }, [isOpen, incidentId]);

  const fetchIncidentAndLogs = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    try {
      const [incRes, logRes] = await Promise.all([
        fetch(`${apiUrl}/incidents/${incidentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/incidents/${incidentId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const incData = await incRes.json();
      const logData = await logRes.json();

      if (incRes.ok && incData.success) {
        setIncident(incData.data);
      }
      if (logRes.ok && logData.success) {
        setCaseLogs(logData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching incident in modal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (targetStatus) => {
    setIsUpdating(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    try {
      const res = await fetch(`${apiUrl}/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newStatus: targetStatus,
          notes: actionNotes.trim() || `Status updated to ${targetStatus} via operations portal.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(`Incident transitioned to ${targetStatus}`, 'success');
        setActionNotes('');
        await fetchIncidentAndLogs();
        if (onIncidentUpdated) onIncidentUpdated();
      } else {
        throw new Error(data.message || 'Transition error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;

    setIsUpdating(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    try {
      const res = await fetch(`${apiUrl}/incidents/${incidentId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: newNoteInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Progress note added to case audit trail', 'success');
        setNewNoteInput('');
        await fetchIncidentAndLogs();
        if (onIncidentUpdated) onIncidentUpdated();
      } else {
        throw new Error(data.message || 'Failed to add note');
      }
    } catch (err) {
      addToast(err.message || 'Failed to add note', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyReference = () => {
    const ref = incident?.incidentReference || incident?.reference || incident?._id;
    if (ref) {
      navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
      addToast('Incident reference copied to clipboard', 'info');
    }
  };

  if (!isOpen) return null;

  const refCode = incident?.incidentReference || incident?.reference || `#${incident?._id?.slice(-6).toUpperCase()}`;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-slate-100 text-brand-navy font-bold border border-slate-200">
              {refCode}
            </span>
            <span className="text-base font-extrabold text-brand-navy">
              Emergency Case Inspection
            </span>
          </div>
        }
        size="xl"
      >
        {loading || !incident ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-brand-teal/20 border-t-brand-teal animate-spin" />
            <span className="text-xs font-semibold text-slate-400">Loading incident lifecycle data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Navigation Bar: Metadata & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={incident.status} />
                <StatusBadge status={incident.severity} type="severity" />
                <button
                  onClick={copyReference}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-brand-navy px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-medium"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRef ? 'Copied' : 'Copy Ref'}</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'overview'
                      ? 'bg-white text-brand-navy shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Overview & Map
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'audit'
                      ? 'bg-white text-brand-navy shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Case Audit Logs ({caseLogs.length})
                </button>
                <button
                  onClick={() => setActiveTab('management')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'management'
                      ? 'bg-white text-brand-navy shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Status Management
                </button>
              </div>
            </div>

            {/* Visual Lifecycle Stepper Progress */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <IncidentLifecycleStepper currentStatus={incident.status} />
            </div>

            {/* TAB 1: OVERVIEW & MAP */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left: Incident Details */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                        {incident.category}
                      </span>
                      <h3 className="text-base font-extrabold text-brand-navy mt-0.5">
                        {incident.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {incident.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Reported Time</div>
                        <div className="font-semibold text-slate-700 mt-0.5">
                          {new Date(incident.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Reporter Identity</div>
                        <div className="font-semibold text-slate-700 mt-0.5">
                          {incident.travelerId?.name || 'Verified Traveler'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Card */}
                  <IncidentAssignmentCard
                    assignedProvider={incident.assignedProviderId || incident.assignedProvider}
                    estimatedArrivalTimeMinutes={incident.estimatedArrivalTimeMinutes}
                    incidentStatus={incident.status}
                    canManage={true}
                    onAssignClick={() => setActiveTab('management')}
                  />
                </div>

                {/* Right: Map Card */}
                <div>
                  <IncidentLocationMapCard
                    location={incident.location}
                    title="Incident Pinned Coordinates"
                    height="320px"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                {/* Add inline progress note */}
                <form onSubmit={handleAddNote} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Log operational note or update to audit history..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
                  />
                  <Button type="submit" size="sm" icon={Send} isLoading={isUpdating}>
                    Record Note
                  </Button>
                </form>

                <div className="max-h-[450px] overflow-y-auto pr-2">
                  <CaseAuditTimeline logs={caseLogs} />
                </div>
              </div>
            )}

            {/* TAB 3: STATUS MANAGEMENT & FSM CONTROLS */}
            {activeTab === 'management' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Finite State Machine Engine:</span> Permitted transitions are strictly regulated by case lifecycle business rules. All updates append an immutable entry to the case audit log.
                </div>

                {/* Operational Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Audit Transition Notes (Required for transparency):
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Provide operator context explaining this state transition..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>

                {/* Permitted Next States based on currentStatus */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                    Permitted Transition Actions
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {incident.status === 'Submitted' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusTransition('Under Review')}
                        isLoading={isUpdating}
                      >
                        Triage to Under Review
                      </Button>
                    )}

                    {incident.status === 'Under Review' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusTransition('Assigned')}
                        isLoading={isUpdating}
                      >
                        Assign Provider
                      </Button>
                    )}

                    {incident.status === 'Assigned' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusTransition('Assistance Dispatched')}
                        isLoading={isUpdating}
                      >
                        Confirm Assistance Dispatched
                      </Button>
                    )}

                    {incident.status === 'Assistance Dispatched' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusTransition('In Progress')}
                        isLoading={isUpdating}
                      >
                        Mark Crew On Scene / In Progress
                      </Button>
                    )}

                    {incident.status === 'In Progress' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusTransition('Resolved')}
                        isLoading={isUpdating}
                      >
                        Resolve Emergency Case
                      </Button>
                    )}

                    {incident.status !== 'Resolved' && incident.status !== 'Cancelled' && (
                      <Button
                        size="sm"
                        variant="emergencyStatic"
                        onClick={() => setCancelDialogOpen(true)}
                        isLoading={isUpdating}
                      >
                        Cancel Emergency Case
                      </Button>
                    )}

                    {incident.status === 'Resolved' && (
                      <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>This case is in a terminal state (Resolved). No further mutations permitted.</span>
                      </div>
                    )}

                    {incident.status === 'Cancelled' && (
                      <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>This case was Cancelled. No further mutations permitted.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Row */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/traveler/incidents/${incident._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
              >
                <span>Open Dedicated Full-Screen Tracking Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={fetchIncidentAndLogs} icon={RefreshCw}>
                  Refresh
                </Button>
                <Button size="sm" variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={async () => {
          setCancelDialogOpen(false);
          await handleStatusTransition('Cancelled');
        }}
        title="Cancel Emergency Case?"
        message="Are you certain you wish to cancel this emergency incident? This action is terminal and will notify responding units."
        confirmText="Yes, Cancel Emergency"
      />
    </>
  );
}
