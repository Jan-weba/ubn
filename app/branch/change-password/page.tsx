// frontend/src/app/branch/change-password/page.tsx

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function BranchChangePasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [form, setForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error(t('form.passwordsDoNotMatch'));
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error(t('form.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      // PUT /auth/branch/change-password
      await api.put('/auth/branch/change-password', {
        tempPassword: form.tempPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      toast.success(t('form.passwordChanged'));
      router.push('/branch/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('branch.failedToChangePassword'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field: keyof typeof showPass) =>
  setShowPass(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {/* Header */}
          <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('branch.changePasswordTitle')}</h1>
          <p className="text-sm text-gray-500 mt-2">
            You're logging in for the first time. Please set a permanent password to continue.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current (temp) password */}
            <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Temporary Password
              </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                  type={showPass.current ? 'text' : 'password'}
                  required
                  value={form.tempPassword}
                  onChange={e => setForm(p => ({...p, tempPassword: e.target.value}))}
                  placeholder={t('branch.tempPassword')}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              <button type="button" onClick={() => toggle('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass.current ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
          </div>

          {/* New password */}
            <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              New Password
              </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                  type={showPass.new ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.newPassword}
                  onChange={e => setForm(p => ({...p, newPassword: e.target.value}))}
                  placeholder={t('signup.minChars')}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              <button type="button" onClick={() => toggle('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass.new ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
          </div>

          {/* Confirm password */}
            <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
              </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                  type={showPass.confirm ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))}
                  placeholder={t('branch.confirmPassword')}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              <button type="button" onClick={() => toggle('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass.confirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
            </div>
          </div>

          <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
            {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('branch.saving')}</>
            ) : (
                t('branch.setPasswordAndContinue')
              )}
            </button>
        </form>
      </div>
    </div>
  </div>
);
}