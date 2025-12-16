'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../_contexts/AuthContext';
import { Send, Mail } from 'lucide-react';

interface SupportTicket {
  id: string;
  userId: string;
  name: string;
  query: string;
  subject: string;
  description: string;
  reply: string;
  date: string;
  status: 'pending' | 'replied' | 'resolved';
}

export default function Support() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    query: '',
    subject: '',
    message: '',
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load tickets from localStorage
    const storedTickets = localStorage.getItem('supportTickets');
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.query || !formData.subject || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newTicket: SupportTicket = {
        id: `TKT-${Date.now()}`,
        userId: user?.userId || 'N/A',
        name: user?.name || 'User',
        query: formData.query,
        subject: formData.subject,
        description: formData.message,
        reply: '',
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        status: 'pending',
      };

      const updatedTickets = [newTicket, ...tickets];
      setTickets(updatedTickets);
      localStorage.setItem('supportTickets', JSON.stringify(updatedTickets));

      // Reset form
      setFormData({
        query: '',
        subject: '',
        message: '',
      });

      setIsSubmitting(false);
      alert('Support ticket submitted successfully!');
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${
          statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="mt-1 text-sm text-gray-600">
          Get help and contact our support team.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Send to Mail Card */}
        <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-200 ">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Send to Mail</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Query Type
              </label>
              <select
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select query type</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="problem">Problem</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter subject"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                placeholder="Enter your message"
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        {/* Support Tickets Table Card */}
        <div className="bg-white shadow-sm ring-1 ring-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Support Tickets</h2>
            <span className="text-sm text-gray-500">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No support tickets yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Submit a ticket using the form on the left
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reply
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {ticket.userId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {ticket.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium">
                          {ticket.query}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {ticket.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {ticket.reply || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {ticket.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(ticket.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
