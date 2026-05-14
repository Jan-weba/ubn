'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

export default function StaffChangePasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ temp: false, new: false, confirm: false });
  const [form, setForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error(t('form.passwordsDoNotMatch'));
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error(t('form.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      await api.put('/staff/profile/change-password', {
        tempPassword: form.tempPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      toast.success(t('form.passwordChangedWelcome'));
      router.push('/staff/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('staff.failedToChangePassword'));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field: keyof typeof showPass) =>
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: NAVY }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F0F7F6' }}>
              <ShieldCheckIcon className="w-7 h-7" style={{ color: TEAL }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('staff.welcomeTitle')}</h1>
            <p className="text-sm text-gray-500 mt-2">
              Please set a permanent password before accessing your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'temp' as const,    label: 'Temporary Password',    key: 'tempPassword',    placeholder: 'Enter the password from your email' },
              { field: 'new' as const,     label: 'New Password',          key: 'newPassword',     placeholder: 'At least 8 characters' },
              { field: 'confirm' as const, label: 'Confirm New Password',  key: 'confirmPassword', placeholder: 'Re-enter new password' },
            ].map(({ field, label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass[field] ? 'text' : 'password'}
                    required
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm outline-none"
                    style={{ '--tw-ring-color': TEAL } as React.CSSProperties}
                    onFocus={e => (e.target.style.borderColor = TEAL)}
                    onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
                  />
                  <button type="button" onClick={() => toggle(field)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass[field] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: TEAL }}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('branch.saving')}</>
              ) : (
                t('branch.setPasswordAndContinue')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
