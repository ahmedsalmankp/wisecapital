'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../_contexts/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  HelpCircle,
  LogOut,
  X,
  ArrowDownCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Deposit',
    icon: ArrowDownCircle,
    children: [
      { name: 'Deposit INR', href: '/dashboard/deposit' },
      { name: 'Deposit USD', href: '/dashboard/deposit-usd' },
      { name: 'Deposit Crypto', href: '/dashboard/deposit-crypto' },
    ],
  },
  { name: 'Withdrawal', href: '/dashboard/withdrawal', icon: Wallet },
  { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center  border-b border-green-300 px-4">
        <Image
          src="/wisecapital-logo.png"
          alt="Wise Capital"
          width={120}
          height={40}
          className="h-10 w-auto object-contain mr-3"
        />
        <h1 className="text-xl font-bold text-green-800">WISECAPITAL</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          // Handle simple links
          if (!item.children) {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-green-200 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          }

          // Handle dropdown (Deposit)
          const isParentActive = item.children.some(
            (child) => child.href === pathname
          );

          return (
            <div key={item.name} className="space-y-1">
              <div
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium ${
                  isParentActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              <div className="ml-8 space-y-1">
                {item.children.map((child) => {
                  const isActive = pathname === child.href;
                  return (
                    <Link
                      key={child.name}
                      href={child.href}
                      onClick={onClose}
                      className={`block px-3 py-1.5 text-sm ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : 'text-gray-700 hover:bg-green-200 hover:text-gray-900'
                      }`}
                    >
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-green-300 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-green-200 hover:text-gray-900 "
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: '#bbedb7' }}
      >
        <div className="flex h-full flex-col">{sidebarContent}</div>
      </aside>
    </>
  );
}
