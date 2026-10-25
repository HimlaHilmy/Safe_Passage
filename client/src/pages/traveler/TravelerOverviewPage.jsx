import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import {
  AlertOctagon,
  MapPin,
  Clock,
  Phone,
  HeartPulse,
  Truck,
  Shield,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function TravelerOverviewPage() {
  const { user } = useAuth();

  const activeIncident = {
    _id: '65f000000000000000000010',
    title: 'Engine overheating on Mountain Pass A4',
    category: 'Roadside & Vehicle Breakdown',
    severity: 'High',
    status: 'Assistance Dispatched',
    etaMinutes: 18,
    provider: 'Apex Rapid Response Ltd',
    address: 'Route A4, Mile Marker 42, Central Province',
  };

  const emergencyCategories = [
    { title: 'Medical Emergency', icon: HeartPulse, color: 'text-emergency-red', bg: 'bg-red-50 hover:bg-red-100/70 border-red-200' },
    { title: 'Roadside Breakdown', icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100/70 border-amber-200' },
    { title: 'Crime & Theft', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100/70 border-blue-200' },
    { title: 'Lost & Stranded', icon: Compass, color: 'text-brand-teal-dark', bg: 'bg-teal-50 hover:bg-teal-100/70 border-teal-200' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Traveler'}`}
        subtitle="Your real-time travel safety monitor, emergency dispatch link, and local verified facilities."
        breadcrumbs={['Traveler', 'Overview']}
        action={
          <Link to="/traveler/report">
            <Button variant="emergency" size="md" icon={AlertOctagon}>
              Report Emergency (SOS)
            </Button>
          </Link>
        }
      />

      {/* Active Live Emergency Banner */}
      {activeIncident && (
        <div className="rounded-3xl bg-gradient-to-r from-brand-navy via-brand-navy-light to-brand-navy text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emergency-red beacon-pulse-red" />
                <span className="text-xs font-black uppercase tracking-widest text-brand-teal">
                  Active Dispatch in Progress
                </span>
                <StatusBadge status={activeIncident.status} size="sm" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">{activeIncident.title}</h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                <span>{activeIncident.address}</span>
                <span className="mx-1">•</span>
                <span>Responding: <strong className="text-white">{activeIncident.provider}</strong> (ETA {activeIncident.etaMinutes}m)</span>
              </p>
            </div>

            <Link to={`/traveler/incidents/${activeIncident._id}`}>
              <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                View Live Case Tracker
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Emergency Quick-Trigger Grid */}
      <div>
        <h3 className="text-lg font-extrabold text-brand-navy mb-4">
          Instant Emergency Dispatch
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {emergencyCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/traveler/report?category=${encodeURIComponent(cat.title)}`}
                className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-card ${cat.bg} flex items-center gap-4`}
              >
                <div className={`p-3 rounded-xl bg-white shadow-xs ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-navy leading-tight">{cat.title}</h4>
                  <span className="text-xs text-slate-500 font-medium">Request Aid &rarr;</span>
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
            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emergency-red" />
                <span className="font-bold text-brand-navy">National Trauma Hospital</span>
              </div>
              <a href="tel:1990" className="font-extrabold text-brand-teal hover:underline">
                Call: 1990
              </a>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-bold text-brand-navy">Tourist Police Command</span>
              </div>
              <a href="tel:119" className="font-extrabold text-brand-teal hover:underline">
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500">Total Cases Reported:</span>
              <div className="text-2xl font-black text-brand-navy">3 Emergencies</div>
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
