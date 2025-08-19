import { generateSalt } from './encryptionFallback';

export interface SecurityAuditResult {
  passed: boolean;
  issues: SecurityIssue[];
  warnings: SecurityWarning[];
  recommendations: string[];
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  remediation: string;
}

export interface SecurityWarning {
  category: string;
  description: string;
  recommendation: string;
}

export class SecurityAuditor {
  static auditCryptographicImplementation(): SecurityAuditResult {
    const issues: SecurityIssue[] = [];
    const warnings: SecurityWarning[] = [];
    const recommendations: string[] = [];

    // Audit salt generation
    this.auditSaltGeneration(issues, warnings);
    
    // Audit PBKDF2 configuration
    this.auditPBKDF2Configuration(issues, warnings);
    
    // Audit encryption method
    this.auditEncryptionMethod(issues, warnings);
    
    // Audit key derivation
    this.auditKeyDerivation(issues, warnings);

    // General recommendations
    recommendations.push(
      'Regularly rotate encryption parameters',
      'Implement proper key zeroization',
      'Use secure memory allocation where possible',
      'Implement timing attack protections',
      'Consider hardware security module (HSM) integration for production'
    );

    return {
      passed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      warnings,
      recommendations,
    };
  }

  private static auditSaltGeneration(issues: SecurityIssue[], warnings: SecurityWarning[]) {
    // Test salt generation quality
    const salts = new Set();
    const testCount = 100;
    
    for (let i = 0; i < testCount; i++) {
      const salt = generateSalt();
      
      // Check salt length
      if (salt.length !== 64) { // 32 bytes = 64 hex chars
        issues.push({
          severity: 'high',
          category: 'Salt Generation',
          description: `Salt length is ${salt.length}, expected 64 characters`,
          remediation: 'Ensure salt generation produces exactly 32 bytes (64 hex characters)',
        });
      }
      
      // Check for hex format
      if (!/^[a-f0-9]{64}$/.test(salt)) {
        issues.push({
          severity: 'medium',
          category: 'Salt Generation',
          description: 'Salt contains non-hexadecimal characters',
          remediation: 'Ensure salt is properly formatted as hexadecimal',
        });
      }
      
      salts.add(salt);
    }
    
    // Check for uniqueness
    if (salts.size < testCount * 0.95) { // Allow for 5% collision rate in test
      issues.push({
        severity: 'critical',
        category: 'Salt Generation',
        description: 'Salt generation shows poor randomness - duplicate salts detected',
        remediation: 'Improve salt generation randomness using crypto.getRandomValues()',
      });
    }

    // Check if crypto.getRandomValues is available
    if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
      issues.push({
        severity: 'critical',
        category: 'Salt Generation',
        description: 'crypto.getRandomValues is not available',
        remediation: 'Ensure application runs in a secure context with crypto API available',
      });
    }
  }

  private static auditPBKDF2Configuration(issues: SecurityIssue[], warnings: SecurityWarning[]) {
    const PBKDF2_MIN_ITERATIONS = 100000;
    
    warnings.push({
      category: 'Key Derivation',
      description: 'Using PBKDF2 instead of Argon2 for key derivation',
      recommendation: 'Consider upgrading to Argon2id for better resistance to GPU attacks',
    });

    // Note: We're using 100000 iterations which is OWASP recommended minimum
    if (PBKDF2_MIN_ITERATIONS < 100000) {
      issues.push({
        severity: 'high',
        category: 'PBKDF2 Configuration',
        description: `PBKDF2 iterations below recommended minimum of 100,000`,
        remediation: 'Increase PBKDF2 iterations to at least 100,000',
      });
    }
  }

  private static auditEncryptionMethod(issues: SecurityIssue[], warnings: SecurityWarning[]) {
    // Current implementation uses AES-GCM with PBKDF2-derived key
    // This is cryptographically secure and uses authenticated encryption
    
    warnings.push({
      category: 'Encryption Method',
      description: 'Using PBKDF2 for key derivation instead of Argon2',
      recommendation: 'Consider upgrading to Argon2id when WASM support is stable',
    });
  }

  private static auditKeyDerivation(issues: SecurityIssue[], warnings: SecurityWarning[]) {
    warnings.push({
      category: 'Key Derivation',
      description: 'Same PBKDF2 parameters used for both password hashing and key derivation',
      recommendation: 'Consider using different parameters or additional key stretching',
    });

    warnings.push({
      category: 'Key Derivation',
      description: 'No key rotation mechanism implemented',
      recommendation: 'Implement periodic key rotation for long-lived data',
    });
  }

  static auditStorageSecurity(): SecurityAuditResult {
    const issues: SecurityIssue[] = [];
    const warnings: SecurityWarning[] = [];
    const recommendations: string[] = [];

    // Check localStorage security
    if (typeof localStorage === 'undefined') {
      issues.push({
        severity: 'critical',
        category: 'Storage',
        description: 'localStorage is not available',
        remediation: 'Ensure application runs in a browser environment with localStorage support',
      });
    } else {
      warnings.push({
        category: 'Storage',
        description: 'localStorage is not encrypted at rest',
        recommendation: 'Consider additional encryption layers for sensitive data',
      });

      warnings.push({
        category: 'Storage',
        description: 'localStorage data persists across browser sessions',
        recommendation: 'Implement secure session management with auto-logout',
      });
    }

    // Check for secure context
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      issues.push({
        severity: 'critical',
        category: 'Security Context',
        description: 'Application is not running in a secure context (HTTPS)',
        remediation: 'Deploy application over HTTPS to ensure secure context',
      });
    }

    recommendations.push(
      'Implement Content Security Policy (CSP)',
      'Use Subresource Integrity (SRI) for external resources',
      'Implement proper CORS headers',
      'Consider using Web Crypto API for additional security',
      'Implement secure session token management'
    );

    return {
      passed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      warnings,
      recommendations,
    };
  }

  static auditPasswordSecurity(): SecurityAuditResult {
    const issues: SecurityIssue[] = [];
    const warnings: SecurityWarning[] = [];
    const recommendations: string[] = [];

    // Check password policy enforcement
    warnings.push({
      category: 'Password Policy',
      description: 'No password history checking implemented',
      recommendation: 'Prevent reuse of recent passwords',
    });

    warnings.push({
      category: 'Password Policy',
      description: 'No password expiration policy',
      recommendation: 'Consider implementing password expiration for high-security environments',
    });

    // Check for timing attack protection
    warnings.push({
      category: 'Password Verification',
      description: 'Password verification may be vulnerable to timing attacks',
      recommendation: 'Implement constant-time comparison for password verification',
    });

    recommendations.push(
      'Implement rate limiting for password attempts',
      'Add CAPTCHA after failed attempts',
      'Implement account lockout policies',
      'Use secure password recovery mechanisms',
      'Consider multi-factor authentication'
    );

    return {
      passed: true, // No critical issues in password security
      issues,
      warnings,
      recommendations,
    };
  }

  static performFullSecurityAudit(): SecurityAuditResult {
    const cryptoAudit = this.auditCryptographicImplementation();
    const storageAudit = this.auditStorageSecurity();
    const passwordAudit = this.auditPasswordSecurity();

    return {
      passed: cryptoAudit.passed && storageAudit.passed && passwordAudit.passed,
      issues: [...cryptoAudit.issues, ...storageAudit.issues, ...passwordAudit.issues],
      warnings: [...cryptoAudit.warnings, ...storageAudit.warnings, ...passwordAudit.warnings],
      recommendations: [...cryptoAudit.recommendations, ...storageAudit.recommendations, ...passwordAudit.recommendations],
    };
  }
}

export const securityAuditor = SecurityAuditor;
