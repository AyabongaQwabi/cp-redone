import type React from 'react';
import { DashboardSidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex '>
      <DashboardSidebar />
      <main className=' p-8 overflow-scroll h-screen w-full'>{children}</main>
    </div>
  );
}
