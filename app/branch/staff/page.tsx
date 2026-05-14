// frontend/src/app/branch/staff/page.tsx

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  UserGroupIcon,
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nationalId?: string;
  gender?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  user: { email: string; role: string };
  permissions?: { permissions: string[] };
}

const ROLE_COLORS: Record<string, string> = {
  PHARMACIST: 'bg-violet-100 text-violet-800',
  CASHIER:    'bg-blue-100 text-blue-800',
  NURSE:      'bg-pink-100 text-pink-800',
};

export default function BranchStaffPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: staff = [], loading, refetch } = useFetch<StaffMember[]>(
    async (signal) => {
      const res = await api.get('/staff', { signal });
      return res.data;
    },
    []
  ) as any;

  const handleResendCredentials = async (staffId: string, email: string) => {
    if (!confirm(`Resend login credentials to ${email}?`)) return;
    setActionId(staffId + '-resend');
    try {
      await api.post(`/staff/${staffId}/resend-credentials`); // POST /staff/:id/resend-credentials
      toast.success(`Credentials resent to ${email}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('staffMgmt.failedToResend'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (staffId: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setActionId(staffId + '-delete');
    try {
      await api.delete(`/staff/${staffId}`); // DELETE /staff/:id
      toast.success(t('success.staffMemberRemoved'));
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete staff');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
    {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('branch.staff')}</h1>
        <p className="text-sm text-gray-500 mt-1">{staff.length} member{staff.length !== 1 ? 's' : ''} in your branch</p>
      </div>
      <button
          onClick={() => router.push('/branch/staff/new')}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: TEAL }}
        >
        <PlusIcon className="w-4 h-4" />
        Add Staff
        </button>
    </div>

    {/* Staff List */}
      {staff.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 text-center">
        <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">{t('staffMgmt.noStaffYet')}</p>
        <p className="text-gray-400 text-sm mt-1">{t('staffMgmt.addFirst')}</p>
        <button
            onClick={() => router.push('/branch/staff/new')}
            className="mt-4 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: TEAL }}
          >
          Add Staff Member
          </button>
      </div>
    ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.name')}</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('form.role')}</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">{t('common.phone')}</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">{t('staffMgmt.permissions')}</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {staff.map((member: any) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {member.firstName} {member.lastName}
                    </p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[member.user.role] || 'bg-gray-100 text-gray-700'}`}>
                    {member.user.role}
                    </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone || '—'}</p>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  <p className="text-xs text-gray-500">
                    {member.permissions?.permissions?.length ?? 0} permissions
                    </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                    {member.status}
                    </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => router.push(`/branch/staff/${member.id}`)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: TEAL }}
                        title={t('staffMgmt.viewDetails')}
                      >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleResendCredentials(member.id, member.user.email)}
                        disabled={!!actionId}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50"
                        title={t('staffMgmt.resendCredentials')}
                      >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(member.id, `${member.firstName} ${member.lastName}`)}
                        disabled={!!actionId}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title={t('staffMgmt.removeStaffMember')}
                      >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
        </table>
      </div>
    )}
    </div>
);
}