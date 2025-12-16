'use client';

import { useState } from 'react';
import { MessageCircle, Upload, ArrowUpCircle } from 'lucide-react';

export default function DepositUSD() {
  const [formData, setFormData] = useState({
    receipt: null as File | null,
    amount: '',
    txnId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const message = `Fund Request (USD) - Amount: $${formData.amount}, Txn ID: ${formData.txnId}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      ''
    )}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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

    setTimeout(() => {
      alert('USD fund request submitted successfully!');
      setFormData({ receipt: null, amount: '', txnId: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deposit USD</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request USD funds to be added to your account.
        </p>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowUpCircle className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Fund Request (USD)</h2>
        </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Amount in USD"
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
              step="0.01"
            />
          </div>

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
    </div>
  );
}
