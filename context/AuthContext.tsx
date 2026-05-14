// frontend/src/context/AuthContext.tsx
// UPDATED VERSION - Added routing for BRANCH_MANAGER, PHARMACIST, CASHIER, NURSE

'use client';

import { useTranslation } from 'react-i18next';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAuthTokens, removeAuthTokens, getUserFromToken, User, cacheUserData, clearUserCache } from '@/lib/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: any) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      const userData = getUserFromToken();
      setUser(userData);
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      setAuthTokens(accessToken, refreshToken);
      cacheUserData(userData);
      setUser(userData);

      // Route based on role
      switch (userData.role) {
        case 'PATIENT':
          toast.success(t('auth2.welcomeBack'));
          router.push('/patient/dashboard');
          break;

        case 'PHARMACY':
          if (userData.pharmacyStatus === 'PENDING') {
            toast.success(t('auth2.applicationUnderReview'));
            router.push('/pending-approval');
          } else if (userData.pharmacyStatus === 'REJECTED') {
            toast.error(t('auth2.applicationRejected'));
            router.push('/pharmacy-rejected');
          } else if (userData.pharmacyStatus === 'APPROVED') {
            toast.success(t('auth2.welcomeBack'));
            router.push('/pharmacy/dashboard');
          } else {
            toast.error(t('auth2.invalidPharmacyStatus'));
            removeAuthTokens();
            setUser(null);
            router.push('/login');
          }
          break;

        case 'SUPER_ADMIN':
          toast.success(t('auth2.welcomeAdmin'));
          router.push('/super-admin/dashboard');
          break;

        case 'BRANCH_MANAGER':
          toast.success(t('auth2.welcomeBranchManager'));
          // If first login (temp password), redirect to change password
          if (response.data.requiresPasswordChange) {
            router.push('/branch/change-password');
          } else {
            router.push('/branch/dashboard');
          }
          break;

        case 'PHARMACIST':
        case 'CASHIER':
        case 'NURSE':
          toast.success(t('auth2.welcomeBack'));
          // If first login (temp password), redirect to change password
          if (response.data.requiresPasswordChange) {
            router.push('/staff/change-password');
          } else {
            router.push('/staff/dashboard');
          }
          break;

        default:
          toast.error(t('auth2.invalidRole'));
          removeAuthTokens();
          setUser(null);
          router.push('/login');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthTokens();
      clearUserCache();
      setUser(null);
      router.push('/login');
      toast.success(t('auth2.loggedOut'));
    }
  };

  const updateUser = (userData: any) => {
    setUser((prev) => ({ ...prev, ...userData } as User));
  };

  const refreshUser = async () => {
    try {
      const currentUser = getUserFromToken();
      if (!currentUser) throw new Error('No user');

      let endpoint = '';
      switch (currentUser.role) {
        case 'PHARMACY':
          endpoint = '/pharmacies/profile/me';
          break;
        case 'PATIENT':
          endpoint = '/patients/profile';
          break;
        case 'BRANCH_MANAGER':
        case 'PHARMACIST':
        case 'CASHIER':
        case 'NURSE':
          endpoint = '/staff/profile/me';
          break;
        default:
          // SUPER_ADMIN — no profile endpoint, just use cached token data
          return;
      }

      const response = await api.get(endpoint);
      const userData = { ...currentUser, ...response.data };
      cacheUserData(userData);
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      removeAuthTokens();
      clearUserCache();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
    {children}
    </AuthContext.Provider>
);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};