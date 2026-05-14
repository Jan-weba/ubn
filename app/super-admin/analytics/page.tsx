// frontend/src/app/super-admin/analytics/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

export default function SuperAdminAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, revenueRes] = await Promise.all([
        api.get('/super-admin/analytics'),
        api.get('/super-admin/revenue'),
      ]);
      
      setAnalytics(analyticsRes.data);
      setRevenue(revenueRes.data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error(t('errors.failedToLoadAnalytics'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner />
    </div>
  );
  }

  const completionRate = analytics?.totalOrders
    ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)
    : '0.0';

  const metrics = [
    {
      name: 'Total Revenue (RWF)',
      value: `RWF ${analytics?.totalRevenue?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      sub: `${revenue?.transactionCount || 0} transactions`,
    },
    {
      name: 'Total Orders',
      value: analytics?.totalOrders || 0,
      icon: ShoppingCartIcon,
      sub: `${analytics?.completedOrders || 0} completed`,
    },
    {
      name: 'Completion Rate',
      value: `${completionRate}%`,
      icon: ChartBarIcon,
      sub: 'of all orders completed',
    },
    {
      name: 'Platform Revenue',
      value: `$${analytics?.platformRevenue?.toLocaleString() || 0}`,
      icon: ArrowTrendingUpIcon,
      sub: `$${analytics?.platformFeePerPharmacy || 0}/pharmacy/month`,
    },
  ];

  return (
    <div className="space-y-6">
          {/* Header */}
            <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
               {t('superAdmin.analytics')}
              </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detailed platform performance metrics
              </p>
          </div>

          {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.name} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                      <Icon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {metric.value}
                    </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{metric.name}</p>
                  {metric.sub && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{metric.sub}</p>
                  )}
                  </div>
              );
              })}
            </div>

          {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Revenue Overview
              </h2>
              
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.totalTransactions')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {revenue?.transactionCount || 0}
                    </p>
                </div>
                <ShoppingCartIcon className="w-12 h-12 text-rose-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.avgOrderValue')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${revenue?.transactionCount ? (revenue.totalRevenue / revenue.transactionCount).toFixed(2) : 0}
                    </p>
                </div>
                <CurrencyDollarIcon className="w-12 h-12 text-green-500" />
              </div>
            </div>
          </div>

          {/* Platform Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Pharmacy Insights
                </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('superAdmin.totalPharmacies')}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {analytics?.totalPharmacies || 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('superAdmin.approved')}</span>
                  <span className="font-bold text-green-600">
                    {analytics?.approvedPharmacies || 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('superAdmin.pending')}</span>
                  <span className="font-bold text-yellow-600">
                    {analytics?.pendingPharmacies || 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('analytics.monthlyFeePerPharmacy')}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    ${analytics?.platformFeePerPharmacy || 0}
                    </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Patient Insights
                </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('superAdmin.totalPatients')}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {analytics?.totalPatients || 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('analytics.activeOrders')}</span>
                  <span className="font-bold text-blue-600">
                    {(analytics?.totalOrders || 0) - (analytics?.completedOrders || 0)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('analytics.completionRate')}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {analytics?.totalOrders ? 
                        ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1) : 0}%
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}