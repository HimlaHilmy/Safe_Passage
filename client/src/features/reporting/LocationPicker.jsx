import React, { useState } from 'react';
import SafePassageMap from '../../components/maps/MapContainer';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  Navigation,
  MapPin,
  Compass,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LocateFixed,
} from 'lucide-react';

export default function LocationPicker({
  coords,
  onCoordsChange,
  address,
  onAddressChange,
  landmark,
  onLandmarkChange,
  errors = {},
}) {
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null); // { type: 'success' | 'warning' | 'error', message: string }

  // Handle GPS capture via browser geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser. Please enter your location manually below.',
      });
      return;
    }

    setIsLocating(true);
    setGeoStatus(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        onCoordsChange([longitude, latitude]);

        const formattedGps = `GPS Detected: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E (±${Math.round(accuracy)}m)`;
        if (!address || address.includes('GPS') || address.includes('Default') || address.includes('Pinned')) {
          onAddressChange(formattedGps);
        }

        setIsLocating(false);
        setGeoStatus({
          type: 'success',
          message: `GPS coordinates locked successfully with ±${Math.round(accuracy)}m accuracy. You can refine on the map or type an address.`,
        });
      },
      (err) => {
        setIsLocating(false);
        let userMsg = 'Unable to retrieve your location.';
        if (err.code === 1) {
          userMsg = 'Location permission denied by browser. Please type your street address or click on the map to pin.';
        } else if (err.code === 2) {
          userMsg = 'GPS signal unavailable or offline. Please enter your address or landmark manually.';
        } else if (err.code === 3) {
          userMsg = 'Location request timed out. Switched to manual address entry.';
        }
        setGeoStatus({
          type: 'warning',
          message: userMsg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Handle map click
  const handleMapClick = ({ lat, lng }) => {
    onCoordsChange([lng, lat]);
    if (!address || address.includes('Pinned') || address.includes('GPS')) {
      onAddressChange(`Pinned Coordinates: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
    }
    setGeoStatus({
      type: 'success',
      message: `Pin relocated to ${lat.toFixed(5)}, ${lng.toFixed(5)}. Responders will use these coordinates.`,
    });
  };

  const currentLat = coords && coords[1] ? coords[1] : 6.9271; // Colombo default
  const currentLng = coords && coords[0] ? coords[0] : 79.8612;

  return (
    <div className="space-y-5">
      {/* Action Header with GPS trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div>
          <h4 className="text-sm font-extrabold text-brand-navy flex items-center gap-2">
            <LocateFixed className="w-4 h-4 text-brand-teal" />
            Automatic Location Detection
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Lock your live coordinates via satellite GPS or pin your location on the map
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={Navigation}
          onClick={handleDetectLocation}
          isLoading={isLocating}
          className="shrink-0"
        >
          {isLocating ? 'Detecting GPS...' : 'Use My Current GPS'}
        </Button>
      </div>

      {/* Geolocation feedback alert */}
      {geoStatus && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
            geoStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : geoStatus.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {geoStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{geoStatus.message}</span>
        </div>
      )}

      {/* Manual Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Street Address / Highway / Area"
            name="address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="e.g. Galle Road, Colpetty, Colombo 03 or Expressway KM 18"
            icon={MapPin}
            error={errors.address}
            required
            helperText="Provide street name, road number, or general area."
          />
        </div>

        <div>
          <Input
            label="Nearest Landmark / Surroundings"
            name="landmark"
            value={landmark}
            onChange={(e) => onLandmarkChange(e.target.value)}
            placeholder="e.g. Opposite Lighthouse Hotel, near toll plaza"
            icon={Compass}
            helperText="Helps responders visually spot your location quickly."
          />
        </div>
      </div>

      {/* Interactive Leaflet Map for Pinning */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-bold text-brand-navy flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emergency-red" />
            <span>Interactive Incident Pin (Click map anywhere to reposition)</span>
          </div>
          <div className="font-mono text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
            Lng: <span className="text-brand-navy font-bold">{currentLng.toFixed(5)}</span> | Lat:{' '}
            <span className="text-brand-navy font-bold">{currentLat.toFixed(5)}</span>
          </div>
        </div>

        <div className="p-2">
          <SafePassageMap
            center={[currentLat, currentLng]}
            zoom={14}
            userLocation={{ lat: currentLat, lng: currentLng, address }}
            onLocationSelect={handleMapClick}
            height="320px"
          />
        </div>
      </div>

      {errors.coordinates && (
        <p className="text-xs font-semibold text-emergency-red flex items-center gap-1">
          <span>●</span> {errors.coordinates}
        </p>
      )}
    </div>
  );
}

