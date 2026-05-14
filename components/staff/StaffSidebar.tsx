'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Clock, Lock, User, HelpCircle, LogOut, X, ShoppingCart, Package, ClipboardList, ShieldAlert, CreditCard } from 'lucide-react';
import { isPatientEnabled } from '@/lib/features';
import { useAuth } from '@/context/AuthContext';


interface StaffSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void;
}

export default function StaffSidebar({ open = false, onClose, onOpenSupport }: StaffSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCashier = user?.role === 'CASHIER';

  const nav = [
    { href: '/staff/dashboard',       icon: LayoutDashboard, label: t('staff.dashboard'),                                              show: true },
    { href: '/staff/orders',          icon: CreditCard,      label: t('cashier.paymentsNav'),                                         show: isCashier },
    { href: '/staff/orders',          icon: ShoppingCart,    label: t('staff.orders'),                                                 show: !isCashier },
    { href: '/staff/inventory',       icon: Package,         label: t('staff.inventory'),                                              show: true },
    { href: '/staff/prescriptions',   icon: ClipboardList,   label: t('staff.prescriptions') + (isPatientEnabled() ? '' : ' (Soon)'), show: !isCashier },
    { href: '/staff/attendance',      icon: Clock,           label: t('staff.attendance'),                                             show: true },
    { href: '/staff/profile',         icon: User,            label: t('staff.profile'),                                                show: true },
    { href: '/staff/change-password', icon: Lock,            label: t('staff.changePassword'),                                        show: true },
  ].filter((item) => item.show);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{ backgroundColor: '#1E4D8C' }}
    >
      <div className="px-6 py-7 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-white text-2xl font-bold tracking-tight">E-Vuze</p>
          <p className="text-white/60 text-sm mt-0.5">{t('staff.portal')}</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10">
          <X size={18} className="text-white/70" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              style={active ? { backgroundColor: '#2D9B8A' } : {}}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {label}
              </div>
              {href === '/staff/prescriptions' && !isPatientEnabled() && (
                <ShieldAlert size={14} className="text-white/40" />
              )}
            </Link>

          );
        })}
      </nav>

      <div className="px-4 pb-4 space-y-2">
        <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={16} className="text-white/70" />
            <p className="text-white text-sm font-semibold">{t('common.needHelp')}</p>
          </div>
          <p className="text-white/60 text-xs mb-3">{t('common.contactSupport')}</p>
          <button
            onClick={onOpenSupport}
            className="w-full py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2D9B8A' }}
          >
            {t('common.getSupport')}
          </button>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium"
        >
          <LogOut size={18} />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
