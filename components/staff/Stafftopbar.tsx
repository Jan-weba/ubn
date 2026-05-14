'use client';

import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

const ROLE_COLORS: Record<string, string> = {
  PHARMACIST: 'bg-violet-100 text-violet-800',
  CASHIER:    'bg-blue-100 text-blue-800',
  NURSE:      'bg-pink-100 text-pink-800',
};

interface StaffTopbarProps {
  onMenuClick?: () => void;
}

export default function StaffTopbar({
  onMenuClick }: StaffTopbarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const role = user?.role || '';
  const roleLabel = role ? t(`roles.${role.toLowerCase()}`, { defaultValue: t('roles.staff') }) : t('roles.staff');
  const roleColor = ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-violet-700">{t('topbar.staffPortal')}</h2>
            <p className="text-xs text-gray-500 hidden sm:block">{t('topbar.eVuzeHealthcare')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full hidden sm:inline-flex ${roleColor}`}>
            {roleLabel}
          </span>
          <LanguageSwitcher />
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-900">{user?.email || 'Staff'}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <UserCircleIcon className="w-9 h-9 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
