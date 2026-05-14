// frontend/src/components/super-admin/SuperAdminTopbar.tsx
// FIXED VERSION - Corrected CSS gradient classes

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

interface SuperAdminTopbarProps {
  onMenuClick?: () => void;
}

export default function SuperAdminTopbar({ onMenuClick }: SuperAdminTopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, type: 'pharmacy', message: t('superAdmin.topbar.newPharmacy'), time: '10 min ago' },
    { id: 2, type: 'system', message: t('superAdmin.topbar.systemAlert'), time: '1 hour ago' },
    { id: 3, type: 'report', message: t('superAdmin.topbar.weeklyReport'), time: '3 hours ago' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 sticky top-0 z-40">
    <div className="flex items-center justify-between">
      {/* Left: Title */}
        <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 text-slate-800 dark:text-slate-200 hidden sm:block" />
          <div>
            <h2 className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white">
              {t('superAdmin.topbar.title')}
              </h2>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              {t('superAdmin.topbar.subtitle')}
              </p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
        <div className="flex items-center gap-4">
        {/* Language Switcher */}
          <LanguageSwitcher />

        {/* Notifications */}
          <div className="relative" ref={notifRef}>
          <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            >
            <BellIcon className="w-6 h-6" />
            {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
            </button>

          {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  {t('common.notifications')}
                  </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {notif.message}
                        </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notif.time}
                        </p>
                    </div>
                  ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('common.noNotifications')}
                      </p>
                  </div>
                )}
                </div>
            </div>
          )}
          </div>

        {/* Profile */}
          <div className="relative" ref={profileRef}>
          <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Super Admin
                </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('superAdmin.role')}
                </p>
            </div>
            <div className="w-8 h-8 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center text-white font-bold">
              SA
              </div>
          </button>

          {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  Super Admin
                  </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}
                  </p>
              </div>

              <button
                  onClick={() => {
                    router.push('/super-admin/profile');
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                <UserCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">
                  {t('common.profile')}
                  </span>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-3 text-rose-600 dark:text-rose-400"
                  >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          )}
          </div>
      </div>
    </div>
  </div>
);
}