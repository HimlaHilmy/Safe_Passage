import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import { Shield, Users, HeartHandshake, CheckCircle2, Award, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      title: 'Safety',
      desc: 'Your safety is our priority.',
      icon: Shield,
    },
    {
      title: 'Community',
      desc: 'Stronger together.',
      icon: Users,
    },
    {
      title: 'Accessibility',
      desc: 'Support for all.',
      icon: HeartHandshake,
    },
    {
      title: 'Trust',
      desc: 'Reliable and transparent.',
      icon: CheckCircle2,
    },
  ];

  const team = [
    { name: 'M.H.F. Himla', role: 'Group Leader & System Architect', module: 'Assistance Dispatch & Provider Portal' },
    { name: 'K.H.S. Dulanjani', role: 'Software Engineer', module: 'Emergency Reporting System' },
    { name: 'J.D.R. Samindika', role: 'Software Engineer', module: 'Geolocation & Service Discovery' },
    { name: 'J.K.S. Jayasundara', role: 'Software Engineer', module: 'Case Lifecycle Manager' },
    { name: 'R.P.J.H. Hirunika', role: 'Software Engineer', module: 'Admin Analytics & Operations' },
  ];

  return (
    <div className="bg-palette-bg text-palette-text flex flex-col gap-16 sm:gap-24 pb-20">
      {/* 1. Hero Banner matching Reference Screen 2 */}
      <section className="relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=85')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-palette-primary-dark/95 via-palette-primary/90 to-palette-primary-dark/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            About Safe Passage
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            Our mission is to make travel and relocation safer, easier, and more supported for everyone.
          </p>
        </div>
      </section>

      {/* 2. "Our Mission" Section matching Reference Screen 2 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-palette-border shadow-card grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
              Purpose & Dedication
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-palette-primary">
              Our Mission
            </h2>
            <p className="text-sm sm:text-base text-palette-muted leading-relaxed">
              Safe Passage exists to provide reliable information, resources, and support for individuals and families on the move. We believe everyone deserves a safe journey, no matter where they are going.
            </p>
            <p className="text-xs text-palette-muted leading-relaxed">
              By combining high-accuracy geospatial discovery with an enforceable case lifecycle and direct provider dispatch, we eliminate confusion and ensure help arrives with zero delay.
            </p>
          </div>

          {/* Right Image: Hikers against Sunset matching Reference */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden border border-palette-border shadow-sm aspect-[16/10]">
              <img
                src="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=1000&q=80"
                alt="Hikers silhouetted against sunset"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. "Our Values" Section matching Reference: 4 clean cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
            Core Principles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-palette-primary mt-1">
            Our Values
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all text-center flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full border-2 border-palette-secondary/30 bg-palette-bg flex items-center justify-center text-palette-secondary mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-palette-primary mb-1">{val.title}</h4>
                <p className="text-xs text-palette-muted">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. University Development Team Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
            Engineering Team
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-palette-primary mt-1">
            Development Team & Leadership
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((m, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-palette-border shadow-card flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-full bg-palette-primary text-white font-bold flex items-center justify-center text-sm shrink-0">
                {m.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-palette-primary">{m.name}</h4>
                <div className="text-xs font-semibold text-palette-secondary">{m.role}</div>
                <div className="text-[11px] text-palette-muted mt-1">{m.module}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. "Together for Safer Journeys" CTA Banner matching Reference */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-10 sm:p-14 rounded-3xl bg-palette-primary text-white text-center shadow-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Together for Safer Journeys
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We work with trusted partners, organizations, and communities to create a safer and more connected world.
            </p>
            <div className="pt-2">
              <Link to="/traveler/report">
                <button className="px-6 py-3 rounded-xl text-xs font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white transition-all shadow-md">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
