// frontend/src/app/pharmacy/notifications/page.tsx

'use client';

import {useFetch} from '@/hooks/useFetch';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  BellIcon,
  CubeIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

export default function PharmacyNotificationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'ORDERS' | 'INVENTORY' | 'OTHER'>('ALL');


  const { data, loading, error } = useFetch<Notification[]>(
    async (signal) => {
      const res = await api.get('/notifications?userType=pharmacy', { signal });
      return res.data;
    },
    []
  );

  const notifications = data ?? [];
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (error) {
      toast.error(t('errors.failedToLoadNotifications') || 'Failed to load notifications');
    }
  }, [error, t]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setLocalNotifications(localNotifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all?userType=pharmacy');
      setLocalNotifications(localNotifications.map(n => ({ ...n, isRead: true })));
      toast.success(t('success.allNotificationsRead'));
    } catch (error) {
      toast.error(t('success.notificationsReadFailed'));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_ACCEPTED':
      case 'ORDER_CANCELLED':
        return ShoppingCartIcon;
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return ExclamationTriangleIcon;
      case 'INVENTORY_UPDATED':
        return CubeIcon;
      case 'ORDER_COMPLETED':
        return CheckCircleIcon;
      case 'NEW_CUSTOMER':
        return UserGroupIcon;
      default:
        return BellIcon;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':
        return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-500' };
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-500' };
      case 'ORDER_COMPLETED':
        return { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-500' };
      default:
        return { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-500' };
    }
  };

  const getNotificationType = (type: string) => {
    if (['ORDER_PLACED', 'ORDER_ACCEPTED', 'ORDER_CANCELLED', 'ORDER_COMPLETED'].includes(type)) {
      return 'order';
    }
    if (['LOW_STOCK', 'OUT_OF_STOCK', 'INVENTORY_UPDATED'].includes(type)) {
      return 'inventory';
    }
    return 'other';
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'ALL') return true;
    const type = getNotificationType(notif.type);
    if (filter === 'ORDERS') return type === 'order';
    if (filter === 'INVENTORY') return type === 'inventory';
    if (filter === 'OTHER') return type === 'other';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const orderCount = notifications.filter(n => getNotificationType(n.type) === 'order').length;
  const inventoryCount = notifications.filter(n => getNotificationType(n.type) === 'inventory').length;
  const otherCount = notifications.filter(n => getNotificationType(n.type) === 'other').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  }

  return (
    <div className="space-y-6">
          {/* Header */}
            <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('notifications2.notifications')}</h1>
              <p className="text-gray-600">You have {unreadCount} unread notifications</p>
            </div>
            <div className="flex gap-3">
              <button 
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                Mark all as read
                </button>
            </div>
          </div>

          {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">{orderCount}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('notifications2.orderNotifications')}</p>
                </div>
                <ShoppingCartIcon className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">{inventoryCount}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('notifications2.stockAlerts')}</p>
                </div>
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="bg-white border-l-4 border-teal-500 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">{unreadCount}</p>
                  <p className="text-sm text-gray-600 mt-1">{t('notifications2.unread')}</p>
                </div>
                <BellIcon className="w-12 h-12 text-teal-500" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
            <button
                onClick={() => setFilter('ALL')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'ALL'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
              <BellIcon className="w-4 h-4" />
              {t('notifications2.allNotifications').split(' ')[0]} ({notifications.length})
              </button>
            <button
                onClick={() => setFilter('ORDERS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'ORDERS'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
              <ShoppingCartIcon className="w-4 h-4" />
              {t('common.orders')} ({orderCount})
              </button>
            <button
                onClick={() => setFilter('INVENTORY')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'INVENTORY'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
              <CubeIcon className="w-4 h-4" />
              {t('branch.inventory')} ({inventoryCount})
              </button>
            <button
                onClick={() => setFilter('OTHER')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'OTHER'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
              <UserGroupIcon className="w-4 h-4" />
              {t('common.other') ?? 'Other'} ({otherCount})
              </button>
          </div>

          {/* Notifications List */}
            <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{t('notifications2.allNotifications')}</h2>
              
            {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-16 text-center">
                <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t('notifications2.noNotificationsYet')}</p>
              </div>
            ) : (
                filteredNotifications.map((notif) => {
                  const Icon = getNotificationIcon(notif.type);
                  const colors = getNotificationColor(notif.type);
                  
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.isRead) markAsRead(notif.id);
                        if (notif.orderId) router.push(`/pharmacy/orders/${notif.orderId}`);
                      }}
                      className={`${colors.bg} ${!notif.isRead ? 'border-l-4 ' + colors.border : 'border border-gray-200'} rounded-lg p-6 hover:shadow-md transition-all cursor-pointer relative`}
                    >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                        
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                            {!notif.isRead && (
                                <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                New
                                </span>
                            )}
                            </div>
                        </div>
                        <p className="text-gray-700 mb-3">{notif.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(notif.createdAt).toLocaleString()}
                          </p>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
          </div>
  );
}