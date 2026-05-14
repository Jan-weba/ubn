'use client';
// src/app/(pharmacy)/orders/page.tsx
import { useFetch } from '@/hooks/useFetch';
import { useState, useEffect, useCallback} from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

type TabKey = 'PENDING' | 'ACCEPTED' | 'READY_FOR_CHECKOUT' | 'COMPLETED' | 'REJECTED';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:            { bg: '#FEF3C7', text: '#92400E' },
  ACCEPTED:           { bg: '#D1FAE5', text: '#065F46' },
  READY_FOR_CHECKOUT: { bg: '#DBEAFE', text: '#1E40AF' },
  COMPLETED:          { bg: '#E0E7FF', text: '#3730A3' },
  REJECTED:           { bg: '#FEE2E2', text: '#991B1B' },
};

export default function PharmacyOrdersPage() {
  const { t } = useTranslation();
  const [filtered, setFiltered] = useState<any[]>([]);
  const [tab, setTab]           = useState<TabKey>('PENDING');
  const [search, setSearch]     = useState('');
  const [branch, setBranch]     = useState('');

  const fetchOrdersData = useCallback(
  async (signal: AbortSignal) => {
    const [ordRes, brRes] = await Promise.all([
      api.get('/orders/pharmacy-orders', { signal }),
      api.get('/branches/my-branches', { signal }),
    ]);

    return {
      orders: ordRes.data?.data ?? ordRes.data ?? [],
      branches: brRes.data?.data ?? brRes.data ?? [],
    };
  },
  []
  );

  const { data, loading, error } = useFetch<{
  orders: any[];
  branches: any[];
  }>(fetchOrdersData,[]);

const orders = data?.orders ?? [];
const branches = data?.branches ?? [];

  useEffect(() => {
     if (error) {
        toast.error(t('errors.failedToLoadOrders'));
      };
    }, [error, t]);

  useEffect(() => {
    let res = orders.filter(o => o.status === tab);
    if (branch) res = res.filter(o => o.branchId === branch);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(o =>
      o.id?.toLowerCase().includes(q) ||
        o.patientName?.toLowerCase().includes(q)
      );
    }
    setFiltered(res);
  }, [orders, tab, branch, search]);

  const countFor = (s: TabKey) => orders.filter(o => o.status === s).length;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'PENDING',            label: t('pharmacyOwner.pending') },
    { key: 'ACCEPTED',           label: t('pharmacyOwner.accepted') },
    { key: 'READY_FOR_CHECKOUT', label: t('pharmacyOwner.readyForCheckout') },
    { key: 'COMPLETED',          label: t('pharmacyOwner.completedTab') },
    { key: 'REJECTED',           label: t('pharmacyOwner.rejected') },
  ];

  return (
    <div className="space-y-6">
    {/* Hero */}
      <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: NAVY }}>
      <h1 className="text-3xl font-bold">{t('pharmacyOwner.orderOverviewTitle')}</h1>
      <p className="mt-1 text-white/70">{t('pharmacyOwner.orderOverviewSubtitle')}</p>
    </div>

    {/* Filters */}
      <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pharmacyOwner.searchOrders')}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
      </div>
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
          <option value="">{t('pharmacyOwner.allBranches')}</option>
          {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
          ))}
          </select>
      </div>
    </div>

    {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
      {tabs.map(({ key, label }) => {
          const c = countFor(key);
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                active
                  ? { backgroundColor: TEAL, color: 'white' }
                  : { backgroundColor: '#F3F4F6', color: '#374151' }
              }
            >
            {label} ({c})
            </button>
        );
        })}
      </div>

    {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {[
                t('pharmacyOwner.orderId'),
                t('pharmacyOwner.customer'),
                t('common.total'),
                t('common.status'),
                t('pharmacyOwner.staff'),
                t('common.date'),
                t('common.actions'),
              ].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
                </th>
            ))}
            </tr>
        </thead>
        <tbody>
          {loading ? (
              <tr>
              <td colSpan={7} className="py-12 text-center text-gray-400">
                {t('common.loading')}
                </td>
            </tr>
          ) : filtered.length === 0 ? (
              <tr>
              <td colSpan={7} className="py-12 text-center text-gray-400">
                {t('common.noData')}
                </td>
            </tr>
          ) : (
              filtered.map((order: any) => {
                const sc = STATUS_COLORS[order.status] ?? { bg: '#F3F4F6', text: '#374151' };
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4 text-sm font-medium text-gray-800">
                    #{order.id?.slice(0, 8)}
                    </td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {order.patientName ?? '—'}
                    </td>
                  <td className="px-5 py-4 text-sm font-semibold" style={{ color: TEAL }}>
                    {order.total?.toLocaleString()} RWF
                    </td>
                  <td className="px-5 py-4">
                    <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                      {order.status}
                      </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {order.staffName ?? '—'}
                    </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : '—'}
                    </td>
                  <td className="px-5 py-4">
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                      <Eye size={14} />
                      {t('common.view')}
                      </button>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
      </table>
    </div>
  </div>
);
}