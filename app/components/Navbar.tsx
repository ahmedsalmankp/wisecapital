'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Bell, MessageSquare, User, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-600 hover:bg-gray-100"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex-1 lg:hidden"></div>
      <div className="flex items-center gap-2 lg:gap-4">
        <button className="relative p-2 text-gray-600 hover:bg-gray-100">
          <MessageSquare className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 bg-red-500"></span>
        </button>
        <button className="relative p-2 text-gray-600 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 bg-red-500"></span>
        </button>
        <Link
          href="/dashboard/profile"
          className="hidden items-center gap-3 bg-gray-100 px-3 py-2 lg:flex hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center bg-green-600 text-white">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {user?.name || 'User'}
          </span>
        </Link>
        <Link
          href="/dashboard/profile"
          className="flex lg:hidden items-center gap-2 bg-gray-100 px-2 py-1 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center bg-blue-600 text-white">
            <User className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
