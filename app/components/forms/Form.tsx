import { type FormHTMLAttributes, type ReactNode } from 'react';

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  error?: string;
  loading?: boolean;
  actions?: ReactNode;
}

export default function Form({
  title,
  description,
  error,
  loading = false,
  actions,
  children,
  className = '',
  ...props
}: FormProps) {
  const formClasses = ['form', loading ? 'form-loading' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="form-container">
      {(title || description) && (
        <div className="form-header">
          {title && <h2 className="form-title">{title}</h2>}
          {description && <p className="form-description">{description}</p>}
        </div>
      )}
      
      {error && (
        <div className="form-error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
        </div>
      )}
      
      <form className={formClasses} {...props}>
        <div className="form-content">
          {children}
        </div>
        
        {actions && (
          <div className="form-actions">
            {actions}
          </div>
        )}
        
        {loading && (
          <div className="form-loading-overlay">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
