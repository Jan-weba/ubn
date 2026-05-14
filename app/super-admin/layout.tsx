'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import SuperAdminTopbar from '@/components/super-admin/SuperAdminTopbar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SupportBot from '@/components/shared/SupportBot';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner />
    </div>
  );

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <SuperAdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenSupport={() => setSupportOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <SupportBot
        open={supportOpen}
        onOpen={() => setSupportOpen(true)}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
}
