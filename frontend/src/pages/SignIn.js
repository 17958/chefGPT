import React, { useState, useEffect } from 'react';
import {  useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRestaurantLogo } from '../utils/imageHelper';
import './Auth.css';

const SignIn = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login, user, token } = useAuth();
  const navigate = useNavigate();
  const logoImages = getRestaurantLogo();

  // Redirect if already signed in
  useEffect(() => {
    if (token && user) {
      navigate('/menu');
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Frontend validation
    if (!phone || !phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);

    try {
      const result = await login(phone.trim());
      
      if (result.success) {
        setLoading(false);
        navigate('/menu');
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Try again!');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="logo-container">
            {!logoError ? (
              <img 
                src={logoImages.primary}
                alt="ChefGPT - AI-Powered Restaurant" 
                className="restaurant-logo"
                onError={(e) => {
                  // Try fallback images
                  const currentSrc = e.target.src;
                  const fallbackIndex = logoImages.fallbacks.findIndex(fb => fb !== currentSrc);
                  
                  if (fallbackIndex >= 0 && fallbackIndex < logoImages.fallbacks.length) {
                    e.target.src = logoImages.fallbacks[fallbackIndex];
                  } else {
                    // All images failed, show placeholder
                    setLogoError(true);
                  }
                }}
              />
            ) : (
              <div className="logo-placeholder">🍽️</div>
            )}
          </div>
          <h1 className="restaurant-name">ChefGPT</h1>
          <h2 className="restaurant-name-english">AI-Powered Restaurant</h2>
          <p className="auth-subtitle">Enter your mobile number</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="phone">Mobile Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Enter your mobile number"
              className="animated-input"
              autoFocus
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;

