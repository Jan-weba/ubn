// frontend/src/app/super-admin/login/page.tsx

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { setAuthTokens } from '@/lib/auth';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export default function SuperAdminLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/super-admin/login', { secretKey });

      const { accessToken, refreshToken, user } = response.data;

      // Save tokens
      setAuthTokens(accessToken, refreshToken);

      // Save user
      Cookies.set('user', JSON.stringify(user), { expires: 7 });

      toast.success(t('auth2.superAdminLoginSuccess'));

      // Redirect to super admin dashboard
      router.push('/super-admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Invalid secret key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4"></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Super Admin Access
          </h1>
        <p className="text-gray-600">{t('superAdminPages.secretKeyPrompt')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-2">
            Secret Key
            </label>
          <input
              id="secretKey"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              placeholder={t('superAdminPages.enterSecretKey')}
              autoComplete="off"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
          {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
      </form>

      <div className="mt-6 text-center">
        <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
          ← Back to regular login
          </Link>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong> Authorized Access Only</strong><br />
          This area is restricted to authorized administrators only.
            Unauthorized access attempts are logged and monitored.
          </p>
      </div>
    </div>
  </div>
);
}