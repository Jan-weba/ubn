// src/app/super-admin/map/page.tsx
// Super Admin Global Pharmacy Triangulation Map
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { fetchPharmacyLocations } from '@/services/pharmacies';
import { PharmacyLocation } from '@/features/map/pharmacyData';
import { MapSkeleton } from '@/components/map/MapStates';
import MapLayout from '@/components/map/MapLayout';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

// Rwanda-wide: zoom out enough to see all provinces
const RWANDA_CENTER: [number, number] = [-1.9403, 29.8739];
const RWANDA_ZOOM = 8;

type FilterStatus = 'all' | 'open' | 'closed';
type FilterActive = 'all' | 'active' | 'inactive';

export default function SuperAdminMapPage() {
  const router = useRouter();
  const [allPharmacies, setAllPharmacies] = useState<PharmacyLocation[]>([]);
  const [filtered, setFiltered] = useState<PharmacyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyLocation | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [activeFilter, setActiveFilter] = useState<FilterActive>('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await fetchPharmacyLocations();
        
        if (fetchError) {
          setError(fetchError);
          toast.error(fetchError);
          setAllPharmacies([]);
          setFiltered([]);
          return;
        }

        if (data) {
          setAllPharmacies(data);
          setFiltered(data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load pharmacies';
        setError(errorMsg);
        toast.error(errorMsg);
        setAllPharmacies([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let result = allPharmacies;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all')
      result = result.filter((p) => (statusFilter === 'open' ? p.status === 'OPEN' : p.status === 'CLOSED'));
    if (activeFilter !== 'all')
      result = result.filter((p) => (activeFilter === 'active' ? p.isActive : !p.isActive));
    setFiltered(result);
  }, [search, statusFilter, activeFilter, allPharmacies]);

  const handleSelectPharmacy = useCallback((p: PharmacyLocation) => {
    setSelectedId(p.id);
    setSelectedPharmacy(p);
  }, []);

  const stats = {
    total: allPharmacies.length,
    active: allPharmacies.filter((p) => p.isActive).length,
    inactive: allPharmacies.filter((p) => !p.isActive).length,
    open: allPharmacies.filter((p) => p.status === 'OPEN').length,
  };

  // ── Sidebar content for MapLayout ──
  const sidebarContent = (
    <div className="flex flex-col gap-4 h-full">
      {/* Detail panel or placeholder */}
      {selectedPharmacy ? (
        <DetailsPanel
          pharmacy={selectedPharmacy}
          onViewDetails={(id) => router.push(`/super-admin/pharmacies/${id}`)}
          onClose={() => { setSelectedId(null); setSelectedPharmacy(null); }}
        />
      ) : (
        <SelectPrompt />
      )}

      {/* Pharmacy index list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-y-auto flex-1" style={{ maxHeight: 300 }}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
            Pharmacy Index
            <span className="ml-2 text-xs font-normal text-gray-400">
              {filtered.length} shown
            </span>
          </h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 flex gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
                  </div>
                </div>
              ))
            : filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPharmacy(p)}
                  className={`w-full text-left p-3 flex items-center gap-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedId === p.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: p.isActive ? `${TEAL}20` : '#f3f4f6' }}
                  >
                    🏥
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.region}</p>
                  </div>
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${p.status === 'OPEN' ? 'bg-emerald-400' : 'bg-gray-300'}`}
                  />
                </button>
              ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div
        className="rounded-2xl shadow-xl p-8 text-white"
        style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3d6f)` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <MapPinIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Global Pharmacy Map</h1>
            <p className="text-blue-100 mt-1">All registered pharmacies across the E-Vuze platform</p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900 dark:text-red-200 text-sm">Failed to load pharmacies</p>
            <p className="text-red-700 dark:text-red-300 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pharmacies', value: stats.total, icon: BuildingStorefrontIcon, color: NAVY, bg: `${NAVY}12` },
          { label: 'Active',           value: stats.active,   icon: CheckCircleIcon,        color: TEAL,    bg: `${TEAL}12` },
          { label: 'Inactive',         value: stats.inactive, icon: XCircleIcon,            color: '#ef4444', bg: '#fef2f2' },
          { label: 'Open Now',         value: stats.open,     icon: MapPinIcon,             color: '#f59e0b', bg: '#fffbeb' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{s.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-4xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex flex-wrap gap-3 items-center">
        <FunnelIcon className="w-5 h-5 text-gray-400 shrink-0" />
        <div className="relative flex-1 min-w-[180px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pharmacy, area, region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl outline-none focus:ring-2"
            style={{ '--tw-ring-color': TEAL } as any}
          />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {(['all', 'open', 'closed'] as FilterStatus[]).map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={statusFilter === v ? { background: NAVY, color: '#fff' } : { color: '#6b7280' }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {(['all', 'active', 'inactive'] as FilterActive[]).map((v) => (
            <button
              key={v}
              onClick={() => setActiveFilter(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={activeFilter === v ? { background: TEAL, color: '#fff' } : { color: '#6b7280' }}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          Showing {filtered.length} / {allPharmacies.length}
        </span>
      </div>

      {/* Map + sidebar via MapLayout */}
      {error ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `#ef444412` }}>
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-700 dark:text-gray-200 font-semibold text-base mb-2">Unable to Load Map</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
        </div>
      ) : (
        <MapLayout
          mapHeightMobile={360}
          mapHeightTablet={440}
          mapHeightDesktop={540}
          map={
            loading ? (
              <MapSkeleton />
            ) : (
              <MapView
                pharmacies={filtered}
                center={RWANDA_CENTER}
                zoom={RWANDA_ZOOM}
                selectedId={selectedId}
                onSelectPharmacy={handleSelectPharmacy}
                onViewDetails={(id) => router.push(`/super-admin/pharmacies/${id}`)}
                className="h-full"
              />
            )
          }
          sidebar={sidebarContent}
        />
      )}
    </div>
  );
}

