import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SafePassageMap from '../../components/maps/MapContainer';
import {
  Navigation,
  MapPin,
  Truck,
  Inbox,
  Briefcase,
  Phone,
  Compass,
  RotateCw,
  ExternalLink,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

export default function ProviderMapPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeJobs, setActiveJobs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'active', 'pending'

  // Provider base location (default to Colombo / Western Province or user location)
  const defaultProviderCoords = user?.providerDetails?.currentLocation?.coordinates || [79.8612, 6.9271];
  const [center, setCenter] = useState([defaultProviderCoords[1], defaultProviderCoords[0]]);
  const [zoom, setZoom] = useState(11);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      // Fetch Active Jobs
      const activeRes = await fetch(`${apiUrl}/assistance-requests?filter=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeRes.ok) {
        const json = await activeRes.json();
        if (json.success) setActiveJobs(json.data || []);
      }

      // Fetch Pending Requests
      const pendingRes = await fetch(`${apiUrl}/assistance-requests?status=Pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pendingRes.ok) {
        const json = await pendingRes.json();
        if (json.success) setPendingRequests(json.data || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Construct map markers
  const markers = [];

  // Provider Base Location Marker
  markers.push({
    _id: 'provider_base_location',
    title: `${user?.name || 'Your Unit'} (Base Station)`,
    category: 'Roadside & Towing',
    type: 'Roadside & Towing',
    lat: defaultProviderCoords[1],
    lng: defaultProviderCoords[0],
    address: 'Provider Operations Command Center',
    contactInfo: {
      phone: user?.phone || '+1 (555) 987-6543',
    },
  });

  // Active Job Markers
  if (filterMode === 'all' || filterMode === 'active') {
    activeJobs.forEach((job) => {
      const coords = job.location?.coordinates;
      if (coords && coords.length === 2) {
        markers.push({
          _id: job._id,
          title: `[ACTIVE] ${job.serviceType}`,
          category: job.incidentId?.category || 'Roadside & Towing',
          type: job.serviceType.includes('Medical') ? 'Hospital & Medical' : 'Emergency Incident',
          lat: coords[1],
          lng: coords[0],
          address: job.location?.address,
          distanceKm: job.distanceKm,
          contactInfo: {
            phone: job.travelerId?.phone,
          },
        });
      }
    });
  }

  // Pending Request Markers
  if (filterMode === 'all' || filterMode === 'pending') {
    pendingRequests.forEach((req) => {
      const coords = req.location?.coordinates;
      if (coords && coords.length === 2) {
        markers.push({
          _id: req._id,
          title: `[PENDING] ${req.serviceType}`,
          category: 'Fire & Rescue', // High visibility
          type: 'Fire & Rescue',
          lat: coords[1],
          lng: coords[0],
          address: req.location?.address,
          distanceKm: req.distanceKm,
        });
      }
    });
  }

  const focusLocation = (item) => {
    setSelectedItem(item);
    const coords = item.location?.coordinates;
    if (coords && coords.length === 2) {
      setCenter([coords[1], coords[0]]);
      setZoom(14);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500">Loading Geospatial Dispatch Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Interactive Dispatch Map"
        subtitle="Live geospatial situational awareness • Active field missions & pending requests"
        breadcrumbs={['Provider', 'Dispatch Map']}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCw}
              loading={refreshing}
              onClick={() => fetchData(false)}
            >
              Refresh Pins
            </Button>
          </div>
        }
      />

      {/* Layer Filters & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600">Map Layers:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Pins ({markers.length})
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'active'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Missions ({activeJobs.length})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Pool ({pendingRequests.length})
          </button>
        </div>

        <button
          onClick={() => {
            setCenter([defaultProviderCoords[1], defaultProviderCoords[0]]);
            setZoom(12);
            setSelectedItem(null);
          }}
          className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Center to Base Station</span>
        </button>
      </div>

      {/* Grid: Map on Left, Mission Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <SafePassageMap
            center={center}
            zoom={zoom}
            markers={markers}
            height="580px"
          />
        </div>

        {/* Side Panel: Active Missions & Dispatches */}
        <div className="space-y-4">
          <Card
            title="Field Missions List"
            subtitle="Click mission to pan & focus map camera"
            icon={Truck}
          >
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeJobs.length === 0 && pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No active or pending dispatches currently available on map.
                </div>
              ) : (
                <>
                  {activeJobs.map((job) => {
                    const coords = job.location?.coordinates;
                    const directionsUrl = coords
                      ? `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`
                      : null;

                    return (
                      <div
                        key={job._id}
                        onClick={() => focusLocation(job)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedItem?._id === job._id
                            ? 'border-brand-teal bg-teal-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <StatusBadge status={job.status} size="sm" />
                          {job.distanceKm && (
                            <span className="font-extrabold text-brand-teal text-[11px]">
                              {job.distanceKm} km away
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-brand-navy mt-1.5 truncate">
                          {job.serviceType}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-teal shrink-0" />
                          <span>{job.location?.address || 'Incident coordinates'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                          <Link
                            to="/provider/jobs"
                            className="text-[11px] font-bold text-brand-navy hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Manage Job →
                          </Link>

                          {directionsUrl && (
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-bold text-brand-teal hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Google Directions</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {pendingRequests.map((req) => (
                    <div
                      key={req._id}
                      onClick={() => focusLocation(req)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedItem?._id === req._id
                          ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          PENDING DISPATCH
                        </span>
                        {req.distanceKm && (
                          <span className="font-extrabold text-amber-700 text-[11px]">
                            {req.distanceKm} km away
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-brand-navy mt-1.5 truncate">
                        {req.serviceType}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{req.location?.address || 'Coordinates provided'}</span>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          to={`/provider/requests/${req._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-amber-700 hover:underline"
                        >
                          Review & Claim Request →
                        </Link>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
