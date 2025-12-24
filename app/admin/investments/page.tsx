'use client';

import { useEffect, useState } from 'react';
import { getAllDeposits, getAllUsers } from '../../_services/admin';
import { adminUpdateWallet } from '../../_services/admin';
import { getWalletByUserId } from '../../_services/wallet';
import { DepositRequest } from '../../_services/deposit';
import { Wallet } from '../../_services/wallet';
import { updateDepositRequestStatus } from '../../_services/admin';
import { DollarSign, CheckCircle, XCircle, Clock, TrendingUp, Search, Filter, Edit } from 'lucide-react';

export default function AdminInvestments() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletUpdate, setWalletUpdate] = useState({
    mainWallet: 0,
    totalBonus: 0,
    directBonus: 0,
    levelBonus: 0,
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  useEffect(() => {
    let filtered = deposits;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.requestId.toLowerCase().includes(query) ||
          d.userId.toLowerCase().includes(query) ||
          d.name.toLowerCase().includes(query) ||
          d.txnId.toLowerCase().includes(query)
      );
    }

    setFilteredDeposits(filtered);
  }, [searchQuery, statusFilter, deposits]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const allDeposits = await getAllDeposits();
      setDeposits(allDeposits);
      setFilteredDeposits(allDeposits);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deposit: DepositRequest, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    if (!deposit.$id) return;

    const action = newStatus === 'Approved' ? 'approve' : newStatus === 'Rejected' ? 'reject' : 'reset';
    if (!confirm(`Are you sure you want to ${action} deposit ${deposit.requestId}?`)) {
      return;
    }

    try {
      const updated = await updateDepositRequestStatus(deposit.$id, newStatus);
      if (updated) {
        await fetchDeposits(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating deposit status:', error);
      alert('Failed to update deposit status');
    }
  };

  const handleViewWallet = async (userId: string) => {
    try {
      const wallet = await getWalletByUserId(userId);
      if (wallet) {
        setSelectedWallet(wallet);
        setWalletUpdate({
          mainWallet: wallet.mainWallet,
          totalBonus: wallet.totalBonus,
          directBonus: wallet.directBonus,
          levelBonus: wallet.levelBonus,
        });
        setShowWalletModal(true);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      alert('Failed to load wallet');
    }
  };

  const handleWalletUpdate = async () => {
    if (!selectedWallet) return;

    if (!confirm('Are you sure you want to update this wallet? This action cannot be undone.')) {
      return;
    }

    try {
      const updated = await adminUpdateWallet(selectedWallet.userId, walletUpdate);
      if (updated) {
        alert('Wallet updated successfully');
        setShowWalletModal(false);
        await handleViewWallet(selectedWallet.userId); // Refresh
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      alert('Failed to update wallet');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
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

  const pendingCount = deposits.filter((d) => d.status === 'Pending').length;
  const approvedCount = deposits.filter((d) => d.status === 'Approved').length;
  const rejectedCount = deposits.filter((d) => d.status === 'Rejected').length;
  const totalAmount = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Investments Management</h1>
        <p className="mt-2 text-gray-600">Review deposits and manage user wallets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Deposits</p>
          <p className="text-2xl font-bold text-gray-900">{deposits.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</p>
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
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deposits Table */}
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit) => (
                  <tr key={deposit.$id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {deposit.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{deposit.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deposit.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{deposit.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {deposit.type === 'INR' ? '₹' : deposit.type === 'USD' ? '$' : ''}
                      {deposit.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(deposit.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                        {deposit.status === 'Pending' && <Clock size={12} className="mr-1" />}
                        {deposit.status === 'Approved' && <CheckCircle size={12} className="mr-1" />}
                        {deposit.status === 'Rejected' && <XCircle size={12} className="mr-1" />}
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {deposit.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(deposit, 'Approved')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <CheckCircle size={16} className="mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(deposit, 'Rejected')}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <XCircle size={16} className="mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewWallet(deposit.userId)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Wallet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Wallet Management - {selectedWallet.userId}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Wallet</label>
                <input
                  type="number"
                  value={walletUpdate.mainWallet}
                  onChange={(e) => setWalletUpdate({ ...walletUpdate, mainWallet: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Bonus</label>
                <input
                  type="number"
                  value={walletUpdate.totalBonus}
                  onChange={(e) => setWalletUpdate({ ...walletUpdate, totalBonus: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Direct Bonus</label>
                <input
                  type="number"
                  value={walletUpdate.directBonus}
                  onChange={(e) => setWalletUpdate({ ...walletUpdate, directBonus: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level Bonus</label>
                <input
                  type="number"
                  value={walletUpdate.levelBonus}
                  onChange={(e) => setWalletUpdate({ ...walletUpdate, levelBonus: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleWalletUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Update Wallet
              </button>
              <button
                onClick={() => setShowWalletModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

