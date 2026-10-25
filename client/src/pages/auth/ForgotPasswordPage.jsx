import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-card text-center">
        <div className="flex justify-center mb-2">
          <BrandLogo size="md" />
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">Password Reset Sent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We have dispatched password recovery instructions to <span className="font-bold text-slate-700">{email}</span>. Please verify your inbox and spam folder.
            </p>
            <Link to="/login">
              <Button variant="outline" size="sm" icon={ArrowLeft} fullWidth className="mt-4">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-extrabold text-brand-navy">Reset Your Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered email address and we'll send you recovery instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <Input
                label="Registered Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@safepassage.org"
                icon={Mail}
                required
              />

              <Button type="submit" variant="primary" fullWidth size="md">
                Send Recovery Instructions
              </Button>
            </form>

            <div className="pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-navy">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
