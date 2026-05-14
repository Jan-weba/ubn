'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  XMarkIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

interface SuperAdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void;
}

export default function SuperAdminSidebar({ open = false, onClose, onOpenSupport }: SuperAdminSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navigation = [
    { name: t('superAdmin.dashboard'),  href: '/super-admin/dashboard',  icon: HomeIcon },
    { name: t('superAdmin.pharmacies'), href: '/super-admin/pharmacies', icon: BuildingStorefrontIcon },
    { name: t('superAdmin.patients'),   href: '/super-admin/patients',   icon: UserGroupIcon },
    { name: t('superAdmin.analytics'),  href: '/super-admin/analytics',  icon: ChartBarIcon },
    { name: 'Pharmacy Map',             href: '/super-admin/map',        icon: MapPinIcon },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-40 w-64 flex flex-col
      bg-slate-900 text-slate-300
      transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      lg:translate-x-0 lg:min-h-screen lg:sticky lg:top-0 lg:self-start
    `}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">E-Vuze</h1>
              <p className="text-xs text-slate-400">{t('superAdmin.portal')}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} onClick={onClose}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold">{t('common.needHelp')}</p>
          </div>
          <p className="text-xs text-slate-400 mb-3">{t('common.contactSupport')}</p>
          <button
            onClick={onOpenSupport}
            className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
          >
            {t('common.getSupport')}
          </button>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-sm font-semibold">{t('superAdmin.systemStatus')}</p>
          </div>
          <p className="text-xs text-slate-400">{t('superAdmin.allSystemsOperational')}</p>
        </div>
      </div>
    </div>
  );
}
