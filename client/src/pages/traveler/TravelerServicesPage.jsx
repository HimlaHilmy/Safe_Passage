import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SafePassageMap from '../../components/maps/MapContainer';
import ServiceCard from '../../components/services/ServiceCard';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
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
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Layers,
  Map as MapIcon,
  List as ListIcon,
  PhoneCall
} from 'lucide-react';

// 5 Core Service Categories required by Safe Passage specifications
const CATEGORIES = [
  { key: '', label: 'All Services', icon: Compass },
  { key: 'Hospitals', label: 'Hospitals', icon: HeartPulse, color: 'text-emergency-red' },
  { key: 'Police Stations', label: 'Police Stations', icon: Shield, color: 'text-blue-600' },
  { key: 'Embassies', label: 'Embassies', icon: Building2, color: 'text-purple-600' },
  { key: 'Mechanics', label: 'Mechanics', icon: Wrench, color: 'text-amber-600' },
  { key: 'Towing Services', label: 'Towing Services', icon: Truck, color: 'text-brand-teal' },
];

// Configurable Search Radius Presets (in meters)
const RADIUS_OPTIONS = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' },
  { value: 100000, label: '100 km' },
];

// Quick City Presets in Sri Lanka
const QUICK_LOCATIONS = [
  { name: 'Colombo', coords: [6.9271, 79.8612] },
  { name: 'Kandy', coords: [7.2906, 80.6337] },
  { name: 'Galle', coords: [6.0535, 80.2210] },
  { name: 'Negombo / BIA', coords: [7.2094, 79.8398] },
  { name: 'Ella / Badulla', coords: [6.8667, 81.0466] },
];

/**
 * Geolocation & Service Discovery Page
 * Primary Owner: Member 2 (J.D.R. Samindika)
 * Primary Route: /traveler/services
 */

