import { type ValidationResult, type PasswordStrengthResult } from '../services/validation';

interface ValidationMessageProps {
  validation: ValidationResult | PasswordStrengthResult | null;
  showSuccess?: boolean;
  className?: string;
}

export default function ValidationMessage({ 
  validation, 
  showSuccess = false, 
  className = '' 
}: ValidationMessageProps) {
  if (!validation) return null;

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings && validation.warnings.length > 0;
  const isPasswordValidation = 'score' in validation;

  if (!hasErrors && !hasWarnings && !showSuccess) return null;

  return (
    <div className={`validation-message ${className}`}>
      {hasErrors && (
        <div className="validation-errors">
          {validation.errors.map((error, index) => (
            <div key={index} className="validation-error">
              <span className="validation-icon">⚠️</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {hasWarnings && (
        <div className="validation-warnings">
          {validation.warnings?.map((warning, index) => (
            <div key={index} className="validation-warning">
              <span className="validation-icon">💡</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {!hasErrors && showSuccess && validation.isValid && (
        <div className="validation-success">
          <span className="validation-icon">✅</span>
          <span>
            {isPasswordValidation 
              ? (validation as PasswordStrengthResult).feedback
              : 'Valid'
            }
          </span>
        </div>
      )}

      {isPasswordValidation && (
        <div className="password-strength">
          <div className="password-strength-bar">
            <div 
              className={`password-strength-fill strength-${(validation as PasswordStrengthResult).score}`}
              style={{ 
                width: `${((validation as PasswordStrengthResult).score / 5) * 100}%` 
              }}
            />
          </div>
          <div className="password-requirements">
            {Object.entries((validation as PasswordStrengthResult).requirements).map(([key, met]) => (
              <div 
                key={key} 
                className={`requirement ${met ? 'met' : 'unmet'}`}
              >
                <span className="requirement-icon">{met ? '✓' : '○'}</span>
                <span className="requirement-text">
                  {getRequirementText(key)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getRequirementText(requirement: string): string {
  const texts: Record<string, string> = {
    minLength: 'At least 8 characters',
    hasUppercase: 'One uppercase letter',
    hasLowercase: 'One lowercase letter',
    hasNumber: 'One number',
    hasSpecialChar: 'One special character',
    hasMinRecommendedLength: '12+ characters (recommended)',
  };

  return texts[requirement] || requirement;
}
