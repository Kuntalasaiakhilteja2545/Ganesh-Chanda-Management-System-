import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFestival, setActiveFestival] = useState(null);

  // Load user from AsyncStorage on app start
  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedUser, storedAccessToken, storedRefreshToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('access_token'),
        AsyncStorage.getItem('refresh_token'),
      ]);

      if (storedUser && storedAccessToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading stored auth:', err);
    }
  }, []);

  // Verify token and fetch fresh user data
  const verifyTokenAndFetchUser = useCallback(async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return false;
    }

    try {
      const res = await apiClient.get('/auth/me/');
      setUser(res.data);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));

      // Load active festival
      try {
        const festRes = await apiClient.get('/festivals/');
        const festivals = festRes.data.results || festRes.data;
        const active = festivals.find((f) => f.is_active) || festivals[0] || null;
        setActiveFestival(active);
      } catch (err) {
        console.error('Error loading festivals:', err);
      }

      return true;
    } catch (err) {
      // Token invalid or expired, clear storage
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      await loadStoredAuth();
      await verifyTokenAndFetchUser();
    };

    initAuth();
  }, [loadStoredAuth, verifyTokenAndFetchUser]);

  // Verify token when app comes to foreground (handles background token expiry)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        verifyTokenAndFetchUser();
      }
    });

    return () => subscription.remove();
  }, [verifyTokenAndFetchUser]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = res.data;

      await Promise.all([
        AsyncStorage.setItem('access_token', access),
        AsyncStorage.setItem('refresh_token', refresh),
        AsyncStorage.setItem('user', JSON.stringify(userData)),
      ]);

      setUser(userData);

      // Load active festival
      try {
        const festRes = await apiClient.get('/festivals/');
        const festivals = festRes.data.results || festRes.data;
        const active = festivals.find((f) => f.is_active) || festivals[0] || null;
        setActiveFestival(active);
      } catch (err) {
        console.error('Error fetching festivals:', err);
      }

      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refresh = await AsyncStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await apiClient.post('/auth/logout/', { refresh });
      } catch (e) {
        // Ignore logout errors
      }
    }
    await Promise.all([
      AsyncStorage.removeItem('access_token'),
      AsyncStorage.removeItem('refresh_token'),
      AsyncStorage.removeItem('user'),
    ]);
    setUser(null);
    setActiveFestival(null);
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

  const isTreasurer = user?.role === 'ADMIN' || user?.role === 'TREASURER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeFestival,
        login,
        logout,
        forgotUsername,
        resetPassword,
        isTreasurer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}