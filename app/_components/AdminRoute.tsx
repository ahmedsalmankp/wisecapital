'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_contexts/AuthContext';
import { isAdmin } from '../_services/admin';
import { getCurrentUser } from '../_services/auth';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // First check if user is in context or if there's an active session
      let currentUser = user;
      
      if (!currentUser) {
        // Check if there's an active Appwrite session
        // Only check session on protected routes (not on login page)
        try {
          currentUser = await getCurrentUser();
          if (currentUser) {
            // Session exists - update auth context
            await checkAuth();
          } else {
            // No session - redirect to login
            setIsChecking(false);
            router.push('/');
            return;
          }
        } catch (error) {
          // No valid session
          setIsChecking(false);
          router.push('/');
          return;
        }
      }

      // At this point, we have a user (either from context or from session)
      // Verify admin status from database - always fetch fresh, never cache
      try {
        const adminStatus = await isAdmin();
        if (adminStatus) {
          setIsAuthorized(true);
        } else {
          // User is logged in but not admin - redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminAccess();
  }, [user, isLoading, router, checkAuth]);

  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

