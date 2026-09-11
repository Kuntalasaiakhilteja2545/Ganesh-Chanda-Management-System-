import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [activeFestival, setActiveFestival] = useState(null);

  // Fetch current user details on load if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me/');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          logout();
        }
      }
      // Load active festival
      await loadOrCreateActiveFestival();

      setLoading(false);
    };

    initAuth();
  }, []);

  const loadOrCreateActiveFestival = async () => {
    try {
      const festRes = await apiClient.get('/festivals/');
      let festivals = festRes.data.results || festRes.data;
      if (!festivals || festivals.length === 0) {
        try {
          const createRes = await apiClient.post('/festivals/', {
            name: `Ganesh Chanda ${new Date().getFullYear()}`,
            name_telugu: `గణేష్ చందా ${new Date().getFullYear()}`,
            association_name: user?.association_name || 'Ganesh Youth Association',
            association_name_telugu: 'గణేష్ యువజన సంఘం',
            year: new Date().getFullYear(),
            is_active: true,
          });
          setActiveFestival(createRes.data);
        } catch (cErr) {
          console.error('Error auto-creating initial festival:', cErr);
        }
      } else {
        const active = festivals.find((f) => f.is_active) || festivals[0] || null;
        setActiveFestival(active);
      }
    } catch (err) {
      console.error('Error loading festivals:', err);
    }
  };

  const login = async (username, password) => {
    const res = await apiClient.post('/auth/login/', { username, password });
    const { access, refresh, user: userData } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    await loadOrCreateActiveFestival();

    return userData;
  };

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await apiClient.post('/auth/logout/', { refresh });
      } catch (e) {
        // Ignore logout errors
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (registerData) => {
    const res = await apiClient.post('/auth/register/', registerData);
    const { access, refresh, user: userData } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    await loadOrCreateActiveFestival();

    return userData;
  };

  const forgotUsername = async (mobileNumber) => {
    const res = await apiClient.post('/auth/forgot-username/', {
      mobile_number: mobileNumber,
    });
    return res.data; // { success, message, username }
  };

  const resetPassword = async (username, mobileNumber, newPassword) => {
    const res = await apiClient.post('/auth/reset-password/', {
      username,
      mobile_number: mobileNumber,
      new_password: newPassword,
    });
    return res.data; // { success, message }
  };

  const role = user?.role || '';
  const isAdmin = role === 'ADMIN';
  const isTreasurer = role === 'TREASURER' || isAdmin;
  const isCollector = role === 'COLLECTOR' || isTreasurer;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isTreasurer,
        isCollector,
        activeFestival,
        setActiveFestival,
        login,
        register,
        forgotUsername,
        resetPassword,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
