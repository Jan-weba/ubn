// frontend/src/components/guards/PharmacyGuard.tsx
// Route guard to ensure only APPROVED pharmacies can access dashboard

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface PharmacyGuardProps {
  children: React.ReactNode;
}

export default function PharmacyGuard({ children }: PharmacyGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    // Not a pharmacy
    if (user.role !== 'PHARMACY') {
      router.push('/dashboard');
      return;
    }

    // Pharmacy status checks
    if (user.pharmacyStatus === 'PENDING') {
      router.push('/pending-approval');
      return;
    }

    if (user.pharmacyStatus === 'REJECTED') {
      router.push('/pharmacy-rejected');
      return;
    }

    // If not APPROVED, redirect to login
    if (user.pharmacyStatus !== 'APPROVED') {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  }

  // Only render children if pharmacy is approved
  if (user && user.role === 'PHARMACY' && user.pharmacyStatus === 'APPROVED') {
    return <>{children}</>;
  }

  return null;
}