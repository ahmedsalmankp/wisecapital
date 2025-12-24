'use client';

import { useEffect, useState } from 'react';
import { getAllUsers } from '../../_services/admin';
import { getAllDeposits, getAllWithdrawals } from '../../_services/admin';
import { getAllSupportTickets } from '../../_services/support';
import { Users, DollarSign, ArrowDownUp, MessageSquare, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  openTickets: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    openTickets: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, deposits, withdrawals, tickets] = await Promise.all([
          getAllUsers(),
          getAllDeposits(),
          getAllWithdrawals(),
          getAllSupportTickets(),
        ]);

        const activeUsers = users.filter((u) => u.status !== 'blocked').length;
        const pendingDeposits = deposits.filter((d) => d.status === 'Pending').length;
        const pendingWithdrawals = withdrawals.filter((w) => w.status === 'Pending').length;
        const openTickets = tickets.filter((t) => t.status !== 'resolved').length;
        const totalDeposits = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

        setStats({
          totalUsers: users.length,
          activeUsers,
          pendingDeposits,
          pendingWithdrawals,
          openTickets,
          totalDeposits,
          totalWithdrawals,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Pending Deposits',
      value: stats.pendingDeposits,
      subtitle: 'Requires review',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      subtitle: 'Requires review',
      icon: ArrowDownUp,
      color: 'bg-yellow-500',
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      subtitle: 'Needs attention',
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Deposits',
      value: `₹${stats.totalDeposits.toLocaleString()}`,
      subtitle: 'All time',
      icon: TrendingUp,
      color: 'bg-green-600',
    },
    {
      title: 'Total Withdrawals',
      value: `₹${stats.totalWithdrawals.toLocaleString()}`,
      subtitle: 'All time',
      icon: TrendingUp,
      color: 'bg-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600 mt-1">View and manage all users</p>
          </a>
          <a
            href="/admin/withdrawals"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Review Withdrawals</h3>
            <p className="text-sm text-gray-600 mt-1">Approve or reject withdrawal requests</p>
          </a>
          <a
            href="/admin/support"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Support Tickets</h3>
            <p className="text-sm text-gray-600 mt-1">Respond to user inquiries</p>
          </a>
        </div>
      </div>
    </div>
  );
}

