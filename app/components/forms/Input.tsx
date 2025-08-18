import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  variant?: 'default' | 'monospace';
  icon?: string;
  onIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  variant = 'default',
  icon,
  onIconClick,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'form-input';
  const variantClasses = variant === 'monospace' ? 'monospace' : '';
  const errorClasses = error ? 'error' : '';
  const iconClasses = icon ? 'with-icon' : '';
  
  const inputClasses = [baseClasses, variantClasses, errorClasses, iconClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="input-container">
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {icon && (
          <button
            type="button"
            onClick={onIconClick}
            className="input-icon"
            disabled={!onIconClick}
          >
            {icon}
          </button>
        )}
      </div>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
