'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StaffSidebar from '@/components/staff/StaffSidebar';
import StaffTopbar from '@/components/staff/Stafftopbar';
import SupportBot from '@/components/pharmacy/SupportBot';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const STAFF_ROLES = ['PHARMACIST', 'CASHIER', 'NURSE'];
const STANDALONE_PAGES = ['/staff/change-password'];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !STAFF_ROLES.includes(user.role))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !STAFF_ROLES.includes(user.role)) return null;

  const isStandalone = STANDALONE_PAGES.some(p => pathname.startsWith(p));
  if (isStandalone) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <StaffSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSupport={() => setSupportOpen(true)}
      />

      <SupportBot
        open={supportOpen}
        onOpen={() => setSupportOpen(true)}
        onClose={() => setSupportOpen(false)}
      />
      <div className="flex-1 lg:ml-64 min-w-0">
        <StaffTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
