'use client';

/**
 * Pharmacy Owner — Branch Triangulation Map
 * Route: /pharmacy/map
 *
 * Shows all branches owned by this pharmacy on a unified map
 * with triangulation lines connecting them and info-cards.
 *
 * API: GET /branches/my-branches
 * Returns: { id, name, address, branchStatus, isActive, manager, latitude?, longitude? }
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GitBranch, MapPin, Users, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import type { MapMarker } from '@/components/map/BaseMap';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

// Dynamic import — Leaflet must not run on the server
const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// ── Helpers ────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case 'APPROVED': return { bg: '#D1FAE5', text: '#065F46', label: 'Active',           icon: CheckCircle };
    case 'INVITED':  return { bg: '#FEF3C7', text: '#92400E', label: 'Pending Setup',    icon: Clock };
    case 'PENDING':  return { bg: '#DBEAFE', text: '#1E40AF', label: 'Pending Approval', icon: Clock };
    default:         return { bg: '#F3F4F6', text: '#6B7280', label: status ?? '—',      icon: AlertCircle };
  }
}

// ── Branch Info Card ───────────────────────────────────────────────────────

function BranchCard({ branch, active, onClick }: { branch: any; active: boolean; onClick: () => void }) {
  const st = statusBadge(branch.branchStatus);
  const StatusIcon = st.icon;
  const hasCoords = branch.latitude != null && branch.longitude != null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 border transition-all duration-150"
      style={{
        backgroundColor: active ? '#F0F7F6' : '#fff',
        borderColor:     active ? TEAL : '#E5E7EB',
        boxShadow: active ? `0 0 0 2px ${TEAL}33` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{branch.name}</p>
        <span
          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: st.bg, color: st.text }}
        >
          <StatusIcon size={10} />
          {st.label}
        </span>
      </div>

      <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-1">
        <MapPin size={12} className="shrink-0 mt-0.5" style={{ color: TEAL }} />
        <span className="line-clamp-2">{branch.address || '—'}</span>
      </div>

      {branch.manager?.email && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: NAVY }}>
          <Users size={12} />
          <span className="truncate">{branch.manager.email}</span>
        </div>
      )}

      {!hasCoords && (
        <p className="mt-2 text-xs text-amber-500 flex items-center gap-1">
          <AlertCircle size={11} />
          No coordinates — won&apos;t appear on map
        </p>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PharmacyMapPage() {
  const { t } = useTranslation();

  const [branches, setBranches]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [triangulate, setTriangulate]     = useState(true);
  const [filterStatus, setFilterStatus]   = useState<string>('ALL');

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/branches/my-branches');
      const data: any[] = res.data?.data ?? res.data ?? [];
      setBranches(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Build map markers from branches that have coordinates
  const mappableBranches = branches.filter(b =>
    b.latitude != null && b.longitude != null &&
    (filterStatus === 'ALL' || b.branchStatus === filterStatus)
  );

  const markers: MapMarker[] = mappableBranches.map(b => ({
    id:       b.id,
    lat:      b.latitude,
    lng:      b.longitude,
    label:    b.name,
    sublabel: b.address,
    type:     'own',
    status:   statusBadge(b.branchStatus).label,
  }));

  const filteredList = branches.filter(b =>
    filterStatus === 'ALL' || b.branchStatus === filterStatus
  );

  const handleMarkerClick = (marker: MapMarker) => {
    const branch = branches.find(b => b.id === marker.id);
    if (branch) setSelectedBranch(branch);
  };

  // Stats
  const totalActive   = branches.filter(b => b.branchStatus === 'APPROVED').length;
  const totalPending  = branches.filter(b => b.branchStatus !== 'APPROVED').length;
  const totalMapped   = branches.filter(b => b.latitude != null).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white flex items-start justify-between gap-4" style={{ backgroundColor: NAVY }}>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Branch Network Map</h1>
          <p className="mt-1 text-white/70">Triangulated view of all your branch locations</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total Branches', value: branches.length,  color: NAVY },
          { label: 'Active',         value: totalActive,       color: TEAL },
          { label: 'Pending Setup',  value: totalPending,      color: '#F59E0B' },
          { label: 'On Map',         value: totalMapped,       color: '#6366F1' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs font-semibold text-gray-700">{s.value}</span>
            <span className="text-xs text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="flex items-center justify-center h-64 rounded-2xl border border-gray-100 bg-gray-50">
          <div className="text-center space-y-2">
            <AlertCircle size={28} className="mx-auto text-gray-300" />
            <p className="text-sm text-gray-400">Failed to load branches.</p>
            <button onClick={load} className="text-xs font-medium underline" style={{ color: TEAL }}>Try again</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map panel */}
          <div className="lg:col-span-2 space-y-3">
            {/* Map controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Status filter */}
              <div className="flex bg-gray-100 rounded-xl p-0.5 text-xs font-semibold gap-0.5">
                {['ALL', 'APPROVED', 'INVITED', 'PENDING'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className="px-3 py-1.5 rounded-lg transition-all"
                    style={filterStatus === s
                      ? { backgroundColor: '#fff', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: '#6B7280' }
                    }
                  >
                    {s === 'ALL' ? 'All' : s === 'APPROVED' ? 'Active' : s === 'INVITED' ? 'Invited' : 'Pending'}
                  </button>
                ))}
              </div>

              {/* Triangulation toggle */}
              <button
                onClick={() => setTriangulate(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all"
                style={triangulate
                  ? { backgroundColor: `${NAVY}12`, borderColor: NAVY, color: NAVY }
                  : { backgroundColor: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }
                }
              >
                <GitBranch size={13} />
                Triangulation {triangulate ? 'On' : 'Off'}
              </button>
            </div>

            {/* Map */}
            {loading ? (
              <div className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: '520px' }} />
            ) : mappableBranches.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 gap-3"
                style={{ height: '520px' }}
              >
                <MapPin size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No branches with coordinates to display.</p>
                <p className="text-xs text-gray-300">Add latitude/longitude when creating branches.</p>
              </div>
            ) : (
              <BaseMap
                markers={markers}
                triangulate={triangulate}
                height="520px"
                onMarkerClick={handleMarkerClick}
                className="shadow-sm"
              />
            )}
          </div>

          {/* Branch list panel */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {filteredList.length} Branch{filteredList.length !== 1 ? 'es' : ''}
              </p>
              {selectedBranch && (
                <button
                  onClick={() => setSelectedBranch(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear selection
                </button>
              )}
            </div>

            <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '520px' }}>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))
              ) : filteredList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No branches found.</p>
              ) : (
                filteredList.map(b => (
                  <BranchCard
                    key={b.id}
                    branch={b}
                    active={selectedBranch?.id === b.id}
                    onClick={() => setSelectedBranch((prev: any) => prev?.id === b.id ? null : b)}
                  />
                ))
              )}
            </div>

            {/* Selected branch detail card */}
            {selectedBranch && (
              <div className="rounded-2xl border p-4 bg-white space-y-3" style={{ borderColor: TEAL }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${TEAL}20` }}>
                    <GitBranch size={14} style={{ color: TEAL }} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{selectedBranch.name}</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">Address</span>
                    <span className="text-gray-700 font-medium">{selectedBranch.address || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">Manager</span>
                    <span className="font-medium truncate" style={{ color: NAVY }}>{selectedBranch.manager?.email || 'Unassigned'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">Phone</span>
                    <span className="text-gray-700 font-medium">{selectedBranch.phone || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-16 shrink-0">Coords</span>
                    <span className="text-gray-500 font-mono text-[11px]">
                      {selectedBranch.latitude != null
                        ? `${selectedBranch.latitude.toFixed(4)}, ${selectedBranch.longitude.toFixed(4)}`
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
