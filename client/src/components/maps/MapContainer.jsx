import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, ExternalLink, Navigation } from 'lucide-react';

// Fix Leaflet's default icon missing issue in Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom styled SVG DivIcons for different facility types
const createMarkerIcon = (type, isPulsing = false) => {
  let color = '#14B8A6'; // Brand Teal
  let glyph = '📍';

  if (type === 'Hospital & Medical') {
    color = '#EF4444';
    glyph = '🏥';
  } else if (type === 'Police Station') {
    color = '#3B82F6';
    glyph = '👮';
  } else if (type === 'Fire & Rescue') {
    color = '#F97316';
    glyph = '🚒';
  } else if (type === 'Roadside & Towing') {
    color = '#0F766E';
    glyph = '🛠️';
  } else if (type === 'Emergency Incident' || isPulsing) {
    color = '#DC2626';
    glyph = '🚨';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background-color: white;
        border: 2.5px solid ${color};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        font-size: 18px;
        ${isPulsing ? 'animation: beacon-pulse 1.8s infinite;' : ''}
      ">
        <span>${glyph}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

// Component to programmatically re-center map when center coordinate changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Map click handler for selecting coordinates during incident reporting
function LocationPickerHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

/**
 * Reusable Map Container
 * Primary Owner: Member 2 (J.D.R. Samindika)
 * Reusable by Member 1 (Reporting pin), Member 3 (Case tracking), Member 4 (Dispatch navigation)
 */
export default function SafePassageMap({
  center = [6.9271, 79.8612], // Colombo default [lat, lng]
  zoom = 12,
  markers = [],
  userLocation = null,
  onLocationSelect = null,
  height = '500px',
  className = '',
}) {
  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-card bg-slate-100 ${className}`}
      style={{ height }}
    >
      <LeafletMap
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        {onLocationSelect && <LocationPickerHandler onLocationSelect={onLocationSelect} />}

        {/* High-contrast, clean OpenStreetMap Carto tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User / Traveler Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createMarkerIcon('Emergency Incident', true)}
          >
            <Popup>
              <div className="p-1 font-sans">
                <div className="flex items-center gap-1.5 text-emergency-red font-bold text-xs uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-emergency-red animate-ping" />
                  Your Location
                </div>
                <p className="text-xs text-slate-600 font-medium">{userLocation.address || 'Selected coordinates'}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Emergency Services & Facility Markers */}
        {markers.map((marker, idx) => {
          // GeoJSON coordinates are [longitude, latitude], Leaflet requires [latitude, longitude]
          const lat = marker.location?.coordinates?.[1] || marker.lat;
          const lng = marker.location?.coordinates?.[0] || marker.lng;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={marker._id || idx}
              position={[lat, lng]}
              icon={createMarkerIcon(marker.type || marker.category)}
            >
              <Popup>
                <div className="p-2 min-w-[200px] font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-teal/15 text-brand-teal-dark">
                      {marker.type || marker.category}
                    </span>
                    {marker.distanceKm && (
                      <span className="text-[11px] font-semibold text-slate-500">
                        {marker.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-brand-navy leading-snug mb-1">
                    {marker.name || marker.title}
                  </h4>
                  {marker.address && (
                    <p className="text-xs text-slate-500 mb-2 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{marker.address}</span>
                    </p>
                  )}
                  {marker.contactInfo?.phone && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                      <a
                        href={`tel:${marker.contactInfo.phone}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{marker.contactInfo.phone}</span>
                      </a>
                      {marker.contactInfo.emergencyHotline && (
                        <span className="text-[11px] font-extrabold text-emergency-red">
                          SOS: {marker.contactInfo.emergencyHotline}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </LeafletMap>

      {/* Floating map hint banner */}
      {onLocationSelect && (
        <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none flex justify-center">
          <div className="bg-brand-navy/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-brand-teal animate-pulse" />
            <span>Click anywhere on the map to pin incident coordinates</span>
          </div>
        </div>
      )}
    </div>
  );
}
