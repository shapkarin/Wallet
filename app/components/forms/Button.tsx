import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const fullWidthClasses = fullWidth ? 'btn-full-width' : '';
  const loadingClasses = loading ? 'btn-loading' : '';
  
  const buttonClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidthClasses,
    loadingClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner">
          <span className="spinner"></span>
        </span>
      )}
      
      {leftIcon && !loading && (
        <span className="btn-icon btn-icon-left">
          {leftIcon}
        </span>
      )}
      
      <span className={`btn-content ${loading ? 'loading' : ''}`}>
        {children}
      </span>
      
      {rightIcon && !loading && (
        <span className="btn-icon btn-icon-right">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
