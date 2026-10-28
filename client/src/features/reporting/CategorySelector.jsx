import React from 'react';
import {
  HeartPulse,
  FileQuestion,
  ShieldAlert,
  Truck,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

export const EMERGENCY_CATEGORIES = [
  {
    id: 'medical',
    value: 'Medical Emergency',
    label: 'Medical Emergency',
    description: 'Physical trauma, injury, sudden cardiac distress, allergic reactions, or acute illness.',
    icon: HeartPulse,
    badgeColor: 'text-emergency-red bg-red-100/80 border-red-200',
    accentColor: 'border-red-400 bg-red-50/50',
    activeRing: 'ring-2 ring-red-500 border-red-500 bg-red-50/70',
    badge: 'Immediate Priority',
  },
  {
    id: 'passport',
    value: 'Lost Passport or Documents',
    label: 'Lost Passport or Documents',
    description: 'Stolen or missing passport, travel visa, flight documentation, or critical IDs.',
    icon: FileQuestion,
    badgeColor: 'text-blue-700 bg-blue-100/80 border-blue-200',
    accentColor: 'border-blue-400 bg-blue-50/50',
    activeRing: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/70',
    badge: 'Consular Assistance',
  },
  {
    id: 'security',
    value: 'Theft or Security Incident',
    label: 'Theft or Security Incident',
    description: 'Armed robbery, mugging, physical assault, hotel room breach, or harassment.',
    icon: ShieldAlert,
    badgeColor: 'text-purple-700 bg-purple-100/80 border-purple-200',
    accentColor: 'border-purple-400 bg-purple-50/50',
    activeRing: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50/70',
    badge: 'Police & Security Link',
  },
  {
    id: 'vehicle',
    value: 'Vehicle Breakdown',
    label: 'Vehicle Breakdown',
    description: 'Engine failure, flat tire, radiator steam, roadside collision, or fuel depletion.',
    icon: Truck,
    badgeColor: 'text-amber-700 bg-amber-100/80 border-amber-200',
    accentColor: 'border-amber-400 bg-amber-50/50',
    activeRing: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/70',
    badge: 'Towing & Recovery',
  },
  {
    id: 'other',
    value: 'Other Emergency',
    label: 'Other Emergency',
    description: 'Severe weather, flash floods, stranded in wilderness, or other urgent crisis.',
    icon: AlertOctagon,
    badgeColor: 'text-teal-800 bg-teal-100/80 border-teal-200',
    accentColor: 'border-teal-400 bg-teal-50/50',
    activeRing: 'ring-2 ring-brand-teal border-brand-teal bg-teal-50/70',
    badge: 'General Assistance',
  },
];

export default function CategorySelector({ selectedCategory, onSelectCategory, error }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-brand-navy">
          Select Emergency Incident Category <span className="text-emergency-red">*</span>
        </label>
        <span className="text-xs text-slate-500">Pick the closest category to dispatch appropriate crews</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {EMERGENCY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.value;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.value)}
              className={`
                relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between
                ${
                  isSelected
                    ? `${cat.activeRing} shadow-md`
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }
              `}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs ${cat.badgeColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {cat.badge}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-brand-navy mb-1 flex items-center gap-1.5">
                  {cat.label}
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-teal inline shrink-0" />}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? 'text-brand-navy font-bold' : 'text-slate-400'}>
                  {isSelected ? 'Selected Category' : 'Click to select'}
                </span>
                <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? 'bg-brand-navy border-brand-navy' : 'border-slate-300'}`}>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
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

