'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Package, CheckCircle2, ListOrdered, User, ShoppingCart } from 'lucide-react';
import CashierPOSModal, { type CashierOrder } from './CashierPOSModal';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

type CashierTab = 'pending_payment' | 'ready_pickup' | 'completed' | 'all';

const STATUS_PENDING_PAYMENT = ['READY_FOR_PICKUP'];
const STATUS_READY_PICKUP = ['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY'];
const STATUS_COMPLETED = ['COMPLETED', 'DELIVERED'];

interface CashierOrdersViewProps {
  orders: CashierOrder[];
  loading: boolean;
}

export default function CashierOrdersView({ orders, loading }: CashierOrdersViewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<CashierTab>('pending_payment');
  const [activeOrder, setActiveOrder] = useState<CashierOrder | null>(null);
  const [advancedIds, setAdvancedIds] = useState<Set<string>>(new Set());

  const tabs: { key: CashierTab; label: string; icon: React.ElementType }[] = [
    { key: 'pending_payment', label: t('cashier.tabPendingPayment'), icon: CreditCard },
    { key: 'ready_pickup',    label: t('cashier.tabReadyPickup'),    icon: Package },
    { key: 'completed',       label: t('cashier.tabCompleted'),      icon: CheckCircle2 },
    { key: 'all',             label: t('cashier.tabAll'),            icon: ListOrdered },
  ];

  const filtered = useMemo(() => {
    return orders.filter((o: any) => {
      if (advancedIds.has(o.id)) {
        return tab === 'completed' || tab === 'all';
      }
      switch (tab) {
        case 'pending_payment': return STATUS_PENDING_PAYMENT.includes(o.status);
        case 'ready_pickup':    return STATUS_READY_PICKUP.includes(o.status);
        case 'completed':       return STATUS_COMPLETED.includes(o.status);
        case 'all':             return true;
        default:                return true;
      }
    });
  }, [tab, orders, advancedIds]);

  const cashierName = user
    ? `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim() || user.email || 'Cashier'
    : 'Cashier';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white" style={{ backgroundColor: NAVY }}>
        <h1 className="text-2xl lg:text-3xl font-bold">{t('cashier.ordersTitle')}</h1>
        <p className="mt-1 text-white/70">{t('cashier.ordersSubtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('cashier.tabAll'),             value: orders.length,                                                          dark: false },
          { label: t('cashier.tabPendingPayment'),  value: orders.filter((o: any) => STATUS_PENDING_PAYMENT.includes(o.status)).length, dark: false },
          { label: t('cashier.tabReadyPickup'),     value: orders.filter((o: any) => STATUS_READY_PICKUP.includes(o.status)).length,    dark: false },
          { label: t('cashier.tabCompleted'),       value: orders.filter((o: any) => STATUS_COMPLETED.includes(o.status)).length + advancedIds.size, dark: true },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ backgroundColor: s.dark ? NAVY : TEAL }}
          >
            <div>
              <p className="text-white/80 text-sm">{s.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15">
              <ShoppingCart size={20} className="text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab pills */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={tab === key ? { backgroundColor: TEAL } : {}}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <ShoppingCart size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('cashier.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const o = order as any;
            const itemCount = o.orderItems.reduce((s: number, it: any) => s + it.quantity, 0);
            const isPaid = advancedIds.has(o.id);
            const isPaymentTab = tab === 'pending_payment';

            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${NAVY}1a` }}>
                        <User size={16} style={{ color: NAVY }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {o.patient.firstName} {o.patient.lastName}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          #{o.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Package size={13} />
                        {itemCount} {itemCount === 1 ? t('cashier.item') : t('cashier.items')}
                      </span>
                      <span className="font-semibold" style={{ color: NAVY }}>
                        RWF {Number(o.total ?? 0).toLocaleString()}
                      </span>
                      {isPaid && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={{ backgroundColor: `${TEAL}1a`, color: TEAL, borderColor: `${TEAL}4d` }}
                        >
                          {t('cashier.paid')}
                        </span>
                      )}
                    </div>
                  </div>

                  {isPaymentTab && !isPaid && (
                    <button
                      onClick={() => setActiveOrder(order)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 shrink-0"
                      style={{ backgroundColor: TEAL }}
                    >
                      <CreditCard size={15} />
                      {t('cashier.processPayment')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CashierPOSModal
        open={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        order={activeOrder}
        cashierName={cashierName}
        onAdvance={(id) => {
          setAdvancedIds((prev) => new Set(prev).add(id));
          setActiveOrder(null);
        }}
      />
    </div>
  );
}
