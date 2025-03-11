'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  MessageSquare,
  Bell,
  Briefcase,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth';

const adminSidebarItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: Calendar, label: 'Appointments', href: '/admin/appointments' },
  { icon: Users, label: 'Companies', href: '/admin/companies' },
  { icon: Building, label: 'Clinics', href: '/admin/clinics' },
  { icon: Briefcase, label: 'Services', href: '/admin/services' },
  { icon: Briefcase, label: 'Doctors', href: '/admin/doctors' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <div
      className={cn(
        'bg-red-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40 shadow-lg transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className='p-4 flex items-center justify-between border-b border-red-800'>
        {!isCollapsed && <h2 className='text-2xl font-bold'>Admin</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='p-2 rounded-full hover:bg-red-800'
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>
      <nav className='flex-grow overflow-y-auto'>
        <ul className='space-y-2 p-2'>
          {adminSidebarItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center p-2 rounded-lg hover:bg-red-800 transition-colors',
                  pathname === item.href && 'bg-red-800',
                  isCollapsed && 'justify-center'
                )}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6',
                    isCollapsed && 'text-white hover:text-red-300'
                  )}
                />
                {!isCollapsed && <span className='ml-3'>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className='p-4 border-t border-red-800'>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center p-2 rounded-lg hover:bg-red-800 transition-colors w-full',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut
            className={cn(
              'h-6 w-6',
              isCollapsed && 'text-white hover:text-red-300'
            )}
          />
          {!isCollapsed && <span className='ml-3'>Logout</span>}
        </button>
      </div>
    </div>
  );
}
