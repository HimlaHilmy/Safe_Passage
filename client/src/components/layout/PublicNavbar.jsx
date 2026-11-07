import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertOctagon, 
  Menu, 
  X, 
  LogOut,
  LayoutDashboard
} from 'lucide-react';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Stories', path: '/stories' },
    { label: 'Resources', path: '/resources' },
    { label: 'Contact', path: '/contact' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'provider') return '/provider/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/traveler/dashboard';
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
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
          {/* User Portal Link or Login */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link to={getDashboardPath()}>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-palette-primary text-white hover:bg-palette-primary-light transition-all shadow-sm capitalize">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{user.role} Dashboard</span>
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-emergency-red transition-all flex items-center gap-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <button className="px-4 py-2 rounded-xl text-xs font-bold border border-palette-secondary text-palette-secondary hover:bg-palette-secondary/10 transition-all">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-primary text-white hover:bg-palette-primary-light transition-all shadow-sm">
                  Register
                </button>
              </Link>
            </div>
          )}

          {/* SOS Report Quick Trigger (Only for travelers or public) */}
          <Link to="/traveler/report-emergency">
            <button className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white transition-all shadow-sm flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>SOS Help</span>
            </button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link to="/traveler/report-emergency">
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
            {isAuthenticated && user ? (
              <>
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-palette-primary text-white hover:bg-palette-primary-light capitalize">
                    Go to {user.role} Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-emergency-red flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-2.5 rounded-xl text-xs font-bold border border-palette-secondary text-palette-secondary text-center">
                    Sign In
                  </button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full py-2.5 rounded-xl text-xs font-bold bg-palette-primary text-white text-center">
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
