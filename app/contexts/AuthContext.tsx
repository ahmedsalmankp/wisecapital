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
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - accept any credentials
    // In a real app, this would make an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        let mockUser: User;
        
        if (storedUser) {
          mockUser = { ...JSON.parse(storedUser), email };
        } else {
          mockUser = {
            name: email.split('@')[0] || 'User',
            email: email,
            userId: '4336294',
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

