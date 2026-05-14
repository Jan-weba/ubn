'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PharmacySidebar from '@/components/pharmacy/PharmacySidebar';
import PharmacyTopbar from '@/components/pharmacy/PharmacyTopbar';
import SupportBot from '@/components/pharmacy/SupportBot';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'PHARMACY') { router.push('/login'); return; }
    if (user.pharmacyStatus === 'PENDING') { router.push('/pending-approval'); return; }
    if (user.pharmacyStatus === 'REJECTED') { router.push('/pharmacy-rejected'); return; }
    if (user.pharmacyStatus !== 'APPROVED') { router.push('/login'); return; }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner />
    </div>
  );

  if (!user || user.role !== 'PHARMACY' || user.pharmacyStatus !== 'APPROVED') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <PharmacySidebar
        onOpenSupport={() => setSupportOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <SupportBot
        open={supportOpen}
        onOpen={() => setSupportOpen(true)}
        onClose={() => setSupportOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:ml-72 min-w-0">
        <PharmacyTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
