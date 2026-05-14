// frontend/src/app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon, MapPinIcon, ClockIcon, UserGroupIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: MapPinIcon, titleKey: 'auth.findPharmacies', descKey: 'auth.findPharmaciesDesc' },
    { icon: ClockIcon, titleKey: 'auth.saveTime', descKey: 'auth.saveTimeDesc' },
    { icon: UserGroupIcon, titleKey: 'auth.connectHealthcare', descKey: 'auth.connectHealthcareDesc' },
    { icon: ShieldCheckIcon, titleKey: 'auth.securePrivate', descKey: 'auth.securePrivateDesc' },
  ];

  return (
    <div className="min-h-screen flex relative">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Left Side - Blue Background with Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#1E4D8C] via-[#2563a8] to-[#1a3d6f] p-12 flex-col justify-between text-white">
        <div>
          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-4xl font-bold mb-2">Evuze</h1>
            <p className="text-blue-100 text-lg">{t('auth.healthcarePlatform')}</p>
          </div>

          {/* Welcome Section */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold mb-6">{t('auth.welcomeBack')}</h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              {t('auth.loginSidebarSubtitle')}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <p className="text-xl font-semibold mb-4">{t('auth.withEvuze')}</p>
            {features.map(({ icon: Icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex items-start gap-4">
                <Icon className="w-8 h-8 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-1">{t(titleKey)}</h3>
                  <p className="text-blue-100">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-blue-200 text-sm">
          {t('auth.trusted')}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{t('auth.welcomeBack')}</h2>
            <p className="text-gray-600 text-lg">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-900"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-gray-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('auth.loading')}</span>
                </div>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">{t('auth.or')}</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              {t('auth.noAccount')}{' '}
              <Link
                href="/signup"
                className="text-teal-600 hover:text-teal-700 font-semibold hover:underline"
              >
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer (mobile only) */}
      <div className="lg:hidden fixed bottom-4 left-0 right-0 text-center text-gray-600 text-sm px-4">
        {t('signup.copyrightYear')}
      </div>
    </div>
  );
}
