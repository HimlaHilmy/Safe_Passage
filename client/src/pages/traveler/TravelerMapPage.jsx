import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SafePassageMap from '../../components/maps/MapContainer';
import ServiceCard from '../../components/services/ServiceCard';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  MapPin,
  Navigation,
  Compass,
  Search,
  Filter,
  SlidersHorizontal,
  RotateCw,
  HeartPulse,
  Shield,
  Building2,
  Wrench,
  Truck,
  Phone,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  LocateFixed,
  Layers,
  X
} from 'lucide-react';

const CATEGORIES = [
  { key: '', label: 'All', icon: Compass },
  { key: 'Hospitals', label: 'Hospitals', icon: HeartPulse, color: 'text-emergency-red' },
  { key: 'Police Stations', label: 'Police', icon: Shield, color: 'text-blue-600' },
  { key: 'Embassies', label: 'Embassies', icon: Building2, color: 'text-purple-600' },
  { key: 'Mechanics', label: 'Mechanics', icon: Wrench, color: 'text-amber-600' },
  { key: 'Towing Services', label: 'Towing', icon: Truck, color: 'text-brand-teal' },
];

const RADIUS_OPTIONS = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' },
  { value: 100000, label: '100 km' },
];

const CITIES = [
  { name: 'Colombo', coords: [6.9271, 79.8612] },
  { name: 'Kandy', coords: [7.2906, 80.6337] },
  { name: 'Galle', coords: [6.0535, 80.2210] },
  { name: 'Negombo', coords: [7.2094, 79.8398] },
  { name: 'Ella', coords: [6.8667, 81.0466] },
];

/**
 * Interactive Mapping & Situational Awareness Console
 * Primary Owner: Member 2 (J.D.R. Samindika)
 * Primary Route: /traveler/map
 */
