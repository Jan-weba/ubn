'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const TEAL = '#2D9B8A';
const NAVY = '#1E4D8C';
const PIE_COLORS = ['#2D9B8A', '#1E4D8C', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PharmacyAnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.get('/pharmacies/dashboard/analytics', { signal: controller.signal }),
      api.get('/pharmacies/dashboard/stats', { signal: controller.signal }),
    ])
      .then(([aRes, sRes]) => {
        setAnalytics(aRes.data?.data ?? aRes.data);
        setStats(sRes.data?.data ?? sRes.data);
      })
      .catch(err => { if (err?.code !== 'ERR_CANCELED') console.error(err); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <LoadingSpinner />
    </div>
  );
  }

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n ?? 0);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatChange = (change: number) => {
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return '0%';
  };

  const cards = [
    { label: 'Total Revenue', value: `RWF ${fmt(analytics?.totalRevenue ?? 0)}`, change: analytics?.revenueChange, icon: CurrencyDollarIcon, color: 'bg-teal-100', iconColor: 'text-teal-600' },
    { label: 'Total Orders', value: analytics?.totalOrders ?? 0, change: analytics?.ordersChange, icon: ShoppingCartIcon, color: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'Avg. Order Value', value: `RWF ${fmt(analytics?.avgOrderValue ?? 0)}`, change: analytics?.avgValueChange, icon: ArrowTrendingUpIcon, color: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: 'Items Sold', value: analytics?.itemsSold ?? 0, change: analytics?.itemsChange, icon: CubeIcon, color: 'bg-green-100', iconColor: 'text-green-600' },
  ];

  const revenueOverTime = stats?.revenueOverTime ?? [];
  const revenueByBranch = stats?.revenueByBranch ?? [];
  const inventoryDistribution = stats?.inventoryDistribution ?? [];

  return (
    <div className="space-y-6">
    {/* Header */}
      <div className="bg-linear-to-r from-[#1E4D8C] via-[#2563a8] to-[#1a3d6f] rounded-2xl shadow-lg p-6 lg:p-8 text-white">
      <h1 className="text-2xl lg:text-3xl font-bold mb-1">{t('analytics.analyticsTitle')}</h1>
      <p className="text-blue-100 text-sm">{t('analytics.trackPerformance')}</p>
    </div>

    {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{card.label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
            {card.change !== undefined && (
                <p className={`text-sm font-medium ${getChangeColor(card.change)}`}>
                {formatChange(card.change)} from last month
                </p>
            )}
            </div>
        );
        })}
      </div>

    {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('analytics.revenueTrend6Months')}</h2>
        {revenueOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={(v: any) => [`RWF ${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="revenue" stroke={TEAL} strokeWidth={2.5} dot={{ fill: TEAL, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{t('analytics.noRevenueData')}</div>
        )}
        </div>

      {/* Revenue by branch */}
        <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('analytics.revenueByBranch')}</h2>
        {revenueByBranch.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueByBranch} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={(v: any) => [`RWF ${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="revenue" fill={NAVY} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{t('analytics.noBranchData')}</div>
        )}
        </div>
    </div>

    {/* Inventory distribution */}
      <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('analytics.inventoryDistribution')}</h2>
      {inventoryDistribution.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={inventoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {inventoryDistribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
                </Pie>
              <Tooltip formatter={(v: any) => [`${v} SKUs`, 'Medications']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">{t('analytics.noInventoryData')}</div>
      )}
      </div>

    {/* Monthly performance summary */}
      <div className="bg-white rounded-xl shadow-md p-6 pb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('analytics.monthlyPerformance')}</h2>
      <div className="space-y-4">
        {[
            { label: 'Revenue Growth', value: `RWF ${fmt(analytics?.totalRevenue ?? 0)}`, change: analytics?.revenueChange },
            { label: 'Order Growth', value: `${analytics?.totalOrders ?? 0} orders`, change: analytics?.ordersChange },
            { label: 'Average Order Value', value: `RWF ${fmt(analytics?.avgOrderValue ?? 0)}`, change: analytics?.avgValueChange },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">{row.label}</p>
              <p className="text-xl font-bold text-gray-900">{row.value}</p>
            </div>
            {row.change !== undefined && (
                <div className={`text-right ${getChangeColor(row.change)}`}>
                <p className="text-xl font-bold">{formatChange(row.change)}</p>
                <p className="text-xs text-gray-500">{t('analytics.vsLastMonth')}</p>
              </div>
            )}
            </div>
        ))}
        </div>
    </div>
  </div>
);
}
