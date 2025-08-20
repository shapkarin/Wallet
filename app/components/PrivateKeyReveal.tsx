import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectWallets, selectSeedPhrases } from '../store/selectors';
import { storageService } from '../services/storage';
import { deriveWalletFromMnemonic } from '../services/wallet';

interface PrivateKeyRevealProps {
  walletId: string;
}

export default function PrivateKeyReveal({ walletId }: PrivateKeyRevealProps) {
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  
  const wallet = wallets.find(w => w.id === walletId);
  const seedPhrase = seedPhrases.find(sp => sp.walletIDHash === wallet?.walletIDHash);

  const handleRevealPrivateKey = async () => {
    if (!wallet || !seedPhrase) {
      setError('Wallet or seed phrase not found');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsRevealing(true);
    setError(null);

    try {
      const isValidPassword = await storageService.verifyPassword(password);
      if (!isValidPassword) {
        setError('Invalid password');
        return;
      }

      const decryptedMnemonic = await storageService.decryptSeedPhrase(seedPhrase, password);
      const derivedWallet = await deriveWalletFromMnemonic(decryptedMnemonic, wallet.derivationPath);
      
      setPrivateKey(derivedWallet.privateKey);
      setIsVisible(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reveal private key';
      setError(errorMessage);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyPrivateKey = async () => {
    if (privateKey) {
      try {
        await navigator.clipboard.writeText(privateKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy private key:', error);
      }
    }
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleClear = () => {
    setPrivateKey(null);
    setPassword('');
    setError(null);
    setIsVisible(false);
    setCopied(false);
  };

  if (!wallet) {
    return (
      <div className="private-key-reveal">
        <div className="error-state">
          <h3>Wallet Not Found</h3>
          <p>The requested wallet could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="private-key-reveal">
      <div className="private-key-reveal__header">
        <h2>Reveal Private Key</h2>
        <div className="wallet-info">
          <h3>{wallet.name}</h3>
          <p className="wallet-address">{wallet.address}</p>
          <p className="derivation-path">Path: {wallet.derivationPath}</p>
        </div>
      </div>

      <div className="security-warning">
        <h3>⚠️ Security Warning</h3>
        <ul>
          <li>Never share your private key with anyone</li>
          <li>Anyone with access to your private key can control your funds</li>
          <li>Make sure you're in a secure environment</li>
          <li>Consider using a hardware wallet for large amounts</li>
        </ul>
      </div>

      {!privateKey ? (
        <div className="password-form">
          <div className="form-group">
            <label htmlFor="password">Enter Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your wallet password"
              disabled={isRevealing}
              className="form-input"
              onKeyDown={(e) => e.key === 'Enter' && handleRevealPrivateKey()}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleRevealPrivateKey}
            disabled={isRevealing || !password.trim()}
            className="btn btn-primary"
          >
            {isRevealing ? 'Verifying...' : 'Reveal Private Key'}
          </button>
        </div>
      ) : (
        <div className="private-key-display">
          <div className="form-group">
            <label>Private Key</label>
            <div className="private-key-container">
              <input
                type={isVisible ? 'text' : 'password'}
                value={privateKey}
                readOnly
                className="private-key-input"
              />
              <div className="private-key-actions">
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  className="btn btn-secondary btn-sm"
                  title={isVisible ? 'Hide' : 'Show'}
                >
                  {isVisible ? '👁️‍🗨️' : '👁️'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrivateKey}
                  className="btn btn-secondary btn-sm"
                  title="Copy to clipboard"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            </div>
          </div>

          <div className="private-key-info">
            <h4>Important Notes:</h4>
            <ul>
              <li>This private key controls the wallet at address: {wallet.address}</li>
              <li>You can import this private key into other wallets</li>
              <li>Keep this private key secure and never share it</li>
            </ul>
          </div>

          <div className="private-key-controls">
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary"
            >
              Clear and Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
