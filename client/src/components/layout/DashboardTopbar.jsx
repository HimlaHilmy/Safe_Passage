import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, AlertOctagon, ExternalLink, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';

export default function DashboardTopbar({ onOpenMobile }) {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (targetRole) => {
    switchDemoRole(targetRole);
    if (targetRole === 'traveler') navigate('/traveler');
    if (targetRole === 'provider') navigate('/provider');
    if (targetRole === 'admin') navigate('/admin');
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <Link to="/" className="shrink-0" title="Safe Passage Home">
            <img
              src="/logo-transparent.png"
              alt="Safe Passage Logo"
              className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white p-0.5 object-contain shadow-xs hover:scale-105 transition-transform"
            />
          </Link>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Safe Passage System
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-brand-navy capitalize leading-tight">
              {user?.role || 'Traveler'} Console
            </h2>
          </div>
        </div>
      </div>

      {/* Right: Quick Role Switcher + SOS + Public Site Link */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Role Tester Pills */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1 font-bold">Role:</span>
          <button
            onClick={() => handleRoleChange('traveler')}
            className={`px-2.5 py-1 rounded-lg transition-all ${user?.role === 'traveler' ? 'bg-brand-teal text-brand-navy font-bold shadow-xs' : 'hover:text-brand-navy'}`}
          >
            Traveler
          </button>
          <button
            onClick={() => handleRoleChange('provider')}
            className={`px-2.5 py-1 rounded-lg transition-all ${user?.role === 'provider' ? 'bg-brand-teal text-brand-navy font-bold shadow-xs' : 'hover:text-brand-navy'}`}
          >
            Provider
          </button>
          <button
            onClick={() => handleRoleChange('admin')}
            className={`px-2.5 py-1 rounded-lg transition-all ${user?.role === 'admin' ? 'bg-brand-teal text-brand-navy font-bold shadow-xs' : 'hover:text-brand-navy'}`}
          >
            Admin
          </button>
        </div>

        {/* SOS Button for Emergency Reporting */}
        <Link to="/traveler/report">
          <Button variant="emergency" size="sm" icon={AlertOctagon}>
            <span className="hidden sm:inline">SOS Report</span>
            <span className="sm:hidden">SOS</span>
          </Button>
        </Link>

        {/* Public Website Link */}
        <Link
          to="/"
          className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-navy transition-colors px-2 py-1"
        >
          <span>Public Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
