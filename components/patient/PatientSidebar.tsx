'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { id: 'dashboard', nameKey: 'patient.dashboard', href: '/patient/dashboard', icon: HomeIcon },
  { id: 'search', nameKey: 'extras.search.findTagline', href: '/patient/search', icon: MagnifyingGlassIcon },
  // { id: 'pharmacies-map', nameKey: 'Pharmacy Map', href: '/patient/search', icon: MapPinIcon },
  // commenting out for now since it's the same as search, but can be added back with a different href if needed
  { id: 'cart', nameKey: 'cart.title', href: '/patient/cart', icon: ShoppingCartIcon },
  { id: 'orders', nameKey: 'patient.myOrders', href: '/patient/orders', icon: ClipboardDocumentListIcon },
  { id: 'notifications', nameKey: 'common.notifications', href: '/patient/notifications', icon: BellIcon },
  { id: 'profile', nameKey: 'patient.myProfile', href: '/patient/profile', icon: UserCircleIcon },
];

interface PatientSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void;
}

export default function PatientSidebar({ open = false, onClose, onOpenSupport }: PatientSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={`
      w-64 bg-linear-to-b from-[#1E4D8C] via-[#1a3d6f] to-[#0f2444] text-white min-h-screen
      fixed left-0 top-0 shadow-2xl z-40 flex flex-col
      transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
    <div className="p-6 border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BuildingStorefrontIcon className="w-10 h-10 text-white" />
        <div>
          <h1 className="text-2xl font-bold text-white">Evuze</h1>
          <p className="text-xs text-blue-200">{t('auth.healthcarePlatform')}</p>
        </div>
      </div>
      <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>

    <nav className="p-4 space-y-2 flex-1">
      {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#2D9B8A] text-white font-semibold shadow-lg'
                  : 'hover:bg-white/10 hover:translate-x-1'
              }`}
            >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{t(item.nameKey)}</span>
          </Link>
        );
        })}
      </nav>

    <div className="p-4 border-t border-white/10 space-y-2">
      <div className="rounded-xl p-4 bg-white/10">
        <div className="flex items-center gap-2 mb-1">
          <QuestionMarkCircleIcon className="w-4 h-4 text-white/70" />
          <p className="text-white text-sm font-semibold">{t('common.needHelp')}</p>
        </div>
        <p className="text-white/60 text-xs mb-3">{t('common.contactSupport')}</p>
        <button
          onClick={onOpenSupport}
          className="w-full py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D9B8A' }}
        >
          {t('common.getSupport')}
        </button>
      </div>
      <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/10 w-full text-left"
        >
        <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
        <span className="text-sm">{t('common.logout')}</span>
      </button>
    </div>

    <div className="p-4 border-t border-white/10">
      <p className="text-xs text-blue-200 text-center">
        {t('landing.copyrightShort')}
        </p>
    </div>
  </aside>
);
}
