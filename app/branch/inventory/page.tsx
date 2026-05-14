'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

const FDA_CATEGORIES = [
  'All Categories',
  'Analgesics & Antipyretics', 'Antibiotics & Antimicrobials', 'Antifungals',
  'Antivirals & Antiretrovirals', 'Antimalaria', 'Antituberculosis',
  'Antiparasitics & Anthelmintics', 'Cardiovascular & Antihypertensives',
  'Antidiabetics', 'Gastrointestinal', 'Respiratory & Bronchodilators',
  'Central Nervous System', 'Vitamins, Minerals & Supplements', 'Dermatologicals',
  'Ophthalmologicals', 'ENT (Ear, Nose & Throat)', 'Hormones & Endocrine',
  'Vaccines & Biologicals', 'Oncologicals', 'Immunosuppressants', 'Contraceptives',
  'Haematologicals', 'Musculoskeletal & Anti-inflammatories', 'Urological',
  'Psychiatric & Psychotropic', 'Anesthetics', 'Diagnostics & Contrast Media',
  'Traditional & Herbal Medicines', 'Other',
];

export default function BranchInventoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [backendReady, setBackendReady] = useState(true);
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: medications = [], loading } = useFetch<any[]>(
    async (signal) => {
      try {
        const res = await api.get('/medications/pharmacy/my-medications', { signal });
        setBackendReady(true);
        return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setBackendReady(false);
        } else {
          toast.error(t('errors.failedToLoadMedication'));
        }
        return [];
      }
    },
    []
  ) as any;

  const filtered = medications.filter((m: any) => {
    const matchSearch = !searchTerm ||
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'All Categories' || m.category === categoryFilter;
    const qty = m.quantity ?? 0;
    const threshold = m.lowStockThreshold ?? 10;
    if (stockFilter === 'LOW') return matchSearch && matchCat && qty > 0 && qty <= threshold;
    if (stockFilter === 'OUT') return matchSearch && matchCat && qty === 0;
    return matchSearch && matchCat;
  });

  const stockBadge = (med: any) => {
    const qty = med.quantity ?? 0;
    const threshold = med.lowStockThreshold ?? 10;
    if (qty === 0) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
        Out of Stock
      </span>
    );
    if (qty <= threshold) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
        <ExclamationTriangleIcon className="w-3 h-3" /> Low
      </span>
    );
    return <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{t('inventory.inStock')}</span>;
  };

  const summaryStats = {
    total:      medications.length,
    outOfStock: medications.filter((m: any) => (m.quantity ?? 0) === 0).length,
    lowStock:   medications.filter((m: any) => { const q = m.quantity ?? 0; return q > 0 && q <= (m.lowStockThreshold ?? 10); }).length,
    categories: new Set(medications.map((m: any) => m.category)).size,
  };

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white" style={{ backgroundColor: NAVY }}>
        <h1 className="text-2xl lg:text-3xl font-bold">{t('branch.inventory')}</h1>
        <p className="mt-1 text-white/70">{t('branch.inventorySubtitle')}</p>
      </div>

      {/* Backend pending banner */}
      {!backendReady && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl border border-yellow-200 bg-yellow-50">
          <LockClosedIcon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">{t('branch.backendPending')}</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Inventory management for branch managers is built and ready. The backend team needs to add
              <span className="font-mono font-bold mx-1">Role.BRANCH_MANAGER</span>
              to the
              <span className="font-mono mx-1">GET /medications/pharmacy/my-medications</span>,
              <span className="font-mono mx-1">GET /medications/pharmacy/low-stock</span>,
              <span className="font-mono mx-1">GET /medications/pharmacy/out-of-stock</span>,
              <span className="font-mono mx-1">POST /medications</span>, and
              <span className="font-mono mx-1">PUT /medications/:id</span>
              endpoints in medications.controller.ts. No frontend changes will be needed once that is done.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {backendReady && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: t('inventory.totalItems'),  value: summaryStats.total,      color: NAVY },
            { label: t('inventory.categories'),  value: summaryStats.categories,  color: TEAL },
            { label: t('inventory.lowStock'),    value: summaryStats.lowStock,    color: '#92400E' },
            { label: t('inventory.outOfStock'), value: summaryStats.outOfStock,  color: '#991B1B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border border-gray-100">
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('inventory.searchBranchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="w-full sm:w-52 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
        >
          <option value="All Categories">{t('inventory.allCategories')}</option>
          {FDA_CATEGORIES.filter(c => c !== 'All Categories').map(c => <option key={c} value={c}>{t('medicationCategories.' + c) || c}</option>)}
        </select>

        <div className="flex gap-2 shrink-0">
          {(['ALL', 'LOW', 'OUT'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={stockFilter === f ? { backgroundColor: TEAL, color: '#fff' } : { backgroundColor: '#F3F4F6', color: '#374151' }}
            >
              {f === 'ALL' ? t('inventory.stockAll') : f === 'LOW' ? t('inventory.stockLow') : t('inventory.stockOut')}
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push('/branch/inventory/add')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-white rounded-lg text-sm font-medium shrink-0"
          style={{ backgroundColor: TEAL }}
        >
          <PlusIcon className="w-4 h-4" /> {t('branch.addMedication')}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : !backendReady ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <LockClosedIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('inventory.inventoryAccessPending')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('inventory.seeAbove')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border border-gray-100">
          <p className="text-gray-500 font-medium">{t('errors.noMedicationsFound')}</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm || categoryFilter !== 'All Categories'
              ? t('inventory.adjustFilters')
              : t('inventory.addFirstMedication')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    t('inventory.colMedication'),
                    t('inventory.colCategory'),
                    t('inventory.colPrice'),
                    t('inventory.colQuantity'),
                    t('inventory.colThreshold'),
                    t('inventory.colPrescription'),
                    t('inventory.colStatus'),
                    t('inventory.colActions'),
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((med: any) => (
                  <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      {med.description && <p className="text-xs text-gray-400 truncate max-w-40">{med.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full whitespace-nowrap">{med.category}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: TEAL }}>
                      {Number(med.price ?? 0).toLocaleString()} RWF
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${(med.quantity ?? 0) === 0 ? 'text-red-600' : (med.quantity ?? 0) <= (med.lowStockThreshold ?? 10) ? 'text-yellow-600' : 'text-gray-800'}`}>
                        {med.quantity ?? 0}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">{t('inventory.units')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{med.lowStockThreshold ?? 10} units</td>
                    <td className="px-4 py-3">
                      {med.requiresPrescription
                        ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{t('inventory.required')}</span>
                        : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{t('common.no')}</span>}
                    </td>
                    <td className="px-4 py-3">{stockBadge(med)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/branch/inventory/${med.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ backgroundColor: '#F0F7F6', color: TEAL }}
                      >
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{medications.length}</span> medications
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
