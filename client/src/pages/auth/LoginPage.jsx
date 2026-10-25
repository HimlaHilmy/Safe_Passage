import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BrandLogo from '../../components/common/BrandLogo';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, Shield, UserCheck, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, switchDemoRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/traveler';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'warning');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      addToast(`Welcome back, ${result.user.name}!`, 'success');
      const target = result.user.role === 'admin' ? '/admin' : result.user.role === 'provider' ? '/provider' : '/traveler';
      navigate(target, { replace: true });
    } else {
      addToast(result.message || 'Invalid email or password', 'error');
    }
  };

  const handleDemoFill = (role, demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    switchDemoRole(role);
    addToast(`Pre-filled ${role} demo credentials. Click Sign In to proceed!`, 'info');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-card">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-navy tracking-tight">
            Sign In to Safe Passage
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your emergency response console, reports, and real-time dispatches
          </p>
        </div>

        {/* 1-Click Demo Login Panel for Evaluators & University Graders */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Zap className="w-3.5 h-3.5 text-brand-teal fill-brand-teal" />
            <span>1-Click Demo Quick Fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('traveler', 'traveler@safepassage.org', 'traveler123')}
              className="p-2 rounded-xl text-xs font-bold bg-white hover:bg-brand-teal hover:text-brand-navy border border-slate-200 transition-colors shadow-xs"
            >
              Traveler
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('provider', 'provider@safepassage.org', 'provider123')}
              className="p-2 rounded-xl text-xs font-bold bg-white hover:bg-brand-teal hover:text-brand-navy border border-slate-200 transition-colors shadow-xs"
            >
              Provider
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin', 'admin@safepassage.org', 'admin123')}
              className="p-2 rounded-xl text-xs font-bold bg-white hover:bg-brand-teal hover:text-brand-navy border border-slate-200 transition-colors shadow-xs"
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. traveler@safepassage.org"
            icon={Mail}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="font-semibold text-brand-teal hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Sign In to Console
          </Button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-navy hover:text-brand-teal">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
