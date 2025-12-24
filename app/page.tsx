'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './_contexts/AuthContext';

export default function SignIn() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // User is logged in - redirect to appropriate dashboard
      const isAdmin = user.isAdmin === true;
      router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userId.trim()) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(userId, password);
      if (result.success && result.user) {
        // Check admin status - handle both boolean true and string "true" cases
        const isAdminValue: any = result.user.isAdmin;
        const isAdmin = isAdminValue === true || isAdminValue === 'true' || isAdminValue === 1;
        
        // Debug log (remove in production if needed)
        console.log('Login successful. User:', {
          userId: result.user.userId,
          isAdmin: result.user.isAdmin,
          isAdminType: typeof result.user.isAdmin,
          willRedirectTo: isAdmin ? '/admin/dashboard' : '/dashboard'
        });
        
        // Redirect admins to admin dashboard, regular users to user dashboard
        if (isAdmin) {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Invalid User ID or password. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#bbedb7]">
      <div className="w-full max-w-md  bg-white p-8 shadow-xl">
        <div className="mb-8 text-center flex flex-col items-center">
          <Image
            src="/wisecapital-logo.png"
            alt="Wise Capital logo"
            width={160}
            height={160}
            className="mb-2"
            priority
          />
          <p className="mt-1 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700"
            >
              User ID
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              autoComplete="username"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Enter your User ID"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-600">
          <p>
            Not registered yet?{' '}
            <Link
              href="/register"
              className="font-semibold text-green-700 hover:text-green-800"
            >
              Create a new account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
