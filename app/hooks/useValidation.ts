import { useState, useCallback, useMemo } from 'react';
import { ValidationService, type ValidationResult, type PasswordStrengthResult } from '../services/validation';

export interface UseValidationOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
}

export interface UsePasswordValidationResult {
  validation: PasswordStrengthResult;
  isValid: boolean;
  validate: (password: string) => PasswordStrengthResult;
  reset: () => void;
}

export interface UseGenericValidationResult<T = ValidationResult> {
  validation: T | null;
  isValid: boolean;
  validate: (value: string) => T;
  reset: () => void;
}

export const usePasswordValidation = (
  initialValue = '',
  options: UseValidationOptions = {}
): UsePasswordValidationResult => {
  const { validateOnChange = false } = options;
  
  const [validation, setValidation] = useState<PasswordStrengthResult>(() =>
    validateOnChange ? ValidationService.validatePassword(initialValue) : {
      isValid: false,
      errors: [],
      score: 0,
      feedback: '',
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinRecommendedLength: false,
      },
    }
  );

  const validate = useCallback((password: string): PasswordStrengthResult => {
    const result = ValidationService.validatePassword(password);
    setValidation(result);
    return result;
  }, []);

  const reset = useCallback(() => {
    setValidation({
      isValid: false,
      errors: [],
      score: 0,
      feedback: '',
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinRecommendedLength: false,
      },
    });
  }, []);

  const isValid = useMemo(() => validation.isValid, [validation.isValid]);

  return { validation, isValid, validate, reset };
};

export const useMnemonicValidation = (
  initialValue = '',
  options: UseValidationOptions = {}
): UseGenericValidationResult => {
  const { validateOnChange = false } = options;
  
  const [validation, setValidation] = useState<ValidationResult | null>(() =>
    validateOnChange ? ValidationService.validateMnemonic(initialValue) : null
  );

  const validate = useCallback((mnemonic: string): ValidationResult => {
    const result = ValidationService.validateMnemonic(mnemonic);
    setValidation(result);
    return result;
  }, []);

  const reset = useCallback(() => {
    setValidation(null);
  }, []);

  const isValid = useMemo(() => validation?.isValid ?? false, [validation?.isValid]);

  return { validation, isValid, validate, reset };
};

export const useDerivationPathValidation = (
  initialValue = '',
  options: UseValidationOptions = {}
): UseGenericValidationResult => {
  const { validateOnChange = false } = options;
  
  const [validation, setValidation] = useState<ValidationResult | null>(() =>
    validateOnChange ? ValidationService.validateDerivationPath(initialValue) : null
  );

  const validate = useCallback((path: string): ValidationResult => {
    const result = ValidationService.validateDerivationPath(path);
    setValidation(result);
    return result;
  }, []);

  const reset = useCallback(() => {
    setValidation(null);
  }, []);

  const isValid = useMemo(() => validation?.isValid ?? false, [validation?.isValid]);

  return { validation, isValid, validate, reset };
};

export const useWalletNameValidation = (
  initialValue = '',
  options: UseValidationOptions = {}
): UseGenericValidationResult => {
  const { validateOnChange = false } = options;
  
  const [validation, setValidation] = useState<ValidationResult | null>(() =>
    validateOnChange ? ValidationService.validateWalletName(initialValue) : null
  );

  const validate = useCallback((name: string): ValidationResult => {
    const result = ValidationService.validateWalletName(name);
    setValidation(result);
    return result;
  }, []);

  const reset = useCallback(() => {
    setValidation(null);
  }, []);

  const isValid = useMemo(() => validation?.isValid ?? false, [validation?.isValid]);

  return { validation, isValid, validate, reset };
};

export const usePrivateKeyValidation = (
  initialValue = '',
  options: UseValidationOptions = {}
): UseGenericValidationResult => {
  const { validateOnChange = false } = options;
  
  const [validation, setValidation] = useState<ValidationResult | null>(() =>
    validateOnChange ? ValidationService.validatePrivateKey(initialValue) : null
  );

  const validate = useCallback((privateKey: string): ValidationResult => {
    const result = ValidationService.validatePrivateKey(privateKey);
    setValidation(result);
    return result;
  }, []);

  const reset = useCallback(() => {
    setValidation(null);
  }, []);

  const isValid = useMemo(() => validation?.isValid ?? false, [validation?.isValid]);

  return { validation, isValid, validate, reset };
};

export const useFormValidation = <T extends Record<string, string>>(
  validators: Record<keyof T, (value: string) => ValidationResult>
) => {
  const [validations, setValidations] = useState<Record<keyof T, ValidationResult | null>>(() => 
    Object.keys(validators).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, ValidationResult | null>)
  );

  const validate = useCallback((field: keyof T, value: string): ValidationResult => {
    const result = validators[field](value);
    setValidations(prev => ({ ...prev, [field]: result }));
    return result;
  }, [validators]);

  const validateAll = useCallback((values: T): Record<keyof T, ValidationResult> => {
    const results = {} as Record<keyof T, ValidationResult>;
    
    Object.entries(values).forEach(([field, value]) => {
      results[field as keyof T] = validators[field as keyof T](value as string);
    });
    
    setValidations(results);
    return results;
  }, [validators]);

  const reset = useCallback(() => {
    setValidations(
      Object.keys(validators).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, ValidationResult | null>)
    );
  }, [validators]);

  const isFormValid = useMemo(() => {
    return Object.values(validations).every(validation => validation?.isValid === true);
  }, [validations]);

  const hasErrors = useMemo(() => {
    return Object.values(validations).some(validation => validation && !validation.isValid);
  }, [validations]);

  return {
    validations,
    validate,
    validateAll,
    reset,
    isFormValid,
    hasErrors,
  };
};
