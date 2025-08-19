import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout, refreshSession } from '../store/authSlice';
import { selectIsAuthenticated } from '../store/selectors';
import { sessionManager, type SessionStatus } from '../services/sessionManager';

export interface UseSessionResult {
  sessionStatus: SessionStatus;
  showWarning: boolean;
  extendSession: () => void;
  logoutUser: () => void;
  timeUntilExpiry: number;
  isSessionActive: boolean;
}

export const useSession = (): UseSessionResult => {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(() => 
    sessionManager.getSessionStatus()
  );
  const [showWarning, setShowWarning] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
    sessionManager.clearSession();
    navigate('/unlock');
  }, [dispatch, navigate]);

  const handleSessionWarning = useCallback((timeRemaining: number) => {
    setShowWarning(true);
    setSessionStatus(sessionManager.getSessionStatus());
  }, []);

  const handleActivityDetected = useCallback(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    dispatch(refreshSession());
    setShowWarning(false);
    setSessionStatus(sessionManager.getSessionStatus());
  }, [dispatch]);

  const logoutUser = useCallback(() => {
    handleSessionExpired();
  }, [handleSessionExpired]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    // Set up session event handlers
    sessionManager.setEventHandlers({
      onSessionExpired: handleSessionExpired,
      onSessionWarning: handleSessionWarning,
      onActivityDetected: handleActivityDetected,
    });

    // Update session status periodically
    const statusInterval = setInterval(() => {
      const status = sessionManager.getSessionStatus();
      setSessionStatus(status);
      
      if (status.isExpired) {
        handleSessionExpired();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(statusInterval);
    };
  }, [isAuthenticated, handleSessionExpired, handleSessionWarning, handleActivityDetected]);

  // Clean up warning when session becomes active again
  useEffect(() => {
    if (sessionStatus.isActive && !sessionStatus.showWarning) {
      setShowWarning(false);
    }
  }, [sessionStatus.isActive, sessionStatus.showWarning]);

  return {
    sessionStatus,
    showWarning: showWarning || sessionStatus.showWarning,
    extendSession,
    logoutUser,
    timeUntilExpiry: sessionStatus.timeRemaining,
    isSessionActive: sessionStatus.isActive,
  };
};

export const useSessionSetup = () => {
  const dispatch = useAppDispatch();

  const initializeSession = useCallback(async (userId?: string, rememberSession = false) => {
    try {
      await sessionManager.startSession(userId, rememberSession);
      return true;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return false;
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const session = await sessionManager.loadSession();
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
    sessionManager.updateConfig(config);
  }, []);

  return {
    initializeSession,
    restoreSession,
    configureSession,
  };
};
