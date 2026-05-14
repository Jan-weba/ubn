// frontend/src/app/pharmacy/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PharmacyTopbar from '@/components/pharmacy/PharmacyTopbar';
import PharmacySidebar from '@/components/pharmacy/PharmacySidebar';
import SupportBot from '@/components/pharmacy/SupportBot';
import { ArrowLeftIcon, MapPinIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

const STATUS_FLOW = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'];
const DELIVERY_STATUS_FLOW = ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

type NextAction = { label: string; status: string; color: string } | null;

function getNextAction(status: string, type: string, t: (k: string) => string): NextAction {
  const flow = type === 'DELIVERY' ? DELIVERY_STATUS_FLOW : STATUS_FLOW;
  const idx = flow.indexOf(status);
  if (idx === -1 || idx >= flow.length - 1) return null;
  const next = flow[idx + 1];
  const labels: Record<string, { label: string; color: string }> = {
    ACCEPTED:         { label: t('pharmacyOwner.acceptOrder'),         color: 'bg-green-500 hover:bg-green-600' },
    PREPARING:        { label: t('pharmacyOwner.startPreparing'),      color: 'bg-blue-500 hover:bg-blue-600' },
    READY_FOR_PICKUP: { label: t('pharmacyOwner.markReadyForPickup'),  color: 'bg-teal-500 hover:bg-teal-600' },
    OUT_FOR_DELIVERY: { label: t('pharmacyOwner.dispatchForDelivery'), color: 'bg-purple-500 hover:bg-purple-600' },
    COMPLETED:        { label: t('pharmacyOwner.markCompleted'),       color: 'bg-green-600 hover:bg-green-700' },
    DELIVERED:        { label: t('pharmacyOwner.markDelivered'),       color: 'bg-green-600 hover:bg-green-700' },
  };
  return { label: labels[next]?.label || `→ ${next}`, status: next, color: labels[next]?.color || 'bg-teal-500' };
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  READY_FOR_PICKUP: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function PharmacyOrderDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => { fetchOrder(); }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${params.id}`);
      setOrder(res.data);
    } catch { toast.error(t('errors.failedToLoadOrder')); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/orders/${params.id}/status`, { status });
      toast.success(`Order updated to ${status}`);
      fetchOrder();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.updateFailed')); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error(t('form.provideReason')); return; }
    setActionLoading(true);
    try {
      await api.patch(`/orders/${params.id}/cancel`, { cancellationReason: rejectReason });
      toast.success(t('success.orderCancelled2'));
      setShowReject(false);
      fetchOrder();
    } catch (err: any) { toast.error(err.response?.data?.message || t('common.failed')); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
    <PharmacySidebar /><SupportBot />
    <div className="flex-1 flex flex-col lg:ml-72"><PharmacyTopbar />
      <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
    </div>
  </div>
);

  if (!order) return null;

  const nextAction = getNextAction(order.status, order.type, t);
  const flow = order.type === 'DELIVERY' ? DELIVERY_STATUS_FLOW : STATUS_FLOW;
  const currentIdx = flow.indexOf(order.status);

  return (
    <div className="flex min-h-screen bg-gray-50">
    <PharmacySidebar /><SupportBot />
    <div className="flex-1 flex flex-col lg:ml-72">
      <PharmacyTopbar />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Orders
            </button>

          {/* Order Header */}
            <div className="bg-linear-to-r from-[#1E4D8C] to-[#2563a8] rounded-2xl p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-blue-200 text-sm mb-1">Order #{order.orderNumber || order.id?.slice(0,8)}</p>
                <h1 className="text-2xl font-bold">{order.patient?.firstName} {order.patient?.lastName}</h1>
                <p className="text-blue-200 text-sm">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {order.status?.replace(/_/g,' ')}
                </span>
            </div>

            {/* Progress */}
              {order.status !== 'CANCELLED' && (
                <div className="mt-6 flex items-center gap-1 overflow-x-auto">
                {flow.map((s, i) => (
                    <div key={s} className="flex items-center shrink-0">
                    <div className={`flex flex-col items-center`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentIdx ? 'bg-white text-blue-700' : 'bg-white/30 text-white/60'}`}>
                        {i <= currentIdx ? '' : i + 1}
                        </div>
                      <span className="text-xs text-white/80 mt-1 max-w-[60px] text-center leading-tight">{s.replace(/_/g,' ')}</span>
                    </div>
                    {i < flow.length - 1 && <div className={`h-0.5 w-8 mx-1 ${i < currentIdx ? 'bg-white' : 'bg-white/30'}`} />}
                    </div>
                ))}
                </div>
            )}
            </div>

          {/* Action Buttons */}
            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && order.status !== 'DELIVERED' && (
              <div className="flex flex-wrap gap-3">
              {nextAction && (
                  <button onClick={() => handleUpdateStatus(nextAction.status)} disabled={actionLoading}
                    className={`px-6 py-2.5 ${nextAction.color} text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2`}>
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : '→'} {nextAction.label}
                  </button>
              )}
                {order.status === 'PENDING' && (
                  <button onClick={() => setShowReject(true)}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold">
                   Reject Order
                  </button>
              )}
              </div>
          )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Info */}
              <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4 text-teal-500"/>{t('orders2.patientInfo')}</h2>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-800">{order.patient?.firstName} {order.patient?.lastName}</p>
                <p className="text-gray-600">{order.patient?.user?.email || order.patient?.email}</p>
                {order.patient?.phone && (
                    <div className="flex items-center gap-2 text-gray-600"><PhoneIcon className="w-4 h-4"/>{order.patient.phone}</div>
                )}
                  {order.type === 'DELIVERY' && order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-gray-600 mt-2"><MapPinIcon className="w-4 h-4 shrink-0 mt-0.5"/>
                    <span>{order.deliveryAddress}</span>
                  </div>
                )}
                </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                <span>{order.type === 'DELIVERY' ? ' Delivery' : ' Pickup'}</span>
                <span>{order.paymentMethod?.replace(/_/g,' ')}</span>
                <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span>
              </div>
            </div>

            {/* Prescription */}
              <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-bold text-gray-900 mb-4"> Prescription</h2>
              {order.prescription ? (
                  <div className="space-y-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.prescription.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      order.prescription.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{order.prescription.status}</span>
                  {order.prescription.fileUrl && (
                      <div className="mt-3">
                      <a href={order.prescription.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">
                        View Prescription →
                        </a>
                    </div>
                  )}
                  </div>
              ) : (
                  <p className="text-sm text-gray-500">{t('orders2.noPrescriptionAttached')}</p>
              )}
              </div>
          </div>

          {/* Order Items */}
            <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-bold text-gray-900 mb-4"> Medications</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left pb-2 text-gray-600 font-semibold">{t('orders2.item')}</th>
                  <th className="text-center pb-2 text-gray-600 font-semibold">Qty</th>
                  <th className="text-right pb-2 text-gray-600 font-semibold">{t('orders2.unitPrice')}</th>
                  <th className="text-right pb-2 text-gray-600 font-semibold">{t('cart.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.orderItems?.map((item: any) => (
                    <tr key={item.id}>
                    <td className="py-2.5">
                      <p className="font-medium text-gray-800">{item.medication?.name}</p>
                      {item.medication?.requiresPrescription && <span className="text-xs text-yellow-600"> Prescription</span>}
                      </td>
                    <td className="py-2.5 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-2.5 text-right text-gray-700">{Number(item.unitPrice || item.price).toLocaleString()} RWF</td>
                    <td className="py-2.5 text-right font-semibold text-teal-600">{(Number(item.unitPrice || item.price) * item.quantity).toLocaleString()} RWF</td>
                  </tr>
                ))}
                </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>{t('orders2.subtotal')}</span><span>{Number(order.subtotal || 0).toLocaleString()} RWF</span></div>
              {order.deliveryFee > 0 && <div className="flex justify-between text-gray-600"><span>{t('orders2.deliveryFee')}</span><span>{Number(order.deliveryFee).toLocaleString()} RWF</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>{t('cart.total')}</span><span className="text-teal-600">{Number(order.total || 0).toLocaleString()} RWF</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>

    {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{t('orders2.rejectOrder')}</h3>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
              placeholder={t('checkout2.rejectReasonPlaceholder')}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none" />
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReject(false)} className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium">{t('common.cancel')}</button>
            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              Confirm Rejection
              </button>
          </div>
        </div>
      </div>
    )}
    </div>
);
}