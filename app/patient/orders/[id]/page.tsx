// frontend/src/app/patient/orders/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function OrderDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Payment states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => { fetchOrderDetails(); }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/orders/${params.id}`);
      setOrder(res.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error(t('errors.failedToLoadOrder'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) { toast.error(t('orders2.provideCancellationReason')); return; }
    if (!confirm(t('orders.confirmCancel'))) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${params.id}/cancel`, { cancellationReason: cancellationReason.trim() });
      toast.success(t('success.orderCancelled'));
      fetchOrderDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('orders.failedToCancel'));
    } finally { setCancelling(false); }
  };

  const handlePayment = async () => {
    if (['MTN_MOMO', 'AIRTEL_MONEY'].includes(order.paymentMethod) && !phoneNumber) {
      toast.error(t('orders.enterMobileNumber'));
      return;
    }
    setProcessingPayment(true);
    try {
      const res = await api.post('/payments/initiate', {
        orderId: order.id,
        phoneNumber,
      });
      // Handle Flutterwave responses
      if (res.data.meta?.authorization?.mode === 'otp') {
        setShowOtpInput(true);
        setPaymentId(res.data.paymentId);
        toast.success(t('orders.enterOtpSent'));
      } else if (res.data?.data?.link) {
        // Card payment standard link
        window.open(res.data.data.link, '_blank');
        toast.success(t('orders.redirectingPayment'));
      } else {
        toast.success(t('Payment initiated. Check your phone to approve.'));
        // We can poll here or have user click a verify button.
        // In the interest of simplicity we let the user await the prompt.
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('orders.failedToInitiatePayment'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return;
    setProcessingPayment(true);
    try {
      await api.post('/payments/validate-otp', {
        paymentId,
        otp,
      });
      toast.success('Payment completed successfully!');
      setShowOtpInput(false);
      fetchOrderDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('orders.invalidOtp'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const canCancel = order && !['PREPARING', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (!order) return <div className="text-center py-12"><p className="text-gray-500">{t('orders.notFound')}</p></div>;

  const statusSteps = ['PENDING', 'ACCEPTED', 'PREPARING', order.type === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'READY_FOR_PICKUP', 'DELIVERED'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
      <ArrowLeftIcon className="w-5 h-5" /> {t('common.back')}
      </button>

    {/* Order Header */}
      <div className="bg-linear-to-r from-[#1E4D8C] to-[#2D9B8A] rounded-2xl shadow-xl p-8 text-white">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {t('orders.orderNumber')}: #{order.orderNumber || order.id.slice(0, 8)}
            </h1>
          <p className="text-teal-100">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`inline-block px-6 py-3 rounded-xl text-sm font-bold shadow-lg ${
            order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'bg-green-500 text-white' :
            order.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
          }`}>
          {order.status}
          </span>
      </div>

      {order.status !== 'CANCELLED' && (
          <div className="mt-8">
          <div className="flex justify-between items-center">
            {statusSteps.map((status, index) => {
                const isComplete = statusSteps.indexOf(order.status) >= index;
                const isCurrent = order.status === status;
                return (
                  <div key={status} className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${isComplete ? 'bg-white text-[#1E4D8C] shadow-lg' : 'bg-white/30 text-white/70'} ${isCurrent ? 'ring-4 ring-white/50 scale-110' : ''}`}>
                    {isComplete ? '' : index + 1}
                    </div>
                  <p className="text-xs mt-2 text-center text-white/90 font-medium">{status}</p>
                </div>
              );
              })}
            </div>
        </div>
      )}

        {order.status === 'CANCELLED' && order.cancellationReason && (
          <div className="mt-6 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-300/30">
          <p className="text-sm font-semibold mb-1">{t('orders2.cancellationReason')}</p>
          <p className="text-sm text-white/90">{order.cancellationReason}</p>
        </div>
      )}
      </div>

    {/* Pharmacy Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="font-bold text-xl mb-4 text-gray-800 dark:text-gray-100">{t('orders.pharmacyInfo')}</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E4D8C]/10 dark:bg-[#1E4D8C]/30 rounded-xl flex items-center justify-center"></div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{order.pharmacy.name}</p>
        </div>
        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
          <MapPinIcon className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{order.pharmacy.address}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <PhoneIcon className="w-5 h-5 shrink-0" />
          <span>{order.pharmacy.phone}</span>
        </div>
      </div>
    </div>

    {/* Medications */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h2 className="font-bold text-xl mb-4 text-gray-800 dark:text-gray-100">{t('orders.medications')}</h2>
      <div className="space-y-4">
        {order.orderItems?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{item.medication.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('orders.quantity')}: {item.quantity} × {item.price.toLocaleString()} RWF
                </p>
            </div>
            <p className="font-bold text-lg bg-linear-to-r from-[#1E4D8C] to-[#2D9B8A] bg-clip-text text-transparent">
              {(item.price * item.quantity).toLocaleString()} RWF
              </p>
          </div>
        ))}
        </div>
    </div>

    {/* Delivery Info */}
      {order.type === 'DELIVERY' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="font-bold text-xl mb-4 text-gray-800 dark:text-gray-100">{t('orders.deliveryInfo')} </h2>
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p><strong>{t('orders.address')}:</strong> {order.deliveryAddress}</p>
          {order.deliveryZone && <p><strong>{t('orders.zone')}:</strong> {order.deliveryZone}</p>}
            <p><strong>{t('orders.fee')}:</strong> {order.deliveryFee?.toLocaleString() || 0} RWF</p>
        </div>
      </div>
    )}

      {/* Payment Summary */}
      <div className="bg-linear-to-br from-[#1E4D8C]/5 to-[#2D9B8A]/5 dark:from-[#1E4D8C]/20 dark:to-[#2D9B8A]/20 rounded-2xl shadow-lg p-6">
      <h2 className="font-bold text-xl mb-4 text-gray-800 dark:text-gray-100">{t('orders.paymentSummary')}</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>{t('orders.subtotal')}</span><span>{order.subtotal.toLocaleString()} RWF</span>
        </div>
        {order.deliveryFee > 0 && (
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>{t('orders.deliveryFee')}</span><span>{order.deliveryFee.toLocaleString()} RWF</span>
          </div>
        )}
          {order.insuranceCoverage > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>{t('orders.insuranceCoverage')}</span><span>-{order.insuranceCoverage.toLocaleString()} RWF</span>
          </div>
        )}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between font-bold text-xl">
          <span className="text-gray-800 dark:text-gray-100">{t('orders.total')}</span>
          <span className="bg-linear-to-r from-[#1E4D8C] to-[#2D9B8A] bg-clip-text text-transparent">
            {order.total.toLocaleString()} RWF
            </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 pt-2">
          {t('orders.paymentMethod')}: {order.paymentMethod}
          </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Payment Status: <span className={`font-semibold ${order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span>
        </p>

        {order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
          <div className="mt-4 pt-4 border-t border-[#2D9B8A]/20 dark:border-[#2D9B8A]/20">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="text-xl">💳</span> Complete your payment
            </h3>
            
            {!showOtpInput ? (
              <div className="space-y-3">
                {['MTN_MOMO', 'AIRTEL_MONEY'].includes(order.paymentMethod) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Money Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 078XXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[#2D9B8A]"
                    />
                  </div>
                )}
                
                <button
                  onClick={handlePayment}
                  disabled={processingPayment}
                  className="w-full bg-linear-to-r from-[#1E4D8C] to-[#1a3d6f] hover:from-[#1a3d6f] hover:to-[#0f2444] text-white py-2.5 rounded-lg font-bold text-sm shadow transition-all disabled:opacity-50"
                >
                  {processingPayment ? t('orders.processing') : `${t('orders.payNow').replace('{amount}', order.total.toLocaleString())}`}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[#2D9B8A]"
                  />
                </div>
                <button
                  onClick={handleVerifyOtp}
                  disabled={processingPayment || !otp}
                  className="w-full bg-linear-to-r from-[#2D9B8A] to-[#207a6c] hover:from-[#207a6c] hover:to-[#185e53] text-white py-2.5 rounded-lg font-bold text-sm shadow transition-all disabled:opacity-50"
                >
                  {processingPayment ? t('orders.verifying') : t('orders.submitOtp')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Prescription Info */}
      {order.prescription && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="font-bold text-xl mb-4 text-gray-800 dark:text-gray-100"> Prescription Information</h2>
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p><strong>{t('orders2.status')}</strong> <span className={`font-semibold ${order.prescription.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>{order.prescription.status}</span></p>
          {order.prescription.fileUrl && (
              <a href={order.prescription.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[#1E4D8C] hover:text-[#2D9B8A] underline">
              View Prescription
              </a>
          )}
          </div>
      </div>
    )}

      {/* Cancel Order */}
      {canCancel && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t('orders2.cancelOrder')}</h3>
        <textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder={t('orders2.cancellationReason')}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
            rows={3}
          />
        <button
            onClick={handleCancelOrder}
            disabled={cancelling || !cancellationReason.trim()}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {cancelling ? t('orders.cancelling') : t('orders.cancelOrder')}
          </button>
      </div>
    )}
    </div>
);
}