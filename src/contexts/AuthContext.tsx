import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/AuthService';

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: { email: string; name: string; loginTime: string } | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; loginTime: string } | null>(null);

  // Check authentication state on component mount
  useEffect(() => {
    const authState = AuthService.getAuthState();
    if (authState) {
      setIsAuthenticated(true);
      setUserInfo(authState);
    }
  }, []);

  const login = (email: string, password: string): { success: boolean; message: string } => {
    // Validate input
    if (!email.trim()) {
      return { success: false, message: 'Email is required' };
    }

    if (!password.trim()) {
      return { success: false, message: 'Password is required' };
    }

    if (!AuthService.isValidEmail(email)) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    // Authenticate with hardcoded credentials
    if (AuthService.authenticate(email, password)) {
      setIsAuthenticated(true);
      AuthService.saveAuthState(email);
      
      const authState = AuthService.getAuthState();
      if (authState) {
        setUserInfo(authState);
      }

      return { success: true, message: 'Login successful!' };
    } else {
      return { success: false, message: 'Invalid email or password' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    AuthService.clearAuthState();
  };

  const value: AuthContextType = {
    isAuthenticated,
    userInfo,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
