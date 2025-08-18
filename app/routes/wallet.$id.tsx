import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppSelector } from '../store/hooks';
import { selectWallets, selectSeedPhrases, selectSelectedChainId } from '../store/selectors';
import { SUPPORTED_NETWORKS } from '../services/wallet';
import WalletBalance from '../components/WalletBalance';
import Layout from '../components/Layout';
import type { Route } from "./+types/wallet.$id";
import type { WalletData } from '../store/types';

export default function WalletDetails({ params }: Route.ComponentProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const navigate = useNavigate();
  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  const selectedChainId = useAppSelector(selectSelectedChainId);

  useEffect(() => {
    const foundWallet = wallets.find(w => w.id === params.id);
    if (foundWallet) {
      setWallet(foundWallet);
      const foundSeed = seedPhrases.find(sp => sp.hash === foundWallet.seedPhraseHash);
      setSeedPhrase(foundSeed);
    } else {
      navigate('/dashboard');
    }
  }, [params.id, wallets, seedPhrases, navigate]);

  const handleCopyAddress = async () => {
    if (wallet) {
      try {
        await navigator.clipboard.writeText(wallet.address);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleViewPrivateKey = () => {
    navigate(`/wallet/${wallet?.id}/private-key`);
  };

  const handleViewMnemonic = () => {
    navigate(`/wallet/${wallet?.id}/mnemonic`);
  };

  const handleDeriveWallet = () => {
    navigate(`/derive-wallet?seed=${wallet?.seedPhraseHash}`);
  };

  const generateQRCode = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`;
  };

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === (wallet?.chainId || selectedChainId));

  if (!wallet) {
    return (
      <Layout>
        <div className="wallet-details-page">
          <div className="loading">Loading wallet details...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="wallet-details-page">
        <div className="wallet-details-container">
          <div className="wallet-header">
            <div className="wallet-info">
              <h1>{wallet.name}</h1>
              <p className="wallet-type">
                {currentNetwork?.name} Wallet
                {currentNetwork?.isTestnet && <span className="testnet-badge">Testnet</span>}
              </p>
            </div>
            <div className="wallet-actions">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary btn-small"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          <div className="wallet-content">
            <div className="wallet-main">
              <div className="balance-section">
                <h2>Balance</h2>
                <WalletBalance 
                  address={wallet.address} 
                  chainId={wallet.chainId}
                  showRefresh={true}
                />
              </div>

              <div className="address-section">
                <h2>Wallet Address</h2>
                <div className="address-display">
                  <div className="address-text">
                    <span className="address-value">{wallet.address}</span>
                    <button
                      onClick={handleCopyAddress}
                      className="btn btn-icon"
                      title="Copy Address"
                    >
                      📋
                    </button>
                  </div>
                  <div className="address-actions">
                    <button
                      onClick={() => setShowQRCode(!showQRCode)}
                      className="btn btn-secondary btn-small"
                    >
                      {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                    </button>
                    <a
                      href={`${currentNetwork?.blockExplorerUrl}/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-small"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
                {showQRCode && (
                  <div className="qr-code-section">
                    <div className="qr-code">
                      <img 
                        src={generateQRCode(wallet.address)} 
                        alt="Wallet Address QR Code"
                      />
                    </div>
                    <p className="qr-code-label">Scan to copy wallet address</p>
                  </div>
                )}
              </div>

              <div className="transaction-section">
                <h2>Recent Transactions</h2>
                <div className="transactions-placeholder">
                  <div className="placeholder-icon">📄</div>
                  <h3>Transaction History Coming Soon</h3>
                  <p>
                    Transaction history will be available in a future update. 
                    For now, you can view transactions on the block explorer.
                  </p>
                  <a
                    href={`${currentNetwork?.blockExplorerUrl}/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    View on {currentNetwork?.name} Explorer
                  </a>
                </div>
              </div>
            </div>

            <div className="wallet-sidebar">
              <div className="wallet-info-card">
                <h3>Wallet Information</h3>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">
                    {new Date(wallet.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Derivation Path:</span>
                  <span className="info-value">{wallet.derivationPath}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Network:</span>
                  <span className="info-value">{currentNetwork?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Chain ID:</span>
                  <span className="info-value">{wallet.chainId}</span>
                </div>
                {seedPhrase && (
                  <div className="info-item">
                    <span className="info-label">Backup Status:</span>
                    <span className={`info-value ${seedPhrase.isBackedUp ? 'backed-up' : 'not-backed-up'}`}>
                      {seedPhrase.isBackedUp ? '✅ Backed Up' : '⚠️ Not Backed Up'}
                    </span>
                  </div>
                )}
              </div>

              <div className="wallet-actions-card">
                <h3>Wallet Actions</h3>
                <div className="action-buttons">
                  <button
                    onClick={handleViewPrivateKey}
                    className="btn btn-secondary btn-full"
                  >
                    🔑 View Private Key
                  </button>
                  <button
                    onClick={handleViewMnemonic}
                    className="btn btn-secondary btn-full"
                  >
                    📝 View Seed Phrase
                  </button>
                  <button
                    onClick={handleDeriveWallet}
                    className="btn btn-secondary btn-full"
                  >
                    🔗 Derive New Wallet
                  </button>
                </div>
              </div>

              <div className="security-card">
                <h3>Security Tips</h3>
                <ul>
                  <li>Never share your private key or seed phrase</li>
                  <li>Always verify the recipient address before sending</li>
                  <li>Use testnet for testing transactions</li>
                  <li>Keep your seed phrase backed up offline</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
