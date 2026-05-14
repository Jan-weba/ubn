// frontend/src/lib/auth.ts - Auth Helpers
// UPDATED VERSION - Added BRANCH_MANAGER, PHARMACIST, CASHIER, NURSE roles

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'PHARMACY' | 'PATIENT' | 'BRANCH_MANAGER' | 'PHARMACIST' | 'CASHIER' | 'NURSE';
  isVerified: boolean;
  // Pharmacy owner specific
  pharmacyStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  // Branch manager / staff specific
  requiresPasswordChange?: boolean;
  profile?: any;
}

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 1/48 }); // 30 min
  Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

  const decoded: any = jwtDecode(accessToken);
  Cookies.set('userRole', decoded.role, { expires: 7, sameSite: 'lax' });
};

export const removeAuthTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('userRole');
  Cookies.remove('user');
};

export const getAccessToken = () => Cookies.get('accessToken');
export const getRefreshToken = () => Cookies.get('refreshToken');

export const isAuthenticated = () => !!getAccessToken();

export const cacheUserData = (user: User): void => {
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
};

export const getCachedUser = (): User | null => {
  const userData = Cookies.get('user');
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const clearUserCache = (): void => {
  Cookies.remove('user');
};

export const getUserFromToken = (): User | null => {
  const cachedUser = getCachedUser();
  if (cachedUser) return cachedUser;

  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified || true,
      pharmacyStatus: decoded.pharmacyStatus,
    };
  } catch {
    return null;
  }
};