import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Save,
  Compass,
  FileText,
  Star,
  Activity,
  Award,
  Radio
} from 'lucide-react';

const AVAILABLE_SERVICE_CATEGORIES = [
  'Roadside Towing & Vehicle Repair',
  'Emergency Paramedic Escort',
  'Medical First Response',
  'Battery Jumpstart & Mobile Charging',
  'Search & Mountain Extrication',
  'Highway Winching & Heavy Recovery',
  'Emergency Fuel Delivery',
  'Locksmith & Vehicle Access',
  'Tire Change & Inflation Assistance',
];

export default function ProviderProfilePage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  const [coordinates, setCoordinates] = useState([79.8612, 6.9271]); // [lng, lat]
  const [locatingGPS, setLocatingGPS] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/providers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const data = json.data;
          setProfile(data);
          setName(data.name || '');
          setPhone(data.phone || '');
          setLicenseNumber(data.providerDetails?.licenseNumber || '');
          setIsAvailable(data.providerDetails?.isAvailable !== false);
          setSelectedServices(data.providerDetails?.serviceTypes || ['Roadside Towing & Vehicle Repair']);
          if (data.providerDetails?.currentLocation?.coordinates) {
            setCoordinates(data.providerDetails.currentLocation.coordinates);
          }
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle service tag toggling
  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length === 1) {
        addToast('At least one primary service capability must remain active.', 'warning');
        return;
      }
      setSelectedServices((prev) => prev.filter((s) => s !== service));
    } else {
      setSelectedServices((prev) => [...prev, service]);
    }
  };

  // Acquire current GPS using browser Geolocation
  const handleAcquireGPS = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = [
          parseFloat(pos.coords.longitude.toFixed(5)),
          parseFloat(pos.coords.latitude.toFixed(5)),
        ];
        setCoordinates(newCoords);
        setLocatingGPS(false);
        addToast(`GPS locked: [${newCoords[1]}, ${newCoords[0]}]`, 'success');
      },
      (err) => {
        setLocatingGPS(false);
        addToast(`GPS lock failed: ${err.message}`, 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Profile Updates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/providers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          licenseNumber,
          isAvailable,
          serviceTypes: selectedServices,
          coordinates,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addToast('Provider operational profile updated successfully.', 'success');
        fetchProfile();
      } else {
        addToast(json.message || 'Profile update failed.', 'error');
      }
    } catch {
      addToast('Network error while saving profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Provider Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Provider Fleet Profile"
        subtitle="Manage dispatch capabilities, verified licenses, GPS base station coordinates, and duty availability."
        breadcrumbs={['Provider', 'Profile & Settings']}
      />

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Verification and Accreditation Status Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-navy to-brand-navy-light text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-teal text-brand-teal flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">{name || 'Emergency Service Unit'}</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 uppercase">
                  Verified Provider
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                License: {licenseNumber || 'SRI-EMERG-2024-88'} • Safe Passage Certified Dispatcher
              </p>
            </div>
          </div>

          {/* Quick Duty Status Switcher */}
          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl border border-white/10 shrink-0">
            <span className="text-xs font-bold text-slate-300 pl-1">Duty Status:</span>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                isAvailable
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              <span>{isAvailable ? 'AVAILABLE FOR DISPATCH' : 'OFF DUTY'}</span>
            </button>
          </div>
        </div>

        {/* General Details & Contact */}
        <Card title="Organization & Emergency Dispatch Contacts" subtitle="Publicly accessible upon dispatch acceptance" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Company / Unit Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Emergency Response Hotline / Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Accredited Registration / License #</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Registered Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.email || user?.email || ''}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* GPS Base Station Coordinates */}
        <Card
          title="Field Operations Base GPS Coordinates"
          subtitle="Used by dispatch matching algorithms to compute accurate distance and ETA to incidents"
          icon={MapPin}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Compass}
              loading={locatingGPS}
              onClick={handleAcquireGPS}
            >
              Acquire Current GPS
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Longitude (Decimal Degrees)</label>
              <input
                type="number"
                step="0.00001"
                required
                value={coordinates[0]}
                onChange={(e) => setCoordinates([parseFloat(e.target.value) || 0, coordinates[1]])}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-brand-teal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Latitude (Decimal Degrees)</label>
              <input
                type="number"
                step="0.00001"
                required
                value={coordinates[1]}
                onChange={(e) => setCoordinates([coordinates[0], parseFloat(e.target.value) || 0])}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          <div className="p-3 mt-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              Target Base Station: <strong>[{coordinates[1]}, {coordinates[0]}]</strong>
            </span>
            <span className="text-brand-teal font-semibold">Active in Geolocation Radius Engine</span>
          </div>
        </Card>

        {/* Certified Service Capabilities Multi-Selector */}
        <Card
          title="Certified Emergency Response Capabilities"
          subtitle="You will automatically be notified of dispatches matching your selected services"
          icon={Award}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {AVAILABLE_SERVICE_CATEGORIES.map((category) => {
              const isSelected = selectedServices.includes(category);
              return (
                <div
                  key={category}
                  onClick={() => toggleService(category)}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-brand-teal/10 border-brand-teal text-brand-navy shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{category}</span>
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-brand-teal text-white' : 'border border-slate-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="submit" variant="primary" size="lg" icon={Save} loading={saving}>
            Save Profile Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
