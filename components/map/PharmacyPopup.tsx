// src/components/map/PharmacyPopup.tsx
'use client';

import { PharmacyLocation } from '@/features/map/pharmacyData';
import { MapPinIcon, PhoneIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

interface Props {
  pharmacy: PharmacyLocation;
  onViewDetails?: (id: string) => void;
  onClose?: () => void;
}

export default function PharmacyPopup({ pharmacy, onViewDetails, onClose }: Props) {
  const isOpen = pharmacy.status === 'OPEN';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-72 overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3d6f)` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-base">🏥</span>
          </div>
          <span className="text-white font-bold text-sm truncate">{pharmacy.name}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white ml-2 shrink-0 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isOpen
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-400'}`} />
          {isOpen ? 'Open Now' : 'Closed'}
        </span>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: NAVY }} />
          <span>{pharmacy.address}</span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <PhoneIcon className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
          <span>{pharmacy.phone}</span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ClockIcon className="w-4 h-4 shrink-0" style={{ color: NAVY }} />
          <span>{pharmacy.hours}</span>
        </div>

        {/* Rating + Distance row */}
        <div className="flex items-center justify-between text-sm">
          {pharmacy.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{pharmacy.rating}</span>
            </div>
          )}
          {pharmacy.distance !== undefined && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${TEAL}15`, color: TEAL }}
            >
              {pharmacy.distance} km away
            </span>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      {onViewDetails && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onViewDetails(pharmacy.id)}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #207a6c)` }}
          >
            View Full Details →
          </button>
        </div>
      )}
    </div>
  );
}
