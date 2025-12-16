'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './_contexts/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
              inputMode="numeric"
              pattern="\d{7}"
              maxLength={7}
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Enter your 7-digit User ID"
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
              className="mt-1 block w-full border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className=" bg-red-50 p-3 text-sm text-red-600">
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

        <div className="mt-6 space-y-2 text-center text-xs text-gray-500">
          <p>
            Demo: Any User ID and password will work for now.
          </p>
          <p className="text-gray-600">
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
