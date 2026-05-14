'use client';
// src/app/(pharmacy)/profile/page.tsx
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

export default function PharmacyProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [ownerName, setOwnerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchProfileData = useCallback(
    async (signal: AbortSignal) => {
      const res = await api.get('/pharmacies/profile/me', { signal });
      return res.data?.data ?? res.data;
    },
    []
  );

  const { data, loading, error } = useFetch<any>(fetchProfileData, []);

  useEffect(() => {
    if (data) {
      setProfile(data);
      setOwnerName(data?.representativeName ?? data?.ownerName ?? data?.name ?? '');
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(t('errors.failedToLoadProfile'));
    }
  }, [error, t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/pharmacies/profile/me', { representativeName: ownerName });
      setSaved(true);
      toast.success(t('common.savedSuccessfully'));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(t('errors.failedToSaveProfile'));
      console.error('Profile save failed:', err);
    }
    setSaving(false);
  };

  const docs = [
    { label: t('pharmacyOwner.pharmacyLicense'), file: 'pharmacy_license_2025.pdf', date: 'Jan 10, 2025' },
    { label: t('pharmacyOwner.nationalId'),       file: 'national_id_scan.pdf',      date: 'Jan 10, 2025' },
    { label: t('pharmacyOwner.taxRegistration'),  file: 'tax_cert_2025.pdf',         date: 'Jan 10, 2025' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
      {t('common.loading')}
      </div>
  );
  }

  return (
    <div className="space-y-6">
    {/* Hero */}
      <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: NAVY }}>
      <h1 className="text-3xl font-bold">{t('pharmacyOwner.profileTitle')}</h1>
      <p className="mt-1 text-white/70">{t('pharmacyOwner.profileSubtitle')}</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Personal Information */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-5">{t('pharmacyOwner.personalInformation')}</h3>

        {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#E5E7EB' }}
              >
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <button
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: TEAL }}
              >
              <Camera size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('pharmacyOwner.clickToUpdatePhoto')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('pharmacyOwner.ownerName')}
              </label>
            <input
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
          </div>
        </div>

        <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-5 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-60"
            style={{ backgroundColor: TEAL }}
          >
          {saving ? t('common.saving') : t('common.saveChanges')}
          </button>
        {saved && (
            <p className="text-center text-sm mt-2" style={{ color: TEAL }}>
             Saved successfully
            </p>
        )}
        </div>

      {/* Registration Details */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">{t('pharmacyOwner.registrationDetails')}</h3>
          <span
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ borderColor: TEAL, color: TEAL }}
            >
            <CheckCircle size={12} />
            {t('pharmacyOwner.approved')}
            </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
              { label: t('pharmacyOwner.pharmacyName'),       value: profile?.name ?? '—' },
              { label: t('pharmacyOwner.registrationNumber'), value: profile?.rdbCertificate ? 'On file' : '—' },
              { label: t('pharmacyOwner.approvalDate'),        value: profile?.approvedAt ? new Date(profile.approvedAt).toLocaleDateString() : '—' },
              { label: t('pharmacyOwner.licenseExpiry'),       value: profile?.dateOfIncorporation ? new Date(profile.dateOfIncorporation).toLocaleDateString() : '—' },
              { label: t('common.address'),                    value: profile?.address ?? '—' },
              { label: t('common.phone'),                      value: profile?.phone ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          ))}
          </div>

        {/* Documents */}
          <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {t('pharmacyOwner.submittedDocuments')}
            </h4>
          <div className="space-y-2">
            {docs.map(doc => (
                <div
                  key={doc.label}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50"
                >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                    <p className="text-xs text-gray-400">
                      {doc.file} · {t('pharmacyOwner.uploaded')} {doc.date}
                      </p>
                  </div>
                </div>
                <button
                    className="text-sm font-medium hover:underline"
                    style={{ color: NAVY }}
                  >
                  {t('common.view')}
                  </button>
              </div>
            ))}
            </div>
          <p className="text-xs text-gray-400 mt-3">{t('pharmacyOwner.documentsNotice')}</p>
        </div>
      </div>
    </div>
  </div>
);
}