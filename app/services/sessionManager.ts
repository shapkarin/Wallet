import { securityUtils } from './securityUtils';

export interface SessionConfig {
  maxIdleTime: number; // milliseconds
  maxSessionTime: number; // milliseconds
  warningTime: number; // milliseconds before expiry to show warning
  checkInterval: number; // milliseconds between activity checks
  rememberSession: boolean;
  encryptSessionData: boolean;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  userId?: string;
  rememberSession: boolean;
  fingerprint: string;
}

export interface SessionStatus {
  isActive: boolean;
  timeRemaining: number;
  showWarning: boolean;
  isExpired: boolean;
}

export class SessionManager {
  private static instance: SessionManager;
  private config: SessionConfig;
  private currentSession: SessionData | null = null;
  private activityTimer: number | null = null;
  private warningTimer: number | null = null;
  private checkTimer: number | null = null;
  private onSessionExpired?: () => void;
  private onSessionWarning?: (timeRemaining: number) => void;
  private onActivityDetected?: () => void;

  private constructor(config: Partial<SessionConfig> = {}) {
    this.config = {
      maxIdleTime: 30 * 60 * 1000, // 30 minutes
      maxSessionTime: 8 * 60 * 60 * 1000, // 8 hours
      warningTime: 5 * 60 * 1000, // 5 minutes
      checkInterval: 60 * 1000, // 1 minute
      rememberSession: false,
      encryptSessionData: true,
      ...config,
    };

    this.setupActivityListeners();
  }

  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      this.updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkSessionValidity();
      }
    });

    // Listen for storage changes (multiple tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'trustwallet_session' && e.newValue === null) {
        // Session was cleared in another tab
        this.clearSession();
      }
    });
  }

  private generateSessionFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.platform,
    ];

    // Simple hash of components
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  async startSession(userId?: string, rememberSession = false): Promise<SessionData> {
    const now = Date.now();
    const sessionId = securityUtils.generateSecureToken();
    const fingerprint = this.generateSessionFingerprint();

    this.currentSession = {
      sessionId,
      startTime: now,
      lastActivity: now,
      userId,
      rememberSession,
      fingerprint,
    };

    await this.persistSession();
    this.startTimers();

    return this.currentSession;
  }

  private async persistSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const sessionData = JSON.stringify(this.currentSession);
      
      if (this.config.encryptSessionData) {
        // Simple obfuscation for session data (not critical security)
        const encoded = btoa(sessionData);
        localStorage.setItem('trustwallet_session', encoded);
      } else {
        localStorage.setItem('trustwallet_session', sessionData);
      }

      // Store session expiry separately for cleanup
      const expiryTime = this.currentSession.lastActivity + this.config.maxIdleTime;
      localStorage.setItem('trustwallet_session_expiry', expiryTime.toString());

    } catch (error) {
      console.warn('Failed to persist session:', error);
    }
  }

  async loadSession(): Promise<SessionData | null> {
    try {
      const sessionDataRaw = localStorage.getItem('trustwallet_session');
      if (!sessionDataRaw) return null;

      let sessionData: string;
      if (this.config.encryptSessionData) {
        sessionData = atob(sessionDataRaw);
      } else {
        sessionData = sessionDataRaw;
      }

      const session: SessionData = JSON.parse(sessionData);

      // Validate session fingerprint
      const currentFingerprint = this.generateSessionFingerprint();
      if (session.fingerprint !== currentFingerprint) {
        console.warn('Session fingerprint mismatch - possible session hijacking');
        this.clearSession();
        return null;
      }

      // Check if session is expired
      const now = Date.now();
      const idleTime = now - session.lastActivity;
      const totalTime = now - session.startTime;

      if (idleTime > this.config.maxIdleTime || totalTime > this.config.maxSessionTime) {
        this.clearSession();
        return null;
      }

      this.currentSession = session;
      this.updateActivity(); // Update last activity to now
      this.startTimers();

      return session;
    } catch (error) {
      console.warn('Failed to load session:', error);
      this.clearSession();
      return null;
    }
  }

  updateActivity(): void {
    if (!this.currentSession) return;

    const now = Date.now();
    this.currentSession.lastActivity = now;
    this.persistSession();

    if (this.onActivityDetected) {
      this.onActivityDetected();
    }

    // Reset warning timer
    this.clearWarningTimer();
    this.startWarningTimer();
  }

  getSessionStatus(): SessionStatus {
    if (!this.currentSession) {
      return {
        isActive: false,
        timeRemaining: 0,
        showWarning: false,
        isExpired: true,
      };
    }

    const now = Date.now();
    const idleTime = now - this.currentSession.lastActivity;
    const totalTime = now - this.currentSession.startTime;
    const timeRemaining = Math.min(
      this.config.maxIdleTime - idleTime,
      this.config.maxSessionTime - totalTime
    );

    const isExpired = timeRemaining <= 0;
    const showWarning = timeRemaining <= this.config.warningTime && timeRemaining > 0;

    return {
      isActive: !isExpired,
      timeRemaining: Math.max(0, timeRemaining),
      showWarning,
      isExpired,
    };
  }

  extendSession(): void {
    if (!this.currentSession) return;
    this.updateActivity();
  }

  clearSession(): void {
    this.currentSession = null;
    this.clearTimers();
    
    try {
      localStorage.removeItem('trustwallet_session');
      localStorage.removeItem('trustwallet_session_expiry');
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }

  private startTimers(): void {
    this.clearTimers();
    this.startWarningTimer();
    this.startCheckTimer();
  }

  private startWarningTimer(): void {
    if (!this.currentSession) return;

    const status = this.getSessionStatus();
    if (status.timeRemaining <= this.config.warningTime) {
      if (this.onSessionWarning) {
        this.onSessionWarning(status.timeRemaining);
      }
      return;
    }

    const warningDelay = status.timeRemaining - this.config.warningTime;
    this.warningTimer = window.setTimeout(() => {
      const currentStatus = this.getSessionStatus();
      if (currentStatus.isActive && this.onSessionWarning) {
        this.onSessionWarning(currentStatus.timeRemaining);
      }
    }, warningDelay);
  }

  private startCheckTimer(): void {
    this.checkTimer = window.setInterval(() => {
      this.checkSessionValidity();
    }, this.config.checkInterval);
  }

  private checkSessionValidity(): void {
    const status = this.getSessionStatus();
    
    if (status.isExpired) {
      this.clearSession();
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    }
  }

  private clearWarningTimer(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    this.clearWarningTimer();

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart timers with new config
    if (this.currentSession) {
      this.startTimers();
    }
  }

  setEventHandlers(handlers: {
    onSessionExpired?: () => void;
    onSessionWarning?: (timeRemaining: number) => void;
    onActivityDetected?: () => void;
  }): void {
    this.onSessionExpired = handlers.onSessionExpired;
    this.onSessionWarning = handlers.onSessionWarning;
    this.onActivityDetected = handlers.onActivityDetected;
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  isSessionActive(): boolean {
    return this.getSessionStatus().isActive;
  }

  getTimeUntilExpiry(): number {
    return this.getSessionStatus().timeRemaining;
  }

  // Cleanup method for component unmount
  destroy(): void {
    this.clearTimers();
    this.currentSession = null;
  }

  // Static method to clean up expired sessions
  static cleanupExpiredSessions(): void {
    try {
      const expiryTime = localStorage.getItem('trustwallet_session_expiry');
      if (expiryTime && Date.now() > parseInt(expiryTime)) {
        localStorage.removeItem('trustwallet_session');
        localStorage.removeItem('trustwallet_session_expiry');
      }
    } catch (error) {
      console.warn('Failed to cleanup expired sessions:', error);
    }
  }
}

export const sessionManager = SessionManager.getInstance();
