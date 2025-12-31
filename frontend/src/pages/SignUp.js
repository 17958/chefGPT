import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRestaurantLogo } from '../utils/imageHelper';
import './Auth.css';

const SignUp = () => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [warning, setWarning] = useState('');
  const { register, user, token } = useAuth();
  const navigate = useNavigate();
  const logoImages = getRestaurantLogo();

  // Check if user is already signed in
  useEffect(() => {
    if (token && user) {
      setWarning(`You are already signed in. Please logout first to create a new account.`);
    }
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');
    
    // Check if already signed in
    if (token && user) {
      setWarning(`You are already signed in. Please logout first to create a new account.`);
      return;
    }
    
    // Frontend validation
    if (!phone || !phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    
    setLoading(true);

    const result = await register(phone.trim());
    
    if (result.success) {
      navigate('/menu');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
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
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {warning && <div className="warning-message">{warning}</div>}
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
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
          {token && user && (
            <span> | <Link to="/menu">Go to Menu</Link></span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SignUp;

