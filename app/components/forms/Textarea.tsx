import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helpText,
  resize = 'vertical',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'form-textarea';
  const errorClasses = error ? 'error' : '';
  const resizeClasses = `resize-${resize}`;
  
  const textareaClasses = [baseClasses, errorClasses, resizeClasses, className]
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
      
      <textarea
        ref={ref}
        className={textareaClasses}
        {...props}
      />
      
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

Textarea.displayName = 'Textarea';

export default Textarea;
