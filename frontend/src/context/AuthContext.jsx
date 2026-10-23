import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sixwings_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast, fetchNotifications } = useNotification();

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('sixwings_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.token) {
        localStorage.setItem('sixwings_token', res.token);
        setToken(res.token);
        setUser(res.user);
        showToast('success', 'Welcome Back', `Logged in as ${res.user.name} (${res.user.role})`);
        fetchNotifications();
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const msg = err.message || 'Failed to login';
      showToast('error', 'Login Failed', msg);
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.success && res.token) {
        localStorage.setItem('sixwings_token', res.token);
        setToken(res.token);
        setUser(res.user);
        showToast('success', 'Account Created', `Welcome to Six Wings, ${res.user.name}!`);
        fetchNotifications();
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      const msg = err.message || 'Failed to create account';
      showToast('error', 'Registration Error', msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('sixwings_token');
    setToken(null);
    setUser(null);
    showToast('info', 'Logged Out', 'You have been signed out successfully.');
  };

  const loginAsDemoCustomer = async () => {
    return login('alex@example.com', 'Customer@123');
  };

  const loginAsDemoAdmin = async () => {
    return login('admin@sixwings.com', 'Admin@SixWings2026');
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin,
        loading,
        login,
        register,
        logout,
        loginAsDemoCustomer,
        loginAsDemoAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
