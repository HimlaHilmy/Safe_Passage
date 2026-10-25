import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertOctagon, 
  Menu, 
  X, 
  LayoutDashboard, 
  UserCheck
} from 'lucide-react';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, switchDemoRole } = useAuth();

  // Navigation Links strictly matching the reference UI
  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Stories', path: '/stories' },
    { label: 'Resources', path: '/resources' },
    { label: 'Contact', path: '/contact' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/traveler';
    if (user.role === 'provider') return '/provider';
    if (user.role === 'admin') return '/admin';
    return '/traveler';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-palette-border shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors relative py-1 ${
                  isActive
                    ? 'text-palette-secondary font-bold'
                    : 'text-palette-muted hover:text-palette-primary'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-palette-secondary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Role Tester Pills for Team/Reviewers */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1 font-bold">Role:</span>
            <button
              onClick={() => switchDemoRole('traveler')}
              className={`px-2 py-0.5 rounded-lg transition-all ${user?.role === 'traveler' ? 'bg-palette-secondary text-white font-bold shadow-xs' : 'hover:text-palette-primary'}`}
            >
              Traveler
            </button>
            <button
              onClick={() => switchDemoRole('provider')}
              className={`px-2 py-0.5 rounded-lg transition-all ${user?.role === 'provider' ? 'bg-palette-secondary text-white font-bold shadow-xs' : 'hover:text-palette-primary'}`}
            >
              Provider
            </button>
            <button
              onClick={() => switchDemoRole('admin')}
              className={`px-2 py-0.5 rounded-lg transition-all ${user?.role === 'admin' ? 'bg-palette-secondary text-white font-bold shadow-xs' : 'hover:text-palette-primary'}`}
            >
              Admin
            </button>
          </div>

          {/* User Portal Link or Login */}
          {isAuthenticated ? (
            <Link to={getDashboardPath()}>
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-primary text-white hover:bg-palette-primary-light transition-all shadow-sm">
                Dashboard ({user.role})
              </button>
            </Link>
          ) : (
            <Link to="/login">
              <button className="px-4 py-2 rounded-xl text-xs font-bold border border-palette-secondary text-palette-secondary hover:bg-palette-secondary/10 transition-all">
                Login / Sign In
              </button>
            </Link>
          )}

          {/* SOS Report Quick Trigger */}
          <Link to="/traveler/report">
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white transition-all shadow-sm flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SOS Help</span>
            </button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link to="/traveler/report">
            <button className="px-3 py-1.5 rounded-xl text-xs font-bold bg-palette-secondary text-white flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-palette-primary hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu matching bottom row mobile views */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-palette-border bg-white px-6 py-6 flex flex-col gap-4 animate-in slide-in-from-top-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-palette-primary hover:text-palette-secondary py-1.5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-palette-border flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase text-palette-muted">Switch Demo Role</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { switchDemoRole('traveler'); setMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs font-bold ${user?.role === 'traveler' ? 'bg-palette-secondary text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Traveler
              </button>
              <button
                onClick={() => { switchDemoRole('provider'); setMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs font-bold ${user?.role === 'provider' ? 'bg-palette-secondary text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Provider
              </button>
              <button
                onClick={() => { switchDemoRole('admin'); setMobileMenuOpen(false); }}
                className={`p-2 rounded-xl text-xs font-bold ${user?.role === 'admin' ? 'bg-palette-secondary text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Admin
              </button>
            </div>

            <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-palette-primary text-white hover:bg-palette-primary-light">
                Go to {user?.role || 'Traveler'} Dashboard
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
