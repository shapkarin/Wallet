import { generateSecureToken } from './securityUtils';

export interface WalletSessionConfig {
  maxIdleTime: number;
  warningTime: number;
  checkInterval: number;
}

export interface WalletSessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  isLocked: boolean;
}

export interface WalletSessionStatus {
  isUnlocked: boolean;
  timeRemaining: number;
  showWarning: boolean;
  isExpired: boolean;
}

export interface SessionEventHandlers {
  onSessionExpired?: () => void;
  onSessionWarning?: (timeRemaining: number) => void; // eslint-disable-line
  onActivityDetected?: () => void;
}

const DEFAULT_CONFIG: WalletSessionConfig = {
  maxIdleTime: 15 * 60 * 1000, // 15 minutes for wallet sessions
  warningTime: 2 * 60 * 1000, // 2 minutes warning
  checkInterval: 30 * 1000, // 30 seconds check interval
};

let currentSession: WalletSessionData | null = null;
let sessionConfig: WalletSessionConfig = DEFAULT_CONFIG;
let warningTimer: number | null = null;
let checkTimer: number | null = null;
let eventHandlers: SessionEventHandlers = {};



const persistSession = (): void => {
  if (!currentSession) return;

  try {
    const sessionData = JSON.stringify(currentSession);
    const encoded = btoa(sessionData);
    sessionStorage.setItem('trustwallet_session', encoded);
    
    const expiryTime = currentSession.lastActivity + sessionConfig.maxIdleTime;
    sessionStorage.setItem('trustwallet_session_expiry', expiryTime.toString());
  } catch (error) {
    console.warn('Failed to persist session:', error);
  }
};

const setupActivityListeners = (): void => {
  if (typeof window === 'undefined') return;

  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const handleActivity = () => {
    updateActivity();
  };

  activityEvents.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkSessionValidity();
    }
  });
};

const startTimers = (): void => {
  clearTimers();
  startWarningTimer();
  startCheckTimer();
};

const startWarningTimer = (): void => {
  if (!currentSession) return;

  const status = getSessionStatus();
  if (status.timeRemaining <= sessionConfig.warningTime) {
    if (eventHandlers.onSessionWarning) {
      eventHandlers.onSessionWarning(status.timeRemaining);
    }
    return;
  }

  const warningDelay = status.timeRemaining - sessionConfig.warningTime;
  warningTimer = window.setTimeout(() => {
    const currentStatus = getSessionStatus();
    if (currentStatus.isUnlocked && eventHandlers.onSessionWarning) {
      eventHandlers.onSessionWarning(currentStatus.timeRemaining);
    }
  }, warningDelay);
};

const startCheckTimer = (): void => {
  checkTimer = window.setInterval(() => {
    checkSessionValidity();
  }, sessionConfig.checkInterval);
};

const clearWarningTimer = (): void => {
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
};

const clearTimers = (): void => {
  clearWarningTimer();

  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
};

const checkSessionValidity = (): void => {
  const status = getSessionStatus();
  
  if (status.isExpired) {
    lockWallet();
    if (eventHandlers.onSessionExpired) {
      eventHandlers.onSessionExpired();
    }
  }
};

export const unlockWallet = (): WalletSessionData => {
  const now = Date.now();
  const sessionId = generateSecureToken();

  currentSession = {
    sessionId,
    startTime: now,
    lastActivity: now,
    isLocked: false,
  };

  persistSession();
  startTimers();
  setupActivityListeners();

  return currentSession;
};

export const lockWallet = (): void => {
  currentSession = null;
  clearTimers();
  
  try {
    sessionStorage.removeItem('trustwallet_session');
    sessionStorage.removeItem('trustwallet_session_expiry');
  } catch (error) {
    console.warn('Failed to clear session storage:', error);
  }
};

export const loadSession = (): WalletSessionData | null => {
  try {
    const sessionDataRaw = sessionStorage.getItem('trustwallet_session');
    if (!sessionDataRaw) return null;

    const sessionData = atob(sessionDataRaw);
    const session: WalletSessionData = JSON.parse(sessionData);

    const now = Date.now();
    const idleTime = now - session.lastActivity;

    if (idleTime > sessionConfig.maxIdleTime) {
      lockWallet();
      return null;
    }

    currentSession = session;
    updateActivity();
    startTimers();

    return session;
  } catch (error) {
    console.warn('Failed to load session:', error);
    lockWallet();
    return null;
  }
};

export const updateActivity = (): void => {
  if (!currentSession) return;

  const now = Date.now();
  currentSession.lastActivity = now;
  persistSession();

  if (eventHandlers.onActivityDetected) {
    eventHandlers.onActivityDetected();
  }

  clearWarningTimer();
  startWarningTimer();
};

export const getSessionStatus = (): WalletSessionStatus => {
  if (!currentSession || currentSession.isLocked) {
    return {
      isUnlocked: false,
      timeRemaining: 0,
      showWarning: false,
      isExpired: true,
    };
  }

  const now = Date.now();
  const idleTime = now - currentSession.lastActivity;
  const timeRemaining = sessionConfig.maxIdleTime - idleTime;

  const isExpired = timeRemaining <= 0;
  const showWarning = timeRemaining <= sessionConfig.warningTime && timeRemaining > 0;

  return {
    isUnlocked: !isExpired,
    timeRemaining: Math.max(0, timeRemaining),
    showWarning,
    isExpired,
  };
};

export const extendSession = (): void => {
  updateActivity();
};

export const isWalletUnlocked = (): boolean => {
  return getSessionStatus().isUnlocked;
};

export const getTimeUntilExpiry = (): number => {
  return getSessionStatus().timeRemaining;
};

export const getCurrentSession = (): WalletSessionData | null => {
  return currentSession;
};

export const updateConfig = (config: Partial<WalletSessionConfig>): void => {
  sessionConfig = { ...sessionConfig, ...config };
  
  if (currentSession) {
    startTimers();
  }
};

export const setEventHandlers = (handlers: SessionEventHandlers): void => {
  eventHandlers = { ...eventHandlers, ...handlers };
};

export const cleanupExpiredSessions = (): void => {
  try {
    const expiryTime = sessionStorage.getItem('trustwallet_session_expiry');
    if (expiryTime && Date.now() > parseInt(expiryTime)) {
      sessionStorage.removeItem('trustwallet_session');
      sessionStorage.removeItem('trustwallet_session_expiry');
    }
  } catch (error) {
    console.warn('Failed to cleanup expired sessions:', error);
  }
};

export const destroySession = (): void => {
  clearTimers();
  currentSession = null;
};
