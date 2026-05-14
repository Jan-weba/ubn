// frontend/src/app/branch/attendance/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface AttendanceRecord {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'CLOCKED_OUT' | 'COMPLETED' | 'REJECTED';
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  notes?: string;
  rejectionReason?: string;
  staff: {
    firstName: string;
    lastName: string;
    user: { email: string; role: string };
  };
  clockInApprover?: { firstName: string; lastName: string };
  clockOutApprover?: { firstName: string; lastName: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-yellow-100 text-yellow-800',
  APPROVED:    'bg-blue-100 text-blue-800',
  CLOCKED_OUT: 'bg-orange-100 text-orange-800',
  COMPLETED:   'bg-emerald-100 text-emerald-800',
  REJECTED:    'bg-red-100 text-red-800',
};

export default function BranchAttendancePage() {
  const { t } = useTranslation();
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchAttendanceData = useCallback(
    async (signal: AbortSignal) => {
      const res = await api.get('/attendance/branch', { signal });
      return res.data;
    },
    []
  );

  const { data, loading, error, refetch } = useFetch<AttendanceRecord[]>(fetchAttendanceData, []);
  const records = data ?? [];

  useEffect(() => {
    if (error) {
      toast.error(t('errors.failedToLoadAttendance'));
    }
  }, [error, t]);

  const handleAction = async (
    id: string,
    action: 'approve-clock-in' | 'reject-clock-in' | 'approve-clock-out' | 'reject-clock-out',
    currentStatus: string
  ) => {
    const actionKey = id + '-' + action;
    const isReject = action.includes('reject');
    const reason = isReject ? prompt('Reason for rejection (optional):') ?? '' : '';

    setActionId(actionKey);
    try {
      await api.put(`/attendance/${id}/${action}`, isReject ? { reason } : {});
      toast.success(isReject ? t('attendance.rejected') : t('attendance.approved'));
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('attendance.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const formatTime = (dateStr?: string) =>
  dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
    {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('attendance.attendance')}</h1>
        <p className="text-sm text-gray-500 mt-1">{records.length} {t('staffMgmt.records')}</p>
      </div>
      {/* Filter */}
        <div className="flex flex-wrap gap-2">
        {['all', 'PENDING', 'APPROVED', 'CLOCKED_OUT', 'COMPLETED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === status
                  ? 'text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
              style={filter === status ? { backgroundColor: '#2D9B8A' } : {}}
            >
            {status === 'all' ? t('attendance.all') : status.replace(/_/g, ' ')}
            </button>
        ))}
        </div>
    </div>

    {/* Records */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700">
        <p className="text-gray-400">{t('attendance.noRecordsFound')}</p>
      </div>
    ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.staff')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.date')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.clockIn')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.clockOut')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">{t('attendance.hours')}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.status')}</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{t('attendance.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {record.staff.firstName} {record.staff.lastName}
                      </p>
                    <p className="text-xs text-gray-500">{record.staff.user.role}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(record.clockInTime)}
                    </td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(record.clockInTime)}
                    </td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(record.clockOutTime)}
                    </td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                    {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '—'}
                    </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[record.status]}`}>
                      {record.status.replace(/_/g, ' ')}
                      </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Pending clock-in: approve or reject */}
                        {record.status === 'PENDING' && (
                          <>
                          <button
                              onClick={() => handleAction(record.id, 'approve-clock-in', record.status)}
                              disabled={!!actionId}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg disabled:opacity-50"
                              title={t('attendance.approveClockIn')}
                            >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => handleAction(record.id, 'reject-clock-in', record.status)}
                              disabled={!!actionId}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg disabled:opacity-50"
                              title={t('attendance.rejectClockIn')}
                            >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                        {/* Clocked-out: approve or reject clock-out */}
                        {record.status === 'CLOCKED_OUT' && (
                          <>
                          <button
                              onClick={() => handleAction(record.id, 'approve-clock-out', record.status)}
                              disabled={!!actionId}
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg disabled:opacity-50"
                              title={t('attendance.approveClockOut')}
                            >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => handleAction(record.id, 'reject-clock-out', record.status)}
                              disabled={!!actionId}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg disabled:opacity-50"
                              title={t('attendance.rejectClockOut')}
                            >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                        {/* No actions for APPROVED, COMPLETED, REJECTED */}
                        {['APPROVED', 'COMPLETED', 'REJECTED'].includes(record.status) && (
                          <span className="text-xs text-gray-400">—</span>
                      )}
                      </div>
                  </td>
                </tr>
              ))}
              </tbody>
          </table>
        </div>
      </div>
    )}
    </div>
);
}