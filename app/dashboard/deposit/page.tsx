'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Upload, ArrowUpCircle } from 'lucide-react';

interface DepositRecord {
  srNo: number;
  userId: string;
  name: string;
  amount: number;
  txnId: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function Deposit() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    receipt: null as File | null,
    amount: '',
    txnId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock deposit history - in real app, this would come from API
  const [depositHistory] = useState<DepositRecord[]>([
    {
      srNo: 1,
      userId: user?.userId || '4336294',
      name: user?.name || 'John Doe',
      amount: 10000,
      txnId: 'TXN123456789',
      date: '2024-01-15',
      status: 'Approved',
    },
    {
      srNo: 2,
      userId: user?.userId || '4336294',
      name: user?.name || 'John Doe',
      amount: 5000,
      txnId: 'TXN987654321',
      date: '2024-01-10',
      status: 'Pending',
    },
    {
      srNo: 3,
      userId: user?.userId || '4336294',
      name: user?.name || 'John Doe',
      amount: 7500,
      txnId: 'TXN456789123',
      date: '2024-01-05',
      status: 'Rejected',
    },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, receipt: file }));
    }
  };

  const handleSendWhatsApp = () => {
    const message = `Fund Request - Amount: ₹${formData.amount}, Txn ID: ${formData.txnId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.amount || !formData.txnId) {
      alert('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      alert('Fund request submitted successfully!');
      setFormData({
        receipt: null,
        amount: '',
        txnId: '',
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deposit</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request funds to be added to your account.
        </p>
      </div>

      {/* Card 1: Fund Request Form */}
      <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpCircle className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Fund Request
          </h2>
        </div>

        {/* Payment QR */}
        <div className="mb-6 grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
            <div className="h-36 w-36 rounded border border-gray-200 bg-white flex items-center justify-center">
              <Image
                src="/unnamed.png"
                alt="Payment QR code"
                width={144}
                height={144}
                className="h-36 w-36 object-contain"
                priority
              />
            </div>
            <div className="text-center md:text-left space-y-1">
              <p className="text-sm text-gray-700 font-medium">Scan to pay</p>
            </div>
          </div>
        </div>

        {/* Top Row: WhatsApp Button */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-6">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 font-medium hover:bg-green-700 transition-colors w-full md:w-auto"
          >
            <MessageCircle className="h-4 w-4" />
            Send on WhatsApp
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Receipt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Receipt
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="receipt"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="receipt"
                className="flex items-center gap-2 cursor-pointer border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Choose File</span>
              </label>
              <span className="text-sm text-gray-500">
                {formData.receipt ? formData.receipt.name : 'no file selected'}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Amount"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
              step="0.01"
            />
          </div>

          {/* Transaction ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID
            </label>
            <input
              type="text"
              name="txnId"
              value={formData.txnId}
              onChange={handleInputChange}
              placeholder="Transaction ID"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white px-6 py-3 font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Request Fund'}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Fund Request Status Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        {/* Orange Header Banner */}
        <div className="bg-green-600 px-6 py-3">
          <h2 className="text-lg font-semibold text-white">
            Fund Request Inr Details
          </h2>
        </div>

        {/* Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.NO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USER ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AMOUNT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TXN ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depositHistory.length > 0 ? (
                  depositHistory.map((record) => (
                    <tr key={record.srNo} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.srNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      No deposit requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
