'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import LocationPicker from '@/components/shared/LocationPicker';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending Review' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
};

export default function SuperAdminPharmacyDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Opens a document URL safely — handles both data URIs (DB storage) and HTTP URLs (legacy S3)
  const openDocument = (url: string) => {
    if (!url) { toast.error(t('form.documentUrlNotAvailable')); return; }

    if (url.startsWith('data:')) {
      // Convert data URI to Blob URL so browsers can open PDFs and images
      const [header, base64] = url.split(',');
      const mime = header.replace('data:', '').replace(';base64', '');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      // Revoke after 60s to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      if (!win) toast.error('Popup blocked — please allow popups for this site');
    } else {
      // Legacy HTTP URL
      window.open(url, '_blank');
    }
  };

  useEffect(() => { fetchPharmacy(); }, [params.id]);

  const fetchPharmacy = async () => {
    try {
      // GET /super-admin/pharmacies/:id — returns full pharmacy with documents,
      // medications, orders, _count
      const res = await api.get(`/super-admin/pharmacies/${params.id}`);
      setPharmacy(res.data);
    } catch {
      toast.error(t('pharmacies.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/pharmacies/${params.id}/approve`);
      toast.success(t('success.pharmacyApproved'));
      fetchPharmacy();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error(t('form.provideRejectionReason')); return; }
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/pharmacies/${params.id}/reject`, { reason: rejectReason });
      toast.success(t('success.pharmacyRejected'));
      setShowReject(false);
      fetchPharmacy();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyLocation = async (verified: boolean) => {
    setLocationLoading(true);
    try {
      await api.patch(`/super-admin/pharmacies/${params.id}/verify-location`, { verified });
      toast.success(verified ? 'Location marked as verified.' : 'Location flagged as unverified.');
      fetchPharmacy();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update location status.');
    } finally {
      setLocationLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><LoadingSpinner /></div>
  );

  if (!pharmacy) return null;

  const status = STATUS_STYLES[pharmacy.status] ?? { bg: '#F3F4F6', text: '#374151', label: pharmacy.status };

  // Registration number fields from the Prisma schema
  const registrationNumbers = [
    { label: 'RDB Certificate Number',        value: pharmacy.rdbCertificate,       docType: 'rdb' },
    { label: 'Pharmacy License Number',        value: pharmacy.pharmacyLicense,      docType: 'license' },
    { label: 'Business Registration Number',   value: pharmacy.businessRegistration, docType: null },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Back */}
      <button
        onClick={() => router.push('/super-admin/pharmacies')}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: NAVY }}
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Applications
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white" style={{ backgroundColor: NAVY }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/60 text-sm mb-1">{t('superAdminPages.pharmacyApplication')}</p>
            <h1 className="text-2xl lg:text-3xl font-bold">{pharmacy.name}</h1>
            <p className="text-white/70 mt-1 text-sm">
              Submitted {new Date(pharmacy.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Quick stats from _count */}
        {pharmacy._count && (
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <ArchiveBoxIcon className="w-4 h-4" />
              {pharmacy._count.medications} medications listed
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <ShoppingCartIcon className="w-4 h-4" />
              {pharmacy._count.orders} orders total
            </div>
          </div>
        )}
      </div>

      {/* Action buttons for PENDING */}
      {pharmacy.status === 'PENDING' && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
            style={{ backgroundColor: TEAL }}
          >
            <CheckCircleIcon className="w-5 h-5" /> Approve Application
          </button>
          <button
            onClick={() => setShowReject(true)}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 transition-all"
          >
            <XCircleIcon className="w-5 h-5" /> Reject Application
          </button>
        </div>
      )}

      {/* Rejection reason display */}
      {pharmacy.status === 'REJECTED' && pharmacy.rejectionReason && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl border border-red-200 bg-red-50">
          <XCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{t('superAdminPages.rejectionReason')}</p>
            <p className="text-sm text-red-600 mt-0.5">{pharmacy.rejectionReason}</p>
            {pharmacy.approvedAt && (
              <p className="text-xs text-red-400 mt-1">
                Actioned: {new Date(pharmacy.approvedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Approval date */}
      {pharmacy.status === 'APPROVED' && pharmacy.approvedAt && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200 bg-green-50">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">
            Approved on {new Date(pharmacy.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Owner / Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide" style={{ color: NAVY }}>
            Owner & Contact
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-700">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-medium">{pharmacy.representativeName || '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <EnvelopeIcon className="w-4 h-4 text-gray-400 shrink-0" />
              {pharmacy.user?.email || '—'}
            </div>
            {pharmacy.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
                {pharmacy.phone}
              </div>
            )}
            {pharmacy.address && (
              <div className="flex items-start gap-3 text-gray-700">
                <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                {pharmacy.address}
              </div>
            )}
            {pharmacy.dateOfIncorporation && (
              <div className="flex items-center gap-3 text-gray-700">
                <ClockIcon className="w-4 h-4 text-gray-400 shrink-0" />
                Incorporated: {new Date(pharmacy.dateOfIncorporation).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Registration Numbers — the three searchable fields */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide" style={{ color: NAVY }}>
            Registration Numbers
          </h2>
          <div className="space-y-4">
            {registrationNumbers.map(item => (
              <div key={item.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-mono ${item.value ? 'text-gray-800 font-semibold' : 'text-gray-300 italic'}`}>
                    {item.value || t('common.notProvided')}
                  </p>
                  {item.value && item.docType && (
                    <button
                      onClick={async () => {
                        try {
                          // GET /super-admin/pharmacies/:id/documents/rdb-certificate
                          // GET /super-admin/pharmacies/:id/documents/pharmacy-license
                          const endpoint = item.docType === 'rdb'
                            ? `/super-admin/pharmacies/${params.id}/documents/rdb-certificate`
                            : `/super-admin/pharmacies/${params.id}/documents/pharmacy-license`;
                          const res = await api.get(endpoint);
                          const url = res.data?.documentUrl || res.data?.url || res.data;
                          openDocument(url);
                        } catch {
                          toast.error(t('errors.couldNotFetchDocument'));
                        }
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                      style={{ backgroundColor: '#F0F7F6', color: TEAL }}
                    >
                      View Doc
                    </button>
                  )}
                </div>
                <div className="h-px bg-gray-100 mt-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Verification Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2" style={{ color: NAVY }}>
            <MapPinIcon className="w-4 h-4" />
            Location Verification
          </h2>

          {/* Verification status badge */}
          {pharmacy.isLocationVerified ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              <ShieldCheckIcon className="w-3.5 h-3.5" /> Location Verified
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" /> Not Yet Verified
            </span>
          )}
        </div>

        {/* Instruction */}
        <p className="text-xs text-gray-500">
          Review the map pin below against the submitted text address. Verify if the coordinates are authentic and match the stated location.
        </p>

        {/* Submitted text address for reference */}
        <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Submitted Address</p>
            <p className="text-sm text-gray-800">{pharmacy.address || '—'}</p>
          </div>
        </div>

        {/* Map preview — read-only (no onChange needed, but LocationPicker requires it) */}
        {pharmacy.latitude && pharmacy.longitude ? (
          <>
            <LocationPicker
              latitude={pharmacy.latitude}
              longitude={pharmacy.longitude}
              onChange={() => {/* read-only view */}}
              label="Submitted GPS Coordinates"
              height="280px"
            />

            {/* Coordinate values */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Latitude</p>
                <p className="font-mono font-semibold text-gray-800">{pharmacy.latitude}</p>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Longitude</p>
                <p className="font-mono font-semibold text-gray-800">{pharmacy.longitude}</p>
              </div>
            </div>

            {/* Verify / Flag buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => handleVerifyLocation(true)}
                disabled={locationLoading || pharmacy.isLocationVerified}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: TEAL }}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                {pharmacy.isLocationVerified ? 'Already Verified' : 'Verify Location'}
              </button>
              <button
                onClick={() => handleVerifyLocation(false)}
                disabled={locationLoading || !pharmacy.isLocationVerified}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-all"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                Flag as Unverified
              </button>
            </div>

            {pharmacy.locationVerifiedAt && (
              <p className="text-xs text-gray-400">
                Last verified: {new Date(pharmacy.locationVerifiedAt).toLocaleString()}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-amber-100 bg-amber-50">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              This pharmacy did not submit GPS coordinates. Location verification is not possible until coordinates are provided.
            </p>
          </div>
        )}
      </div>

      {/* Submitted Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2" style={{ color: NAVY }}>
          <DocumentTextIcon className="w-4 h-4" />
          Submitted Documents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: 'RDB Certificate',
              value: pharmacy.rdbCertificate,
              endpoint: `/super-admin/pharmacies/${params.id}/documents/rdb-certificate`,
            },
            {
              label: 'Pharmacy License',
              value: pharmacy.pharmacyLicense,
              endpoint: `/super-admin/pharmacies/${params.id}/documents/pharmacy-license`,
            },
          ].map(doc => (
            <div
              key={doc.label}
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{ borderColor: doc.value ? '#D1FAE5' : '#FEE2E2', backgroundColor: doc.value ? '#F0FDF4' : '#FEF2F2' }}
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">{doc.label}</p>
                {doc.value
                  ? <p className="text-xs text-green-600 mt-0.5">{t('superAdminPages.documentUploaded')}</p>
                  : <p className="text-xs text-red-500 mt-0.5">{t('superAdminPages.documentMissing')}</p>}
              </div>
              {doc.value && (
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get(doc.endpoint);
                      const url = res.data?.documentUrl || res.data?.url || res.data;
                      openDocument(url);
                    } catch {
                      toast.error(t('errors.couldNotFetchDocument'));
                    }
                  }}
                  className="px-3 py-1.5 text-white rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: TEAL }}
                >
                  Open
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders from this pharmacy */}
      {pharmacy.orders && pharmacy.orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide" style={{ color: NAVY }}>
            Recent Orders
          </h2>
          <div className="space-y-2">
            {pharmacy.orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {order.patient ? `${order.patient.firstName} ${order.patient.lastName}` : 'Patient'}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: TEAL }}>
                    {Number(order.total ?? 0).toLocaleString()} RWF
                  </p>
                  <span className="text-xs text-gray-400">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('superAdminPages.rejectApplication')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              The rejection reason will be shown to the pharmacy owner so they can correct and resubmit.
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
                onClick={() => { setShowReject(false); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
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
