'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { ClockIcon, CheckCircleIcon, ShoppingCartIcon, CurrencyDollarIcon, PresentationChartLineIcon, ClipboardDocumentListIcon, PlusCircleIcon, DocumentTextIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

interface CurrentAttendance {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'CLOCKED_OUT' | 'COMPLETED' | 'REJECTED';
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  clockInApprover?: { firstName: string; lastName: string };
  rejectionReason?: string;
}

interface StaffProfile {
  firstName: string;
  lastName: string;
  user: { email: string; role: string };
  branch: { name: string; pharmacy: { name: string } };
  status: string;
}

const STATUS_INFO_COLORS: Record<string, { color: string; dot: string }> = {
  PENDING:     { color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dot: 'bg-yellow-400'  },
  APPROVED:    { color: 'bg-green-50 text-green-700 border-green-200',     dot: 'bg-green-400'   },
  CLOCKED_OUT: { color: 'bg-orange-50 text-orange-700 border-orange-200',  dot: 'bg-orange-400'  },
  COMPLETED:   { color: 'bg-blue-50 text-blue-700 border-blue-200',        dot: 'bg-blue-400'    },
  REJECTED:    { color: 'bg-red-50 text-red-700 border-red-200',           dot: 'bg-red-400'     },
};

export default function StaffDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCashier = user?.role === 'CASHIER';

  const STATUS_INFO: Record<string, { label: string; color: string; dot: string }> = {
    PENDING:     { label: t('staff.statusWaitingApproval'),   ...STATUS_INFO_COLORS.PENDING     },
    APPROVED:    { label: t('staff.statusActiveShift'),       ...STATUS_INFO_COLORS.APPROVED    },
    CLOCKED_OUT: { label: t('staff.statusClockOutPending'),   ...STATUS_INFO_COLORS.CLOCKED_OUT },
    COMPLETED:   { label: t('dashboard.completed') ?? 'Shift completed', ...STATUS_INFO_COLORS.COMPLETED  },
    REJECTED:    { label: t('staff.statusRejected'),          ...STATUS_INFO_COLORS.REJECTED    },
  };
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [todayShift, setTodayShift] = useState<CurrentAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [transactionsToday, setTransactionsToday] = useState(0);
  const [grossSales, setGrossSales] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [profileRes, shiftRes, ordersRes] = await Promise.all([
        api.get('/staff/profile/me'),
        api.get('/attendance/my-current'),
        api.get('/orders/pharmacy-orders'),
      ]);

      setProfile(profileRes.data);
      setTodayShift(shiftRes.data);

      const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data ?? [];
      
      const todayStr = new Date().toDateString();
      const todaysOrders = allOrders.filter((o: any) => new Date(o.createdAt).toDateString() === todayStr);
      
      setTransactionsToday(todaysOrders.length);
      
      const totalSales = todaysOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      setGrossSales(totalSales);

      const mappedActivities = [...allOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((o: any) => {
          let statusColor = 'text-gray-600 bg-gray-50 ring-gray-200';
          if (['COMPLETED', 'DELIVERED'].includes(o.status)) statusColor = 'text-green-600 bg-green-50 ring-green-200';
          if (['PENDING'].includes(o.status)) statusColor = 'text-yellow-600 bg-yellow-50 ring-yellow-200';
          if (['CANCELLED'].includes(o.status)) statusColor = 'text-red-600 bg-red-50 ring-red-200';

          return {
            id: o.id.slice(0, 8).toUpperCase(),
            type: o.prescription ? t('staff.prescription') : t('staff.order'),
            amount: `${t('common.currency')} ${Number(o.total || 0).toLocaleString()}`,
            time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: o.status.replace(/_/g, ' '),
            color: statusColor
          };
        });

        setRecentActivities(mappedActivities);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/clock-in', {});
      toast.success(t('dashboard.clockInRequest'));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('dashboard.failedToClockIn'));
    } finally { setActionLoading(false); }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/clock-out', {});
      toast.success(t('dashboard.clockOutRequest'));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('dashboard.failedToClockOut'));
    } finally { setActionLoading(false); }
  };

  const formatTime = (d?: string) =>
    d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const now = new Date();
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const shiftInfo = todayShift ? STATUS_INFO[todayShift.status] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Hero banner — navy/teal palette matching pharmacy owner */}
      <div className="rounded-2xl p-6 lg:p-8 text-white shadow-sm" style={{ backgroundColor: NAVY }}>
        <p className="text-white/70 text-sm">{getGreeting()},</p>
        <h1 className="text-2xl lg:text-3xl font-bold mt-1">
          {profile ? `${profile.firstName} ${profile.lastName}` : t('common.loading')}
        </h1>
        {profile && (
          <div className="flex items-center gap-2 mt-3 text-white/70 text-sm flex-wrap">
            <span>{profile.branch.name}</span>
            <span>·</span>
            <span>{profile.branch.pharmacy.name}</span>
            <span>·</span>
            <span className="capitalize">{profile.user.role.toLowerCase()}</span>
          </div>
        )}
      </div>

      {/* Overview stat cards & Quick Actions */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('dashboard.todaysOverview')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('dashboard.transactionsToday'), value: String(transactionsToday), icon: ShoppingCartIcon, dark: false },
            { label: t('dashboard.grossSales'), value: `${t('common.currency')} ${grossSales.toLocaleString()}`, icon: CurrencyDollarIcon, dark: true },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-2xl p-5 flex items-center justify-between shadow-sm" style={{ backgroundColor: s.dark ? NAVY : TEAL }}>
                <div>
                  <p className="text-white/80 text-sm">{s.label}</p>
                  <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15">
                  <Icon className="w-[22px] h-[22px] text-white" />
                </div>
              </div>
            );
          })}

          {/* Quick Action 1 */}
          <Link href="/staff/orders" className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: '#F0F7F6' }}>
              <PlusCircleIcon className="w-6 h-6" style={{ color: TEAL }} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{t('dashboard.newSale')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.goToPos')}</p>
            </div>
          </Link>

          {isCashier ? (
            <Link href="/staff/orders" className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: '#F0F7F6' }}>
                <CreditCardIcon className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{t('dashboard.processPayments')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.processPaymentsSubtitle')}</p>
              </div>
            </Link>
          ) : (
            <Link href="/staff/prescriptions" className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: '#F0F7F6' }}>
                <DocumentTextIcon className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{t('dashboard.rxCheck')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.viewPrescriptions')}</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shift details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Today's Shift */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.todayShift')}</h2>

        {!todayShift ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F0F7F6' }}>
              <ClockIcon className="w-8 h-8" style={{ color: TEAL }} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">{t('dashboard.notClockedIn')}</p>
            <p className="text-gray-400 text-sm mb-6">{t('dashboard.clickToStart')}</p>
            <button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
              style={{ backgroundColor: TEAL }}
            >
              {actionLoading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <ClockIcon className="w-5 h-5" />}
              Clock In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {shiftInfo && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${shiftInfo.color}`}>
                <span className={`w-3 h-3 rounded-full shrink-0 ${shiftInfo.dot}`} />
                <span className="font-medium text-sm">{shiftInfo.label}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{t('staff.clockIn')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatTime(todayShift.clockInTime)}</p>
                {todayShift.clockInApprover && (
                  <p className="text-xs mt-1" style={{ color: TEAL }}>
                    Approved by {todayShift.clockInApprover.firstName}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{t('staff.clockOut')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatTime(todayShift.clockOutTime)}</p>
                {todayShift.totalHours && (
                  <p className="text-xs text-blue-600 mt-1">{todayShift.totalHours.toFixed(1)} hours worked</p>
                )}
              </div>
            </div>

            {todayShift.status === 'REJECTED' && todayShift.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs text-red-600 font-medium">Rejection reason: {todayShift.rejectionReason}</p>
              </div>
            )}

            {todayShift.status === 'APPROVED' && (
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <ClockIcon className="w-5 h-5" />}
                Clock Out
              </button>
            )}

            {todayShift.status === 'REJECTED' && (
              <button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: TEAL }}
              >
                {actionLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <ClockIcon className="w-5 h-5" />}
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Right Column: Recent Activity Table */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('dashboard.recentActivity')}</h2>
            <Link href="/staff/orders" className="text-sm font-medium hover:underline" style={{ color: TEAL }}>{t('common.viewAll')}</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('dashboard.transactionId')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.type')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.time')}</th>
                  <th className="px-5 py-3 font-medium text-right">{t('dashboard.amount')}</th>
                  <th className="px-5 py-3 font-medium text-center">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {recentActivities.map((activity, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">{activity.id}</td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{activity.type}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{activity.time}</td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900 dark:text-gray-100">{activity.amount}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${activity.color}`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentActivities.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                 {t('dashboard.noRecentActivity')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
