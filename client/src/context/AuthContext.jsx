/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data);
          setError(null);
        } catch (err) {
          console.error('Auth check failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token, logout]);

  const register = async (name, email, password, role = 'member') => {
    try {
      const data = await api.register({ name, email, password, role });
      const newToken = data.token;
      const newUser = data.user || {
        id: data.userId,
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role || role,
        team_id: data.team_id || null,
      };
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      const newToken = data.token;
      const newUser = data.user || {
        id: data.userId,
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role || 'member',
        team_id: data.team_id || null,
      };
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    setUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
