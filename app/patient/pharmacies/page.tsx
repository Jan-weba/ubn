// frontend/src/app/patient/pharmacies/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  _count?: { medications: number };
}

export default function BrowsePharmaciesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchPharmacies(); }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pharmacies');
      setPharmacies(res.data);
    } catch (error) {
      console.error('Failed to fetch pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter((pharmacy) =>
  pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
           {t('patient.browsePharmacies')}
          </h1>
        <p className="text-purple-100 text-lg">{t('patient.findPharmaciesNearYou')}</p>
      </div>

      {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="relative">
          <input
              type="text"
              placeholder={t('patient.searchPharmacies')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors text-lg"
            />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></div>
        </div>
      </div>

      <div className="text-gray-600 dark:text-gray-400 text-sm">
        {filteredPharmacies.length} {t('patient.pharmaciesFound')}
        </div>

      {filteredPharmacies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <p className="text-6xl mb-4"></p>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchQuery ? t('patient.noPharmaciesMatch') : t('patient.noPharmaciesAvailable')}
            </p>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                onClick={() => router.push(`/patient/pharmacies/${pharmacy.id}`)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer overflow-hidden"
              >
              <div className="bg-linear-to-r from-purple-500 to-indigo-500 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{pharmacy.name}</h3>
                {pharmacy._count && (
                    <p className="text-sm text-purple-100">
                     {pharmacy._count.medications} {t('patient.medicationsAvailable')}
                    </p>
                )}
                </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                    <MapPinIcon className="w-5 h-5 mt-0.5 shrink-0 text-purple-600" />
                    <span className="text-sm">{pharmacy.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <PhoneIcon className="w-5 h-5 shrink-0 text-purple-600" />
                    <span className="text-sm font-medium">{pharmacy.phone}</span>
                  </div>
                </div>
                <button className="w-full bg-linear-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg mt-4">
                  {t('patient.viewMedications')} →
                  </button>
              </div>
            </div>
          ))}
          </div>
      )}
      </div>
  </div>
);
}