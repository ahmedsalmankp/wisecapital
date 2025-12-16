'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  email: string;
  userId?: string;
  sponsorId?: string;
  mobile?: string;
  password?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  usdtAddress?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  /**
   * For now we treat the first argument as a User ID,
   * even though historically it was called "email".
   */
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } else {
      // Set default user data if not exists
      const defaultUser: User = {
        name: 'User',
        email: '',
        userId: '4336294',
        sponsorId: '7291833',
        mobile: '',
        password: '••••••••••',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        usdtAddress: '',
      };
      setUser(defaultUser);
      localStorage.setItem('user', JSON.stringify(defaultUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    // Mock authentication - accept any credentials.
    // We now treat the first argument as a "User ID" (numeric string),
    // and keep the demo user's name separate so we don't display the ID as the name.
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        let mockUser: User;

        if (storedUser) {
          const existingUser: User = JSON.parse(storedUser);
          mockUser = {
            ...existingUser,
            userId, // update the userId to what was entered on the login screen
          };
        } else {
          mockUser = {
            name: 'User',
            email: '',
            userId,
            sponsorId: '7291833',
            mobile: '',
            password: '••••••••••',
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            usdtAddress: '',
          };
        }

        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        resolve(true);
      }, 500);
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
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

