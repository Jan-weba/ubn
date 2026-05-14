// frontend/src/app/pharmacy/inventory/page.tsx
'use client';

import {useFetch} from '@/hooks/useFetch';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const FDA_CATEGORIES = [
  'All Categories',
  'Analgesics & Antipyretics',
  'Antibiotics & Antimicrobials',
  'Antifungals',
  'Antivirals & Antiretrovirals',
  'Antimalaria',
  'Antituberculosis',
  'Antiparasitics & Anthelmintics',
  'Cardiovascular & Antihypertensives',
  'Antidiabetics',
  'Gastrointestinal',
  'Respiratory & Bronchodilators',
  'Central Nervous System',
  'Vitamins, Minerals & Supplements',
  'Dermatologicals',
  'Ophthalmologicals',
  'ENT (Ear, Nose & Throat)',
  'Hormones & Endocrine',
  'Vaccines & Biologicals',
  'Oncologicals',
  'Immunosuppressants',
  'Contraceptives',
  'Haematologicals',
  'Musculoskeletal & Anti-inflammatories',
  'Urological',
  'Psychiatric & Psychotropic',
  'Anesthetics',
  'Diagnostics & Contrast Media',
  'Traditional & Herbal Medicines',
  'Other',
];

export default function PharmacyInventoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');


const { data, loading, error } = useFetch<any[]>(
  async (signal) => {
    let url = '/medications/pharmacy/my-medications';

    if (stockFilter === 'LOW_STOCK') {
      url = '/medications/pharmacy/low-stock';
    } else if (stockFilter === 'OUT_OF_STOCK') {
      url = '/medications/pharmacy/out-of-stock';
    }

    const res = await api.get(url, { signal });
    return res.data;
  },
  [stockFilter]
);

const medications = data ?? [];

useEffect(() => {
  if (error) {
    toast.error(t('errors.failedToLoadMedication'));
    }
  }, [error, t]);

  const filtered = medications.filter(m => {
    const matchSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'All Categories' || m.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const stockBadge = (med: any) => {
    const qty = med.quantity ?? med.quantityInStock ?? 0;
    const threshold = med.lowStockThreshold ?? 10;
    if (qty === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{t('inventory.outOfStock')}</span>;
    if (qty <= threshold) return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full"><ExclamationTriangleIcon className="w-3 h-3"/>Low</span>;
    return <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{t('inventory.inStock')}</span>;
  };

  const summaryStats = {
    total: medications.length,
    outOfStock: medications.filter(m => (m.quantity ?? m.quantityInStock ?? 0) === 0).length,
    lowStock: medications.filter(m => {
      const q = m.quantity ?? m.quantityInStock ?? 0;
      return q > 0 && q <= (m.lowStockThreshold ?? 10);
    }).length,
    categories: new Set(medications.map(m => m.category)).size,
  };

  return (
    <div className="space-y-6">
    {/* Header */}
      <div className="bg-linear-to-r from-[#1E4D8C] via-[#2563a8] to-[#1a3d6f] rounded-2xl p-6 text-white">
      <h1 className="text-2xl font-bold mb-1">{t('pharmacy.inventoryManagement')}</h1>
      <p className="text-blue-100 text-sm">Manage your pharmacy's medication stock — categories follow Rwanda FDA Medicine Register</p>
    </div>

    {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
          { label: t('inventory.totalItems'),  value: summaryStats.total,       color: 'text-blue-600' },
          { label: t('inventory.categories'),  value: summaryStats.categories,  color: 'text-teal-600' },
          { label: t('inventory.lowStock'),    value: summaryStats.lowStock,    color: 'text-yellow-600' },
          { label: t('inventory.outOfStock'), value: summaryStats.outOfStock,  color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
        </div>
      ))}
      </div>

    {/* Controls bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border border-gray-100">
      {/* Search */}
        <div className="relative w-full sm:w-72">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder={t('inventory.searchPlaceholder')}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
      </div>

      {/* Category filter */}
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="w-full sm:w-56 px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
        {FDA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

      {/* Stock filter */}
        <div className="flex gap-2 shrink-0">
        {(['ALL','LOW_STOCK','OUT_OF_STOCK'] as const).map(f => (
            <button key={f} onClick={() => setStockFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${stockFilter === f ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f === 'ALL' ? 'All' : f === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
            </button>
        ))}
        </div>

      {/* Action buttons */}
        <div className="flex gap-2 shrink-0">
        <button onClick={() => router.push('/pharmacy/inventory/add?mode=upload')}
            className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-teal-500 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50 transition-all">
          <ArrowUpTrayIcon className="w-4 h-4" /> Upload
          </button>
        <button onClick={() => router.push('/pharmacy/inventory/add')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all">
          <PlusIcon className="w-4 h-4" /> Add Medication
          </button>
      </div>
    </div>

    {error && (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      Failed to load medications. Please try again.
    </div>
      )}

    {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
    ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
        <div className="text-5xl mb-3"></div>
        <p className="text-gray-500 font-medium mb-1">{t('errors.noMedicationsFound')}</p>
        <p className="text-gray-400 text-sm">
          {searchTerm || categoryFilter !== 'All Categories' ? 'Try adjusting your search or filters' : 'Add your first medication to get started'}
          </p>
      </div>
    ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Medication Name','Category','Dosage','Manufacturer','Unit Price','Qty in Stock','Threshold','Prescription','Expiry','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((med: any) => {
                  const price = med.unitPrice ?? med.price ?? 0;
                  const qty = med.quantity ?? med.quantityInStock ?? 0;
                  return (
                    <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{med.name}</p>
                      {med.description && <p className="text-xs text-gray-400 truncate max-w-[140px]">{med.description}</p>}
                      </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full whitespace-nowrap">{med.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{med.dosage || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{med.manufacturer || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-teal-600 whitespace-nowrap">{Number(price).toLocaleString()} RWF</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${qty === 0 ? 'text-red-600' : qty <= (med.lowStockThreshold ?? 10) ? 'text-yellow-600' : 'text-gray-800'}`}>
                        {qty}
                        </span>
                      <span className="text-gray-400 text-xs ml-1">{t('inventory.units')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{med.lowStockThreshold ?? 10} units</td>
                    <td className="px-4 py-3">
                      {med.requiresPrescription
                          ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{t('inventory.required')}</span>
                        : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">No</span>}
                      </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}
                      </td>
                    <td className="px-4 py-3">{stockBadge(med)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => router.push(`/pharmacy/inventory/${med.id}`)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-medium transition-all">
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                        </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
          </table>
        </div>

        {/* Table footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{medications.length}</span> medications
            </p>
          <p className="text-xs text-gray-400">{t('inventory.categoriesFootnote')}</p>
        </div>
      </div>
    )}
    </div>
);
}