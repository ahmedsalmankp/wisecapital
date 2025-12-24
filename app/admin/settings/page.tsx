'use client';

import { useAuth } from '../../_contexts/AuthContext';
import { Settings, User, Shield, Bell, Key, Database } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your admin account and preferences</p>
      </div>

      {/* Admin Info */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Admin Information</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <p className="mt-1 text-sm text-gray-900">{user?.userId || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile</label>
            <p className="mt-1 text-sm text-gray-900">{user?.mobile || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Status</label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <Shield size={12} className="mr-1" />
                Administrator
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Platform Information */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="text-green-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Platform Information</h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">
              This admin panel provides comprehensive management tools for your Wise Capital platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Total Features</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">6</p>
              <p className="text-xs text-gray-500 mt-1">Admin pages available</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Access Level</p>
              <p className="text-lg font-bold text-gray-900 mt-1">Full Access</p>
              <p className="text-xs text-gray-500 mt-1">All management features enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Shield className="text-yellow-600 mt-1" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800 mb-1">Security Notice</h3>
            <p className="text-sm text-yellow-700">
              You have administrative access to this platform. Please ensure you follow security best practices:
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Never share your admin credentials</li>
              <li>Always verify user actions before making changes</li>
              <li>Use the confirmation dialogs for critical operations</li>
              <li>Log out when finished with admin tasks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/users"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="text-blue-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage users and permissions</p>
          </a>
          <a
            href="/admin/dashboard"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="text-green-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-900">Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">View platform overview</p>
          </a>
        </div>
      </div>
    </div>
  );
}

