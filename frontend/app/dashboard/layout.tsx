'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 w-full overflow-x-hidden">
          {/* Mobile header with hamburger menu */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background p-4 lg:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Quizz Admin</h1>
          </div>

          {/* Main content with responsive padding */}
          <div className="p-4 sm:p-6 bg-muted/20 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
