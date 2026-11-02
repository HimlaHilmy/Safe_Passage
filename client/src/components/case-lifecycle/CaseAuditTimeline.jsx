import React from 'react';
import StatusBadge from '../common/StatusBadge';
import {
  Clock,
  User,
  Shield,
  Truck,
  FileText,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

function getActorBadge(role) {
  switch (role) {
    case 'traveler':
      return {
        label: 'Traveler Reporter',
        icon: User,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'provider':
      return {
        label: 'Response Crew',
        icon: Truck,
        className: 'bg-teal-50 text-teal-800 border-teal-200',
      };
    case 'admin':
      return {
        label: 'Operations Dispatcher',
        icon: Shield,
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    default:
      return {
        label: 'System Engine',
        icon: FileText,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function CaseAuditTimeline({ logs = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-brand-teal/20 border-t-brand-teal animate-spin" />
        <span className="text-xs text-slate-400">Loading audit history...</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        No case logs recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-2 sm:pl-4 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-5 sm:before:left-7 before:w-0.5 before:bg-slate-200">
      {logs.map((log, index) => {
        const actor = getActorBadge(log.updaterRole);
        const ActorIcon = actor.icon;
        const isLatest = index === logs.length - 1;
        const isStatusChange = log.previousStatus !== log.newStatus;

        return (
          <div key={log._id || index} className="relative pl-8 sm:pl-10 group">
            {/* Timeline Dot Icon */}
            <div
              className={`
                absolute top-1 left-2 sm:left-4 -translate-x-1/2 w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all duration-300
                ${
                  isLatest
                    ? 'bg-brand-teal text-brand-navy border-white ring-4 ring-brand-teal/20 shadow-md scale-110'
                    : 'bg-white text-brand-navy border-slate-300 group-hover:border-brand-teal'
                }
              `}
            >
              <ActorIcon className="w-3.5 h-3.5" />
            </div>

            {/* Timeline Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:border-slate-300 transition-all">
              {/* Header: Role & Timestamps */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${actor.className}`}
                  >
                    <ActorIcon className="w-3 h-3" />
                    <span>{actor.label}</span>
                  </span>
                  {log.updatedBy?.name && (
                    <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                      ({log.updatedBy.name})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span title={new Date(log.timestamp).toLocaleString()}>
                    {formatRelativeTime(log.timestamp)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Status Transition Badges (if state changed) */}
              {isStatusChange && (
                <div className="flex flex-wrap items-center gap-1.5 py-1 mb-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {log.previousStatus === 'None' ? 'Initial Report' : log.previousStatus}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <StatusBadge status={log.newStatus} size="sm" />
                </div>
              )}

              {/* Notes content */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-brand-teal shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {log.notes || 'Status updated by system.'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
