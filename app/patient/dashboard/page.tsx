// src/app/patient/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import {
  ShoppingCartIcon,
  MapPinIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { fetchPharmacyLocations } from '@/services/pharmacies';
import { PharmacyLocation, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/features/map/pharmacyData';
import { MapSkeleton } from '@/components/map/MapStates';
import MapLayout from '@/components/map/MapLayout';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

export default function PatientDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const firstName = (user as any)?.profile?.firstName ?? user?.email?.split('@')[0] ?? 'there';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning');
    if (h < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const [stats, setStats] = useState({ totalOrders: 0, completedOrders: 0, pendingOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map state
  const [mapPharmacies, setMapPharmacies] = useState<PharmacyLocation[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    loadMapPharmacies();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const ordersRes = await api.get('/orders/my-orders');
      const orders = ordersRes.data;
      setStats({
        totalOrders: orders.length,
        completedOrders: orders.filter((o: any) =>
          ['COMPLETED', 'DELIVERED'].includes(o.status)
        ).length,
        pendingOrders: orders.filter((o: any) =>
          ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)
        ).length,
      });
      setRecentOrders(orders.slice(0, 5));
    } catch {
      setStats({ totalOrders: 0, completedOrders: 0, pendingOrders: 0 });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMapPharmacies = async () => {
    try {
      const data = await fetchPharmacyLocations();
      // Show only first 6 on dashboard preview
      setMapPharmacies(data.slice(0, 6));
    } catch {
      setMapPharmacies([]);
    } finally {
      setMapLoading(false);
    }
  };

  const quickActions = [
    {
      title: t('checkout2.cartEmpty').replace('Your cart is empty', '') || t('common.profileInfo').replace('Profile Info', '') || 'Shopping Cart',
      description: t('patient.browsePharmacies'),
      icon: ShoppingCartIcon,
      href: '/patient/cart',
      color: '#1E4D8C',
      cardBg: '#EBF5FF',
      iconBg: '#BFDBFE',
    },
    {
      title: t('analytics.activeOrders'),
      description: `${stats.pendingOrders} ${t('orders.pending').toLowerCase()}`,
      icon: BoltIcon,
      href: '/patient/orders',
      color: '#D97706',
      cardBg: '#FFFBEB',
      iconBg: '#FDE68A',
    },
    {
      title: t('orders2.orderCompleted'),
      description: `${stats.completedOrders} ${t('orders2.completedOrders').toLowerCase()}`,
      icon: CheckCircleIcon,
      href: '/patient/orders?status=completed',
      color: '#059669',
      cardBg: '#F0FDF4',
      iconBg: '#BBF7D0',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome hero banner */}
      <div className="rounded-2xl px-12 py-30 relative overflow-hidden" style={{ background: '#EBF5FF' }}>
        {/* Decorative heartbeat watermark */}
        <svg
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden sm:block sm:w-48 md:w-64 lg:w-96 xl:w-[500px]"
          viewBox="0 0 320 140"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <polyline
            points="0,70 55,70 80,15 108,125 135,30 162,105 188,70 320,70"
            stroke="#1E4D8C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>

        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ color: NAVY }}>
            {getGreeting()},<br />{firstName}.
          </h1>
          <p className="text-gray-500 text-lg mb-7">Your health metrics are looking excellent today.</p>
          <Link
            href="/patient/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90"
            style={{ background: TEAL }}
          >
            <MapPinIcon className="w-5 h-5" />
            Browse Nearby Pharmacies
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="flex">
            <div
              className="flex flex-col items-center text-center rounded-2xl px-8 pt-14 pb-8 w-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                background: action.cardBg,
                borderBottom: `4px solid ${action.color}`,
              }}
            >
              {/* Icon container */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5  -translate-y-5"
                style={{ background: action.iconBg }}
              >
                <action.icon className="w-8 h-8" style={{ color: action.color }} />
              </div>

              {/* Text */}
              <h3 className="font-bold text-2xl mb-3" style={{ color: action.color }}>
                {action.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── NEARBY PHARMACIES MAP SECTION ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${TEAL}15` }}
            >
              <MapPinIcon className="w-6 h-6" style={{ color: TEAL }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Nearby Pharmacies
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {mapPharmacies.length} pharmacies on the map
              </p>
            </div>
          </div>
          <Link
            href="/patient/search"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: NAVY }}
          >
            View All →
          </Link>
        </div>

        <div className="p-4" style={{ height: 380 }}>
          {mapLoading ? (
            <MapSkeleton />
          ) : (
            <MapView
              pharmacies={mapPharmacies}
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              selectedId={selectedId}
              onSelectPharmacy={(p) => setSelectedId(p.id)}
              onViewDetails={(id) => router.push(`/patient/pharmacies/${id}`)}
              className="h-full rounded-xl"
            />
          )}
        </div>

        {/* Quick pharmacy chips below map */}
        {!mapLoading && mapPharmacies.length > 0 && (
          <div className="px-4 pb-4 flex gap-2 flex-wrap">
            {mapPharmacies.slice(0, 5).map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedId === p.id
                    ? 'text-white border-transparent'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-teal-400'
                }`}
                style={selectedId === p.id ? { background: TEAL, borderColor: TEAL } : {}}
              >
                {p.status === 'OPEN' ? '🟢' : '🔴'} {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: NAVY }}>
            Recent Medical Orders
          </h2>
          <Link
            href="/patient/orders"
            className="font-semibold text-sm flex items-center gap-1 hover:underline"
            style={{ color: NAVY }}
          >
            View All <span className="text-base">›</span>
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="flex flex-col" style={{ gap: '20px' }}>
            {recentOrders.map((order: any) => {
              const firstItem = order.items?.[0] ?? order.orderItems?.[0];
              const medName = firstItem?.medication?.name ?? 'Medication';
              const medImage = firstItem?.medication?.imageUrl;
              const pharmacyName = order.pharmacy?.name ?? '—';
              const branchName = order.branch?.name ?? '';

              const statusMap: Record<string, { bg: string; color: string; dot: string }> = {
                PENDING:   { bg: '#EBF5FF', color: '#2563EB', dot: '#3B82F6' },
                ACCEPTED:  { bg: '#EBF5FF', color: '#2563EB', dot: '#3B82F6' },
                PREPARING: { bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
                COMPLETED: { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
                DELIVERED: { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
                CANCELLED: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
              };
              const s = statusMap[order.status] ?? statusMap.PENDING;

              return (
                <Link key={order.id} href={`/patient/orders/${order.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer">
                    {/* Medication image */}
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: '#F0F7FF' }}
                    >
                      {medImage ? (
                        <img src={medImage} alt={medName} className="w-full h-full object-contain p-2" />
                      ) : (
                        <ShoppingCartIcon className="w-8 h-8 text-blue-300" />
                      )}
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                      <p className="font-semibold text-sm mt-0.5" style={{ color: TEAL }}>{medName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {pharmacyName}{branchName ? ` • ${branchName}` : ''}
                      </p>
                    </div>

                    {/* Price + status */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 text-lg">
                        {order.total?.toLocaleString()} RWF
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase"
                        style={{ background: s.bg, color: s.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 text-lg font-semibold mb-1">
              {t('dashboard.noOrdersYet')}
            </p>
            <p className="text-sm text-gray-400">{t('dashboard.startShopping')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
