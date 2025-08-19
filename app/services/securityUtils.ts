export class SecurityUtils {
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly MAX_ATTEMPTS = 5;
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  static sanitizeInput(input: string, options: {
    maxLength?: number;
    allowedPattern?: RegExp;
    stripHtml?: boolean;
  } = {}): string {
    const { maxLength = 10000, allowedPattern, stripHtml = true } = options;

    let sanitized = input;

    if (stripHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    if (allowedPattern) {
      sanitized = sanitized.replace(new RegExp(`[^${allowedPattern.source}]`, 'g'), '');
    }

    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  static isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.rateLimitStore.get(identifier);

    if (!record) {
      this.rateLimitStore.set(identifier, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return false;
    }

    if (now > record.resetTime) {
      this.rateLimitStore.set(identifier, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return false;
    }

    if (record.count >= this.MAX_ATTEMPTS) {
      return true;
    }

    record.count++;
    return false;
  }

  static getRateLimitInfo(identifier: string): { attemptsRemaining: number; resetTime: number } {
    const record = this.rateLimitStore.get(identifier);
    const now = Date.now();

    if (!record || now > record.resetTime) {
      return { attemptsRemaining: this.MAX_ATTEMPTS, resetTime: now + this.RATE_LIMIT_WINDOW };
    }

    return {
      attemptsRemaining: Math.max(0, this.MAX_ATTEMPTS - record.count),
      resetTime: record.resetTime,
    };
  }

  static clearRateLimit(identifier: string): void {
    this.rateLimitStore.delete(identifier);
  }

  static isSecureContext(): boolean {
    if (typeof window === 'undefined') return false;
    return window.isSecureContext;
  }

  static hasWebCryptoAPI(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.crypto !== 'undefined' && 
           typeof window.crypto.subtle !== 'undefined';
  }

  static hasCryptoRandomValues(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.getRandomValues === 'function';
  }

  static validateSecurityRequirements(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isSecureContext()) {
      errors.push('Application must run in a secure context (HTTPS)');
    }

    if (!this.hasWebCryptoAPI()) {
      errors.push('Web Crypto API is not available');
    }

    if (!this.hasCryptoRandomValues()) {
      errors.push('Crypto.getRandomValues is not available');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static generateSecureToken(length = 32): string {
    if (!this.hasCryptoRandomValues()) {
      throw new Error('Secure random number generation not available');
    }

    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  static zeroizeString(str: string): void {
    // Note: In JavaScript, strings are immutable, so we can't actually zero them
    // This is a placeholder for the pattern - in a real implementation,
    // sensitive data should be stored in typed arrays that can be zeroed
    if (typeof str !== 'string') return;
    
    // Clear from any variables that might reference it
    str = '';
  }

  static createContentSecurityPolicy(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: unsafe-inline needed for React
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.createContentSecurityPolicy(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  static detectSuspiciousActivity(context: {
    userAgent?: string;
    timestamp: number;
    action: string;
    identifier: string;
  }): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for rapid successive actions
    const recentActions = this.getRecentActions(context.identifier);
    if (recentActions.length > 10) {
      reasons.push('Too many rapid actions detected');
    }

    // Check for unusual user agent
    if (context.userAgent && this.isUnusualUserAgent(context.userAgent)) {
      reasons.push('Unusual user agent detected');
    }

    // Check for time-based anomalies
    const now = Date.now();
    if (Math.abs(context.timestamp - now) > 300000) { // 5 minutes
      reasons.push('Timestamp anomaly detected');
    }

    this.recordAction(context.identifier, context.action, context.timestamp);

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  }

  private static actionLog = new Map<string, Array<{ action: string; timestamp: number }>>();

  private static getRecentActions(identifier: string): Array<{ action: string; timestamp: number }> {
    const actions = this.actionLog.get(identifier) || [];
    const fiveMinutesAgo = Date.now() - 300000;
    return actions.filter(action => action.timestamp > fiveMinutesAgo);
  }

  private static recordAction(identifier: string, action: string, timestamp: number): void {
    const actions = this.actionLog.get(identifier) || [];
    actions.push({ action, timestamp });
    
    // Keep only recent actions
    const fiveMinutesAgo = Date.now() - 300000;
    const recentActions = actions.filter(a => a.timestamp > fiveMinutesAgo);
    
    this.actionLog.set(identifier, recentActions);
  }

  private static isUnusualUserAgent(userAgent: string): boolean {
    // Basic checks for suspicious user agents
    const suspicious = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
    ];

    return suspicious.some(pattern => pattern.test(userAgent));
  }

  static clearSecurityData(): void {
    this.rateLimitStore.clear();
    this.actionLog.clear();
  }
}

export const securityUtils = SecurityUtils;
