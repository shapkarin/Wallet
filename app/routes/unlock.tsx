import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authenticate, setLoading, setError, refreshSession } from '../store/authSlice';
import { selectAuthLoading, selectAuthError, selectIsAuthenticated, selectIsSetupComplete } from '../store/selectors';
import { storageService } from '../services/storage';
import Layout from '../components/Layout';

export default function Unlock() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isSetupComplete = useAppSelector(selectIsSetupComplete);

  useEffect(() => {
    if (!isSetupComplete) {
      navigate('/onboarding');
    } else if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isSetupComplete, isAuthenticated, navigate]);

  useEffect(() => {
    const checkExistingSession = () => {
      const savedSession = localStorage.getItem('trustwallet_session');
      if (savedSession && rememberSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          const now = Date.now();
          if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
            dispatch(authenticate());
            navigate('/dashboard');
          } else {
            localStorage.removeItem('trustwallet_session');
          }
        } catch {
          localStorage.removeItem('trustwallet_session');
        }
      }
    };

    checkExistingSession();
  }, [dispatch, navigate, rememberSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      dispatch(setError('Please enter your password'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const isValid = await storageService.verifyPassword(password);
      
      if (isValid) {
        dispatch(authenticate());
        
        if (rememberSession) {
          const sessionData = {
            timestamp: Date.now(),
            remember: true,
          };
          localStorage.setItem('trustwallet_session', JSON.stringify(sessionData));
        }

        navigate('/dashboard');
      } else {
        dispatch(setError('Invalid password. Please try again.'));
        setPassword('');
      }
    } catch (error) {
      dispatch(setError('Authentication failed: ' + (error as Error).message));
      setPassword('');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleForgotPassword = () => {
    const confirmed = confirm(
      'If you forgot your password, you will need to reset the application and lose all your wallets. ' +
      'Make sure you have your seed phrases backed up before proceeding. Do you want to continue?'
    );

    if (confirmed) {
      const doubleConfirm = confirm(
        'This will permanently delete all your encrypted wallet data. ' +
        'This action cannot be undone. Are you absolutely sure?'
      );

      if (doubleConfirm) {
        storageService.clearAllData();
        navigate('/onboarding');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <Layout>
      <div className="unlock-page">
        <div className="unlock-container">
          <div className="unlock-header">
            <div className="app-logo">🔐</div>
            <h1>Welcome Back</h1>
            <p>Enter your master password to access your wallets</p>
          </div>

          <form onSubmit={handleSubmit} className="unlock-form">
            <div className="form-group">
              <label htmlFor="password">Master Password</label>
              <div className="password-input-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                Remember me for 24 hours
              </label>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={!password.trim() || isLoading}
              >
                {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
              </button>
            </div>

            <div className="unlock-footer">
              <button
                type="button"
                className="btn-link"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>
          </form>

          <div className="security-info">
            <div className="info-icon">ℹ️</div>
            <div className="info-content">
              <h4>Security Notice</h4>
              <p>Your wallets are encrypted and stored locally. TrustWallet never has access to your passwords or private keys.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