function SelectPrompt() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${NAVY}12` }}>
        <BuildingStorefrontIcon className="w-7 h-7" style={{ color: NAVY }} />
      </div>
      <p className="text-gray-700 dark:text-gray-200 font-semibold text-sm">Select a Pharmacy</p>
      <p className="text-gray-400 text-xs mt-1">Click any map marker or index entry.</p>
    </div>
  );
}

function DetailsPanel({
  pharmacy,
  onViewDetails,
  onClose,
}: {
  pharmacy: PharmacyLocation;
  onViewDetails: (id: string) => void;
  onClose: () => void;
}) {
  const isOpen = pharmacy.status === 'OPEN';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div
        className="px-5 py-4 flex items-center justify-between text-white"
        style={{ background: `linear-gradient(135deg, ${NAVY}, #1a3d6f)` }}
      >
        <p className="font-bold text-sm truncate">{pharmacy.name}</p>
        <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none ml-2 shrink-0">×</button>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isOpen ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {isOpen ? 'Open Now' : 'Closed'} · {pharmacy.isActive ? 'Active' : 'Inactive'}
        </span>
        {[
          ['Address',     pharmacy.address],
          ['Region',      pharmacy.region],
          ['Phone',       pharmacy.phone],
          ['Hours',       pharmacy.hours],
          ['Rating',      pharmacy.rating ? `${pharmacy.rating} / 5` : '—'],
          ['Coordinates', `${pharmacy.latitude.toFixed(4)}, ${pharmacy.longitude.toFixed(4)}`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-xs">
            <span className="text-gray-400 font-medium shrink-0">{label}</span>
            <span className="text-gray-700 dark:text-gray-200 text-right">{value}</span>
          </div>
        ))}
        <button
          onClick={() => onViewDetails(pharmacy.id)}
          className="w-full mt-1 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${TEAL}, #207a6c)` }}
        >
          Open Full Profile →
        </button>
      </div>
    </div>
  );
}
