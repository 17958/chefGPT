import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Determine initial state based on route
  const getInitialSignInState = () => {
    try {
      const pathname = location?.pathname || '/signin';
      return pathname === '/signup' ? false : true;
    } catch (error) {
      console.error('Error determining initial state:', error);
      return true; // default to signin
    }
  };
  
  const [isSignIn, setIsSignIn] = useState(getInitialSignInState());
  // Separate state for signin and signup forms
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  // Separate error states for each form
  const [signInError, setSignInError] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // Update state when route changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsSignIn(false);
    } else if (location.pathname === '/signin' || location.pathname === '/auth') {
      setIsSignIn(true);
    }
  }, [location.pathname]);

  // Pre-fill email from URL parameter and check DB to decide signin/signup
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      // Check backend to see if user exists and what they should do
      const checkEmailStatus = async () => {
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiUrl}/api/auth/check-email/${encodeURIComponent(emailParam)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.shouldSignUp) {
            // User doesn't exist or is auto-created - show signup
            setSignUpEmail(emailParam);
            setIsSignIn(false);
          } else {
            // User exists and is fully registered - show signin
            setSignInEmail(emailParam);
            setIsSignIn(true);
          }
        } catch (error) {
          console.error('Error checking email status:', error);
          // Default to signup if check fails
          setSignUpEmail(emailParam);
          setIsSignIn(false);
        }
      };
      
      checkEmailStatus();
    }
  }, [searchParams]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click
    setSignInError('');
    setSignUpError(''); // Clear signup error too
    
    if (!signInEmail.trim()) {
      setSignInError('Please enter your email');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signInEmail.trim())) {
      setSignInError('Please enter a valid email address');
      return;
    }

    if (!signInPassword || signInPassword.length < 6) {
      setSignInError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);

    try {
      const result = await login(signInEmail.trim(), signInPassword);
      
      if (result.success) {
        navigate('/menu');
      } else {
        setSignInError(result.message || 'Sign in failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setSignInError('Something went wrong. Try again!');
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click
    setSignUpError('');
    setSignInError(''); // Clear signin error too
    
    if (!signUpEmail.trim()) {
      setSignUpError('Please enter your email');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail.trim())) {
      setSignUpError('Please enter a valid email address');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);

    try {
      console.log('Attempting signup with:', { email: signUpEmail.trim() });
      const result = await register(signUpEmail.trim(), signUpPassword);
      console.log('Signup result:', result);
      
      if (result.success) {
        navigate('/menu');
      } else {
        // Filter out any sign-in specific error messages on signup page
        let errorMsg = result.message || 'Registration failed. Please try again.';
        
        // ALWAYS replace sign-in specific messages - they should NEVER appear on signup
        if (errorMsg.includes('User not found') || 
            errorMsg.includes('Please sign up first') ||
            errorMsg.includes('sign up first')) {
          errorMsg = 'Registration failed. Please check your information and try again.';
        }
        
        setSignUpError(errorMsg);
        if (result.suggestSignIn) {
          // Auto-switch to sign in if email already registered
          setTimeout(() => {
            setIsSignIn(true);
            // Copy email to signin form
            setSignInEmail(signUpEmail);
          }, 2000);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      let errorMsg = 'Something went wrong. Please try again!';
      
      // Check if error message contains sign-in specific text
      const errorText = err.message || err.response?.data?.message || '';
      if (errorText.includes('User not found') || 
          errorText.includes('Please sign up first') ||
          errorText.includes('sign up first')) {
        errorMsg = 'Registration failed. Please check your information and try again.';
      } else if (errorText) {
        errorMsg = errorText;
      }
      
      setSignUpError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-cards-wrapper">
        {/* Sign In Card */}
        <div 
          className={`auth-face-card ${!isSignIn ? 'inactive' : 'active'}`}
          onClick={(e) => {
            // Only switch if clicking on card background, not on form elements
            if (!isSignIn && e.target === e.currentTarget || e.target.closest('.face-card-header') || e.target.closest('.switch-card-button')) {
              setIsSignIn(true);
            }
          }}
        >
          <div 
            className="face-card-header" 
            onClick={(e) => {
              if (!isSignIn) {
                e.stopPropagation();
                setIsSignIn(true);
              }
            }}
          >
            <div className="face-icon">😊</div>
            <h2>Sign In</h2>
            <p>Welcome back!</p>
          </div>
          <form 
            onSubmit={handleSignIn} 
            className="auth-form" 
            onClick={(e) => {
              e.stopPropagation();
              // Prevent any interaction if card is inactive
              if (!isSignIn) {
                e.preventDefault();
                return false;
              }
            }}
            onMouseDown={(e) => {
              if (!isSignIn) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          >
            {signInError && <div className="error-message">{signInError}</div>}
            
            <div className="form-group">
              <label htmlFor="signin-email">Email</label>
              <input
                type="email"
                id="signin-email"
                value={signInEmail}
                onChange={(e) => {
                  if (isSignIn) {
                    setSignInEmail(e.target.value);
                  }
                }}
                required
                placeholder="Enter your email"
                disabled={loading || !isSignIn}
                readOnly={!isSignIn}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signin-password">Password</label>
              <input
                type="password"
                id="signin-password"
                value={signInPassword}
                onChange={(e) => {
                  if (isSignIn) {
                    setSignInPassword(e.target.value);
                  }
                }}
                required
                placeholder="Enter your password"
                disabled={loading || !isSignIn}
                readOnly={!isSignIn}
                minLength={6}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            <button 
              type="submit" 
              className="auth-submit-button" 
              disabled={loading || !isSignIn}
              onClick={(e) => e.stopPropagation()}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="switch-card-button" onClick={(e) => { e.stopPropagation(); setIsSignIn(false); }}>
            New here? Sign Up
          </div>
        </div>

        {/* Sign Up Card */}
        <div 
          className={`auth-face-card ${isSignIn ? 'inactive' : 'active'}`}
          onClick={(e) => {
            // Only switch if clicking on card background, not on form elements
            if (isSignIn && (e.target === e.currentTarget || e.target.closest('.face-card-header') || e.target.closest('.switch-card-button'))) {
              setIsSignIn(false);
            }
          }}
        >
          <div 
            className="face-card-header" 
            onClick={(e) => {
              if (isSignIn) {
                e.stopPropagation();
                setIsSignIn(false);
              }
            }}
          >
            <div className="face-icon">👋</div>
            <h2>Sign Up</h2>
            <p>Join us today!</p>
          </div>
          <form 
            onSubmit={handleSignUp} 
            className="auth-form" 
            onClick={(e) => {
              e.stopPropagation();
              // Prevent any interaction if card is inactive
              if (isSignIn) {
                e.preventDefault();
                return false;
              }
            }}
            onMouseDown={(e) => {
              if (isSignIn) {
                e.stopPropagation();
                e.preventDefault();
              }
            }}
          >
            {signUpError && <div className="error-message">{signUpError}</div>}
            
            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <input
                type="email"
                id="signup-email"
                value={signUpEmail}
                onChange={(e) => {
                  if (!isSignIn) {
                    setSignUpEmail(e.target.value);
                  }
                }}
                required
                placeholder="Enter your email"
                disabled={loading || isSignIn}
                readOnly={isSignIn}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                value={signUpPassword}
                onChange={(e) => {
                  if (!isSignIn) {
                    setSignUpPassword(e.target.value);
                  }
                }}
                required
                placeholder="Enter your password (min 6 characters)"
                disabled={loading || isSignIn}
                readOnly={isSignIn}
                minLength={6}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>

            <button 
              type="submit" 
              className="auth-submit-button" 
              disabled={loading || isSignIn}
              onClick={(e) => e.stopPropagation()}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="switch-card-button" onClick={(e) => { e.stopPropagation(); setIsSignIn(true); }}>
            Already have an account? Sign In
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

