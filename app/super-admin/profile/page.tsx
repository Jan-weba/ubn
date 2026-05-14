// frontend/src/app/super-admin/profile/page.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function SuperAdminProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error(t('form.fieldRequired'));
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(t('profile2.newPasswordsMismatch'));
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error(t('form.passwordTooShort'));
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      
      toast.success(t('form.passwordChanged'));
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('errors.failedToChangePassword'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
            <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
               {t('common.profile')}
              </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('extras.superAdmin.manageAccount')}
              </p>
          </div>

          {/* Profile Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <UserCircleIcon className="w-6 h-6" />
              {t('extras.superAdmin.accountInformation')}
              </h2>

            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                SA
                </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('roles.superAdmin')}
                  </h3>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {t('extras.superAdmin.administratorAccess')}
                    </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('form.role')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('roles.superAdministrator')}
                  </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('form.email')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {user?.email}
                  </p>
              </div>
            </div>
          </div>

          {/* Change Password */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <LockClosedIcon className="w-6 h-6" />
              {t('profile2.changePassword')}
              </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('extras.profile.currentPassword')}
                  </label>
                <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('extras.profile.newPassword')}
                  </label>
                <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('extras.profile.confirmNewPassword')}
                  </label>
                <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
              </div>

              <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                {changingPassword ? (
                    <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('profile2.changingPassword')}</span>
                  </div>
                ) : (
                    t('profile2.changePassword')
                  )}
                </button>
            </form>
          </div>

          {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex gap-4">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {t('extras.superAdmin.securityRecommendation')}
                  </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('extras.superAdmin.securityRecommendationText')}
                  </p>
              </div>
            </div>
          </div>
        </div>
  );
}