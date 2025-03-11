import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description:
    'Admin dashboard for managing appointments, doctors, and clinics',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <div className='flex h-screen bg-gray-100'>
        <AdminSidebar />
        <div className='flex-1 overflow-auto pl-64'>
          {' '}
          {/* Added pl-64 for sidebar width */}
          <main className='p-6 min-h-screen'>{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
