import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  userInfo: { email: string; name: string; loginTime: string } | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; loginTime: string } | null>(null);

  // Check authentication state on component mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminInfo = localStorage.getItem('admin_info');
    
    if (token && adminInfo) {
      setIsAuthenticated(true);
      setUserInfo(JSON.parse(adminInfo));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    // Validate input
    if (!email.trim()) {
      return { success: false, message: 'Email is required' };
    }

    if (!password.trim()) {
      return { success: false, message: 'Password is required' };
    }

    try {
      // Make API call to admin login endpoint
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const adminInfo = {
          email: data.data.admin.email,
          name: 'Admin',
          loginTime: new Date().toISOString()
        };

        // Store the actual token from the API response
        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_info', JSON.stringify(adminInfo));
        
        setIsAuthenticated(true);
        setUserInfo(adminInfo);

        return { success: true, message: 'Admin login successful!' };
      } else {
        return { success: false, message: data.message || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, message: 'Network error. Please ensure the backend server is running.' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
  };

  const value: AdminAuthContextType = {
    isAuthenticated,
    userInfo,
    login,
    logout,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