export default function TravelerMapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [center, setCenter] = useState([6.9271, 79.8612]); // Colombo
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Colombo Metropolitan Area');
  const [selectedRadius, setSelectedRadius] = useState(50000);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [gpsLocating, setGpsLocating] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Fetch Nearby Services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [lat, lng] = center;

    try {
      let url = `${apiUrl}/services/nearby?lng=${lng}&lat=${lat}&radius=${selectedRadius}`;
      if (selectedCategory) {
        url += `&type=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setServices(json.data || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }, [center, selectedRadius, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Keep selectedService in sync
  useEffect(() => {
    if (selectedServiceId) {
      const found = services.find((s) => s._id === selectedServiceId);
      setSelectedService(found || null);
    } else {
      setSelectedService(null);
    }
  }, [selectedServiceId, services]);

  // GPS Detection Handler
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) return;
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
        setUserLocation({
          lat: latitude,
          lng: longitude,
          address: 'Current Device GPS Position',
        });
        setLocationName('Live GPS Position');
        setGpsLocating(false);
      },
      () => {
        setGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectCity = (city) => {
    setCenter(city.coords);
    setLocationName(`${city.name}, Sri Lanka`);
    setUserLocation({
      lat: city.coords[0],
      lng: city.coords[1],
      address: `${city.name} City Center`,
    });
    setSelectedServiceId(null);
  };

  const handleMarkerClick = (marker) => {
    setSelectedServiceId(marker._id);
  };

  const handleDirections = (srv) => {
    const lat = srv.location?.coordinates?.[1] || srv.lat;
    const lng = srv.location?.coordinates?.[0] || srv.lng;
    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto overflow-x-hidden">
      {/* Top Header */}
      <PageHeader
        title="Interactive Geolocation & Situational Map"
        subtitle="Real-time OpenStreetMap radar displaying accredited emergency providers, embassies, and roadside fleets."
        breadcrumbs={[
          { label: 'Traveler Portal', path: '/traveler' },
          { label: 'Interactive Map', path: '/traveler/map' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              onClick={fetchServices}
              isLoading={loading}
            >
              Refresh Radar
            </Button>
            <Button
              variant="emergency"
              size="sm"
              icon={AlertOctagon}
              onClick={() => navigate('/traveler/report')}
            >
              Report Incident Here
            </Button>
          </div>
        }
      />

      {/* Main Map Explorer Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl flex flex-col lg:flex-row h-[780px]">
        {/* Left Side Floating Drawer / Control Panel */}
        <div
          className={`
            bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-20 flex flex-col shrink-0
            ${sidebarCollapsed ? 'w-0 lg:w-16 overflow-hidden' : 'w-full lg:w-96'}
          `}
        >
          {/* Sidebar Header & Toggle */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            {!sidebarCollapsed && (
              <div>
                <h3 className="font-bold text-sm text-brand-navy">Radar Controls</h3>
                <p className="text-[11px] text-slate-500">{locationName}</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-brand-navy transition-all"
              title={sidebarCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {/* GPS Locate Me Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsLocating}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-light transition-all shadow-sm"
              >
                <LocateFixed className={`w-4 h-4 text-brand-teal ${gpsLocating ? 'animate-spin' : ''}`} />
                <span>{gpsLocating ? 'Acquiring GPS Fix...' : 'Detect My Exact Location'}</span>
              </button>

              {/* City Presets */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Quick Regions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CITIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCity(c)}
                      className={`
                        px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                        ${
                          locationName.includes(c.name)
                            ? 'bg-brand-teal text-brand-navy font-bold shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }
                      `}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Filter by Category
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`
                          flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all text-left
                          ${
                            isSelected
                              ? 'bg-brand-teal text-brand-navy shadow-sm ring-1 ring-brand-teal'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }
                        `}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-navy' : cat.color || 'text-slate-500'}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Radius Selector */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>Coverage Radius</span>
                  <span className="text-brand-navy font-extrabold">{selectedRadius / 1000} km</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedRadius(r.value)}
                      className={`
                        py-1 rounded-lg text-[11px] font-bold transition-all text-center
                        ${
                          selectedRadius === r.value
                            ? 'bg-brand-navy text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }
                      `}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discovered Services Count and Quick List */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Services on Radar</span>
                  <span className="px-2 py-0.5 rounded-full bg-brand-teal/15 text-brand-teal-dark">
                    {services.length}
                  </span>
                </div>

                {loading && (
                  <div className="py-8 flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                )}

                {!loading && services.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No services detected in this radius. Expand to 50 km or 100 km.
                  </div>
                )}

                {!loading && services.length > 0 && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {services.map((srv) => (
                      <div
                        key={srv._id}
                        onClick={() => {
                          setSelectedServiceId(srv._id);
                          const sLat = srv.location?.coordinates?.[1] || srv.lat;
                          const sLng = srv.location?.coordinates?.[0] || srv.lng;
                          if (sLat && sLng) setCenter([sLat, sLng]);
                        }}
                        className={`
                          p-3 rounded-xl border text-xs cursor-pointer transition-all
                          ${
                            selectedServiceId === srv._id
                              ? 'bg-teal-50/60 border-brand-teal shadow-sm font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold uppercase text-brand-teal truncate">
                            {srv.type}
                          </span>
                          {srv.distanceKm && (
                            <span className="text-[10px] text-slate-500 font-extrabold">
                              {srv.distanceKm} km
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-brand-navy truncate">{srv.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{srv.address}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Hotline Quick Strip */}
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emergency-red">
                  <Phone className="w-3.5 h-3.5" />
                  <span>National Emergency Hotlines</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-bold">
                  <a href="tel:1990" className="text-slate-700 hover:text-emergency-red">
                    🚑 1990 (Ambulance)
                  </a>
                  <a href="tel:119" className="text-slate-700 hover:text-blue-600">
                    👮 119 (Police)
                  </a>
                  <a href="tel:1969" className="text-slate-700 hover:text-amber-600">
                    🛣️ 1969 (Expressway)
                  </a>
                  <a href="tel:110" className="text-slate-700 hover:text-orange-600">
                    🚒 110 (Fire & Rescue)
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Map Canvas (Taking Remaining Space) */}
        <div className="flex-1 relative h-full">
          <SafePassageMap
            center={center}
            zoom={selectedRadius <= 10000 ? 13 : selectedRadius <= 25000 ? 12 : 11}
            markers={services}
            selectedMarkerId={selectedServiceId}
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation || { lat: center[0], lng: center[1], address: locationName }}
            searchRadius={selectedRadius}
            height="100%"
            className="w-full h-full rounded-none"
          />

          {/* Floating Selected Service Bottom Inspector Card */}
          {selectedService && (
            <div className="absolute bottom-6 left-6 right-6 lg:left-12 lg:right-auto lg:max-w-md z-[500] animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-2xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-teal/15 text-brand-teal-dark border border-brand-teal/20">
                    {selectedService.type}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedService.distanceKm && (
                      <span className="text-xs font-extrabold text-brand-navy bg-slate-100 px-2 py-0.5 rounded-md">
                        {selectedService.distanceKm} km away
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedServiceId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-brand-navy leading-snug">
                  {selectedService.name}
                </h4>

                <p className="text-xs text-slate-500 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{selectedService.address}</span>
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {selectedService.contactInfo?.phone ? (
                    <a
                      href={`tel:${selectedService.contactInfo.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedService.contactInfo.phone}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No phone</span>
                  )}

                  <button
                    onClick={() => handleDirections(selectedService)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-light transition-all shadow-sm"
                  >
                    <Navigation className="w-3 h-3 text-brand-teal" />
                    <span>Get Directions</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
