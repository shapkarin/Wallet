import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectSeedPhrases, selectWallets } from '../store/selectors';
import { storageService } from '../services/storage';

interface SeedPhraseSelectorProps {
  selectedSeedHash: string;
  onSeedSelect: (seedHash: string) => void;
  onRevealSeedPhrase: (seedHash: string) => void;
  disabled?: boolean;
}

export default function SeedPhraseSelector({ 
  selectedSeedHash, 
  onSeedSelect, 
  onRevealSeedPhrase,
  disabled = false 
}: SeedPhraseSelectorProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [showRevealForm, setShowRevealForm] = useState(false);

  const seedPhrases = useAppSelector(selectSeedPhrases);
  const wallets = useAppSelector(selectWallets);

  const handleRevealSeedPhrase = async (seedHash: string) => {
    if (!revealPassword.trim()) {
      setRevealError('Password is required');
      return;
    }

    setIsRevealing(true);
    setRevealError('');

    try {
      const seedPhrase = seedPhrases.find(sp => sp.hash === seedHash);
      if (!seedPhrase) {
        throw new Error('Seed phrase not found');
      }

      await storageService.decryptSeedPhrase(seedPhrase, revealPassword);
      onRevealSeedPhrase(seedHash);
      setShowRevealForm(false);
      setRevealPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify password';
      setRevealError(errorMessage);
    } finally {
      setIsRevealing(false);
    }
  };

  const getWalletCountForSeed = (seedHash: string) => {
    return wallets.filter(w => w.seedPhraseHash === seedHash).length;
  };

  if (seedPhrases.length === 0) {
    return (
      <div className="seed-selector-empty">
        <p>No seed phrases available. Create or import a wallet first.</p>
      </div>
    );
  }

  return (
    <div className="seed-phrase-selector">
      <div className="form-group">
        <label htmlFor="seedPhrase">Select Seed Phrase</label>
        <select
          id="seedPhrase"
          value={selectedSeedHash}
          onChange={(e) => onSeedSelect(e.target.value)}
          disabled={disabled}
          required
        >
          <option value="">Choose a seed phrase...</option>
          {seedPhrases.map((seed, index) => (
            <option key={seed.hash} value={seed.hash}>
              Seed Phrase #{index + 1} ({getWalletCountForSeed(seed.hash)} wallets)
              {!seed.isBackedUp && ' - ⚠️ Not Backed Up'}
            </option>
          ))}
        </select>
      </div>

      {selectedSeedHash && (
        <div className="seed-info">
          <div className="seed-actions">
            <button
              type="button"
              onClick={() => setShowRevealForm(!showRevealForm)}
              className="btn btn-secondary btn-small"
              disabled={disabled}
            >
              {showRevealForm ? 'Cancel' : 'Reveal Seed Phrase'}
            </button>
          </div>

          {showRevealForm && (
            <div className="reveal-form">
              <div className="security-warning">
                <p>⚠️ Never share your seed phrase with anyone. Anyone with access to your seed phrase can control your wallets.</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="revealPassword">Enter Password to Reveal</label>
                <input
                  id="revealPassword"
                  type="password"
                  value={revealPassword}
                  onChange={(e) => setRevealPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isRevealing}
                />
                {revealError && (
                  <div className="error-message">{revealError}</div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => handleRevealSeedPhrase(selectedSeedHash)}
                  className="btn btn-danger btn-small"
                  disabled={isRevealing || !revealPassword.trim()}
                >
                  {isRevealing ? 'Verifying...' : 'Reveal Seed Phrase'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRevealForm(false);
                    setRevealPassword('');
                    setRevealError('');
                  }}
                  className="btn btn-secondary btn-small"
                  disabled={isRevealing}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="seed-stats">
            <h4>Seed Phrase Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Wallets:</span>
                <span className="stat-value">{getWalletCountForSeed(selectedSeedHash)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Backup Status:</span>
                <span className={`stat-value ${seedPhrases.find(sp => sp.hash === selectedSeedHash)?.isBackedUp ? 'backed-up' : 'not-backed-up'}`}>
                  {seedPhrases.find(sp => sp.hash === selectedSeedHash)?.isBackedUp ? '✅ Backed Up' : '⚠️ Not Backed Up'}
                </span>
              </div>
            </div>
          </div>

          <div className="security-reminder">
            <h5>Security Reminder</h5>
            <ul>
              <li>Each seed phrase can generate unlimited wallets with different derivation paths</li>
              <li>All wallets derived from the same seed phrase share the same recovery phrase</li>
              <li>If you lose your seed phrase, you lose access to ALL wallets derived from it</li>
              <li>Always keep your seed phrase backed up in a secure location</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
