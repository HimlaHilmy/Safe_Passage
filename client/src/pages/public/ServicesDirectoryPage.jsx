import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SafePassageMap from '../../components/maps/MapContainer';
import SearchBar from '../../components/common/SearchBar';
import FilterControls from '../../components/common/FilterControls';
import Card from '../../components/common/Card';
import {
  MapPin,
  Shield,
  FileText,
  Users,
  Phone,
  AlertOctagon,
  Compass,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  'Hospital & Medical',
  'Police Station',
  'Fire & Rescue',
  'Roadside & Towing',
  'Coast Guard & Marine',
];

export default function ServicesDirectoryPage() {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(50000);
  const [activeCenter, setActiveCenter] = useState([6.9271, 79.8612]); // Colombo
  const [loading, setLoading] = useState(true);

  // 4 Primary Service Cards matching Reference Screen 3
  const primaryServices = [
    {
      title: 'Safe Route Guidance',
      desc: 'Get up-to-date information on safe routes and avoid high-risk areas.',
      icon: MapPin,
    },
    {
      title: 'Emergency Support',
      desc: 'Access help and emergency contacts when you need it most.',
      icon: Shield,
    },
    {
      title: 'Resource Center',
      desc: 'Find guides, documents, and useful information.',
      icon: FileText,
    },
    {
      title: 'Community Network',
      desc: 'Connect with other travelers and support groups.',
      icon: Users,
    },
  ];

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, selectedRadius]);

  const fetchServices = async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      let url = `${apiUrl}/services/nearby?lng=${activeCenter[1]}&lat=${activeCenter[0]}&radius=${selectedRadius}`;
      if (selectedCategory) {
        url += `&type=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.data || []);
      }
    } catch {
      // Offline fallback
      setServices([
        {
          _id: '65s1',
          name: 'National Hospital Emergency Trauma Unit',
          type: 'Hospital & Medical',
          address: 'Regent Street, Colombo 10',
          location: { type: 'Point', coordinates: [79.8653, 6.9189] },
          contactInfo: { phone: '+94 11 269 1111', emergencyHotline: '1990', operatingHours: '24/7' },
          distanceKm: '1.2',
        },
        {
          _id: '65s2',
          name: 'Central Tourist Police Command',
          type: 'Police Station',
          address: 'Chatham Street, Fort, Colombo 01',
          location: { type: 'Point', coordinates: [79.8436, 6.9344] },
          contactInfo: { phone: '+94 11 242 1052', emergencyHotline: '119', operatingHours: '24/7' },
          distanceKm: '2.4',
        },
        {
          _id: '65s3',
          name: 'Metropolitan Fire & Rescue Command',
          type: 'Fire & Rescue',
          address: 'T.B. Jayah Mawatha, Colombo 10',
          location: { type: 'Point', coordinates: [79.8631, 6.9242] },
          contactInfo: { phone: '+94 11 242 2222', emergencyHotline: '110', operatingHours: '24/7' },
          distanceKm: '1.8',
        },
        {
          _id: '65s4',
          name: 'Apex Highway Towing & Road Rescue',
          type: 'Roadside & Towing',
          address: 'Southern Expressway Interchange, Kottawa',
          location: { type: 'Point', coordinates: [79.9574, 6.8402] },
          contactInfo: { phone: '+94 11 789 4500', emergencyHotline: '1969', operatingHours: '24/7' },
          distanceKm: '8.1',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="bg-palette-bg text-palette-text flex flex-col gap-14 sm:gap-20 pb-20">
      {/* 1. Hero Banner matching Reference Screen 3 */}
      <section className="relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=2000&q=85')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-palette-primary-dark/95 via-palette-primary/90 to-palette-primary-dark/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Our Services
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            We provide tools, resources, and support to help you travel and relocate safely.
          </p>
        </div>
      </section>

      {/* 2. Four Primary Service Cards matching Reference Screen 3 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {primaryServices.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-palette-secondary/15 flex items-center justify-center text-palette-secondary mb-4 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-palette-primary mb-2">{srv.title}</h3>
                <p className="text-xs text-palette-muted leading-relaxed flex-1">{srv.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. "Need Immediate Help?" Callout Box matching Reference Screen 3 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-white border border-palette-border shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 items-center">
          {/* Left Photo of Person on Phone matching reference */}
          <div className="md:col-span-5 h-64 md:h-full min-h-[220px]">
            <img
              src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=800&q=80"
              alt="Person using emergency support hotline"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Text & CTA */}
          <div className="md:col-span-7 p-8 sm:p-12 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
              24/7 Operations Desk
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-palette-primary">
              Need Immediate Help?
            </h3>
            <p className="text-sm text-palette-muted leading-relaxed">
              Our support team and accredited first responders are available 24/7 to assist you anywhere along your route.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/contact">
                <button className="px-6 py-3 rounded-xl text-xs font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white transition-all shadow-md">
                  Contact Support
                </button>
              </Link>
              <a
                href="tel:1990"
                className="px-6 py-3 rounded-xl text-xs font-bold border border-palette-primary text-palette-primary hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-palette-secondary" />
                <span>Call Hotline (1990)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Geospatial Directory & Radar Map (Member 2 Module) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-palette-secondary">
            Geospatial Radar
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-palette-primary mt-1">
            Emergency Services Directory & Map
          </h2>
          <p className="text-sm text-palette-muted mt-1">
            Find verified trauma hospitals, police stations, roadside towing bases, and maritime rescue points.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border border-palette-border shadow-card space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by facility name, address, or service..."
              className="w-full md:max-w-md"
            />
            <div className="text-xs text-palette-muted font-semibold">
              Showing {filteredServices.length} verified facilities
            </div>
          </div>

          <FilterControls
            categories={SERVICE_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedRadius={selectedRadius}
            onSelectRadius={setSelectedRadius}
          />
        </div>

        {/* Split View Map & Listing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 sticky top-28">
            <div className="bg-white rounded-3xl p-3 border border-palette-border shadow-card">
              <SafePassageMap
                center={activeCenter}
                zoom={12}
                markers={filteredServices}
                height="500px"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {filteredServices.map((service) => (
              <div
                key={service._id}
                onClick={() => {
                  const lat = service.location?.coordinates?.[1] || service.lat;
                  const lng = service.location?.coordinates?.[0] || service.lng;
                  if (lat && lng) setActiveCenter([lat, lng]);
                }}
                className="p-5 rounded-2xl bg-white border border-palette-border hover:border-palette-secondary hover:shadow-card transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-palette-secondary/15 text-palette-secondary border border-palette-secondary/20">
                    {service.type}
                  </span>
                  {service.distanceKm && (
                    <span className="text-xs font-bold text-palette-muted">
                      {service.distanceKm} km away
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-base text-palette-primary">{service.name}</h4>
                <p className="text-xs text-palette-muted flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-palette-secondary shrink-0 mt-0.5" />
                  <span>{service.address}</span>
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a href={`tel:${service.contactInfo?.phone}`} className="font-bold text-palette-secondary hover:underline">
                    {service.contactInfo?.phone}
                  </a>
                  {service.contactInfo?.emergencyHotline && (
                    <span className="font-extrabold text-emergency-red">
                      SOS: {service.contactInfo.emergencyHotline}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
