'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_contexts/AuthContext';
import { getCurrentUser } from '../_services/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      // If user is in context, allow access
      if (user) {
        return;
      }

      // If no user in context, check if there's an active Appwrite session
      // This handles cases where user refreshed the page and React state was lost
      // Only check session on protected routes (not on login page)
      setIsChecking(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Session exists - update auth context
          await checkAuth();
          return;
        }
      } catch (error) {
        // No valid session - will redirect below
      } finally {
        setIsChecking(false);
      }

      // No user and no session - redirect to login
      router.push('/');
    };

    verifyAuth();
  }, [user, router, checkAuth]);

  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after checking, don't render (redirect will happen)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

