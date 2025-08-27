import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectPasswordPrompt } from '../store/selectors';
import { resolvePasswordPrompt, rejectPasswordPrompt, unlock } from '../store/authSlice';
import { passwordManager } from '../services/passwordManager';

export default function PasswordPrompt() {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const passwordPrompt = useAppSelector(selectPasswordPrompt);

  useEffect(() => {
    if (passwordPrompt.isVisible) {
      setPassword('');
      setError(null);
      setIsVerifying(false);
    }
  }, [passwordPrompt.isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await passwordManager.validateAndSetPassword(password);
      if (isValid) {
        dispatch(unlock());
        dispatch(resolvePasswordPrompt(password));
      } else {
        setError('Invalid password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      setPassword('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    dispatch(rejectPasswordPrompt('Password prompt cancelled'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!passwordPrompt.isVisible) return null;

  return (
    <div className="password-prompt-overlay" onKeyDown={handleKeyDown}>
      <div className="password-prompt">
        <div className="password-prompt__header">
          <h2>{passwordPrompt.title}</h2>
          <button 
            type="button" 
            onClick={handleCancel}
            className="close-button"
            disabled={isVerifying}
          >
            ×
          </button>
        </div>

        <div className="password-prompt__content">
          <p>{passwordPrompt.message}</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isVerifying}
                className="form-input"
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="password-prompt__actions">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isVerifying}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="btn btn-primary"
              >
                {isVerifying ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
