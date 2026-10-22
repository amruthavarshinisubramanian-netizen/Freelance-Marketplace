import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { showToast } from '../services/toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('fm_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('fm_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify current user on start if token exists
    async function loadUser() {
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          if (userData && (userData.userId || userData.email)) {
            setUser(userData);
            localStorage.setItem('fm_user', JSON.stringify(userData));
          }
        } catch (e) {
          // Only log out if specifically unauthorized or token expired
          if (e.response?.status === 401 || e.message?.includes('expired') || e.message?.includes('Unauthorized')) {
            logout(false);
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('fm_token', data.token);
    localStorage.setItem('fm_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await api.post('/auth/register', userData);
    localStorage.setItem('fm_token', data.token);
    localStorage.setItem('fm_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = (notify = true) => {
    localStorage.removeItem('fm_token');
    localStorage.removeItem('fm_user');
    setToken(null);
    setUser(null);
    if (notify) {
      showToast('You have been logged out.', 'info');
    }
  };

  const role = user?.role ? user.role.toUpperCase() : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        role,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout
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

