'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../_contexts/AuthContext';
import { Wallet, ArrowDownCircle } from 'lucide-react';
import { createWithdrawalRequest, getWithdrawalRequestsByUserId } from '../../_services/withdrawal';

interface WithdrawalRecord {
  srNo: number;
  userId: string;
  amount: number;
  payInr: number;
  txnId: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Failed';
}

export default function Withdrawal() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullname: user?.name || '',
    companyId: '',
    amount: '',
    accountNumber: user?.accountNumber || '',
    ifsc: user?.ifscCode || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock available balance - in real app, this would come from API
  const availableBalance = 12500.00;

  // Fetch withdrawal history from Appwrite
  useEffect(() => {
    const fetchWithdrawalHistory = async () => {
      if (!user?.userId) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        const withdrawals = await getWithdrawalRequestsByUserId(user.userId);
        
        // Convert WithdrawalRequest[] to WithdrawalRecord[] with srNo
        const records: WithdrawalRecord[] = withdrawals.map((withdrawal, index) => ({
          srNo: index + 1,
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          payInr: withdrawal.payInr,
          txnId: withdrawal.txnId,
          date: withdrawal.date,
          status: withdrawal.status,
        }));
        
        setWithdrawalHistory(records);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching withdrawal history:', err);
        setError('Failed to load withdrawal history. Please try again later.');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchWithdrawalHistory();
  }, [user?.userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate form
    if (!formData.fullname || !formData.companyId || !formData.amount || !formData.accountNumber || !formData.ifsc) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (!user?.userId) {
      setError('User not authenticated. Please login.');
      setIsSubmitting(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      setIsSubmitting(false);
      return;
    }

    if (amount > availableBalance) {
      setError('Insufficient balance');
      setIsSubmitting(false);
      return;
    }

    // Validate IFSC code format (should be 11 characters)
    if (formData.ifsc.length !== 11) {
      setError('IFSC code must be 11 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create withdrawal request in Appwrite
      const result = await createWithdrawalRequest(
        user.userId,
        formData.fullname,
        formData.companyId,
        amount,
        formData.accountNumber,
        formData.ifsc.toUpperCase()
      );

      if (result.success) {
        alert(`Withdrawal request submitted successfully!\nRequest ID: ${result.requestId}\nTransaction ID: ${result.txnId}`);
        
        // Reset form
        setFormData({
          fullname: user?.name || '',
          companyId: '',
          amount: '',
          accountNumber: user?.accountNumber || '',
          ifsc: user?.ifscCode || '',
        });

        // Refresh withdrawal history
        const withdrawals = await getWithdrawalRequestsByUserId(user.userId);
        const records: WithdrawalRecord[] = withdrawals.map((withdrawal, index) => ({
          srNo: index + 1,
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          payInr: withdrawal.payInr,
          txnId: withdrawal.txnId,
          date: withdrawal.date,
          status: withdrawal.status,
        }));
        setWithdrawalHistory(records);
      }
    } catch (err: any) {
      console.error('Error creating withdrawal request:', err);
      setError(err.message || 'Failed to submit withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'Completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Withdrawal</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request a withdrawal from your account.
        </p>
      </div>

      {/* Available Balance Card */}
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-600 p-3">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Available Balance
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Withdrawal Request INR Card */}
      <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowDownCircle className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Member Withdrawal Request (INR)
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company ID
            </label>
            <input
              type="text"
              name="companyId"
              value={formData.companyId}
              onChange={handleInputChange}
              placeholder="Enter company ID"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter withdrawal amount"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Enter account number"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC
            </label>
            <input
              type="text"
              name="ifsc"
              value={formData.ifsc}
              onChange={handleInputChange}
              placeholder="Enter IFSC code"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              required
              maxLength={11}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white px-6 py-3 font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>

      {/* Withdrawal History Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Withdrawal History
          </h2>
          {isLoadingHistory ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Loading withdrawal history...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SR No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pay INR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TxnID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawalHistory.length > 0 ? (
                    withdrawalHistory.map((record) => (
                      <tr key={record.srNo} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.srNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{record.payInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {record.txnId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(record.status)}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No withdrawal history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

