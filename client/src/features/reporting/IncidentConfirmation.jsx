import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  MapPin,
  Clock,
  ArrowRight,
  Eye,
  PlusCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';

export default function IncidentConfirmation({ incident, onReset }) {
  const [copied, setCopied] = useState(false);

  if (!incident) return null;

  const incidentRef = incident.incidentReference || incident.referenceNumber || incident._id;
  const incidentId = incident._id || incident.id;
  const submissionTime = incident.createdAt
    ? new Date(incident.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  const handleCopyReference = () => {
    if (incidentRef) {
      navigator.clipboard.writeText(incidentRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Hero Success Card */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy text-white p-6 sm:p-10 shadow-xl relative overflow-hidden text-center">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-teal/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-teal/20 border-2 border-brand-teal flex items-center justify-center text-brand-teal mb-4 shadow-lg ring-8 ring-brand-teal/10">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-brand-teal bg-brand-teal/15 px-3 py-1 rounded-full border border-brand-teal/30 mb-2">
            Emergency Transmitted Successfully
          </span>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Incident Registered & Queued for Response
          </h2>

          <p className="text-sm text-slate-300 max-w-lg mb-6 leading-relaxed">
            Your emergency report has been saved to the central dispatch queue. Response teams and nearby facilities have been notified.
          </p>

          {/* Incident Reference Display Box */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Official Incident Reference
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-brand-teal">
                {incidentRef}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyReference}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20"
              title="Copy Reference"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Ref</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Incident Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-card space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-extrabold text-brand-navy">
            Incident Transmission Details
          </h3>
          <p className="text-xs text-slate-500">
            Keep your incident reference ready when speaking to emergency responders or tourist police.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category
            </span>
            <div className="font-extrabold text-sm text-brand-navy">
              {incident.category}
            </div>
          </div>

          {/* Severity */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Severity Level
            </span>
            <StatusBadge status={incident.severity} type="severity" size="sm" />
          </div>

          {/* Current Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Current Status
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <StatusBadge status={incident.status || 'Submitted'} size="sm" />
            </div>
          </div>

          {/* Submission Time */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Submission Time
            </span>
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-teal" />
              <span>{submissionTime}</span>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="font-extrabold text-sm text-brand-navy">
            {incident.title}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {incident.description}
          </p>
        </div>

        {/* Location snippet */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-emergency-red shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-brand-navy">
              {incident.location?.address || 'Location Coordinates Logged'}
            </div>
            {incident.location?.coordinates && (
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                GPS: {incident.location.coordinates[1]?.toFixed(5)}° N, {incident.location.coordinates[0]?.toFixed(5)}° E
              </div>
            )}
            {incident.location?.landmark && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                Landmark: {incident.location.landmark}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Report Another Incident</span>
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
            <Link to="/traveler/incidents" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                My Incidents List
              </Button>
            </Link>

            <Link to={`/traveler/incidents/${incidentId}`} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                icon={Eye}
                iconPosition="right"
                className="w-full sm:w-auto shadow-md"
              >
                View Incident & Track Case
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

