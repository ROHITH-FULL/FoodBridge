import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fb_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('fb_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (data.success) {
          setUser(data.user);
          setOrganization(data.organization);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    if (data.success) {
      localStorage.setItem('fb_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.success) {
      localStorage.setItem('fb_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);
    }
    return data;
  };

  const demoLogin = async (roleType) => {
    const data = await api.demoLogin(roleType);
    if (data.success) {
      localStorage.setItem('fb_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganization(data.organization);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('fb_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data.success) {
        setUser(data.user);
        setOrganization(data.organization);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
