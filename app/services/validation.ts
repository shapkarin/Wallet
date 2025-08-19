import { validateMnemonic } from 'bip39';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  score?: number;
}

export interface PasswordStrengthResult extends ValidationResult {
  score: number;
  feedback: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    hasMinRecommendedLength: boolean;
  };
}

export class ValidationService {
  static readonly PASSWORD_MIN_LENGTH = 8;
  static readonly PASSWORD_RECOMMENDED_LENGTH = 12;
  static readonly MNEMONIC_WORD_COUNTS = [12, 15, 18, 21, 24];
  static readonly DERIVATION_PATH_PATTERN = /^m(\/[0-9]+['h]?)*$/;
  static readonly BIP44_PATH_PATTERN = /^m\/44'\/[0-9]+'\/[0-9]+'\/[0-1]\/[0-9]+$/;

  static validatePassword(password: string): PasswordStrengthResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const requirements = {
      minLength: password.length >= this.PASSWORD_MIN_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
      hasMinRecommendedLength: password.length >= this.PASSWORD_RECOMMENDED_LENGTH,
    };

    if (!requirements.minLength) {
      errors.push(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`);
    } else {
      score += 1;
    }

    if (!requirements.hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!requirements.hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!requirements.hasNumber) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!requirements.hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    if (!requirements.hasMinRecommendedLength && requirements.minLength) {
      warnings.push(`For better security, use at least ${this.PASSWORD_RECOMMENDED_LENGTH} characters`);
    } else if (requirements.hasMinRecommendedLength) {
      score += 1;
    }

    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password.');
      score = Math.max(0, score - 2);
    }

    const hasRepeatingChars = /(.)\1{2,}/.test(password);
    if (hasRepeatingChars) {
      warnings.push('Avoid repeating characters for better security');
    }

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthLabel = strengthLabels[Math.min(score, 5)];
    const feedback = errors.length > 0 ? `Missing: ${errors.join(', ')}` : `${strengthLabel} password`;

    return {
      isValid: errors.length === 0 && score >= 3,
      errors,
      warnings,
      score,
      feedback,
      requirements,
    };
  }

  static validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];

    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    if (!confirmPassword.trim()) {
      errors.push('Please confirm your password');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateMnemonic(mnemonic: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mnemonic.trim()) {
      errors.push('Mnemonic phrase is required');
      return { isValid: false, errors };
    }

    const cleanMnemonic = mnemonic.trim().toLowerCase();
    const words = cleanMnemonic.split(/\s+/);

    if (!this.MNEMONIC_WORD_COUNTS.includes(words.length)) {
      errors.push(`Mnemonic must contain ${this.MNEMONIC_WORD_COUNTS.join(', ')} words. Found ${words.length} words.`);
    }

    const hasInvalidChars = /[^a-z\s]/.test(cleanMnemonic);
    if (hasInvalidChars) {
      errors.push('Mnemonic should only contain lowercase letters and spaces');
    }

    const hasDuplicateWords = words.length !== new Set(words).size;
    if (hasDuplicateWords) {
      warnings.push('Mnemonic contains duplicate words');
    }

    try {
      const isValidBip39 = validateMnemonic(cleanMnemonic);
      if (!isValidBip39) {
        errors.push('Invalid mnemonic phrase. Please check the words and their order.');
      }
    } catch (error) {
      errors.push('Error validating mnemonic: ' + (error as Error).message);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateDerivationPath(path: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!path.trim()) {
      errors.push('Derivation path is required');
      return { isValid: false, errors };
    }

    const cleanPath = path.trim();

    if (!this.DERIVATION_PATH_PATTERN.test(cleanPath)) {
      errors.push('Invalid derivation path format. Must start with "m" and contain only numbers and apostrophes.');
    }

    if (!this.BIP44_PATH_PATTERN.test(cleanPath)) {
      warnings.push('Path does not follow BIP-44 standard (m/44\'/coin_type\'/account\'/change/address_index)');
    }

    const pathParts = cleanPath.split('/');
    if (pathParts.length > 6) {
      warnings.push('Very deep derivation path. Consider using a shorter path for better performance.');
    }

    const hasLargeIndices = pathParts.some(part => {
      const num = parseInt(part.replace(/['h]/g, ''));
      return !isNaN(num) && num > 2147483647; // 2^31 - 1
    });

    if (hasLargeIndices) {
      errors.push('Derivation path indices must be less than 2^31');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateWalletName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name.trim()) {
      errors.push('Wallet name is required');
      return { isValid: false, errors };
    }

    const cleanName = name.trim();

    if (cleanName.length < 2) {
      errors.push('Wallet name must be at least 2 characters long');
    }

    if (cleanName.length > 50) {
      errors.push('Wallet name must be less than 50 characters long');
    }

    const hasInvalidChars = /[<>:"/\\|?*]/.test(cleanName);
    if (hasInvalidChars) {
      errors.push('Wallet name contains invalid characters');
    }

    const isOnlySpaces = /^\s+$/.test(cleanName);
    if (isOnlySpaces) {
      errors.push('Wallet name cannot be only spaces');
    }

    if (cleanName.toLowerCase() === 'default' || cleanName.toLowerCase() === 'wallet') {
      warnings.push('Consider using a more descriptive name');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validatePrivateKey(privateKey: string): ValidationResult {
    const errors: string[] = [];

    if (!privateKey.trim()) {
      errors.push('Private key is required');
      return { isValid: false, errors };
    }

    const cleanKey = privateKey.trim();

    const hexPattern = /^(0x)?[a-fA-F0-9]{64}$/;
    if (!hexPattern.test(cleanKey)) {
      errors.push('Private key must be 64 hexadecimal characters (with or without 0x prefix)');
    }

    const keyWithoutPrefix = cleanKey.startsWith('0x') ? cleanKey.slice(2) : cleanKey;
    const keyBigInt = BigInt('0x' + keyWithoutPrefix);
    const secp256k1Order = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

    if (keyBigInt >= secp256k1Order) {
      errors.push('Private key must be less than the secp256k1 curve order');
    }

    if (keyBigInt === BigInt(0)) {
      errors.push('Private key cannot be zero');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEthereumAddress(address: string): ValidationResult {
    const errors: string[] = [];

    if (!address.trim()) {
      errors.push('Address is required');
      return { isValid: false, errors };
    }

    const cleanAddress = address.trim();

    const addressPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!addressPattern.test(cleanAddress)) {
      errors.push('Invalid Ethereum address format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateNumericInput(value: string, min?: number, max?: number, fieldName = 'Value'): ValidationResult {
    const errors: string[] = [];

    if (!value.trim()) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
      return { isValid: false, errors };
    }

    if (min !== undefined && numValue < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && numValue > max) {
      errors.push(`${fieldName} must be at most ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }


}

export const validationService = ValidationService;
