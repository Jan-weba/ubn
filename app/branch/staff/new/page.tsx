// frontend/src/app/branch/staff/new/page.tsx

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const PERM_GROUP_KEY: Record<string, string> = {
  'Orders': 'permGroupOrders',
  'Inventory': 'permGroupInventory',
  'Payments': 'permGroupPayments',
  'Prescriptions': 'permGroupPrescriptions',
  'Analytics': 'permGroupAnalytics',
  'Customers': 'permGroupCustomers',
  'Staff & Settings': 'permGroupStaffSettings',
};

// All permissions grouped by category
const PERMISSION_GROUPS = [
  {
    label: 'Orders',
    perms: ['VIEW_ORDERS', 'ACCEPT_ORDERS', 'UPDATE_ORDER_STATUS', 'CANCEL_ORDERS'],
  },
  {
    label: 'Inventory',
    perms: ['VIEW_INVENTORY', 'ADD_MEDICATION', 'EDIT_MEDICATION', 'DELETE_MEDICATION', 'MANAGE_STOCK_TRANSFERS'],
  },
  {
    label: 'Payments',
    perms: ['VIEW_PAYMENTS', 'PROCESS_PAYMENTS', 'ISSUE_REFUNDS'],
  },
  {
    label: 'Prescriptions',
    perms: ['VIEW_PRESCRIPTIONS', 'APPROVE_PRESCRIPTIONS', 'REJECT_PRESCRIPTIONS'],
  },
  {
    label: 'Analytics',
    perms: ['VIEW_ANALYTICS', 'VIEW_REPORTS', 'EXPORT_DATA'],
  },
  {
    label: 'Customers',
    perms: ['VIEW_CUSTOMERS', 'MANAGE_CUSTOMER_INFO'],
  },
  {
    label: 'Staff & Settings',
    perms: ['VIEW_STAFF', 'MANAGE_STAFF', 'MANAGE_BRANCH_SETTINGS'],
  },
];

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  PHARMACIST: ['VIEW_ORDERS', 'ACCEPT_ORDERS', 'UPDATE_ORDER_STATUS', 'VIEW_INVENTORY', 'ADD_MEDICATION', 'EDIT_MEDICATION', 'VIEW_PRESCRIPTIONS', 'APPROVE_PRESCRIPTIONS', 'REJECT_PRESCRIPTIONS', 'VIEW_CUSTOMERS', 'VIEW_ANALYTICS'],
  CASHIER:    ['VIEW_ORDERS', 'VIEW_INVENTORY', 'VIEW_PAYMENTS', 'PROCESS_PAYMENTS', 'VIEW_CUSTOMERS'],
  NURSE:      ['VIEW_ORDERS', 'VIEW_INVENTORY', 'VIEW_PRESCRIPTIONS', 'VIEW_CUSTOMERS', 'MANAGE_CUSTOMER_INFO'],
};

export default function NewStaffPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'PHARMACIST' as 'PHARMACIST' | 'CASHIER' | 'NURSE',
    nationalId: '',
    gender: '',
    dateOfBirth: '',
    permissions: DEFAULT_PERMISSIONS['PHARMACIST'],
  });

  const handleRoleChange = (role: 'PHARMACIST' | 'CASHIER' | 'NURSE') => {
    setForm(prev => ({ ...prev, role, permissions: DEFAULT_PERMISSIONS[role] }));
  };

  const togglePermission = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.permissions.length === 0) {
      toast.error(t('form.assignPermission'));
      return;
    }
    setLoading(true);
    try {
      // POST /staff
      await api.post('/staff', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        nationalId: form.nationalId || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        permissions: form.permissions,
      });
      toast.success(t('success.staffCredentialsSent'));
      router.push('/branch/staff');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('staffMgmt.failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
    {/* Header */}
      <div className="flex items-center gap-3">
      <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
        >
        <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('staffMgmt.addStaffMember')}</h1>
        <p className="text-sm text-gray-500">{t('staffMgmt.receiveCredentials')}</p>
      </div>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">{t('staffMgmt.personalInformation')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('signup.firstName')} *</label>
            <input required value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('signup.lastName')} *</label>
            <input required value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.email')} *</label>
            <input required type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.phone')}</label>
            <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                placeholder="+250788..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.nationalId')}</label>
            <input value={form.nationalId} onChange={e => setForm(p => ({...p, nationalId: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.gender')}</label>
            <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">{t('form.select')}</option>
              <option>{t('form.male')}</option>
              <option>{t('form.female')}</option>
              <option>{t('form.other')}</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('form.dateOfBirth')}</label>
            <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({...p, dateOfBirth: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Role */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">{t('form.role')} *</h2>
        <div className="grid grid-cols-3 gap-3">
          {(['PHARMACIST', 'CASHIER', 'NURSE'] as const).map(role => (
              <button
                type="button"
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.role === role
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
              {role}
              </button>
          ))}
          </div>
        <p className="text-xs text-gray-500 mt-2">{t('staffMgmt.defaultPermissions')}</p>
      </div>

      {/* Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('staffMgmt.permissions')}
            <span className="ml-2 text-sm font-normal text-gray-500">({form.permissions.length} {t('staffMgmt.selected')})</span>
        </h2>
        <div className="space-y-4">
          {PERMISSION_GROUPS.map(group => (
              <div key={group.label}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t(`staffMgmt.${PERM_GROUP_KEY[group.label]}`) || group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.perms.map(perm => (
                    <button
                      type="button"
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.permissions.includes(perm)
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                    {perm.replace(/_/g, ' ')}
                    </button>
                ))}
                </div>
            </div>
          ))}
          </div>
      </div>

      {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: '#2D9B8A' }}
        >
        {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('common.loading')}</>
        ) : (
            t('staffMgmt.createStaffAndSend')
          )}
        </button>
    </form>
  </div>
);
}