import React from 'react';
import { AlertTriangle, Clock, Zap, ShieldAlert, Check } from 'lucide-react';

export const SEVERITY_LEVELS = [
  {
    value: 'Critical',
    label: 'Critical',
    timeframe: 'Immediate (< 10 min)',
    desc: 'Life-threatening peril, active medical trauma, or immediate violence.',
    badgeClass: 'bg-red-500 text-white',
    selectedClass: 'ring-2 ring-red-500 border-red-500 bg-red-50/80 shadow-md',
    icon: Zap,
    color: 'text-red-600',
  },
  {
    value: 'High',
    label: 'High',
    timeframe: 'Urgent (< 20 min)',
    desc: 'Severe emergency, vulnerable traveler, escalating roadside risk.',
    badgeClass: 'bg-orange-500 text-white',
    selectedClass: 'ring-2 ring-orange-500 border-orange-500 bg-orange-50/80 shadow-md',
    icon: ShieldAlert,
    color: 'text-orange-600',
  },
  {
    value: 'Medium',
    label: 'Medium',
    timeframe: 'Standard (< 45 min)',
    desc: 'Stable condition, safe surroundings, vehicle needs towing or jumpstart.',
    badgeClass: 'bg-amber-500 text-white',
    selectedClass: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/80 shadow-md',
    icon: AlertTriangle,
    color: 'text-amber-600',
  },
  {
    value: 'Low',
    label: 'Low',
    timeframe: 'Routine (< 2 hours)',
    desc: 'Non-urgent assistance, document replacement advice, travel guidance.',
    badgeClass: 'bg-teal-600 text-white',
    selectedClass: 'ring-2 ring-brand-teal border-brand-teal bg-teal-50/80 shadow-md',
    icon: Clock,
    color: 'text-brand-teal',
  },
];

export default function SeveritySelector({ selectedSeverity, onSelectSeverity, error }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-brand-navy">
          Select Severity Level <span className="text-emergency-red">*</span>
        </label>
        <span className="text-xs text-slate-500">Determines triage speed and responder priority</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SEVERITY_LEVELS.map((sev) => {
          const Icon = sev.icon;
          const isSelected = selectedSeverity === sev.value;

          return (
            <button
              key={sev.value}
              type="button"
              onClick={() => onSelectSeverity(sev.value)}
              className={`
                p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between
                ${
                  isSelected
                    ? sev.selectedClass
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${sev.badgeClass}`}>
                    {sev.label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {sev.timeframe}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${sev.color}`} />
                  <span className="text-sm font-extrabold text-brand-navy">
                    {sev.label} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  {sev.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'bg-brand-navy border-brand-navy' : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-semibold text-emergency-red flex items-center gap-1 mt-1">
          <span>●</span> {error}
        </p>
      )}
    </div>
  );
}

