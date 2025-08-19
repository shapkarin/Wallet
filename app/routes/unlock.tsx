import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { unlock, lock, setLoading, setError, refreshSession } from '../store/authSlice';
import { loadWalletsFromStorage } from '../store/walletSlice';
import { selectAuthLoading, selectAuthError, selectIsUnlocked, selectIsSetupComplete } from '../store/selectors';
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
  const isUnlocked = useAppSelector(selectIsUnlocked);
  const isSetupComplete = useAppSelector(selectIsSetupComplete);

  useEffect(() => {
    if (!isSetupComplete) {
      navigate('/onboarding');
    } else if (isUnlocked) {
      navigate('/dashboard');
    }
  }, [isSetupComplete, isUnlocked, navigate]);

  useEffect(() => {
    const checkExistingSession = () => {
      const savedSession = localStorage.getItem('trustwallet_session');
      if (savedSession && rememberSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          const now = Date.now();
          if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
            dispatch(unlock());
            // Note: Wallets will be loaded by the dashboard effect when needed
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
        const { passwordManager } = await import('../services/passwordManager');
        passwordManager.setCurrentPassword(password);
        
        dispatch(unlock());
        
        try {
          const wallets = await storageService.loadWallets(password);
          const seedPhrases = await storageService.loadSeedPhrases(password);
          dispatch(loadWalletsFromStorage({ wallets, seedPhrases }));
        } catch (error) {
          console.warn('Failed to load wallets on unlock:', error);
        }
        
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
      '⚠️ WARNING: Password Recovery Impossible\n\n' +
      'TrustWallet cannot recover your password. If you proceed:\n' +
      '• ALL your encrypted wallet data will be permanently deleted\n' +
      '• You will lose access to ALL wallets unless you have your seed phrases\n' +
      '• This action cannot be undone\n\n' +
      'Only proceed if you have your seed phrases backed up safely.\n\n' +
      'Do you want to delete your account and start over?'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      '🚨 FINAL WARNING 🚨\n\n' +
      'You are about to permanently delete ALL wallet data.\n\n' +
      'Without your seed phrase backups, you will lose access to your cryptocurrency forever.\n\n' +
      'Are you absolutely certain you want to proceed?'
    );

    if (!doubleConfirm) return;

    const confirmation = prompt(
      'To confirm account deletion, type exactly: DELETE MY ACCOUNT\n\n' +
      '(This will reset the entire application)'
    );
    
    if (confirmation !== 'DELETE MY ACCOUNT') {
      alert('Account deletion cancelled. The text must match exactly.');
      return;
    }

    try {
      storageService.resetApplication();
      
      // Also clear password manager state
      import('../services/passwordManager').then(({ passwordManager }) => {
        passwordManager.clearCurrentPassword();
      });
      
      dispatch(lock());
      
      // Force reload to reset all application state
      window.location.href = '/onboarding';
    } catch (error) {
      alert('Failed to reset application: ' + (error as Error).message);
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
