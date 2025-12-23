'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../../_contexts/AuthContext';
import { MessageCircle, Upload, ArrowUpCircle, X, Copy, Check } from 'lucide-react';
import { createDepositRequest, getDepositRequestsByUserId, getDepositRequestsByType, type DepositRequest } from '../../_services/deposit';

type DepositType = 'INR' | 'USD' | 'Crypto';

export default function Deposit() {
  const { user } = useAuth();
  const [depositType, setDepositType] = useState<DepositType>('INR');
  const [formData, setFormData] = useState({
    receipt: null as File | null,
    amount: '',
    txnId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositHistory, setDepositHistory] = useState<DepositRequest[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState<string>('');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'id' | 'token' | null>(null);

  // Load and filter deposit history from Appwrite
  useEffect(() => {
    const loadDepositHistory = async () => {
      if (user?.userId) {
        try {
          const allUserRequests = await getDepositRequestsByUserId(user.userId);
          // Filter by deposit type
          const filtered = allUserRequests.filter(req => req.type === depositType);
          setDepositHistory(filtered);
        } catch (error) {
          console.error('Error loading deposit history:', error);
        }
      }
    };
    loadDepositHistory();
  }, [depositType, user]);

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

  const handleSendTelegram = () => {
    const currencySymbol = depositType === 'INR' ? '₹' : depositType === 'USD' ? '$' : '';
    const txnLabel = depositType === 'Crypto' ? 'Txn Hash' : 'Txn ID';
    const message = `Fund Request (${depositType}) - Amount: ${currencySymbol}${formData.amount}, ${txnLabel}: ${formData.txnId}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      ''
    )}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
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

    if (!user) {
      alert('Please login to submit a deposit request');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create deposit request with generated ID and token
      const result = await createDepositRequest(
        user.userId,
        user.name,
        depositType,
        amount,
        formData.txnId,
        formData.receipt
      );

      if (result.success) {
        // Store generated ID and token
        setGeneratedRequestId(result.requestId);
        setGeneratedToken(result.token);
        setShowSuccessModal(true);

        // Refresh deposit history
        const allUserRequests = await getDepositRequestsByUserId(user.userId);
        const filtered = allUserRequests.filter(req => req.type === depositType);
        setDepositHistory(filtered);

        // Reset form
        setFormData({
          receipt: null,
          amount: '',
          txnId: '',
        });
      }
    } catch (error) {
      console.error('Error creating deposit request:', error);
      alert('Failed to create deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async (text: string, field: 'id' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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

  const formatAmount = (amount: number, type: DepositType) => {
    if (type === 'INR') {
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (type === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}`;
    }
  };

  const getAmountLabel = () => {
    switch (depositType) {
      case 'INR':
        return 'Amount';
      case 'USD':
        return 'Amount (USD)';
      case 'Crypto':
        return 'Amount (in Crypto or USD equivalent)';
      default:
        return 'Amount';
    }
  };

  const getAmountPlaceholder = () => {
    switch (depositType) {
      case 'INR':
        return 'Amount';
      case 'USD':
        return 'Amount in USD';
      case 'Crypto':
        return 'Amount';
      default:
        return 'Amount';
    }
  };

  const getTxnIdLabel = () => {
    switch (depositType) {
      case 'INR':
        return 'Transaction ID';
      case 'USD':
        return 'Transaction ID';
      case 'Crypto':
        return 'Transaction Hash';
      default:
        return 'Transaction ID';
    }
  };

  const getTxnIdPlaceholder = () => {
    switch (depositType) {
      case 'INR':
        return 'Transaction ID';
      case 'USD':
        return 'Transaction ID';
      case 'Crypto':
        return 'Transaction hash / ID';
      default:
        return 'Transaction ID';
    }
  };

  const getReceiptLabel = () => {
    switch (depositType) {
      case 'INR':
        return 'Upload Receipt';
      case 'USD':
        return 'Upload Receipt';
      case 'Crypto':
        return 'Upload Receipt / Screenshot';
      default:
        return 'Upload Receipt';
    }
  };

  const getStepValue = () => {
    switch (depositType) {
      case 'INR':
        return '0.01';
      case 'USD':
        return '0.01';
      case 'Crypto':
        return '0.0001';
      default:
        return '0.01';
    }
  };

  // Convert DepositRequest to table format
  const tableHistory = depositHistory.map((record, index) => ({
    srNo: index + 1,
    requestId: record.requestId,
    userId: record.userId,
    name: record.name,
    amount: record.amount,
    txnId: record.txnId,
    date: record.date,
    status: record.status,
    type: record.type,
  }));

  return (
    <div className="space-y-6">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Deposit Request Created
              </h3>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your {depositType} deposit request has been submitted successfully!
              </p>
              
              {/* Request ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedRequestId}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 font-mono text-sm rounded"
                  />
                  <button
                    onClick={() => handleCopy(generatedRequestId, 'id')}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    title="Copy Request ID"
                  >
                    {copiedField === 'id' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedToken}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 text-gray-900 font-mono text-xs rounded"
                  />
                  <button
                    onClick={() => handleCopy(generatedToken, 'token')}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                    title="Copy Token"
                  >
                    {copiedField === 'token' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> Please save your Request ID and Token. You'll need them to track your deposit request.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deposit</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request funds to be added to your account.
        </p>
      </div>

      {/* Deposit Type Selection */}
      <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Deposit Type
          </label>
          <div className="flex flex-wrap gap-3">
            {(['INR', 'USD', 'Crypto'] as DepositType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setDepositType(type);
                  // Reset form when switching types
                  setFormData({
                    receipt: null,
                    amount: '',
                    txnId: '',
                  });
                }}
                className={`px-6 py-2 font-medium transition-colors rounded ${
                  depositType === type
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card 1: Fund Request Form */}
      <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpCircle className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Fund Request ({depositType})
          </h2>
        </div>

        {/* Payment QR - Only show for INR */}
        {depositType === 'INR' && (
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
        )}

        {/* Crypto Wallet Address - Only show for Crypto */}
        {depositType === 'Crypto' && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="0x1234567890abcdef1234567890abcdef12345678"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 bg-white text-gray-700 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('0x1234567890abcdef1234567890abcdef12345678');
                  alert('Wallet address copied to clipboard!');
                }}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors text-sm"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Send your crypto to this address. Make sure to use the correct network.
            </p>
          </div>
        )}

        {/* USD Payment Details - Only show for USD */}
        {depositType === 'USD' && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-medium text-gray-900">Wise Capital Inc.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium text-gray-900">1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SWIFT Code:</span>
                <span className="font-medium text-gray-900">WISEUS33XXX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Name:</span>
                <span className="font-medium text-gray-900">Wise Capital Bank</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Row: Telegram Button */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-6">
          <button
            type="button"
            onClick={handleSendTelegram}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 font-medium hover:bg-green-700 transition-colors w-full md:w-auto"
          >
            <MessageCircle className="h-4 w-4" />
            Send on Telegram
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Receipt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getReceiptLabel()}
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
              {getAmountLabel()}
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder={getAmountPlaceholder()}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
              step={getStepValue()}
            />
          </div>

          {/* Transaction ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getTxnIdLabel()}
            </label>
            <input
              type="text"
              name="txnId"
              value={formData.txnId}
              onChange={handleInputChange}
              placeholder={getTxnIdPlaceholder()}
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
            Fund Request {depositType} Details
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
                    {depositType === 'Crypto' ? 'TXN HASH' : 'TXN ID'}
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
                {tableHistory.length > 0 ? (
                  tableHistory.map((record) => (
                    <tr key={record.requestId} className="hover:bg-gray-50">
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
                        {formatAmount(record.amount, record.type)}
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
                      No deposit requests found for {depositType}
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
