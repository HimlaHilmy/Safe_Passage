import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  AlertOctagon,
  MapPin,
  Clock,
  Compass,
  Wrench,
  Inbox,
  Briefcase,
  Navigation,
  History,
  Users,
  ShieldCheck,
  Building2,
  FileText,
  LogOut,
  ChevronRight,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function DashboardSidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user?.role || 'traveler';

  // Navigation Links tailored to each specific Role
  const roleNavItems = {
    traveler: [
      {
        label: 'Dashboard Overview',
        path: '/traveler/dashboard',
        aliases: ['/traveler', '/traveler/dashboard'],
        icon: LayoutDashboard,
      },
      {
        label: 'Report Emergency',
        path: '/traveler/report-emergency',
        aliases: ['/traveler/report', '/traveler/report-emergency'],
        icon: AlertOctagon,
        highlight: true,
      },
      { label: 'Find Services', path: '/traveler/services', icon: MapPin },
      { label: 'My Incidents', path: '/traveler/incidents', icon: Clock },
      { label: 'Roadside Assistance', path: '/traveler/roadside', icon: Wrench },
      { label: 'Explore Map', path: '/services', icon: Compass },
    ],
    provider: [
      { label: 'Provider Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
      { label: 'Incoming Requests', path: '/provider/requests', icon: Inbox, highlight: true },
      { label: 'Active Jobs', path: '/provider/jobs', icon: Briefcase },
      { label: 'Dispatch Map', path: '/provider/map', icon: Navigation },
      { label: 'Job History', path: '/provider/history', icon: History },
      { label: 'Provider Profile', path: '/provider/profile', icon: ShieldCheck },
    ],
    admin: [
      { label: 'Command Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Incident Management', path: '/admin/incidents', icon: AlertOctagon },
      { label: 'Analytics & Reports', path: '/admin/analytics', icon: TrendingUp },
      { label: 'User Directory', path: '/admin/users', icon: Users },
      { label: 'Provider Approvals', path: '/admin/providers', icon: ShieldCheck },
      { label: 'Emergency Services', path: '/admin/services', icon: Building2 },
      { label: 'System Audit Logs', path: '/admin/audit-logs', icon: FileText },
    ],
  };

  const navItems = roleNavItems[role] || roleNavItems.traveler;

  const roleLabels = {
    traveler: { title: 'Traveler Portal', color: 'bg-brand-teal/20 text-brand-teal' },
    provider: { title: 'Provider Dispatch', color: 'bg-amber-400/20 text-amber-300' },
    admin: { title: 'Admin Command', color: 'bg-indigo-400/20 text-indigo-300' },
  };

  const currentRoleInfo = roleLabels[role] || roleLabels.traveler;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-brand-navy/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 bg-brand-navy text-white flex flex-col justify-between
          border-r border-white/10 transition-transform duration-300 ease-in-out shadow-2xl
          lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div>
          {/* Top Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
            <BrandLogo size="md" light={true} linkTo="/" />
          </div>

          {/* Current Active Role Badge */}
          <div className="px-6 py-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Workspace
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${currentRoleInfo.color}`}>
                {currentRoleInfo.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mt-1 truncate">
              {user?.name || 'Authorized Administrator'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                item.aliases?.includes(location.pathname) ||
                location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={`
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${
                      isItemActive
                        ? 'bg-brand-teal text-brand-navy shadow-md font-bold'
                        : item.highlight
                        ? 'bg-emergency-red/20 text-red-300 hover:bg-emergency-red/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Account / Footer Cluster */}
        <div className="p-4 border-t border-white/10 bg-brand-navy-light/60">
          <div className="flex items-center justify-between gap-3 mb-3 px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-teal text-brand-navy font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-emergency-red hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
