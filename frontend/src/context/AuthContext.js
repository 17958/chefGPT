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

  const login = async (email, password) => {
    try {
      // Validate before sending
      if (!email || !email.trim()) {
        return {
          success: false,
          message: 'Please enter your email'
        };
      }

      if (!password) {
        return {
          success: false,
          message: 'Please enter your password'
        };
      }

      const response = await axios.post(`${API_URL}/api/auth/auth`, {
        email: email.trim(),
        password: password
      });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Auth error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Authentication failed'
      };
    }
  };

  const register = async (email, password) => {
    try {
      // Check if already logged in
      if (token && user) {
        return {
          success: false,
          message: 'You are already signed in. Please logout first.'
        };
      }

      // Validate before sending
      if (!email || !email.trim()) {
        return {
          success: false,
          message: 'Please enter your email'
        };
      }

      if (!password || password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long'
        };
      }

      const signupUrl = `${API_URL}/api/auth/signup`;
      console.log('Registering user with:', { email: email.trim(), url: signupUrl });
      
      const response = await axios.post(signupUrl, {
        email: email.trim(),
        password: password
      }, {
        validateStatus: function (status) {
          // Don't throw error for 4xx/5xx, handle them manually
          return status < 600;
        }
      });
      
      console.log('Registration response status:', response.status);
      console.log('Registration response data:', response.data);
      
      // Check if we got an error response
      if (response.status >= 400) {
        throw {
          response: {
            status: response.status,
            data: response.data
          },
          message: response.data?.message || 'Registration failed'
        };
      }
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Registration error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle different error statuses
      if (error.response?.status === 409) {
        // Email already registered
        const errorMessage = error.response?.data?.message || 'Email already registered. Please sign in!';
        return {
          success: false,
          message: errorMessage + ' If this is your first time, the account might have been created when someone added you as a friend. Try signing in with the temporary password sent to your email, or contact support.',
          suggestSignIn: true
        };
      } else if (error.response?.status === 400) {
        // Validation error
        return {
          success: false,
          message: error.response?.data?.message || 'Please check your input and try again.'
        };
      } else if (error.response?.status === 404) {
        // This shouldn't happen on signup, but handle it
        return {
          success: false,
          message: 'Signup endpoint not found. Please check your connection.'
        };
      } else if (error.response?.status === 500) {
        // Server error
        return {
          success: false,
          message: 'Server error. Please try again later.'
        };
      }
      
      // Generic error - filter out sign-in specific messages
      let errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      
      // Replace sign-in specific error messages
      if (errorMessage.includes('User not found') || errorMessage.includes('Please sign up first')) {
        errorMessage = 'Registration failed. Please check your information and try again. If the problem persists, try a different email or contact support.';
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

