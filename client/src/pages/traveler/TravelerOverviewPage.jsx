import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import {
  AlertOctagon,
  MapPin,
  Clock,
  Phone,
  HeartPulse,
  Truck,
  ShieldAlert,
  FileQuestion,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldCheck,
} from 'lucide-react';

export default function TravelerOverviewPage() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const emergencyCategories = [
    {
      title: 'Medical Emergency',
      desc: 'Physical trauma, injury, or acute illness',
      icon: HeartPulse,
      color: 'text-emergency-red',
      bg: 'bg-red-50 hover:bg-red-100/70 border-red-200',
    },
    {
      title: 'Lost Passport or Documents',
      desc: 'Stolen or missing passport, visa, flight IDs',
      icon: FileQuestion,
      color: 'text-blue-600',
      bg: 'bg-blue-50 hover:bg-blue-100/70 border-blue-200',
    },
    {
      title: 'Theft or Security Incident',
      desc: 'Robbery, assault, or personal safety danger',
      icon: ShieldAlert,
      color: 'text-purple-600',
      bg: 'bg-purple-50 hover:bg-purple-100/70 border-purple-200',
    },
    {
      title: 'Vehicle Breakdown',
      desc: 'Engine fault, flat tire, collision, towing',
      icon: Truck,
      color: 'text-amber-600',
      bg: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200',
    },
    {
      title: 'Other Emergency',
      desc: 'Natural hazard, flood, stranded in wilderness',
      icon: AlertOctagon,
      color: 'text-brand-teal-dark',
      bg: 'bg-teal-50 hover:bg-teal-100/70 border-teal-200',
    },
  ];

  useEffect(() => {
    fetchTravelerIncidents();
  }, []);

  const fetchTravelerIncidents = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      const res = await fetch(`${apiUrl}/incidents`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIncidents(data.data || []);
      }
    } catch (err) {
      console.warn('[Overview Fetch Warning]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Find active ongoing emergency
  const activeIncident = incidents.find(
    (inc) => inc.status !== 'Resolved' && inc.status !== 'Cancelled'
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Traveler'}`}
        subtitle="Your real-time travel safety monitor, emergency dispatch portal, and emergency responder network."
        breadcrumbs={['Traveler', 'Dashboard Overview']}
        action={
          <Link to="/traveler/report-emergency">
            <Button variant="emergency" size="md" icon={AlertOctagon}>
              Report Emergency (SOS)
            </Button>
          </Link>
        }
      />

      {/* ACTIVE EMERGENCY BANNER OR ALL-CLEAR STATUS */}
      {loading ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
          <LoadingSpinner size="md" text="Syncing safety network status..." />
        </div>
      ) : activeIncident ? (
        <div className="rounded-3xl bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emergency-red beacon-pulse-red" />
                <span className="text-xs font-black uppercase tracking-widest text-brand-teal">
                  Active Emergency in Progress
                </span>
                <span className="font-mono text-xs text-white/90 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {activeIncident.incidentReference || activeIncident.referenceNumber || `INC-${activeIncident._id.slice(-6).toUpperCase()}`}
                </span>
                <StatusBadge status={activeIncident.status} size="sm" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold">{activeIncident.title}</h3>

              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                  <span>{activeIncident.location?.address || 'Pinned Location'}</span>
                </span>
                {activeIncident.assignedProviderId && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span>
                      Unit: <strong className="text-white">{activeIncident.assignedProviderId.name || 'Responding Crew'}</strong>
                    </span>
                  </>
                )}
                {activeIncident.estimatedArrivalTimeMinutes && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-brand-teal font-bold">
                      ETA: {activeIncident.estimatedArrivalTimeMinutes} mins
                    </span>
                  </>
                )}
              </p>
            </div>

            <Link to={`/traveler/incidents/${activeIncident._id}`} className="shrink-0">
              <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right" className="shadow-lg">
                View Live Case Tracker
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-emerald-200/80 p-6 sm:p-7 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-extrabold text-brand-navy">
                  Travel Safety Status: All Clear
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                No active emergencies reported. If an urgent situation arises, tap any emergency button below.
              </p>
            </div>
          </div>

          <Link to="/traveler/report-emergency">
            <Button variant="emergency" size="sm" icon={Zap}>
              Quick SOS Beacon
            </Button>
          </Link>
        </div>
      )}

      {/* Emergency Quick-Trigger Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-brand-navy flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-emergency-red" />
            Instant Emergency Reporting
          </h3>
          <span className="text-xs text-slate-500 font-medium">Select a category to start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {emergencyCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/traveler/report-emergency?category=${encodeURIComponent(cat.title)}`}
                className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-card ${cat.bg} flex flex-col justify-between`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-100 flex items-center justify-center mb-3 ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-brand-navy leading-tight mb-1">
                    {cat.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-brand-navy">
                  <span>Report Now</span>
                  <span className="text-brand-teal">&rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Secondary Quick Access Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Emergency Facilities Near You"
          subtitle="Explore verified trauma hospitals, police divisions, and rescue points"
          action={
            <Link to="/services">
              <span className="text-xs font-bold text-brand-teal hover:underline">View Map &rarr;</span>
            </Link>
          }
        >
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emergency-red animate-pulse" />
                <div>
                  <div className="font-bold text-brand-navy">National Ambulance & Trauma Center</div>
                  <div className="text-[10px] text-slate-400">24/7 Rapid Emergency Response</div>
                </div>
              </div>
              <a href="tel:1990" className="font-extrabold text-brand-teal hover:underline px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200">
                Call: 1990
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <div>
                  <div className="font-bold text-brand-navy">Tourist Police Command Division</div>
                  <div className="text-[10px] text-slate-400">Traveler Security & Consular Support</div>
                </div>
              </div>
              <a href="tel:119" className="font-extrabold text-brand-teal hover:underline px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200">
                Call: 119
              </a>
            </div>
          </div>
        </Card>

        <Card
          title="Your Submitted Incident History"
          subtitle="Review previous cases, timestamps, and resolution summaries"
          action={
            <Link to="/traveler/incidents">
              <span className="text-xs font-bold text-brand-teal hover:underline">All Incidents &rarr;</span>
            </Link>
          }
        >
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500">Total Cases Reported:</span>
              <div className="text-2xl font-black text-brand-navy">
                {incidents.length} {incidents.length === 1 ? 'Incident' : 'Incidents'}
              </div>
              <span className="text-[11px] text-slate-400">Associated with your authenticated account</span>
            </div>
            <Link to="/traveler/incidents">
              <Button variant="outline" size="sm">
                Open History
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
