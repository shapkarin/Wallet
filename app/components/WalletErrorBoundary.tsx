import { type ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface WalletErrorBoundaryProps {
  children: ReactNode;
}

const WalletErrorFallback = (error: Error, errorInfo: string) => (
  <div className="wallet-error-boundary">
    <div className="wallet-error-content">
      <h3>Wallet Operation Failed</h3>
      <p>
        There was an error processing your wallet request. This could be due to:
      </p>
      <ul>
        <li>Network connectivity issues</li>
        <li>Invalid wallet data</li>
        <li>Encryption/decryption problems</li>
      </ul>
      <p>
        Your wallet data is safe. Please try the operation again or refresh the page.
      </p>
    </div>
  </div>
);

const handleWalletError = (error: Error, errorInfo: string) => {
  if (import.meta.env.DEV) {
    console.error('Wallet Error:', error);
    console.error('Error Info:', errorInfo);
  }
};

export default function WalletErrorBoundary({ children }: WalletErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={WalletErrorFallback}
      onError={handleWalletError}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}
