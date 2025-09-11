'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('app_jwt');
    if (token) {
      // Decode token to get user info (in production, verify with backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            id: payload.sub,
            email: payload.email,
            role: payload.role,
          });
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('app_jwt');
        }
      } catch (error) {
        localStorage.removeItem('app_jwt');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.adminLogin(email, password);
    const { token, user: userData } = response.data;
    
    localStorage.setItem('app_jwt', token);
    setUser(userData);
    setIsAuthenticated(true);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('app_jwt');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}