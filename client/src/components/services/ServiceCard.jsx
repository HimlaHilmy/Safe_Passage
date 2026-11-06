import React from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Star,
  Clock,
  HeartPulse,
  Shield,
  Building2,
  Wrench,
  Truck,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const CATEGORY_CONFIG = {
  'Hospital & Medical': {
    icon: HeartPulse,
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-emergency-red',
    label: 'Hospital',
  },
  Hospitals: {
    icon: HeartPulse,
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-emergency-red',
    label: 'Hospital',
  },
  'Police Station': {
    icon: Shield,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    label: 'Police Station',
  },
  'Police Stations': {
    icon: Shield,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    label: 'Police Station',
  },
  'Embassy & Consulate': {
    icon: Building2,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    label: 'Embassy',
  },
  Embassies: {
    icon: Building2,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    label: 'Embassy',
  },
  'Mechanic & Repair': {
    icon: Wrench,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    label: 'Mechanic',
  },
  Mechanics: {
    icon: Wrench,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    label: 'Mechanic',
  },
  'Roadside & Towing': {
    icon: Truck,
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    iconColor: 'text-brand-teal',
    label: 'Towing Service',
  },
  'Towing Services': {
    icon: Truck,
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    iconColor: 'text-brand-teal',
    label: 'Towing Service',
  },
  'Fire & Rescue': {
    icon: Flame,
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600',
    label: 'Fire & Rescue',
  },
};

/**
 * ServiceCard Component
 * Primary Owner: Member 2 (J.D.R. Samindika)
 * Displays rich service metadata, category badge, distance, contact links, and directions.
 */
export default function ServiceCard({
  service,
  isSelected = false,
  onSelect,
  onDirections,
  className = '',
}) {
  const typeKey = service.type || service.category || 'Hospital & Medical';
  const config = CATEGORY_CONFIG[typeKey] || {
    icon: MapPin,
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-600',
    label: typeKey,
  };
  const CategoryIcon = config.icon;

  const lat = service.location?.coordinates?.[1] || service.lat;
  const lng = service.location?.coordinates?.[0] || service.lng;

  const handleDirectionsClick = (e) => {
    e.stopPropagation();
    if (onDirections) {
      onDirections(service);
    } else if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleCallClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onSelect && onSelect(service)}
      className={`
        group relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer text-left
        ${
          isSelected
            ? 'bg-white border-brand-teal shadow-lg ring-2 ring-brand-teal/30 -translate-y-0.5'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
        }
        ${className}
      `}
    >
      {/* Top Meta Row: Category Badge & Distance */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.badgeBg}`}
          >
            <CategoryIcon className="w-3 h-3 shrink-0" />
            <span>{config.label}</span>
          </span>

          {service.verificationStatus === 'verified' && (
            <span
              title="Verified Safe Passage Facility"
              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </span>
          )}

          {service.isDemonstration && (
            <span
              title="Demonstration partner record"
              className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
            >
              Partner
            </span>
          )}
        </div>

        {service.distanceKm !== undefined && (
          <span className="text-xs font-extrabold text-brand-navy bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
            {service.distanceKm} km away
          </span>
        )}
      </div>

      {/* Service Name & Rating */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-bold text-base text-brand-navy leading-snug group-hover:text-brand-teal transition-colors">
          {service.name}
        </h4>
        {service.rating && (
          <div className="flex items-center gap-1 text-xs font-extrabold text-amber-500 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{service.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Physical Street Address */}
      {service.address && (
        <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-3 leading-relaxed">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{service.address}</span>
        </p>
      )}

      {/* Capabilities / Services Offered Tags */}
      {service.servicesOffered && service.servicesOffered.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {service.servicesOffered.slice(0, 3).map((item, i) => (
            <span
              key={i}
              className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md"
            >
              {item}
            </span>
          ))}
          {service.servicesOffered.length > 3 && (
            <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
              +{service.servicesOffered.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Operating Hours */}
      {service.contactInfo?.operatingHours && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-3 font-medium">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{service.contactInfo.operatingHours}</span>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Telephone Contact Link */}
        {service.contactInfo?.phone ? (
          <div className="flex items-center gap-2">
            <a
              href={`tel:${service.contactInfo.phone}`}
              onClick={handleCallClick}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:text-brand-teal-dark hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{service.contactInfo.phone}</span>
            </a>
            {service.contactInfo.emergencyHotline && (
              <span className="text-[11px] font-extrabold text-emergency-red bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                SOS: {service.contactInfo.emergencyHotline}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">No phone listed</span>
        )}

        {/* Directions Action */}
        <button
          type="button"
          onClick={handleDirectionsClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy-light transition-all shadow-sm"
        >
          <Navigation className="w-3 h-3 text-brand-teal" />
          <span>Directions</span>
        </button>
      </div>

      {/* Selection highlight border indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-teal animate-ping" />
      )}
    </div>
  );
}
