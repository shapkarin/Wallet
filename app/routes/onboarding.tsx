import { Link, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsSetupComplete, selectHasWallets } from '../store/selectors';
import Layout from '../components/Layout';

export default function Onboarding() {
  const navigate = useNavigate();
  const isSetupComplete = useAppSelector(selectIsSetupComplete);
  const hasWallets = useAppSelector(selectHasWallets);

  useEffect(() => {
    if (isSetupComplete && hasWallets) {
      navigate('/dashboard');
    } else if (isSetupComplete) {
      navigate('/create-wallet');
    }
  }, [isSetupComplete, hasWallets, navigate]);

  return (
    <Layout>
      <div className="onboarding-page">
        <div className="onboarding-container">
          <div className="onboarding-header">
            <h1>Welcome to TrustWallet</h1>
            <p className="subtitle">Your secure, non-custodial crypto wallet</p>
          </div>

          <div className="features-section">
            <div className="feature-item">
              <div className="feature-icon">🔐</div>
              <h3>Secure & Private</h3>
              <p>Your private keys are encrypted with strong encryption and stored locally. No one else has access.</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🌐</div>
              <h3>Multi-Chain Support</h3>
              <p>Compatible with Ethereum and BNB Smart Chain networks.</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🔑</div>
              <h3>HD Wallet Support</h3>
              <p>Generate multiple wallets from a single seed phrase using BIP-44 derivation.</p>
            </div>
          </div>

          <div className="security-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Important Security Notice</h4>
              <ul>
                <li>Your seed phrase is the master key to all your wallets</li>
                <li>Never share your seed phrase with anyone</li>
                <li>Write down your seed phrase and store it safely offline</li>
                <li>TrustWallet cannot recover your wallets if you lose your seed phrase</li>
              </ul>
            </div>
          </div>

          <div className="onboarding-actions">
            <Link to="/setup" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/import-wallet" className="btn btn-secondary">
              Import Existing Wallet
            </Link>
          </div>

          <div className="onboarding-footer">
            <p>By continuing, you agree to take full responsibility for the security of your wallets.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
