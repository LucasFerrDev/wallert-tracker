import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  login: (token: string, isConfigured: boolean) => void;
  logout: () => void;
  setConfigured: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isConfigured, setIsConfiguredState] = useState<boolean>(
    localStorage.getItem('isConfigured') === 'true'
  );

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );
    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  const login = (newToken: string, configured: boolean) => {
    setToken(newToken);
    setIsConfiguredState(configured);
    localStorage.setItem('token', newToken);
    localStorage.setItem('isConfigured', String(configured));
    // Navigation is handled by route guards (ConfiguredRoute) in App.tsx
  };

  const logout = () => {
    setToken(null);
    setIsConfiguredState(false);
    localStorage.removeItem('token');
    localStorage.removeItem('isConfigured');
  };

  const setConfigured = (status: boolean) => {
    setIsConfiguredState(status);
    localStorage.setItem('isConfigured', String(status));
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isConfigured, login, logout, setConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

