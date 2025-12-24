'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, signOut, getCurrentUser, updateUserData, User } from '../_services/auth';

interface AuthContextType {
  user: User | null;
  login: (userId: string, password: string) => Promise<{ success: boolean; user: User | null }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true - check session on mount
  const router = useRouter();

  // Check for existing Appwrite session on mount
  // This restores user state if they have a valid session (e.g., after page refresh)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        // No session exists or error occurred - user is not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Function to check auth state (can be called explicitly)
  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (userId: string, password: string): Promise<{ success: boolean; user: User | null }> => {
    try {
      // Create Appwrite session
      const result = await loginUser(userId, password);
      if (result.success && result.user) {
        // Verify session by calling account.get() to ensure session is active
        // This ensures the session cookie is properly set
        try {
          const verifiedUser = await getCurrentUser();
          if (verifiedUser) {
            setUser(verifiedUser);
            return { success: true, user: verifiedUser };
          }
        } catch (error) {
          console.error('Session verification failed:', error);
        }
        // Fallback to result.user if verification fails
        setUser(result.user);
        return { success: true, user: result.user };
      }
      return { success: false, user: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, user: null };
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = await updateUserData(user.userId, userData);
        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error('Update user error:', error);
        // Optimistically update local state even if database update fails
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
      }
    }
  };

  const logout = async () => {
    try {
      // Delete Appwrite session
      await signOut();
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      // Always clear client-side state
      setUser(null);
      
      // Clear all localStorage and sessionStorage (remove any stale auth data)
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
      }
      
      // Redirect to home
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

