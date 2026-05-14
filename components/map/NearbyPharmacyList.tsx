// src/components/map/NearbyPharmacyList.tsx
// Sidebar / below-map list of nearby pharmacies.
// Clicking a card syncs with the map marker (highlight + pan).

'use client';

import { PharmacyLocation } from '@/features/map/pharmacyData';
import {
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

interface Props {
  pharmacies: PharmacyLocation[];
  selectedId?: string | null;
  onSelect: (pharmacy: PharmacyLocation) => void;
  onViewDetails?: (id: string) => void;
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow animate-pulse">
      <div className="flex gap-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function NearbyPharmacyList({
  pharmacies,
  selectedId,
  onSelect,
  onViewDetails,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          No pharmacies found nearby.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pharmacies.map((pharmacy) => {
        const isSelected = pharmacy.id === selectedId;
        const isOpen = pharmacy.status === 'OPEN';

        return (
          <div
            key={pharmacy.id}
            onClick={() => onSelect(pharmacy)}
            className={`
              bg-white dark:bg-gray-800 rounded-2xl p-4 shadow cursor-pointer
              transition-all duration-200 hover:shadow-lg
              ${isSelected
                ? 'ring-2 ring-offset-1 dark:ring-offset-gray-900'
                : 'hover:scale-[1.01]'}
            `}
            style={isSelected ? { ringColor: NAVY } as any : {}}
          >
            {/* Inner ring via border when selected */}
            <div
              className={`rounded-xl ${isSelected ? 'p-0.5' : ''}`}
              style={isSelected ? { background: `linear-gradient(135deg, ${NAVY}, ${TEAL})` } : {}}
            >
              <div className={`${isSelected ? 'bg-white dark:bg-gray-800 rounded-xl p-3' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                    style={{ background: isOpen ? `${TEAL}15` : '#f3f4f6' }}
                  >
                    🏥
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight truncate">
                        {pharmacy.name}
                      </h4>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <MapPinIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{pharmacy.address}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {pharmacy.hours}
                      </span>
                      {pharmacy.distance !== undefined && (
                        <span
                          className="font-semibold"
                          style={{ color: TEAL }}
                        >
                          {pharmacy.distance} km
                        </span>
                      )}
                    </div>

                    {/* Rating + phone row */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {pharmacy.rating && (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <StarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {pharmacy.rating}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          {pharmacy.phone}
                        </span>
                      </div>

                      {onViewDetails && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(pharmacy.id);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: NAVY }}
                        >
                          Details
                          <ChevronRightIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
