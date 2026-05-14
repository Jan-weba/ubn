'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BranchSidebar from '@/components/branch/BranchSidebar';
import BranchTopbar from '@/components/branch/BranchTopbar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const STANDALONE_PAGES = ['/branch/change-password', '/branch/pending-approval'];

export default function BranchLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'BRANCH_MANAGER') { router.push('/login'); return; }
    const branchStatus = (user as any).branchStatus;
    const isStandalone = STANDALONE_PAGES.some(p => pathname.startsWith(p));
    if ((branchStatus === 'INVITED' || branchStatus === 'PENDING') && !isStandalone) {
      router.push('/branch/pending-approval');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.role !== 'BRANCH_MANAGER') return null;

  const isStandalone = STANDALONE_PAGES.some(p => pathname.startsWith(p));
  if (isStandalone) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <BranchSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 min-w-0">
        <BranchTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
