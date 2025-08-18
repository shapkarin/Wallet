import { Link } from 'react-router';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="home-page">
        <div className="hero-section">
          <h1>Welcome to TrustWallet</h1>
          <p>Your secure, decentralized crypto wallet</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>🔐 Secure</h3>
              <p>Your private keys are encrypted and stored locally</p>
            </div>
            <div className="feature-card">
              <h3>🌐 Multi-Chain</h3>
              <p>Support for Ethereum and BNB Smart Chain</p>
            </div>
            <div className="feature-card">
              <h3>💰 Balance Tracking</h3>
              <p>View your testnet balances in real-time</p>
            </div>
            <div className="feature-card">
              <h3>🔑 Key Management</h3>
              <p>Safely reveal private keys when needed</p>
            </div>
          </div>
          
          <div className="cta-section">
            <Link to="/create-wallet" className="btn btn-primary btn-cta">
              Create Your First Wallet
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
