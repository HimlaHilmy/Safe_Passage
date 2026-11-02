import React from 'react';
import { MapPin, Navigation, Compass, ExternalLink } from 'lucide-react';
import SafePassageMap from '../maps/MapContainer';

export default function IncidentLocationMapCard({
  location = {},
  title = 'Incident Location',
  height = '280px',
}) {
  const coordinates = location?.coordinates || [80.6337, 7.2906];
  // GeoJSON order is [longitude, latitude]
  const lng = Number(coordinates[0]) || 80.6337;
  const lat = Number(coordinates[1]) || 7.2906;
  const address = location?.address || 'Location on map';
  const landmark = location?.landmark;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
      {/* Location Details Header */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-teal shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold text-brand-navy">
              {address}
            </h4>
          </div>
          {landmark && (
            <div className="text-xs text-slate-500 pl-6">
              <span className="font-semibold text-slate-600">Landmark:</span> {landmark}
            </div>
          )}
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5 text-brand-teal" />
          <span>Google Directions</span>
          <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
        </a>
      </div>

      {/* Embedded Leaflet Map */}
      <div className="relative">
        <SafePassageMap
          center={[lat, lng]}
          zoom={14}
          userLocation={{ lat, lng, address }}
          height={height}
        />

        {/* Floating coordinates badge */}
        <div className="absolute bottom-3 left-3 z-[400] px-3 py-1 rounded-full bg-brand-navy/85 backdrop-blur-md text-white text-[11px] font-mono font-semibold shadow-md flex items-center gap-1.5 border border-white/20">
          <Compass className="w-3 h-3 text-brand-teal" />
          <span>{lat.toFixed(5)}° N, {lng.toFixed(5)}° E</span>
        </div>
      </div>
    </div>
  );
}
