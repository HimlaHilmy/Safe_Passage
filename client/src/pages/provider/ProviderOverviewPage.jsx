import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
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
  Navigation
} from 'lucide-react';

export default function ProviderOverviewPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [isAvailable, setIsAvailable] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([
    {
      _id: '65r1001',
      serviceType: 'Roadside Towing & Vehicle Repair',
      travelerName: 'Sarah Jenkins',
      travelerPhone: '+1 (555) 234-5678',
      location: {
        address: 'Route A4, Mile Marker 42, Central Province',
        coordinates: [80.6337, 7.2906],
      },
      status: 'Pending',
      distanceKm: '4.8',
      dispatchNotes: 'Vehicle radiator steam observed, unable to proceed.',
      createdAt: new Date(Date.now() - 300000), // 5 mins ago
    },
    {
      _id: '65r1002',
      serviceType: 'Emergency Battery Jumpstart & Diagnostic',
      travelerName: 'Marcus Vance',
      travelerPhone: '+44 7700 900123',
      location: {
        address: 'Kandy Viewpoint Parking Lot B',
        coordinates: [80.6390, 7.2940],
      },
      status: 'Pending',
      distanceKm: '2.1',
      dispatchNotes: 'Dead battery after headlights left on in parking area.',
      createdAt: new Date(Date.now() - 720000), // 12 mins ago
    },
  ]);

  const [activeJobs, setActiveJobs] = useState([
    {
      _id: '65r000000000000000000001',
      serviceType: 'Roadside Towing & Vehicle Repair',
      travelerName: 'Sarah Jenkins',
      travelerPhone: '+1 (555) 234-5678',
      location: {
        address: 'Route A4, Mile Marker 42, Central Province',
      },
      status: 'En Route',
      etaMinutes: 14,
      dispatchNotes: 'Tow truck Unit 4 dispatched with cooling system emergency parts.',
      acceptedAt: new Date(Date.now() - 1800000),
    },
  ]);

  const handleRespond = (requestId, action) => {
    if (action === 'accept') {
      const accepted = incomingRequests.find((r) => r._id === requestId);
      if (accepted) {
        setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
        setActiveJobs((prev) => [
          ...prev,
          {
            ...accepted,
            status: 'En Route',
            etaMinutes: 15,
            acceptedAt: new Date(),
          },
        ]);
        addToast(`Dispatch request accepted! Marked as 'En Route'.`, 'success');
      }
    } else {
      setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
      addToast(`Dispatch request declined. Returning to pool.`, 'info');
    }
  };

  const handleUpdateJobStatus = (jobId, newStatus) => {
    setActiveJobs((prev) =>
      prev.map((job) => (job._id === jobId ? { ...job, status: newStatus } : job))
    );
    addToast(`Job status updated to '${newStatus}'`, 'success');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={`${user?.name || 'Apex Rapid Response Ltd'}`}
        subtitle="Provider Dispatch Terminal & Active Operations Queue."
        breadcrumbs={['Provider', 'Dispatch Console']}
        badge={
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400/20 text-amber-900 border border-amber-300">
            Member 4 Module: Dispatch (Himla)
          </span>
        }
        action={
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-600 pl-2">Duty Status:</span>
            <button
              onClick={() => {
                setIsAvailable(!isAvailable);
                addToast(`Duty status set to ${!isAvailable ? 'Available for Dispatches' : 'Off Duty'}`, 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                isAvailable
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              <span>{isAvailable ? 'AVAILABLE FOR DISPATCH' : 'OFF DUTY'}</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Jobs</div>
          <div className="text-3xl font-extrabold text-brand-navy mt-1">{activeJobs.length}</div>
          <div className="text-[11px] text-brand-teal font-semibold mt-1">1 En Route</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-1">{incomingRequests.length}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Requires immediate response</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Response Time</div>
          <div className="text-3xl font-extrabold text-brand-teal mt-1">14.5m</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Top 5% SLA in region</div>
        </Card>
        <Card className="border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider Rating</div>
          <div className="text-3xl font-extrabold text-brand-navy mt-1 flex items-center gap-1">
            4.9 <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">42 verified reviews</div>
        </Card>
      </div>

      {/* Live Incoming Requests Queue */}
      <Card
        title="Incoming Assistance Requests"
        subtitle="Review traveler coordinates and accept or decline dispatches"
        icon={Inbox}
        action={
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emergency-red/10 text-emergency-red">
            {incomingRequests.length} Waiting
          </span>
        }
      >
        {incomingRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No pending assistance requests in queue. Ready for next incoming dispatch.
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.map((req) => (
              <div
                key={req._id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {req.serviceType}
                    </span>
                    <span className="text-xs font-bold text-brand-teal">
                      {req.distanceKm} km from base
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-brand-navy">{req.travelerName}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {req.dispatchNotes}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.location?.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleRespond(req._id, 'decline')}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleRespond(req._id, 'accept')}
                  >
                    Accept & Dispatch
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Jobs Queue */}
      <Card
        title="Active Jobs in Progress"
        subtitle="Update status for the traveler and dispatch center"
        icon={Briefcase}
      >
        {activeJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No active jobs at the moment.
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div
                key={job._id}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-brand-navy">
                        {job.serviceType}
                      </h4>
                      <StatusBadge status={job.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Client: <strong className="text-brand-navy">{job.travelerName}</strong> ({job.travelerPhone})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${job.travelerPhone}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-brand-navy hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-teal" />
                      <span>Call Client</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-brand-teal shrink-0" />
                  <span>{job.location?.address}</span>
                </div>

                {/* Job Progress Update Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Advance On-Scene Status:
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'Accepted' && (
                      <Button
                        size="sm"
                        icon={Truck}
                        onClick={() => handleUpdateJobStatus(job._id, 'En Route')}
                      >
                        Depart as En Route
                      </Button>
                    )}
                    {job.status === 'En Route' && (
                      <Button
                        size="sm"
                        icon={MapPin}
                        onClick={() => handleUpdateJobStatus(job._id, 'On Scene')}
                      >
                        Arrived On Scene
                      </Button>
                    )}
                    {job.status === 'On Scene' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={CheckCircle2}
                        onClick={() => handleUpdateJobStatus(job._id, 'Completed')}
                      >
                        Complete Job
                      </Button>
                    )}
                    {job.status === 'Completed' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Job Completed Successfully
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
