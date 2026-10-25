import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not complete your request. Please check your network or try again.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-6 rounded-2xl border border-red-200 bg-red-50/70 text-center max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-100 text-emergency-red flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-red-900 mb-1">{title}</h4>
      <p className="text-xs text-red-700 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="bg-white">
          Retry Action
        </Button>
      )}
    </div>
  );
}
