import React from 'react';
import {
  Truck,
  Phone,
  ShieldCheck,
  Clock,
  Star,
  MapPin,
  AlertCircle,
  Award,
} from 'lucide-react';
import Button from '../common/Button';

export default function IncidentAssignmentCard({
  assignedProvider = null,
  estimatedArrivalTimeMinutes = null,
  incidentStatus = 'Submitted',
  onAssignClick = null,
  canManage = false,
}) {
  // Normalize provider details
  const provider = assignedProvider?.name ? assignedProvider : assignedProvider?.providerDetails ? assignedProvider : null;
  const isAssigned = Boolean(provider);

  if (!isAssigned) {
    const isTerminal = incidentStatus === 'Resolved' || incidentStatus === 'Cancelled';

    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assignment Information
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {isTerminal ? 'No Provider Assigned' : 'Awaiting Provider Allocation'}
              </h4>
            </div>
          </div>
          {!isTerminal && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Matching Fleet</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          {isTerminal
            ? 'This incident concluded without a dedicated external provider dispatch.'
            : 'Central Operations is identifying the closest certified emergency crew based on coordinates and required emergency equipment.'}
        </p>

        {canManage && onAssignClick && !isTerminal && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" icon={Truck} onClick={onAssignClick}>
              Assign Response Provider Now
            </Button>
          </div>
        )}
      </div>
    );
  }

  const phone = provider.phone || provider.contactPhone || '+1 (555) 987-6543';
  const serviceTypes = provider.providerDetails?.serviceTypes || ['Emergency Roadside & Towing'];
  const rating = provider.rating || provider.providerDetails?.rating || 4.9;
  const license = provider.providerDetails?.licenseNumber || 'SL-EMG-9021';

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-navy to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-700">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-teal/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header row: Badge & ETA */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-teal/20 border border-brand-teal/40 text-brand-teal text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Assigned Response Unit</span>
          </div>

          {estimatedArrivalTimeMinutes && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-brand-teal" />
              <span>ETA: {estimatedArrivalTimeMinutes} mins</span>
            </div>
          )}
        </div>

        {/* Unit Identity */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>{provider.name}</span>
            <Award className="w-4 h-4 text-brand-teal shrink-0" title="Verified Fleet Partner" />
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-white">{rating}</span> Rating
            </span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-slate-300">Lic: {license}</span>
          </div>
        </div>

        {/* Capabilities tag */}
        <div className="flex flex-wrap gap-1.5">
          {serviceTypes.slice(0, 2).map((srv, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[10px] font-semibold"
            >
              {srv}
            </span>
          ))}
        </div>

        {/* Contact Button */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="text-slate-400">Direct Dispatch Line: </span>
            <span className="font-mono font-bold text-white">{phone}</span>
          </div>

          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-teal text-brand-navy font-extrabold text-xs shadow-md hover:bg-brand-teal-dark hover:text-white transition-all transform active:scale-95"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Responding Crew</span>
          </a>
        </div>
      </div>
    </div>
  );
}
