import { forwardRef, type InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helpText?: string;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  helpText,
  indeterminate = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'form-checkbox';
  const errorClasses = error ? 'error' : '';
  
  const checkboxClasses = [baseClasses, errorClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-group">
      <div className="checkbox-container">
        <label className="checkbox-label">
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            {...props}
          />
          
          <span className={`checkbox-custom ${indeterminate ? 'indeterminate' : ''}`}>
            {indeterminate ? (
              <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                <path
                  d="M1 1H11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          
          <span className="checkbox-text">
            {label}
            {props.required && <span className="required-indicator">*</span>}
          </span>
        </label>
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;
