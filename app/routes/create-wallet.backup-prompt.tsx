import { useNavigate } from 'react-router';
import { useState } from 'react';
import Layout from '../components/Layout';

export default function BackupPrompt() {
  const [understood, setUnderstood] = useState(false);
  const navigate = useNavigate();

  const handleBackupNow = () => {
    if (!understood) {
      alert('Please confirm that you understand the importance of backing up your seed phrase.');
      return;
    }
    navigate('/create-wallet/backup');
  };

  const handleSkipForNow = () => {
    const confirmed = confirm(
      'Are you sure you want to skip backing up your seed phrase? ' +
      'Without a backup, you may lose access to your wallet if something happens to this device.'
    );
    
    if (confirmed) {
      const doubleConfirm = confirm(
        'This is your last warning: If you lose access to this device without backing up your seed phrase, ' +
        'your wallet will be permanently lost. Are you absolutely sure you want to skip?'
      );
      
      if (doubleConfirm) {
        navigate('/dashboard');
      }
    }
  };

  return (
    <Layout>
      <div className="backup-prompt-page">
        <div className="backup-prompt-container">
          <div className="backup-prompt-header">
            <div className="backup-icon">📝</div>
            <h1>Backup Your Seed Phrase</h1>
            <p>Protect your wallet by creating a backup</p>
          </div>

          <div className="backup-explanation">
            <div className="explanation-card">
              <h3>What is a Seed Phrase?</h3>
              <p>
                A seed phrase is a series of 12 words that acts as the master key to your wallet. 
                It can restore all your wallets and funds if you lose access to this device.
              </p>
              <a 
                href="https://web.archive.org/web/20250129000801/https://trustwallet.com/blog/crypto-basics/what-is-a-seed-phrase-and-why-is-it-important" 
                target="_blank" 
                rel="noopener noreferrer"
                className="learn-more-link"
              >
                Learn more about seed phrases →
              </a>
            </div>

            <div className="backup-importance">
              <h3>Why Backup Your Seed Phrase?</h3>
              <div className="importance-grid">
                <div className="importance-item">
                  <div className="importance-icon">🔒</div>
                  <h4>Security</h4>
                  <p>Your seed phrase is encrypted and stored only on your device</p>
                </div>
                <div className="importance-item">
                  <div className="importance-icon">💾</div>
                  <h4>Recovery</h4>
                  <p>Restore your wallet on any device if you lose access</p>
                </div>
                <div className="importance-item">
                  <div className="importance-icon">⚡</div>
                  <h4>Portability</h4>
                  <p>Move your wallet between different applications</p>
                </div>
                <div className="importance-item">
                  <div className="importance-icon">🛡️</div>
                  <h4>Protection</h4>
                  <p>Safeguard against device failure or loss</p>
                </div>
              </div>
            </div>
          </div>

          <div className="backup-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Critical Security Warnings</h4>
              <ul>
                <li>Never share your seed phrase with anyone</li>
                <li>Store it offline in a secure location</li>
                <li>Write it down on paper and keep multiple copies</li>
                <li>Don't store it digitally (photos, cloud storage, etc.)</li>
                <li>TrustWallet cannot recover your seed phrase if lost</li>
              </ul>
            </div>
          </div>

          <div className="understanding-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <span className="checkmark"></span>
              I understand the importance of backing up my seed phrase and the risks of not doing so
            </label>
          </div>

          <div className="backup-actions">
            <button
              onClick={handleBackupNow}
              className="btn btn-primary btn-large"
              disabled={!understood}
            >
              Backup Now (Recommended)
            </button>
            <button
              onClick={handleSkipForNow}
              className="btn btn-secondary btn-outline"
            >
              Skip for Now
            </button>
          </div>

          <div className="backup-reminder">
            <div className="reminder-icon">💡</div>
            <div className="reminder-content">
              <h4>Reminder</h4>
              <p>
                You can always backup your seed phrase later from the wallet settings. 
                However, we strongly recommend doing it now while you're setting up your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
