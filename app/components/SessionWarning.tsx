import { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { refreshSession, lock } from '../store/authSlice';
import { extendSession, lockWallet } from '../services/sessionManager';

interface SessionWarningProps {
  isVisible: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionWarning({ 
  isVisible, 
  timeRemaining, 
  onExtend, 
  onLogout 
}: SessionWarningProps) {
  const [countdown, setCountdown] = useState(timeRemaining);
  const dispatch = useAppDispatch();

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isVisible || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) { // Less than 1 second
          onLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, countdown, onLogout]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    dispatch(refreshSession());
    extendSession();
    onExtend();
  };

  const handleLogoutNow = () => {
    dispatch(lock());
    lockWallet();
    onLogout();
  };

  if (!isVisible) return null;

  return (
    <div className="session-warning-overlay">
      <div className="session-warning-modal">
        <div className="session-warning-header">
          <h3>Session Expiring Soon</h3>
          <div className="session-warning-icon">⏰</div>
        </div>
        
        <div className="session-warning-content">
          <p>
            Your session will expire in <strong>{formatTime(countdown)}</strong> due to inactivity.
          </p>
          <p>
            Would you like to extend your session or log out now?
          </p>
        </div>

        <div className="session-warning-actions">
          <button
            type="button"
            onClick={handleExtendSession}
            className="btn btn-primary"
          >
            Extend Session
          </button>
          <button
            type="button"
            onClick={handleLogoutNow}
            className="btn btn-secondary"
          >
            Logout Now
          </button>
        </div>

        <div className="session-warning-footer">
          <small>
            This helps protect your wallet from unauthorized access.
          </small>
        </div>
      </div>
    </div>
  );
}
