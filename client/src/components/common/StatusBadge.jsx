import React from 'react';
import { 
  Clock, 
  Search, 
  UserCheck, 
  Truck, 
  Activity, 
  CheckCircle2, 
  XCircle,
  AlertTriangle 
} from 'lucide-react';

export default function StatusBadge({ status, type = 'status', size = 'md' }) {
  if (!status) return null;

  // Configuration for Incident & Assistance Dispatch Lifecycle Statuses
  const statusConfig = {
    'Pending': {
      bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
      dot: 'bg-amber-500 animate-pulse',
      icon: Clock,
    },
    'Accepted': {
      bg: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
      dot: 'bg-purple-500',
      icon: UserCheck,
    },
    'En Route': {
      bg: 'bg-teal-50 text-teal-800 border-teal-300 font-semibold',
      dot: 'bg-teal-500 animate-pulse',
      icon: Truck,
    },
    'Arrived': {
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold',
      dot: 'bg-cyan-500',
      icon: UserCheck,
    },
    'On Scene': {
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-300 font-semibold',
      dot: 'bg-cyan-500',
      icon: UserCheck,
    },
    'Submitted': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      icon: Clock,
    },
    'Under Review': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Search,
    },
    'Assigned': {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
      icon: UserCheck,
    },
    'Assistance Dispatched': {
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-brand-teal animate-pulse',
      icon: Truck,
    },
    'In Progress': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
      dot: 'bg-indigo-500 animate-ping',
      icon: Activity,
    },
    'Resolved': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    'Completed': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    'Declined': {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-400',
      icon: XCircle,
    },
    'Cancelled': {
      bg: 'bg-slate-100 text-slate-600 border-slate-300',
      dot: 'bg-slate-400',
      icon: XCircle,
    },
  };

  // Configuration for Severity Levels
  const severityConfig = {
    'Critical': {
      bg: 'bg-red-100 text-red-800 border-red-300 font-bold',
      dot: 'bg-emergency-red animate-ping',
      icon: AlertTriangle,
    },
    'High': {
      bg: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
      dot: 'bg-orange-500',
      icon: AlertTriangle,
    },
    'Medium': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock,
    },
    'Low': {
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
      icon: CheckCircle2,
    },
  };

  const configMap = type === 'severity' ? severityConfig : statusConfig;
  const match = configMap[status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: Clock,
  };

  const Icon = match.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${match.bg}
        ${sizeClasses[size] || sizeClasses.md}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${match.dot}`} />
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{status}</span>
    </span>
  );
}
