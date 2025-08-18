import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helpText,
  options,
  placeholder,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'form-select';
  const errorClasses = error ? 'error' : '';
  
  const selectClasses = [baseClasses, errorClasses, className]
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
      
      <div className="select-container">
        <select
          ref={ref}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="select-arrow">
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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

Select.displayName = 'Select';

export default Select;
