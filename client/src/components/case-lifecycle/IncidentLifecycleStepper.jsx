import React from 'react';
import {
  FileText,
  Search,
  UserCheck,
  Truck,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const ORDERED_STATUSES = [
  {
    key: 'Submitted',
    label: 'Submitted',
    description: 'Distress beacon received & logged',
    icon: FileText,
  },
  {
    key: 'Under Review',
    label: 'Under Review',
    description: 'Operator triage & coordinates verification',
    icon: Search,
  },
  {
    key: 'Assigned',
    label: 'Assigned',
    description: 'Response unit allocated to mission',
    icon: UserCheck,
  },
  {
    key: 'Assistance Dispatched',
    label: 'Dispatched',
    description: 'Rescue crew en route with ETA',
    icon: Truck,
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    description: 'On scene; assistance underway',
    icon: Activity,
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    description: 'Emergency safely concluded',
    icon: CheckCircle2,
  },
];

export default function IncidentLifecycleStepper({ currentStatus, isCompact = false }) {
  const isCancelled = currentStatus === 'Cancelled';
  const currentIdx = ORDERED_STATUSES.findIndex((s) => s.key === currentStatus);

  if (isCancelled) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Emergency Case Terminated
            </div>
            <div className="text-sm font-bold text-slate-800">
              This incident was marked as Cancelled.
            </div>
            <div className="text-xs text-slate-500">
              Active response units have been stood down and audit trail recorded.
            </div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800">
          Cancelled
        </span>
      </div>
    );
  }

  const effectiveIdx = currentIdx !== -1 ? currentIdx : 0;
  const progressPercent = (effectiveIdx / (ORDERED_STATUSES.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden md:block py-2">
        <div className="relative flex items-center justify-between">
          {/* Background track line */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 z-0 rounded-full" />
          
          {/* Active progress fill line */}
          <div
            className="absolute top-5 left-6 h-1 bg-brand-teal transition-all duration-700 ease-out z-0 rounded-full"
            style={{ width: `calc(${progressPercent}% * 0.88)` }}
          />

          {ORDERED_STATUSES.map((step, idx) => {
            const isCompleted = idx < effectiveIdx;
            const isCurrent = idx === effectiveIdx;
            const isPending = idx > effectiveIdx;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center text-center group cursor-default"
                style={{ width: `${100 / ORDERED_STATUSES.length}%` }}
              >
                {/* Step Circle Pin */}
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300
                    ${
                      isCurrent
                        ? 'bg-brand-navy text-brand-teal ring-4 ring-brand-teal/30 scale-110 shadow-md'
                        : isCompleted
                        ? 'bg-brand-teal text-brand-navy shadow-xs'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-navy" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-brand-teal' : 'text-slate-400'}`} />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2.5">
                  <div
                    className={`text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-brand-navy font-extrabold'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  {!isCompact && (
                    <div className="text-[10px] text-slate-400 max-w-[110px] line-clamp-1 mt-0.5">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper Card */}
      <div className="md:hidden space-y-2">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-navy text-brand-teal flex items-center justify-center font-bold text-xs">
              {effectiveIdx + 1}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Stage ({effectiveIdx + 1} of {ORDERED_STATUSES.length})
              </div>
              <div className="text-xs font-extrabold text-brand-navy">
                {ORDERED_STATUSES[effectiveIdx]?.label || currentStatus}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-teal-dark">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
