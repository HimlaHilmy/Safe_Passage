import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = ShieldAlert,
  title = 'No items found',
  description = 'There are no active records in this section right now.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h4 className="text-base font-bold text-brand-navy mb-1">{title}</h4>
      <p className="text-sm text-slate-500 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
