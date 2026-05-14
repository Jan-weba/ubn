// frontend/src/app/super-admin/patients/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function SuperAdminPatientsPage() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // You'll need to create this endpoint in the backend
      const res = await api.get('/super-admin/patients');
      setPatients(res.data);
    } catch (error: any) {
      console.error('Failed to fetch patients:', error);
      toast.error(t('errors.failedToLoadPatients'));
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
  patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner />
    </div>
  );
  }

  return (
    <div className="space-y-6">
          {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                 {t('superAdmin.patients')}
                </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredPatients.length} registered patients
                </p>
            </div>

            {/* Search */}
              <div className="w-full sm:w-auto">
              <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('patients.searchPlaceholder')}
                  className="w-full sm:w-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
            </div>
          </div>

          {/* Patients List */}
            {filteredPatients.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <p className="text-6xl mb-4"></p>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm ? t('patients.noPatientsFound') : t('extras.superAdmin.noPatientsRegistered')}
                </p>
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient: any) => (
                  <div
                    key={patient.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 overflow-hidden"
                  >
                  {/* Card Header */}
                    <div className="bg-slate-800 p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                        </div>
                      <div>
                        <h3 className="font-bold text-xl">
                          {patient.firstName} {patient.lastName}
                          </h3>
                        {patient.user?.isVerified && (
                            <div className="flex items-center gap-1 text-xs">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>{t('patients.verified')}</span>
                          </div>
                        )}
                        </div>
                    </div>
                  </div>

                  {/* Card Body */}
                    <div className="p-6 space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <EnvelopeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="truncate">{patient.user?.email}</span>
                    </div>

                    {patient.phone && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <PhoneIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>{patient.phone}</span>
                      </div>
                    )}

                      {patient.address && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <MapPinIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>{patient.address}</span>
                      </div>
                    )}

                      {patient.dateOfBirth && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                      </div>
                    )}

                      {patient.insuranceProvider && (
                        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">
                          Insurance Provider
                          </p>
                        <p className="text-sm text-slate-800 dark:text-slate-300">
                          {patient.insuranceProvider}
                          </p>
                      </div>
                    )}
                    </div>
                </div>
              ))}
              </div>
          )}
          </div>
  );
}