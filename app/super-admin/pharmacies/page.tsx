'use client';

import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  BuildingStorefrontIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// Removed NAVY and TEAL constants in favor of Authority Theme (slate/rose)

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

function PharmaciesContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('filter')?.toUpperCase() || 'ALL');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Search fields — all three registration numbers + name/email
  const [searchName, setSearchName] = useState('');
  const [searchRdb, setSearchRdb] = useState('');
  const [searchLicense, setSearchLicense] = useState('');
  const [searchBusiness, setSearchBusiness] = useState('');

  useEffect(() => { fetchPharmacies(); }, [filter]);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      // GET /super-admin/pharmacies?status=PENDING|APPROVED|REJECTED|ALL
      const url = filter === 'ALL'
        ? '/super-admin/pharmacies'
        : `/super-admin/pharmacies?status=${filter}`;
      const res = await api.get(url);
      setPharmacies(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      toast.error(t('errors.failedToLoadPharmacies'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/super-admin/pharmacies/${id}/approve`);
      toast.success(t('success.pharmacyApproved'));
      fetchPharmacies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error(t('form.provideRejectionReason'));
      return;
    }
    setActionId(rejectModal.id);
    try {
      await api.patch(`/super-admin/pharmacies/${rejectModal.id}/reject`, { reason: rejectReason });
      toast.success(t('success.pharmacyRejected'));
      setRejectModal(null);
      setRejectReason('');
      fetchPharmacies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionId(null);
    }
  };

  // Client-side filter across all four search fields
  // rdbCertificate, pharmacyLicense, businessRegistration are the exact field names from the schema
  const filtered = pharmacies.filter(p => {
    const nameMatch = !searchName ||
      p.name?.toLowerCase().includes(searchName.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(searchName.toLowerCase()) ||
      p.representativeName?.toLowerCase().includes(searchName.toLowerCase());

    const rdbMatch = !searchRdb ||
      p.rdbCertificate?.toLowerCase().includes(searchRdb.toLowerCase());

    const licenseMatch = !searchLicense ||
      p.pharmacyLicense?.toLowerCase().includes(searchLicense.toLowerCase());

    const businessMatch = !searchBusiness ||
      p.businessRegistration?.toLowerCase().includes(searchBusiness.toLowerCase());

    return nameMatch && rdbMatch && licenseMatch && businessMatch;
  });

  const pendingCount = pharmacies.filter(p => p.status === 'PENDING').length;
  const hasActiveSearch = searchName || searchRdb || searchLicense || searchBusiness;

  const clearSearch = () => {
    setSearchName('');
    setSearchRdb('');
    setSearchLicense('');
    setSearchBusiness('');
  };

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white bg-slate-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{t('superAdminPages.pharmacyApplications')}</h1>
            <p className="mt-1 text-white/70">{t('superAdminPages.reviewVerify')}</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/20 border border-yellow-300/30">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-200 text-sm font-semibold">{pendingCount} pending review</span>
            </div>
          )}
        </div>
      </div>

      {/* Search panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FunnelIcon className="w-4 h-4 text-rose-600" />
          Search & Filter Applications
        </div>

        {/* Name / email search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400"
          />
        </div>

        {/* Three registration number fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              RDB Certificate Number
            </label>
            <input
              type="text"
              placeholder="e.g. RDB/2024/001"
              value={searchRdb}
              onChange={e => setSearchRdb(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Pharmacy License Number
            </label>
            <input
              type="text"
              placeholder="e.g. PL/2024/001"
              value={searchLicense}
              onChange={e => setSearchLicense(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Business Registration Number
            </label>
            <input
              type="text"
              placeholder="e.g. BRN/2024/001"
              value={searchBusiness}
              onChange={e => setSearchBusiness(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400"
            />
          </div>
        </div>

        {hasActiveSearch && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{pharmacies.length}</span> results
            </p>
            <button
              onClick={clearSearch}
              className="text-xs font-medium hover:underline text-rose-600"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${filter === s ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s === 'PENDING' && pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <BuildingStorefrontIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('superAdminPages.noPharmaciesFound')}</p>
          <p className="text-gray-400 text-sm mt-1">
            {hasActiveSearch ? t('superAdminPages.tryAdjustSearch') : t('superAdminPages.noApplicationsInCategory')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#F8FAFC' }} className="border-b border-gray-100">
                <tr>
                  {[t('form.pharmacy'), t('superAdminPages.colRepresentative'), t('superAdminPages.colRdbCertificate'), t('superAdminPages.colLicenseNo'), t('superAdminPages.colBusinessReg'), t('common.status'), t('superAdminPages.colSubmitted'), t('common.actions')].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">

                    {/* Pharmacy name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 bg-slate-900">
                          {p.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.user?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Representative */}
                    <td className="px-4 py-4">
                      <p className="text-gray-700 text-sm">{p.representativeName || '—'}</p>
                      {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                    </td>

                    {/* RDB Certificate */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-mono text-gray-600 max-w-[120px] truncate" title={p.rdbCertificate}>
                        {p.rdbCertificate || '—'}
                      </p>
                    </td>

                    {/* Pharmacy License */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-mono text-gray-600 max-w-[120px] truncate" title={p.pharmacyLicense}>
                        {p.pharmacyLicense || '—'}
                      </p>
                    </td>

                    {/* Business Registration */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-mono text-gray-600 max-w-[120px] truncate" title={p.businessRegistration}>
                        {p.businessRegistration || '—'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                      {p.status === 'REJECTED' && p.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 max-w-[100px] truncate" title={p.rejectionReason}>
                          {p.rejectionReason}
                        </p>
                      )}
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/super-admin/pharmacies/${p.id}`)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                          title={t('common.viewDetails')}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={actionId === p.id}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
                              title={t('superAdmin.approve')}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: p.id, name: p.name })}
                              disabled={actionId === p.id}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                              title={t('superAdmin.reject')}
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold">{filtered.length}</span> of{' '}
              <span className="font-semibold">{pharmacies.length}</span> pharmacies
            </p>
            <p className="text-xs text-gray-400">
              {pharmacies.filter(p => p.status === 'APPROVED').length} approved ·{' '}
              {pharmacies.filter(p => p.status === 'REJECTED').length} rejected
            </p>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('superAdminPages.rejectApplication')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are rejecting <strong>{rejectModal.name}</strong>. The reason will be shown to the pharmacy owner.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder={t('superAdminPages.rejectionReason')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!actionId}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PharmaciesPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><LoadingSpinner /></div>}>
      <PharmaciesContent />
    </Suspense>
  );
}
