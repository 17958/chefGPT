import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [API_URL, logout]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (phone) => {
    try {
      // Validate before sending
      if (!phone || !phone.trim()) {
        return {
          success: false,
          message: 'Please enter your phone number'
        };
      }

      const response = await axios.post(`${API_URL}/api/auth/auth`, {
        phone: phone.trim()
      });
      const { token: newToken, user: userData, isNewUser } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true, isNewUser };
    } catch (error) {
      console.error('Auth error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Authentication failed'
      };
    }
  };

  const register = async (phone) => {
    try {
      // Check if already logged in
      if (token && user) {
        return {
          success: false,
          message: 'You are already signed in. Please logout first.'
        };
      }

      // Validate before sending
      if (!phone || !phone.trim()) {
        return {
          success: false,
          message: 'Please enter your phone number'
        };
      }

      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        phone: phone.trim()
      });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      // Handle duplicate phone number - use backend message as-is (it already includes sign in instruction)
      if (error.response?.status === 409) {
        return {
          success: false,
          message: errorMessage
        };
      }
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

