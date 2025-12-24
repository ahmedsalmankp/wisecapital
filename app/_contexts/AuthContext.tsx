'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, signOut, getCurrentUser, isAuthenticated, updateUserData, User } from '../_services/auth';

interface AuthContextType {
  user: User | null;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false - no initial check
  const router = useRouter();

  // REMOVED: Automatic auth check on page load
  // This was causing 403/CORS errors in production by calling
  // account.getSession('current') before a session exists.
  // Auth will only be checked:
  // 1. After successful login (via login() function)
  // 2. When explicitly requested (e.g., accessing protected routes)

  const login = async (userId: string, password: string): Promise<boolean> => {
    try {
      const result = await loginUser(userId, password);
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      return false;
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
      await signOut();
      setUser(null);
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
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

