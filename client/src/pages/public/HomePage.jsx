import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SafePassageMap from '../../components/maps/MapContainer';
import {
  MapPin,
  Shield,
  Users,
  AlertOctagon,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Compass,
  HeartPulse,
  Truck
} from 'lucide-react';

export default function HomePage() {
  // Verified preview facilities for the interactive map
  const previewMarkers = [
    {
      _id: '1',
      name: 'National Hospital Emergency Trauma Unit',
      type: 'Hospital & Medical',
      address: 'Regent Street, Colombo 10',
      lat: 6.9189,
      lng: 79.8653,
      contactInfo: { phone: '+94 11 269 1111', emergencyHotline: '1990' },
      distanceKm: '1.2',
    },
    {
      _id: '2',
      name: 'Central Tourist Police Command',
      type: 'Police Station',
      address: 'Chatham Street, Fort, Colombo 01',
      lat: 6.9344,
      lng: 79.8436,
      contactInfo: { phone: '+94 11 242 1052', emergencyHotline: '119' },
      distanceKm: '2.4',
    },
    {
      _id: '3',
      name: 'Apex Expressway Towing Base',
      type: 'Roadside & Towing',
      address: 'Kottawa Interchange',
      lat: 6.8402,
      lng: 79.9574,
      contactInfo: { phone: '+94 11 789 4500', emergencyHotline: '1969' },
      distanceKm: '8.1',
    },
  ];

  return (
    <div className="bg-palette-bg text-palette-text flex flex-col gap-16 sm:gap-24 pb-20">
      {/* 1. Hero Section matching Reference */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Scenic Overlay matching reference */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85')`,
          }}
        >
          {/* Deep forest green/navy translucent gradient matching reference palette */}
          <div className="absolute inset-0 bg-gradient-to-r from-palette-primary-dark/95 via-palette-primary/85 to-palette-primary-dark/90" />
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 flex flex-col items-start text-left">
              <span className="text-xs font-bold tracking-widest uppercase text-palette-secondary-light mb-3">
                Emergency Assistance & Navigation
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
                Safe Passage <br />
                <span className="text-palette-secondary">for a Better Tomorrow</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-200 max-w-xl mb-8 leading-relaxed">
                When the unexpected happens, finding help shouldn't be another challenge. Safe Passage connects travelers with nearby emergency services, safe routes, and trusted local assistance through one simple platform.
              </p>

              {/* Two CTA Buttons matching Reference */}
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <Link to="/traveler/report">
                  <button className="px-6 py-3.5 rounded-xl text-sm font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white transition-all shadow-lg shadow-palette-secondary/25 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Get Started</span>
                  </button>
                </Link>
                <Link to="/about">
                  <button className="px-6 py-3.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all backdrop-blur-sm">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>

            {/* Hero Traveler Figure on Right matching reference */}
            <div className="hidden lg:flex lg:col-span-4 justify-center">
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl w-full max-w-sm aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80"
                  alt="Traveler exploring safe mountain routes"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-palette-primary-dark/80 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white text-xs">
                    <div className="font-bold uppercase tracking-wider text-palette-secondary-light">Verified Patrol</div>
                    <div className="text-sm font-semibold">24/7 Monitored Safe Corridors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Floating Feature Highlight Cards matching Reference */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-10 sm:-mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Safe Routes */}
          <div className="p-8 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-palette-secondary/30 bg-palette-bg flex items-center justify-center text-palette-secondary mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-palette-primary mb-2">Safe Routes</h3>
            <p className="text-xs text-palette-muted leading-relaxed">
              Find secure travel routes, vetted road conditions, and real-time situational updates.
            </p>
          </div>

          {/* Card 2: Support Services */}
          <div className="p-8 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-palette-secondary/30 bg-palette-bg flex items-center justify-center text-palette-secondary mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-palette-primary mb-2">Support Services</h3>
            <p className="text-xs text-palette-muted leading-relaxed">
              Access help, medical resources, accredited towing fleets, and emergency contacts.
            </p>
          </div>

          {/* Card 3: Community */}
          <div className="p-8 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-palette-secondary/30 bg-palette-bg flex items-center justify-center text-palette-secondary mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-palette-primary mb-2">Community</h3>
            <p className="text-xs text-palette-muted leading-relaxed">
              Join an interconnected network of travelers, local responders, and verified agencies.
            </p>
          </div>
        </div>
      </section>

      {/* 3. "Your Safety Matters" Section matching Reference */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
              Reliable Guidance
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-palette-primary leading-tight">
              Your Safety Matters
            </h2>
            <p className="text-sm sm:text-base text-palette-muted leading-relaxed">
              Whether you're traveling, relocating, or seeking emergency roadside rescue, Safe Passage is here to guide you every step of the journey with vetted local responders and verified emergency facilities.
            </p>
            <div className="pt-2 flex flex-col gap-3 text-xs text-palette-text">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-palette-secondary shrink-0" />
                <span>Geospatial radius queries locate nearest trauma facilities</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-palette-secondary shrink-0" />
                <span>Live timeline tracking for dispatches with verified arrival estimates</span>
              </div>
            </div>
          </div>

          {/* Right Winding Mountain Road Image matching Reference */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border border-palette-border shadow-card aspect-[16/10]">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                alt="Winding road through scenic mountains"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stats Counter Row matching Reference: 10K+ / 50+ / 100+ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-palette-border shadow-card grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="pt-4 md:pt-0">
            <div className="text-4xl sm:text-5xl font-black text-palette-primary">10K+</div>
            <div className="text-xs font-bold uppercase tracking-wider text-palette-muted mt-2">People Helped</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-4xl sm:text-5xl font-black text-palette-secondary">50+</div>
            <div className="text-xs font-bold uppercase tracking-wider text-palette-muted mt-2">Trusted Partners</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-4xl sm:text-5xl font-black text-palette-primary">100+</div>
            <div className="text-xs font-bold uppercase tracking-wider text-palette-muted mt-2">Safe Routes</div>
          </div>
        </div>
      </section>

      {/* 5. Live Interactive Radar Map (Prompt Requirement) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 rounded-3xl bg-white border border-palette-border shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
                Interactive Radar
              </span>
              <h3 className="text-2xl font-extrabold text-palette-primary">
                Live Verified Emergency Map
              </h3>
            </div>
            <Link to="/services">
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-primary text-white hover:bg-palette-primary-light">
                Explore Full Directory Map &rarr;
              </button>
            </Link>
          </div>
          <SafePassageMap
            center={[6.9271, 79.8612]}
            zoom={12}
            markers={previewMarkers}
            height="400px"
          />
        </div>
      </section>

      {/* 6. "Together for Safer Journeys" CTA Banner matching Reference */}
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
