'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

type Tab = 'queue' | 'history';

export default function StaffPrescriptionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('queue');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // GET /prescriptions/branch — Role.PHARMACIST now permitted
      // Supports optional ?status= query param
      const res = await api.get('/prescriptions/branch');
      setPrescriptions(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      toast.error(t('errors.failedToLoadPrescriptions'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    setActionId(id);
    try {
      // PUT /prescriptions/:id/status — Role.PHARMACIST now permitted
      await api.put(`/prescriptions/${id}/status`, { status: 'APPROVED' });
      toast.success(t('success.prescriptionVerified'));
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('prescriptions.failedToVerify'));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { toast.error(t('form.provideRejectionReason')); return; }
    setActionId(id);
    try {
      // PUT /prescriptions/:id/status — Role.PHARMACIST now permitted
      await api.put(`/prescriptions/${id}/status`, { status: 'REJECTED', rejectionReason: rejectReason });
      toast.success(t('success.prescriptionRejected'));
      setPrescriptions(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'REJECTED', rejectionReason: rejectReason } : p
      ));
      setRejectingId(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('prescriptions.failedToReject'));
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const queue   = prescriptions.filter(p => p.status === 'PENDING');
  const history = prescriptions.filter(p => p.status !== 'PENDING');
  const displayed = tab === 'queue' ? queue : history;

  return (
    <div className="space-y-6">

      <div className="rounded-2xl p-6 lg:p-8 text-white" style={{ backgroundColor: NAVY }}>
        <h1 className="text-2xl lg:text-3xl font-bold">{t('prescriptions.prescriptionsTitle')}</h1>
        <p className="mt-1 text-white/70">{t('prescriptions.prescriptionsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('prescriptions.pendingReview'), value: queue.length,                                             dark: false },
          { label: t('prescriptions.verified'),      value: prescriptions.filter(p => p.status === 'APPROVED').length, dark: false },
          { label: t('prescriptions.rejected'),      value: prescriptions.filter(p => p.status === 'REJECTED').length, dark: true  },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex items-center justify-between"
            style={{ backgroundColor: s.dark ? NAVY : TEAL }}>
            <div>
              <p className="text-white/80 text-sm">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15">
              <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'queue',   label: `${t('prescriptions.pendingQueue')} (${queue.length})` },
          { key: 'history', label: `${t('prescriptions.history')} (${history.length})` },
        ] as { key: Tab; label: string }[]).map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === tabItem.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tabItem.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <ClockIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {tab === 'queue' ? t('prescriptions.noPendingReview') : t('prescriptions.noHistory')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">
                      {p.patient
                        ? `${p.patient.firstName} ${p.patient.lastName}`
                        : `Prescription #${p.id.slice(0, 8)}`}
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>{t('prescriptions.submitted')} {formatDate(p.createdAt)}</span>
                    {p.reviewedAt && <span>{t('prescriptions.reviewed')} {formatDate(p.reviewedAt)}</span>}
                    {p.fileName && <span>{t('prescriptions.file')} {p.fileName}</span>}
                  </div>

                  {p.extractedMedications && Array.isArray(p.extractedMedications) && p.extractedMedications.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{t('prescriptions.extractedMedications')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.extractedMedications.map((m: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {m.medicationName}{m.dosage ? ` — ${m.dosage}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.status === 'REJECTED' && p.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">{t('prescriptions.reason')} {p.rejectionReason}</p>
                  )}

                  {p.fileUrl && (
                    <a href={p.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex text-xs font-medium underline mt-1" style={{ color: TEAL }}>
                      {t('prescriptions.viewFile')}
                    </a>
                  )}
                </div>

                {tab === 'queue' && p.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    {rejectingId === p.id ? (
                      <div className="space-y-2 w-64">
                        <textarea rows={2} value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder={t('prescriptions.rejectionReasonPlaceholder')}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-400 resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="flex-1 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                            {t('common.cancel')}
                          </button>
                          <button onClick={() => handleReject(p.id)} disabled={!!actionId}
                            className="flex-1 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 bg-red-600 hover:bg-red-700">
                            {actionId === p.id ? t('prescriptions.rejecting') : t('prescriptions.confirmReject')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleVerify(p.id)} disabled={!!actionId}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: TEAL }}>
                          <CheckCircleIcon className="w-4 h-4" />
                          {actionId === p.id ? t('prescriptions.verifying') : t('staff.verify')}
                        </button>
                        <button onClick={() => { setRejectingId(p.id); setRejectReason(''); }}
                          disabled={!!actionId}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50">
                          <XCircleIcon className="w-4 h-4" />
                          {t('staff.reject')}
                        </button>
                      </>
                    )}
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
