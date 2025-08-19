import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { lock, refreshSession } from '../store/authSlice';
import { selectIsUnlocked } from '../store/selectors';
import { getSessionStatus, setEventHandlers, extendSession, lockWallet, loadSession, updateConfig, unlockWallet, type WalletSessionStatus } from '../services/sessionManager';

export interface UseSessionResult {
  sessionStatus: WalletSessionStatus;
  showWarning: boolean;
  extendSession: () => void;
  logoutUser: () => void;
  timeUntilExpiry: number;
  isSessionActive: boolean;
}

export const useSession = (): UseSessionResult => {
  const [sessionStatus, setSessionStatus] = useState<WalletSessionStatus>(() => 
    getSessionStatus()
  );
  const [showWarning, setShowWarning] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isUnlocked = useAppSelector(selectIsUnlocked);

  const handleSessionExpired = useCallback(async () => {
    const { passwordManager } = await import('../services/passwordManager');
    passwordManager.clearCurrentPassword();
    dispatch(lock());
    lockWallet();
    navigate('/unlock');
  }, [dispatch, navigate]);

  const handleSessionWarning = useCallback((timeRemaining: number) => {
    setShowWarning(true);
    setSessionStatus(getSessionStatus());
  }, []);

  const handleActivityDetected = useCallback(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  const extendSessionCallback = useCallback(() => {
    extendSession();
    dispatch(refreshSession());
    setShowWarning(false);
    setSessionStatus(getSessionStatus());
  }, [dispatch]);

  const logoutUser = useCallback(() => {
    handleSessionExpired();
  }, [handleSessionExpired]);

  useEffect(() => {
    if (!isUnlocked) {
      setShowWarning(false);
      return;
    }

    // Set up session event handlers
    setEventHandlers({
      onSessionExpired: handleSessionExpired,
      onSessionWarning: handleSessionWarning,
      onActivityDetected: handleActivityDetected,
    });

    // Update session status periodically
    const statusInterval = setInterval(() => {
      const status = getSessionStatus();
      setSessionStatus(status);
      
      if (status.isExpired) {
        handleSessionExpired();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(statusInterval);
    };
  }, [isUnlocked, handleSessionExpired, handleSessionWarning, handleActivityDetected]);

  // Clean up warning when session becomes active again
  useEffect(() => {
    if (sessionStatus.isUnlocked && !sessionStatus.showWarning) {
      setShowWarning(false);
    }
  }, [sessionStatus.isUnlocked, sessionStatus.showWarning]);

  return {
    sessionStatus,
    showWarning: showWarning || sessionStatus.showWarning,
    extendSession: extendSessionCallback,
    logoutUser,
    timeUntilExpiry: sessionStatus.timeRemaining,
    isSessionActive: sessionStatus.isUnlocked,
  };
};

export const useSessionSetup = () => {
  const dispatch = useAppDispatch();

  const initializeSession = useCallback(async (userId?: string, rememberSession = false) => {
    try {
      await unlockWallet();
      return true;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return false;
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const session = await loadSession();
      if (session) {
        dispatch(refreshSession());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return false;
    }
  }, [dispatch]);

  const configureSession = useCallback((config: {
    maxIdleTime?: number;
    maxSessionTime?: number;
    warningTime?: number;
  }) => {
    updateConfig(config);
  }, []);

  return {
    initializeSession,
    restoreSession,
    configureSession,
  };
};