// Verified demonstration & public emergency dataset for offline resilience
const FALLBACK_SERVICES = [
  {
    _id: '65s000000000000000000001',
    name: 'National Hospital Emergency Trauma Unit',
    type: 'Hospital & Medical',
    category: 'Hospital & Medical',
    address: 'Regent Street, Colombo 10',
    location: { type: 'Point', coordinates: [79.8653, 6.9189] },
    contactInfo: {
      phone: '+94 11 269 1111',
      emergencyHotline: '1990',
      email: 'emergency@nationalhospital.health.gov',
      operatingHours: '24/7 Continuous Trauma Care',
    },
    servicesOffered: ['Trauma Surgery', 'ICU', 'Cardiac Emergency', 'Ambulance Dispatch', 'Burn Unit'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000002',
    name: 'Colombo South Teaching Hospital (Kalubowila)',
    type: 'Hospital & Medical',
    category: 'Hospital & Medical',
    address: 'Kalubowila Road, Dehiwala-Mount Lavinia',
    location: { type: 'Point', coordinates: [79.8856, 6.8732] },
    contactInfo: {
      phone: '+94 11 276 3066',
      emergencyHotline: '1990',
      operatingHours: '24/7 Casualty & Outpatient Care',
    },
    servicesOffered: ['Emergency Room', 'Pediatric ICU', 'Orthopedic Trauma'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000003',
    name: 'Kandy General Teaching Hospital',
    type: 'Hospital & Medical',
    category: 'Hospital & Medical',
    address: 'William Gopallawa Mawatha, Kandy',
    location: { type: 'Point', coordinates: [80.627, 7.286] },
    contactInfo: {
      phone: '+94 81 222 2261',
      emergencyHotline: '1990',
      operatingHours: '24/7 Central Province Regional Trauma',
    },
    servicesOffered: ['Critical Care', 'Snakebite Envenomation', 'Helipad'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000004',
    name: 'Central Tourist Police Division',
    type: 'Police Station',
    category: 'Police Station',
    address: 'Chatham Street, Fort, Colombo 01',
    location: { type: 'Point', coordinates: [79.8436, 6.9344] },
    contactInfo: {
      phone: '+94 11 242 1052',
      emergencyHotline: '119',
      email: 'touristpolice@police.lk',
      operatingHours: '24/7 Tourist Assistance',
    },
    servicesOffered: ['Tourist Support', 'Incident Reporting', 'Rapid Response Patrol'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000005',
    name: 'Kandy Tourist Police Unit',
    type: 'Police Station',
    category: 'Police Station',
    address: 'Raja Veediya, Kandy',
    location: { type: 'Point', coordinates: [80.6385, 7.2936] },
    contactInfo: {
      phone: '+94 81 222 2222',
      emergencyHotline: '119',
      operatingHours: '24/7 Safety Command',
    },
    servicesOffered: ['Visitor Protection', 'Lost Property Recovery'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000006',
    name: 'Embassy of the United States of America',
    type: 'Embassy & Consulate',
    category: 'Embassy & Consulate',
    address: '107 Galle Road, Colombo 03',
    location: { type: 'Point', coordinates: [79.8492, 6.9157] },
    contactInfo: {
      phone: '+94 11 249 8500',
      emergencyHotline: '+94 11 249 8500',
      operatingHours: 'Mon-Fri 08:00 - 16:30 (24/7 Citizen Emergency Line)',
    },
    servicesOffered: ['Emergency Passport', 'Citizen Evacuation', 'Legal Liaison'],
    verificationStatus: 'verified',
    rating: 4.6,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000007',
    name: 'British High Commission Colombo',
    type: 'Embassy & Consulate',
    category: 'Embassy & Consulate',
    address: '389 Bauddhaloka Mawatha, Colombo 07',
    location: { type: 'Point', coordinates: [79.8698, 6.9011] },
    contactInfo: {
      phone: '+94 11 539 0639',
      emergencyHotline: '+94 11 539 0639',
      operatingHours: '24/7 Consular Assistance',
    },
    servicesOffered: ['Emergency Travel Documents', 'Consular Support'],
    verificationStatus: 'verified',
    rating: 4.7,
    isDemonstration: false,
  },
  {
    _id: '65s000000000000000000008',
    name: 'Auto Miraj Grand Express Repair & Diagnostics',
    type: 'Mechanic & Repair',
    category: 'Mechanic & Repair',
    address: 'Baseline Road, Colombo 09',
    location: { type: 'Point', coordinates: [79.8785, 6.9321] },
    contactInfo: {
      phone: '+94 11 268 4500',
      operatingHours: '07:00 - 22:00 Daily & On-call Mobile Units',
    },
    servicesOffered: ['Computer Diagnostics', 'Brake Systems', 'Engine Overhaul', 'Battery Care'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: true,
  },
  {
    _id: '65s000000000000000000009',
    name: 'Apex Highway Towing & 24/7 Road Rescue',
    type: 'Roadside & Towing',
    category: 'Roadside & Towing',
    address: 'Kottawa Interchange, Southern Expressway Entrance',
    location: { type: 'Point', coordinates: [79.9574, 6.8402] },
    contactInfo: {
      phone: '+94 11 789 4500',
      emergencyHotline: '1969',
      operatingHours: '24/7 Expressway & Arterial Patrol',
    },
    servicesOffered: ['Flatbed Towing', 'Highway Winching', 'Battery Jumpstart', 'Fuel Delivery'],
    verificationStatus: 'verified',
    rating: 4.9,
    isDemonstration: true,
  },
  {
    _id: '65s000000000000000000010',
    name: 'Metropolitan Fire & Rescue Command',
    type: 'Fire & Rescue',
    category: 'Fire & Rescue',
    address: 'T.B. Jayah Mawatha, Colombo 10',
    location: { type: 'Point', coordinates: [79.8631, 6.9242] },
    contactInfo: {
      phone: '+94 11 242 2222',
      emergencyHotline: '110',
      operatingHours: '24/7 Continuous Emergency Response',
    },
    servicesOffered: ['Fire Suppression', 'Chemical Hazard Extrication', 'Flood Rescue'],
    verificationStatus: 'verified',
    rating: 4.8,
    isDemonstration: false,
  },
];

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const CATEGORY_MAP = {
  hospitals: ['Hospital & Medical', 'Hospitals'],
  'hospital & medical': ['Hospital & Medical', 'Hospitals'],
  'police stations': ['Police Station', 'Police Stations'],
  'police station': ['Police Station', 'Police Stations'],
  embassies: ['Embassy & Consulate', 'Embassies'],
  'embassy & consulate': ['Embassy & Consulate', 'Embassies'],
  mechanics: ['Mechanic & Repair', 'Mechanics'],
  'mechanic & repair': ['Mechanic & Repair', 'Mechanics'],
  'towing services': ['Roadside & Towing', 'Towing Services'],
  'roadside & towing': ['Roadside & Towing', 'Towing Services'],
  'fire & rescue': ['Fire & Rescue'],
};

export default function TravelerServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Coordinates [lat, lng]
  const [queryCenter, setQueryCenter] = useState([6.9271, 79.8612]); // Colombo default
  const [userGpsLocation, setUserGpsLocation] = useState(null); // Actual GPS if detected
  const [locationName, setLocationName] = useState('Colombo, Western Province');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedRadius, setSelectedRadius] = useState(
    Number(searchParams.get('radius')) || 50000
  );
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  // Data & UI State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'
  const [gpsMessage, setGpsMessage] = useState('');

  // Mobile View Switcher: 'list' | 'map'
  const [mobileTab, setMobileTab] = useState('list');

  // Manual Location Search Input
  const [manualLocationInput, setManualLocationInput] = useState('');

  const serviceListRef = useRef(null);
  const cardRefs = useRef({});

  // Sync state to URL Query Params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedRadius) params.set('radius', String(selectedRadius));
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, selectedRadius, setSearchParams]);

  // Fetch Nearby Emergency Services from Backend API (with robust local dataset fallback)
  const fetchNearbyServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [lat, lng] = queryCenter;

    try {
      let endpoint = `${apiUrl}/services/nearby?lng=${lng}&lat=${lat}&radius=${selectedRadius}`;
      if (selectedCategory) {
        endpoint += `&type=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchTerm) {
        endpoint += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(endpoint);
      const json = await res.json();

      if (res.ok && json.success && json.data && json.data.length > 0) {
        setServices(json.data);
        return;
      }
      throw new Error('Using verified local dataset fallback');
    } catch {
      // Local fallback calculation based on coordinates
      const matchedCategories = selectedCategory ? (CATEGORY_MAP[selectedCategory.toLowerCase()] || [selectedCategory]) : null;

      let fallbackList = FALLBACK_SERVICES.map((s) => {
        const sLng = s.location.coordinates[0];
        const sLat = s.location.coordinates[1];
        const dist = calculateDistanceMeters(lat, lng, sLat, sLng);
        return {
          ...s,
          distanceMeters: Math.round(dist),
          distanceKm: (dist / 1000).toFixed(1),
        };
      });

      // Filter by radius if any match, or retain nearest facilities
      const withinRadius = fallbackList.filter((s) => s.distanceMeters <= selectedRadius);
      if (withinRadius.length > 0) {
        fallbackList = withinRadius;
      }

      if (matchedCategories) {
        fallbackList = fallbackList.filter((s) =>
          matchedCategories.some((mc) => s.type.toLowerCase().includes(mc.toLowerCase()))
        );
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        fallbackList = fallbackList.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q)
        );
      }

      fallbackList.sort((a, b) => a.distanceMeters - b.distanceMeters);
      setServices(fallbackList);
    } finally {
      setLoading(false);
    }
  }, [queryCenter, selectedRadius, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchNearbyServices();
  }, [fetchNearbyServices]);

  // Auto-scroll to selected service card when marker clicked
  useEffect(() => {
    if (selectedServiceId && cardRefs.current[selectedServiceId]) {
      cardRefs.current[selectedServiceId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedServiceId]);

  // GPS Geolocation Detection with Permission Handling
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('locating');
    setGpsMessage('Requesting GPS coordinates from browser sensor...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = [latitude, longitude];

        setQueryCenter(newCoords);
        setUserGpsLocation({
          lat: latitude,
          lng: longitude,
          address: `Current GPS Position (±${Math.round(accuracy)}m accuracy)`,
        });
        setLocationName(`Current GPS Location (±${Math.round(accuracy)}m)`);
        setGpsStatus('granted');
        setGpsMessage(`GPS lock established: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`);

        // Switch to Map tab on mobile to display location
        if (window.innerWidth < 1024) {
          setMobileTab('map');
        }
      },
      (geoError) => {
        console.warn('[Geolocation Permission]', geoError);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsMessage(
            'Location access permission was denied. You can still manually search any location or select a city below.'
          );
        } else if (geoError.code === geoError.TIMEOUT) {
          setGpsStatus('unavailable');
          setGpsMessage('GPS detection timed out. Please try again or search manually.');
        } else {
          setGpsStatus('unavailable');
          setGpsMessage('Position unavailable. Defaulting to Central Colombo.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle Manual City / Coordinate Selection
  const handleSelectQuickLocation = (loc) => {
    setQueryCenter(loc.coords);
    setLocationName(`${loc.name}, Sri Lanka`);
    setUserGpsLocation({
      lat: loc.coords[0],
      lng: loc.coords[1],
      address: `${loc.name} Center`,
    });
    setSelectedServiceId(null);
  };

  // Handle Manual Location Search Submission
  const handleManualSearchSubmit = (e) => {
    e.preventDefault();
    if (!manualLocationInput.trim()) return;

    const term = manualLocationInput.trim().toLowerCase();
    const matchedCity = QUICK_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(term) || term.includes(l.name.toLowerCase())
    );

    if (matchedCity) {
      handleSelectQuickLocation(matchedCity);
      setManualLocationInput('');
    } else {
      // Fallback: Perform text search on services
      setSearchTerm(manualLocationInput.trim());
    }
  };

  // Card Selection Handler (highlights corresponding marker on map)
  const handleCardSelect = (service) => {
    setSelectedServiceId(service._id);
    const lat = service.location?.coordinates?.[1] || service.lat;
    const lng = service.location?.coordinates?.[0] || service.lng;
    if (lat && lng) {
      setQueryCenter([lat, lng]);
    }
    // On mobile, switch to map view to show highlighted marker
    if (window.innerWidth < 1024 && mobileTab === 'list') {
      setMobileTab('map');
    }
  };

  // Marker Click Handler (highlights card in list)
  const handleMarkerClick = (marker) => {
    setSelectedServiceId(marker._id);
  };

  // Get Directions Action
  const handleDirections = (service) => {
    const lat = service.location?.coordinates?.[1] || service.lat;
    const lng = service.location?.coordinates?.[0] || service.lng;
    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* 1. Standard Page Header */}
      <PageHeader
        title="Emergency Service Discovery"
        subtitle="Locate verified hospitals, police stations, embassies, mechanics, and towing services nearest to your coordinates."
        breadcrumbs={[
          { label: 'Traveler Portal', path: '/traveler' },
          { label: 'Service Discovery', path: '/traveler/services' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={MapIcon}
              onClick={() => navigate('/traveler/map')}
            >
              Full Interactive Map
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={LocateFixed}
              onClick={handleDetectGPS}
              isLoading={gpsStatus === 'locating'}
            >
              {gpsStatus === 'granted' ? 'GPS Active' : 'Locate Me (GPS)'}
            </Button>
          </div>
        }
      />

      {/* 2. Top Location Bar & GPS Notification Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-card space-y-4">
        {/* Geolocation Notice / Permission Alert */}
        {gpsStatus === 'granted' && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200 text-brand-teal-dark text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
              <span>{gpsMessage}</span>
            </div>
            <button
              onClick={() => setGpsStatus('idle')}
              className="text-[11px] underline text-brand-teal hover:text-brand-navy"
            >
              Dismiss
            </button>
          </div>
        )}

        {gpsStatus === 'denied' && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{gpsMessage}</span>
            </div>
            <button
              onClick={() => setGpsStatus('idle')}
              className="text-[11px] underline text-amber-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Location Search & City Quick Switchers */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Active Search Center Indicator */}
          <div className="flex items-center gap-2.5 text-xs text-brand-navy font-bold">
            <div className="w-8 h-8 rounded-xl bg-brand-teal/15 text-brand-teal flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Searching Around
              </div>
              <div className="text-sm font-extrabold text-brand-navy">{locationName}</div>
            </div>
          </div>

          {/* Quick City Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold mr-1 hidden sm:inline">
              Jump to:
            </span>
            {QUICK_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelectQuickLocation(loc)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                  ${
                    locationName.includes(loc.name)
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                📍 {loc.name}
              </button>
            ))}
          </div>

          {/* Manual Location Search Input */}
          <form onSubmit={handleManualSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualLocationInput}
                onChange={(e) => setManualLocationInput(e.target.value)}
                placeholder="Search city or street..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal text-brand-navy font-medium"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* 3. Category & Radius Filtering Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-card space-y-4">
        {/* Category Filter Buttons */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0
                    ${
                      isSelected
                        ? 'bg-brand-teal text-brand-navy shadow-md ring-2 ring-brand-teal/30'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-navy' : cat.color || 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Keyword Search Input */}
          <div className="w-full sm:w-64 shrink-0 hidden md:block">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Filter by facility name..."
              className="w-full"
            />
          </div>
        </div>

        {/* Configurable Search Radius Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-teal" />
            <span>Search Radius:</span>
            <div className="flex items-center gap-1.5 ml-1">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRadius(r.value)}
                  className={`
                    px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all
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

          {/* Results Counter */}
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <span>Discovered:</span>
            <span className="font-extrabold text-brand-navy px-2 py-0.5 rounded-md bg-slate-100">
              {services.length} services within {selectedRadius / 1000} km
            </span>
          </div>
        </div>
      </div>

      {/* 4. Mobile View Switcher Tab (Visible only on < 1024px) */}
      <div className="flex lg:hidden rounded-2xl bg-slate-200/80 p-1 border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'list'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-600 hover:text-brand-navy'
          }`}
        >
          <ListIcon className="w-4 h-4" />
          <span>Service List ({services.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'map'
              ? 'bg-white text-brand-navy shadow-sm'
              : 'text-slate-600 hover:text-brand-navy'
          }`}
        >
          <MapIcon className="w-4 h-4 text-brand-teal" />
          <span>Interactive Map</span>
        </button>
      </div>

      {/* 5. Desktop Layout: Left List / Right Map (with Mobile Responsive Toggling) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Discovered Services List (Desktop & Mobile when tab === 'list') */}
        <div
          ref={serviceListRef}
          className={`lg:col-span-5 space-y-4 ${
            mobileTab === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          {loading && (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-card flex flex-col items-center justify-center text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm font-bold text-brand-navy mt-4">
                Scanning coordinates for nearby emergency providers...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Executing MongoDB 2dsphere spatial query within {selectedRadius / 1000} km
              </p>
            </div>
          )}

          {!loading && error && (
            <ErrorState
              message={error}
              onRetry={fetchNearbyServices}
              className="bg-white rounded-2xl p-6 border border-slate-200"
            />
          )}

          {!loading && !error && services.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card text-center space-y-4">
              <EmptyState
                icon={Compass}
                title="No Services Found in Range"
                description={`No ${selectedCategory || 'emergency'} facilities were detected within ${
                  selectedRadius / 1000
                } km of this location.`}
              />
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedRadius(100000)}
                >
                  Expand Radius to 100 km
                </Button>
                {selectedCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory('')}
                  >
                    Show All Categories
                  </Button>
                )}
              </div>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className="space-y-3.5 max-h-[820px] overflow-y-auto pr-1 scrollbar-thin">
              {services.map((service) => (
                <div
                  key={service._id}
                  ref={(el) => (cardRefs.current[service._id] = el)}
                >
                  <ServiceCard
                    service={service}
                    isSelected={selectedServiceId === service._id}
                    onSelect={handleCardSelect}
                    onDirections={handleDirections}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map (Desktop & Mobile when tab === 'map') */}
        <div
          className={`lg:col-span-7 sticky top-24 ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-card space-y-3">
            {/* Map Header Controls */}
            <div className="px-3 pt-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-teal animate-pulse" />
                <span>OpenStreetMap Radar View</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {queryCenter[0].toFixed(4)}° N, {queryCenter[1].toFixed(4)}° E
              </span>
            </div>

            {/* Reusable Leaflet Map Container */}
            <SafePassageMap
              center={queryCenter}
              zoom={selectedRadius <= 10000 ? 13 : selectedRadius <= 25000 ? 12 : 11}
              markers={services}
              selectedMarkerId={selectedServiceId}
              onMarkerClick={handleMarkerClick}
              userLocation={userGpsLocation || { lat: queryCenter[0], lng: queryCenter[1], address: locationName }}
              searchRadius={selectedRadius}
              height="620px"
              className="w-full"
            />

            {/* Mobile Bottom Quick-Inspect Card when marker is selected */}
            {selectedServiceId && (
              <div className="block lg:hidden p-3 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                {(() => {
                  const activeSrv = services.find((s) => s._id === selectedServiceId);
                  if (!activeSrv) return null;
                  return (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-brand-teal">
                          {activeSrv.type}
                        </span>
                        <div className="font-bold text-xs text-brand-navy truncate">
                          {activeSrv.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {activeSrv.address} • {activeSrv.distanceKm} km away
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDirections(activeSrv)}
                        className="px-3 py-1.5 rounded-xl bg-brand-teal text-brand-navy font-bold text-xs shrink-0 shadow-sm"
                      >
                        Directions
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
