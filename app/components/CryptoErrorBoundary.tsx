import { type ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface CryptoErrorBoundaryProps {
  children: ReactNode;
}

const CryptoErrorFallback = (error: Error, errorInfo: string) => (
  <div className="crypto-error-boundary">
    <div className="crypto-error-content">
      <h3>Cryptographic Operation Failed</h3>
      <p>
        There was an error with a security operation. This could be due to:
      </p>
      <ul>
        <li>Incorrect password</li>
        <li>Corrupted encrypted data</li>
        <li>Browser security restrictions</li>
      </ul>
      <p className="crypto-error-warning">
        <strong>Important:</strong> Your private keys and seed phrases remain secure.
        No sensitive data has been compromised.
      </p>
    </div>
  </div>
);

const handleCryptoError = (error: Error, errorInfo: string) => {
  if (import.meta.env.DEV) {
    console.error('Crypto Error:', error);
    console.error('Error Info:', errorInfo);
  }
};

export default function CryptoErrorBoundary({ children }: CryptoErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={CryptoErrorFallback}
      onError={handleCryptoError}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}
