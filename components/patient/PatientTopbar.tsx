'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCartIcon, BellIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

interface PatientTopbarProps {
  onMenuClick?: () => void;
}

export default function PatientTopbar({ onMenuClick }: PatientTopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cartCount = getItemCount();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
    <div className="flex items-center gap-3">
      <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
        <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">
        {t('topbar.eVuzeHealthcare')}
        </h1>
    </div>

    <div className="flex items-center gap-2 lg:gap-4">
      <LanguageSwitcher />

      <Link href="/patient/notifications">
        <button className="relative focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
          <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
      </Link>

      <Link href="/patient/cart">
        <button className="relative focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
          <ShoppingCartIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartCount}
              </span>
          )}
          </button>
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 lg:px-3 py-2 rounded-lg transition-colors"
          >
          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm hidden sm:block">
            {user?.email?.split('@')[0] || t('roles.patient')}
            </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>

        {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-1">
              <Link
                  href="/patient/profile"
                  onClick={() => setShowDropdown(false)}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                {t('extras.profile.myProfile')}
                </Link>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              <button
                  onClick={() => { logout(); setShowDropdown(false); router.push('/login'); }}
                  className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                {t('common.logout')}
                </button>
            </div>
          </div>
        )}
        </div>
    </div>
  </header>
);
}
