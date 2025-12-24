'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if user is not in context
    // We do NOT call getCurrentUser() here to avoid 403/CORS errors
    // User must log in to set the user in context
    // This ensures /account/sessions/current is NEVER called before login
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // If no user, don't render (redirect will happen)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}

