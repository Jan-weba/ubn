// frontend/src/app/patient/medications/page.tsx

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function SearchMedications() {
  const { t } = useTranslation();
  const router = useRouter();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) { toast.error(t('medications.searchPlaceholder')); return; }
    setLoading(true); setSearched(true);
    try {
      const res = await api.get(`/medications/search?query=${searchQuery}`);
      setMedications(res.data);
      if (res.data.length === 0) toast.error(t('medications.noMedications'));
    } catch (error) {
      console.error('Search failed:', error);
      toast.error(t('errors.searchFailed'));
    } finally { setLoading(false); }
  };

  const handleAddToCart = (medication: any) => {
    addToCart({
      medicationId: medication.id,
      name: medication.name,
      price: medication.price,
      quantity: 1,
      pharmacyId: medication.pharmacy?.id || '',
      branchId: medication.branchId || '',
      pharmacyName: medication.pharmacy?.name || '',
      requiresPrescription: medication.requiresPrescription,
      imageUrl: medication.imageUrl,
    });
    router.push('/patient/cart');
  };

  return (
    <div className="space-y-6">
    <div className="bg-linear-to-r from-[#1E4D8C] to-[#1a3d6f] rounded-2xl shadow-xl p-8 text-white">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t('medications.title')} </h1>
      <p className="text-blue-100 text-lg">{t('medications.subtitle')}</p>
    </div>

    <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
              type="text"
              placeholder={t('medications.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
        </div>
        <button type="submit" disabled={loading}
            className="px-8 py-3 bg-linear-to-r from-[#2D9B8A] to-teal-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 whitespace-nowrap">
          {loading ? t('medications.searching') : t('common.search')}
          </button>
      </div>
    </form>

    {loading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}

      {!loading && searched && (
        <>
        <div className="text-gray-600 dark:text-gray-400">
          {t('medications.found')} {medications.length} {medications.length === 1 ? t('medications.medication') : t('medications.medications')}
          </div>
        {medications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications.map((med: any) => (
                <div key={med.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all transform hover:scale-105 overflow-hidden">
                <div className="bg-linear-to-r from-[#2D9B8A] to-teal-500 p-6 text-white">
                  <h3 className="font-bold text-xl mb-1">{med.name}</h3>
                  <p className="text-sm opacity-90">{med.category}</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1"> {med.pharmacy.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('medications.stock')}: <span className="font-semibold text-gray-800 dark:text-gray-100">{med.quantity}</span>
                    </p>
                  </div>
                  {med.requiresPrescription && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                       {t('medications.prescriptionRequired')}
                      </div>
                  )}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-[#1E4D8C] dark:text-blue-400">{med.price.toLocaleString()} RWF</span>
                    </div>
                    <button
                        onClick={() => handleAddToCart(med)}
                        disabled={med.quantity === 0}
                        className="w-full bg-linear-to-r from-[#2D9B8A] to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                      {med.quantity > 0 ? (<><ShoppingCartIcon className="w-5 h-5" />{t('medications.addToCart')}</>) : t('medications.outOfStock')}
                      </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
        ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-12 text-center mt-6">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-800 dark:text-gray-200 text-xl font-semibold mb-2">{t('medications.noMedications')}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Try using different keywords or checking your spelling.</p>
          </div>
        )}
        </>
    )}

      {!searched && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-12 text-center mt-6">
        <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-800 dark:text-gray-200 text-xl font-semibold mb-2">{t('search.enterMedicationName')}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Search across all registered pharmacies instantly.</p>
      </div>
    )}
    </div>
);
}