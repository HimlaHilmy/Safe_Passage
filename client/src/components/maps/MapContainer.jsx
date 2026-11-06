import React, { useEffect, useRef } from 'react';
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, ExternalLink, Navigation, Compass, Shield, Wrench, Truck, AlertTriangle } from 'lucide-react';

// Fix Leaflet's default icon missing issue in Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category-specific color and icon glyph styling
const CATEGORY_STYLES = {
  'Hospital & Medical': { color: '#EF4444', glyph: '🏥', label: 'Hospital' },
  Hospitals: { color: '#EF4444', glyph: '🏥', label: 'Hospital' },
  'Police Station': { color: '#2563EB', glyph: '👮', label: 'Police' },
  'Police Stations': { color: '#2563EB', glyph: '👮', label: 'Police' },
  'Embassy & Consulate': { color: '#9333EA', glyph: '🏛️', label: 'Embassy' },
  Embassies: { color: '#9333EA', glyph: '🏛️', label: 'Embassy' },
  'Mechanic & Repair': { color: '#D97706', glyph: '🔧', label: 'Mechanic' },
  Mechanics: { color: '#D97706', glyph: '🔧', label: 'Mechanic' },
  'Roadside & Towing': { color: '#0D9488', glyph: '🚛', label: 'Towing' },
  'Towing Services': { color: '#0D9488', glyph: '🚛', label: 'Towing' },
  'Fire & Rescue': { color: '#F97316', glyph: '🚒', label: 'Fire & Rescue' },
  'Coast Guard & Marine': { color: '#0284C7', glyph: '⚓', label: 'Coast Guard' },
};

/**
 * Creates custom styled HTML DivIcon for Leaflet markers
 */
const createMarkerIcon = (type, isSelected = false, isUserLocation = false) => {
  if (isUserLocation) {
    return L.divIcon({
      className: 'custom-leaflet-user-pin',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: #DC2626;
          color: white;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.35), 0 8px 16px rgba(0,0,0,0.3);
          font-size: 20px;
          animation: beacon-pulse 1.8s infinite;
        ">
          <span>📍</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }

  const style = CATEGORY_STYLES[type] || { color: '#14B8A6', glyph: '📍', label: 'Service' };
  const size = isSelected ? 48 : 38;
  const anchor = isSelected ? 24 : 19;

  return L.divIcon({
    className: `custom-leaflet-marker ${isSelected ? 'marker-selected' : ''}`,
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background-color: #FFFFFF;
        border: ${isSelected ? '3.5px solid #14B8A6' : `2.5px solid ${style.color}`};
        border-radius: 50%;
        box-shadow: ${
          isSelected
            ? `0 0 0 6px rgba(20, 184, 166, 0.4), 0 8px 24px rgba(0,0,0,0.28)`
            : `0 4px 12px rgba(0,0,0,0.18)`
        };
        font-size: ${isSelected ? 22 : 18}px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        ${isSelected ? 'transform: translateY(-4px) scale(1.08);' : ''}
      ">
        <span>${style.glyph}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -anchor - 4],
  });
};

// Component to programmatically re-center map when center coordinate changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
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

// Component to auto-open popup on selected marker
function MarkerWithAutoPopup({ marker, isSelected, onClick, children }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const lat = marker.location?.coordinates?.[1] || marker.lat;
  const lng = marker.location?.coordinates?.[0] || marker.lng;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={createMarkerIcon(marker.type || marker.category, isSelected)}
      zIndexOffset={isSelected ? 1000 : 10}
      eventHandlers={{
        click: () => {
          if (onClick) onClick(marker);
        },
      }}
    >
      {children}
    </Marker>
  );
}

/**
 * Reusable Safe Passage Map Container
 * Primary Owner: Member 2 (J.D.R. Samindika)
 * Reused by:
 * - Member 1: Incident Reporting (pin coordinates via onLocationSelect)
 * - Member 2: Service Discovery & Interactive Map (nearby markers, search radius circle, category icons)
 * - Member 3: Case Management (incident tracking with route polylines)
 * - Member 4: Provider Dispatch (provider base station, active jobs)
 * - Member 5: Admin Analytics (incident density markers)
 */
