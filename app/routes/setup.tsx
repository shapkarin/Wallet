import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSetupComplete, setLoading, setError } from '../store/authSlice';
import { selectAuthLoading, selectAuthError, selectIsSetupComplete } from '../store/selectors';
import { storageService } from '../services/storage';
import Layout from '../components/Layout';

export default function Setup() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isSetupComplete = useAppSelector(selectIsSetupComplete);

  useEffect(() => {
    if (isSetupComplete) {
      navigate('/create-wallet');
    }
  }, [isSetupComplete, navigate]);

  const evaluatePasswordStrength = (pwd: string) => {
    let score = 0;
    const feedback = [];

    if (pwd.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('One lowercase letter');

    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('One number');

    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    else feedback.push('One special character');

    if (pwd.length >= 12) score += 1;

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthLabel = strengthLabels[Math.min(score, 5)];

    return {
      score,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : `${strengthLabel} password`,
    };
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(evaluatePasswordStrength(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      dispatch(setError('You must accept the terms to continue'));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(setError('Passwords do not match'));
      return;
    }

    if (passwordStrength.score < 3) {
      dispatch(setError('Password is too weak. Please use a stronger password.'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await storageService.setupPassword(password);
      
      // Set the password in the password manager for immediate use
      const { passwordManager } = await import('../services/passwordManager');
      passwordManager.setCurrentPassword(password);
      
      dispatch(setSetupComplete(true));
      navigate('/create-wallet');
    } catch (error) {
      dispatch(setError('Failed to setup password: ' + (error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getStrengthColor = (score: number) => {
    if (score < 2) return '#ff4444';
    if (score < 4) return '#ffaa00';
    return '#44ff44';
  };

  const isFormValid = password.length > 0 && 
    password === confirmPassword && 
    passwordStrength.score >= 3 && 
    acceptedTerms;

  return (
    <Layout>
      <div className="setup-page">
        <div className="setup-container">
          <div className="setup-header">
            <h1>Create Master Password</h1>
            <p>This password will encrypt and protect all your wallets</p>
          </div>

          <div className="security-notice">
            <div className="notice-icon">🔐</div>
            <div className="notice-content">
              <h4>Important Security Information</h4>
              <ul>
                <li>This password encrypts your seed phrases using strong encryption</li>
                <li>We cannot recover your password if you forget it</li>
                <li>Choose a strong, unique password you can remember</li>
                <li>Consider using a password manager</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="form-group">
              <label htmlFor="password">Master Password</label>
              <div className="password-input-group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter a strong password"
                  disabled={isLoading}
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
              {password && (
                <div className="password-strength">
                  <div 
                    className="strength-bar"
                    style={{ 
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getStrengthColor(passwordStrength.score)
                    }}
                  />
                  <span 
                    className="strength-text"
                    style={{ color: getStrengthColor(passwordStrength.score) }}
                  >
                    {passwordStrength.feedback}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="error-message">Passwords do not match</div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                I understand that I am responsible for keeping my password secure and that it cannot be recovered if lost
              </label>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
