import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeToken(token: string): { role?: string; pharmacyStatus?: string } | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch (error){
    console.error("Token decoding failed:", error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  const isSuperAdminRoute = pathname.startsWith('/super-admin') && pathname !== '/super-admin/login';
  const isPharmacyRoute   = pathname.startsWith('/pharmacy');
  const isPatientRoute    = pathname.startsWith('/patient');
  const isBranchRoute     = pathname.startsWith('/branch');
  const isStaffRoute      = pathname.startsWith('/staff');

  if (!isSuperAdminRoute && !isPharmacyRoute && !isPatientRoute && !isBranchRoute && !isStaffRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const payload = decodeToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isSuperAdminRoute) {
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isPharmacyRoute) {
    if (payload.role !== 'PHARMACY') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (payload.pharmacyStatus === 'PENDING') {
      return NextResponse.redirect(new URL('/pending-approval', request.url));
    }
    if (payload.pharmacyStatus === 'REJECTED') {
      return NextResponse.redirect(new URL('/pharmacy-rejected', request.url));
    }
    if (payload.pharmacyStatus !== 'APPROVED') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isPatientRoute) {
    const isDevMode = request.cookies.get('dev_mode')?.value === 'true';
    const isPatientEnabled = process.env.NEXT_PUBLIC_ENABLE_PATIENT_FEATURES === 'true';
    
    // Block if neither env flag nor dev_mode is active
    if (!isPatientEnabled && !isDevMode) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (payload.role !== 'PATIENT') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }


  if (isBranchRoute) {
    if (payload.role !== 'BRANCH_MANAGER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isStaffRoute) {
    const staffRoles = ['PHARMACIST', 'CASHIER', 'NURSE'];
    if (!staffRoles.includes(payload.role || '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/pharmacy/:path*',
    '/patient/:path*',
    '/branch/:path*',
    '/staff/:path*',
  ],
};