export default function SafePassageMap({
  center = [6.9271, 79.8612], // Colombo default [lat, lng]
  zoom = 12,
  markers = [],
  selectedMarkerId = null,
  onMarkerClick = null,
  userLocation = null,
  searchRadius = null, // in meters, e.g. 5000, 10000, 25000, 50000
  onLocationSelect = null,
  routePath = null, // array of [lat, lng] coordinates for route polylines
  height = '500px',
  className = '',
  showRecenterButton = true,
}) {
  const mapRef = useRef(null);

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-card bg-slate-100 ${className}`}
      style={{ height }}
    >
      <LeafletMap
        ref={mapRef}
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        {onLocationSelect && <LocationPickerHandler onLocationSelect={onLocationSelect} />}

        {/* High-contrast, clean OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Search Radius Circle Visualization */}
        {searchRadius && (
          <Circle
            center={userLocation ? [userLocation.lat, userLocation.lng] : center}
            radius={Number(searchRadius)}
            pathOptions={{
              color: '#14B8A6',
              fillColor: '#14B8A6',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6, 6',
            }}
          />
        )}

        {/* Route Polyline for Incident Tracking & Dispatch Guidance */}
        {routePath && Array.isArray(routePath) && routePath.length > 1 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: '#0D9488',
              weight: 4,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* User / Traveler Geolocation Marker */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createMarkerIcon('Emergency Incident', false, true)}
            zIndexOffset={500}
          >
            <Popup>
              <div className="p-1 font-sans">
                <div className="flex items-center gap-1.5 text-emergency-red font-bold text-xs uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-emergency-red animate-ping" />
                  Your Location
                </div>
                <p className="text-xs text-slate-700 font-semibold">{userLocation.address || 'Active GPS Position'}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
                </p>
                {searchRadius && (
                  <p className="text-[10px] text-brand-teal font-bold mt-1">
                    Coverage: {searchRadius >= 1000 ? `${searchRadius / 1000} km` : `${searchRadius} m`} radius
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Emergency Services & Facility Markers */}
        {markers.map((marker, idx) => {
          const lat = marker.location?.coordinates?.[1] || marker.lat;
          const lng = marker.location?.coordinates?.[0] || marker.lng;
          if (!lat || !lng) return null;

          const isSelected = selectedMarkerId && String(marker._id) === String(selectedMarkerId);

          return (
            <MarkerWithAutoPopup
              key={marker._id || idx}
              marker={marker}
              isSelected={isSelected}
              onClick={onMarkerClick}
            >
              <Popup>
                <div className="p-2 min-w-[220px] max-w-[280px] font-sans">
                  {/* Category Badge & Distance */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-teal/15 text-brand-teal-dark border border-brand-teal/20">
                      {marker.type || marker.category}
                    </span>
                    {marker.distanceKm && (
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {marker.distanceKm} km
                      </span>
                    )}
                  </div>

                  {/* Facility Name */}
                  <h4 className="font-bold text-sm text-brand-navy leading-snug mb-1">
                    {marker.name || marker.title}
                  </h4>

                  {/* Physical Street Address */}
                  {marker.address && (
                    <p className="text-xs text-slate-500 mb-2 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span>{marker.address}</span>
                    </p>
                  )}

                  {/* Operating Hours or Services */}
                  {marker.contactInfo?.operatingHours && (
                    <p className="text-[10px] text-slate-500 mb-2 font-medium">
                      🕒 {marker.contactInfo.operatingHours}
                    </p>
                  )}

                  {/* Contact Telephone & Emergency Hotline */}
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

                  {/* Directions Action Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-brand-teal text-brand-navy rounded-lg text-xs font-bold hover:bg-brand-teal-dark hover:text-white transition-all shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>
              </Popup>
            </MarkerWithAutoPopup>
          );
        })}
      </LeafletMap>

      {/* Floating Coordinate Picker Hint Banner (Member 1 Integration) */}
      {onLocationSelect && (
        <div className="absolute top-4 left-4 right-4 z-[400] pointer-events-none flex justify-center">
          <div className="bg-brand-navy/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-brand-teal animate-pulse" />
            <span>Click anywhere on the map to pin incident coordinates</span>
          </div>
        </div>
      )}

      {/* Floating Recenter Button */}
      {showRecenterButton && userLocation && (
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
            }
          }}
          title="Recenter on your location"
          className="absolute bottom-6 right-6 z-[400] bg-white text-brand-navy hover:text-brand-teal p-2.5 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-105"
        >
          <Compass className="w-5 h-5 text-brand-teal" />
        </button>
      )}
    </div>
  );
}
