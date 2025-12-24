'use client';

import { useEffect, useState } from 'react';
import { getAllWithdrawals, updateWithdrawalRequestStatus } from '../../_services/admin';
import { WithdrawalRequest } from '../../_services/withdrawal';
import { CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Failed'>('all');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    let filtered = withdrawals;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((w) => w.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.requestId.toLowerCase().includes(query) ||
          w.userId.toLowerCase().includes(query) ||
          w.fullname.toLowerCase().includes(query) ||
          w.txnId.toLowerCase().includes(query)
      );
    }

    setFilteredWithdrawals(filtered);
  }, [searchQuery, statusFilter, withdrawals]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const allWithdrawals = await getAllWithdrawals();
      setWithdrawals(allWithdrawals);
      setFilteredWithdrawals(allWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (withdrawal: WithdrawalRequest, newStatus: 'Pending' | 'Completed' | 'Failed') => {
    if (!withdrawal.$id) return;

    const action = newStatus === 'Completed' ? 'approve' : newStatus === 'Failed' ? 'reject' : 'reset';
    if (!confirm(`Are you sure you want to ${action} withdrawal ${withdrawal.requestId}?`)) {
      return;
    }

    try {
      const updated = await updateWithdrawalRequestStatus(withdrawal.$id, newStatus);
      if (updated) {
        await fetchWithdrawals(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      alert('Failed to update withdrawal status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingCount = withdrawals.filter((w) => w.status === 'Pending').length;
  const completedCount = withdrawals.filter((w) => w.status === 'Completed').length;
  const failedCount = withdrawals.filter((w) => w.status === 'Failed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals Management</h1>
        <p className="mt-2 text-gray-600">Review and manage withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Request ID, User ID, Name, or Txn ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.$id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {withdrawal.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{withdrawal.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{withdrawal.fullname}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{withdrawal.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {withdrawal.accountNumber.substring(0, 4)}****{withdrawal.accountNumber.slice(-4)}
                      <br />
                      <span className="text-xs text-gray-500">{withdrawal.ifscCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(withdrawal.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status === 'Pending' && <Clock size={12} className="mr-1" />}
                        {withdrawal.status === 'Completed' && <CheckCircle size={12} className="mr-1" />}
                        {withdrawal.status === 'Failed' && <XCircle size={12} className="mr-1" />}
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {withdrawal.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(withdrawal, 'Completed')}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal, 'Failed')}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <XCircle size={16} className="mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                      {withdrawal.status !== 'Pending' && (
                        <button
                          onClick={() => handleStatusUpdate(withdrawal, 'Pending')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Reset
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

