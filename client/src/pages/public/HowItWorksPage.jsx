import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  MapPin,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Radio,
  FileCheck2,
  Navigation
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      step: 'Step 1',
      title: 'Emergency Reporting & GPS Lock',
      member: 'Member 1: K.H.S. Dulanjani',
      desc: 'When a traveler encounters danger, they tap SOS on Safe Passage. The system queries browser GPS (navigator.geolocation) to obtain high-precision coordinates [longitude, latitude]. The user chooses a category, severity level (Critical, High, Medium, Low), and optionally attaches photos of vehicle damage or hazards.',
      features: ['One-tap coordinate lock', 'Category & severity taxonomy', 'Offline fallback address input', 'Photo upload simulation'],
      icon: AlertOctagon,
    },
    {
      step: 'Step 2',
      title: 'Geospatial Service Discovery',
      member: 'Member 2: J.D.R. Samindika',
      desc: 'Safe Passage executes a MongoDB 2dsphere $nearSphere query across the EmergencyServices directory. It scans within a configurable radius (e.g. 15km to 50km) for verified medical trauma units, tourist police stations, roadside tow operators, or coast guard bases.',
      features: ['MongoDB GeoJSON Point mapping', 'Distance calculation in meters', 'Interactive Leaflet markers', 'Category filtering'],
      icon: MapPin,
    },
    {
      step: 'Step 3',
      title: 'Case Lifecycle & State Machine',
      member: 'Member 3: J.K.S. Jayasundara',
      desc: 'Every emergency follows an enforceable finite state machine: Submitted → Under Review → Assigned → Assistance Dispatched → In Progress → Resolved. Illegal jumps are strictly blocked at the backend. Every update writes a permanent CaseLog audit record with user role and timestamp.',
      features: ['Deterministic finite state transitions', 'Chronological audit trail', 'Live timeline progress indicator', 'Tamper-proof case history'],
      icon: Clock,
    },
    {
      step: 'Step 4',
      title: 'Assistance Dispatch & Provider Portal',
      member: 'Member 4: M.H.F. Himla (Leader)',
      desc: 'Vetted assistance providers monitor an incoming dispatch queue. An available operator reviews incident details and coordinates, accepts the dispatch, provides an ETA, and updates their active job status (En Route → On Scene → Completed) while the traveler tracks their progress.',
      features: ['Live dispatch queue', 'Accept / Decline actions', 'Route guidance preview', 'Real-time traveler notification'],
      icon: UserCheck,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        title="How Safe Passage Operates"
        subtitle="A detailed breakdown of the 4 synchronized phases bridging travelers in distress with verified response teams."
        breadcrumbs={['Home', 'How It Works']}
      />

      <div className="space-y-12 my-10">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-4 flex flex-col items-start">
                <span className="text-xs font-black uppercase tracking-widest text-brand-teal px-3 py-1 rounded-full bg-brand-teal/10 mb-3">
                  {item.step}
                </span>
                <div className="p-4 rounded-2xl bg-brand-navy text-white mb-4">
                  <Icon className="w-8 h-8 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-extrabold text-brand-navy leading-tight">
                  {item.title}
                </h3>
                <span className="text-xs font-semibold text-slate-500 mt-2">
                  Module Owner: {item.member}
                </span>
              </div>

              <div className="lg:col-span-8 flex flex-col justify-between">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                  {item.desc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  {item.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-brand-teal" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-8 rounded-3xl bg-brand-navy text-white text-center mt-16 shadow-xl">
        <h3 className="text-2xl font-bold mb-2">Want to experience the full flow?</h3>
        <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6">
          Submit a test incident as a Traveler, review it in the Case Lifecycle manager, accept it as a Provider, and monitor it on the Admin Dashboard.
        </p>
        <Link to="/traveler/report">
          <Button variant="primary" icon={ArrowRight}>
            Try Emergency Reporting Flow
          </Button>
        </Link>
      </div>
    </div>
  );
}
