import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectWallets, selectSeedPhrases } from '../store/selectors';
import { storageService } from '../services/storage';

interface MnemonicRevealProps {
  walletId: string;
}

export default function MnemonicReveal({ walletId }: MnemonicRevealProps) {
  const [password, setPassword] = useState('');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  
  const wallet = wallets.find(w => w.id === walletId);
  const seedPhrase = seedPhrases.find(sp => sp.walletIDHash === wallet?.walletIDHash);

  const handleRevealMnemonic = async () => {
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
      setMnemonic(decryptedMnemonic);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reveal mnemonic';
      setError(errorMessage);
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyMnemonic = async () => {
    if (mnemonic) {
      try {
        await navigator.clipboard.writeText(mnemonic);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy mnemonic:', error);
      }
    }
  };

  const handleClear = () => {
    setMnemonic(null);
    setPassword('');
    setError(null);
    setCopied(false);
  };

  if (!wallet) {
    return (
      <div className="mnemonic-reveal">
        <div className="error-state">
          <h3>Wallet Not Found</h3>
          <p>The requested wallet could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mnemonic-reveal">
      <div className="mnemonic-reveal__header">
        <h2>Reveal Seed Phrase</h2>
        <div className="wallet-info">
          <h3>{wallet.name}</h3>
          <p className="wallet-address">{wallet.address}</p>
          <p className="walletID-hash">ID: {wallet.walletIDHash.slice(0, 8)}...{wallet.walletIDHash.slice(-8)}</p>
        </div>
      </div>

      <div className="security-warning">
        <h3>⚠️ Security Warning</h3>
        <ul>
          <li>Never share your seed phrase with anyone</li>
          <li>Anyone with your seed phrase can access ALL wallets derived from it</li>
          <li>Write it down on paper and store it securely</li>
          <li>Never store it digitally or take screenshots</li>
          <li>This seed phrase can recover all wallets created from it</li>
        </ul>
      </div>

      {!mnemonic ? (
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
              onKeyDown={(e) => e.key === 'Enter' && handleRevealMnemonic()}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleRevealMnemonic}
            disabled={isRevealing || !password.trim()}
            className="btn btn-primary"
          >
            {isRevealing ? 'Verifying...' : 'Reveal Seed Phrase'}
          </button>
        </div>
      ) : (
        <div className="mnemonic-display">
          <div className="mnemonic-grid">
            {mnemonic.split(' ').map((word, index) => (
              <div key={index} className="mnemonic-word">
                <span className="word-number">{index + 1}</span>
                <span className="word-text">{word}</span>
              </div>
            ))}
          </div>

          <div className="mnemonic-actions">
            <button
              type="button"
              onClick={handleCopyMnemonic}
              className="btn btn-secondary"
            >
              {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
            </button>
          </div>

          <div className="mnemonic-info">
            <h4>Backup Instructions:</h4>
            <ol>
              <li>Write down these 12 words in the exact order shown</li>
              <li>Store the written backup in a secure location</li>
              <li>Consider making multiple copies and storing them separately</li>
              <li>Never share this seed phrase with anyone</li>
              <li>Use this seed phrase to recover your wallets if needed</li>
            </ol>
          </div>

          <div className="mnemonic-controls">
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
