interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_WINDOW = 60000;
const MAX_ATTEMPTS = 5;
const rateLimitStore = new Map<string, RateLimitRecord>();

export const isRateLimited = (identifier: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }

  record.count++;
  return false;
};

export const getRateLimitInfo = (identifier: string): { attemptsRemaining: number; resetTime: number } => {
  const record = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return { attemptsRemaining: MAX_ATTEMPTS, resetTime: now + RATE_LIMIT_WINDOW };
  }

  return {
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.count),
    resetTime: record.resetTime,
  };
};

export const clearRateLimit = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};

export const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext;
};

export const hasWebCryptoAPI = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.crypto !== 'undefined' && 
         typeof window.crypto.subtle !== 'undefined';
};

export const hasCryptoRandomValues = (): boolean => {
  return typeof crypto !== 'undefined' && 
         typeof crypto.getRandomValues === 'function';
};

export const validateSecurityRequirements = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!hasWebCryptoAPI()) {
    errors.push('Web Crypto API is not available');
  }

  if (!hasCryptoRandomValues()) {
    errors.push('Crypto.getRandomValues is not available');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const generateSecureToken = (length = 32): string => {
  if (!hasCryptoRandomValues()) {
    throw new Error('Secure random number generation not available');
  }

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

export const zeroizeString = (str: string): void => {
  if (typeof str !== 'string') return;
  str = '';
};
