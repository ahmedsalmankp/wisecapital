'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const countries = [
  'India',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Oman',
  'Bahrain',
  'Pakistan',
  'Bangladesh',
  'Nepal',
  'Sri Lanka',
  'Other',
];

export default function Register() {
  const router = useRouter();

  const [sponsorId, setSponsorId] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple static captcha like "4 + 3"
  const captchaQuestion = useMemo(() => '4 + 3 = ?', []);
  const captchaAnswer = 7;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (parseInt(captchaInput.trim(), 10) !== captchaAnswer) {
      setError('Captcha answer is incorrect. Please try again.');
      return;
    }

    setIsSubmitting(true);

    // For now we just simulate a registration and redirect to sign-in.
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess('Registration successful. You can now sign in with your credentials.');
      // Redirect back to sign-in after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#bbedb7]">
      <div className="w-full max-w-lg bg-white p-8 shadow-xl">
        <div className="mb-6 text-center flex flex-col items-center">
          <Image
            src="/wisecapital-logo.png"
            alt="Wise Capital logo"
            width={140}
            height={140}
            className="mb-2"
            priority
          />
          <p className="mt-1 text-gray-600 text-sm">Create your Wise Capital account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sponsorId"
                className="block text-xs font-medium text-gray-700"
              >
                Sponsor ID
              </label>
              <input
                id="sponsorId"
                name="sponsorId"
                type="text"
                inputMode="numeric"
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Enter sponsor ID"
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="sponsorName"
                className="block text-xs font-medium text-gray-700"
              >
                Sponsor Name
              </label>
              <input
                id="sponsorName"
                name="sponsorName"
                type="text"
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Enter sponsor name"
                value={sponsorName}
                onChange={(e) => setSponsorName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-700"
            >
              Email Address <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Enter your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-xs font-medium text-gray-700"
            >
              Select Country
            </label>
            <select
              id="country"
              name="country"
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 bg-white"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            >
              <option value="">Select your country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mobile"
              className="block text-xs font-medium text-gray-700"
            >
              Mobile Number
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="tel"
              className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
              placeholder="Enter your mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="mt-1 block w-full border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Captcha
            </label>
            <div className="mt-1 flex items-center gap-3">
              <div className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
                {captchaQuestion}
              </div>
              <input
                type="text"
                inputMode="numeric"
                className="flex-1 border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
                placeholder="Your answer"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 p-3 text-xs text-green-600">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Already have an account?{' '}
          <Link
            href="/"
            className="font-semibold text-green-700 hover:text-green-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}


