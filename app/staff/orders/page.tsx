'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ShoppingCartIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import CashierOrdersView from '@/components/staff/CashierOrdersView';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

const STATUS_STYLES: Record<string, string> = {
  PENDING:           'bg-yellow-100 text-yellow-800',
  ACCEPTED:          'bg-blue-100 text-blue-800',
  PREPARING:         'bg-indigo-100 text-indigo-800',
  READY_FOR_PICKUP:  'bg-teal-100 text-teal-800',
  OUT_FOR_DELIVERY:  'bg-orange-100 text-orange-800',
  DELIVERED:         'bg-green-100 text-green-800',
  COMPLETED:         'bg-green-100 text-green-800',
  CANCELLED:         'bg-red-100 text-red-800',
};

// Statuses a pharmacist can move an order to from its current status
const NEXT_STATUSES: Record<string, string[]> = {
  PENDING:          ['ACCEPTED'],
  ACCEPTED:         ['PREPARING'],
  PREPARING:        ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
  READY_FOR_PICKUP: ['COMPLETED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        ['COMPLETED'],
};

interface Order {
  id: string;
  status: string;
  total: number;
  type: string;
  createdAt: string;
  patient: { firstName: string; lastName: string; phone?: string };
  orderItems: { quantity: number; price: number; medication: { name: string } }[];
  prescription?: { id: string; status: string } | null;
}

function fmt(n: number) {
  return `RWF ${Number(n ?? 0).toLocaleString()}`;
}

export default function StaffOrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCashier = user?.role === 'CASHIER';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/pharmacy-orders'); // GET /orders/pharmacy-orders
      setOrders(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error(t('errors.failedToLoadOrders'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus }); // PATCH /orders/:id/status
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      toast.success(`Order marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('orders2.failedToUpdate'));
    } finally {
      setUpdatingId(null); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusFilters = ['all', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

  if (isCashier) return <CashierOrdersView orders={orders as any} loading={loading} />;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white" style={{ backgroundColor: NAVY }}>
        <h1 className="text-2xl lg:text-3xl font-bold">{t('staff.orders')}</h1>
        <p className="mt-1 text-white/70">{t('orders2.noOrders2')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('orders2.orderTotal'),     value: orders.length,                                               dark: false },
          { label: t('orders2.orderPending'),   value: orders.filter(o => o.status === 'PENDING').length,           dark: false },
          { label: t('orders2.orderActive'),    value: orders.filter(o => ['ACCEPTED','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY'].includes(o.status)).length, dark: false },
          { label: t('orders2.orderCompleted'), value: orders.filter(o => ['COMPLETED','DELIVERED'].includes(o.status)).length, dark: true },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 flex items-center justify-between"
            style={{ backgroundColor: s.dark ? NAVY : TEAL }}>
            <div>
              <p className="text-white/80 text-sm">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15">
              <ShoppingCartIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={filter === s ? { backgroundColor: TEAL } : {}}
          >
            {s === 'all' ? t('orders2.orderAll') : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <ShoppingCartIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('pharmacy.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isExpanded = expanded === order.id;
            const nextStatuses = NEXT_STATUSES[order.status] ?? [];
            const isUpdating = updatingId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Order header row */}
                <button
                  className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#F0F7F6' }}>
                      <ShoppingCartIcon className="w-5 h-5" style={{ color: TEAL }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {order.patient.firstName} {order.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(order.createdAt)} · {order.type} · {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-gray-900">{fmt(order.total)}</p>
                      {order.prescription && (
                        <p className="text-xs text-gray-400 mt-0.5">{t('orders2.hasPrescription')}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded order details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 lg:p-5 space-y-4">

                    {/* Items */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('orders2.items')}</p>
                      <div className="space-y-2">
                        {order.orderItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {item.medication.name}
                              <span className="text-gray-400 ml-1">x{item.quantity}</span>
                            </span>
                            <span className="font-medium text-gray-900">{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
                        <span className="text-gray-900">{t('cart.total')}</span>
                        <span style={{ color: NAVY }}>{fmt(order.total)}</span>
                      </div>
                    </div>

                    {/* Patient contact */}
                    {order.patient.phone && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('orders2.patientContact')}</p>
                        <p className="text-sm text-gray-700">{order.patient.phone}</p>
                      </div>
                    )}

                    {/* Prescription */}
                    {order.prescription && (
                      <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-600">
                        Prescription attached · Status: <span className="font-medium">{order.prescription.status}</span>
                      </div>
                    )}

                    {/* Status update actions */}
                    {nextStatuses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('orders2.updateStatus')}</p>
                        <div className="flex flex-wrap gap-2">
                          {nextStatuses.map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusUpdate(order.id, s)}
                              disabled={isUpdating}
                              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                              style={{ backgroundColor: TEAL }}
                            >
                              {isUpdating ? t('orders2.updating') : `${t('orders2.markAs')} ${s.replace(/_/g, ' ').toLowerCase()}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
