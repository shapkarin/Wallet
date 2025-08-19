import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectWallets, selectSeedPhrases, selectUnbackedUpSeedPhrases, selectWalletsBySeedPhrase, selectIsUnlocked } from '../store/selectors';
import { loadWalletsFromStorage } from '../store/walletSlice';
import { storageService } from '../services/storage';
import MainLayout from '../components/MainLayout';
import WalletList from '../components/WalletList';
import BalanceDashboard from '../components/BalanceDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  const unbackedUpSeeds = useAppSelector(selectUnbackedUpSeedPhrases);
  const walletsBySeed = useAppSelector(selectWalletsBySeedPhrase);
  const isUnlocked = useAppSelector(selectIsUnlocked);

  useEffect(() => {
    const loadWalletsIfNeeded = async () => {
      if (isUnlocked && wallets.length === 0 && seedPhrases.length === 0) {
        try {
          const { passwordManager } = await import('../services/passwordManager');
          const password = await passwordManager.requestPassword({
            title: 'Load Wallets',
            message: 'Enter your password to load your wallets'
          });
          
          const loadedWallets = await storageService.loadWallets(password);
          const loadedSeedPhrases = await storageService.loadSeedPhrases(password);
          
          dispatch(loadWalletsFromStorage({ wallets: loadedWallets, seedPhrases: loadedSeedPhrases }));
        } catch (error) {
          console.warn('Failed to load wallets in dashboard:', error);
        }
      }
    };

    loadWalletsIfNeeded();
  }, [isUnlocked, wallets.length, seedPhrases.length, dispatch]);

  const handleCreateWallet = () => {
    navigate('/create-wallet');
  };

  const handleImportWallet = () => {
    navigate('/import-wallet');
  };

  const handleDeriveWallet = () => {
    navigate('/derive-wallet');
  };

  const handleBackupSeed = (_seedHash: string) => {
    navigate('/create-wallet/backup-prompt');
  };

  const handleManualLoadWallets = async () => {
    try {
      const { passwordManager } = await import('../services/passwordManager');
      const password = await passwordManager.requestPassword({
        title: 'Load Wallets',
        message: 'Enter your password to load your wallets'
      });
      
      const loadedWallets = await storageService.loadWallets(password);
      const loadedSeedPhrases = await storageService.loadSeedPhrases(password);
      
      dispatch(loadWalletsFromStorage({ wallets: loadedWallets, seedPhrases: loadedSeedPhrases }));
    } catch (error) {
      console.warn('Failed to manually load wallets:', error);
    }
  };

  const backedUpSeeds = seedPhrases.filter(sp => sp.isBackedUp).length;

  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Wallet Dashboard</h1>
          <p>Manage your crypto wallets and view balances</p>
          {/* Temporary debug button */}
          <button onClick={handleManualLoadWallets} style={{ background: 'red', color: 'white', padding: '10px', margin: '10px' }}>
            DEBUG: Manually Load Wallets ({wallets.length} wallets, {seedPhrases.length} seeds)
          </button>
        </div>

        {unbackedUpSeeds.length > 0 && (
          <div className="backup-reminder">
            <div className="backup-reminder-content">
              <div className="backup-icon">⚠️</div>
              <div className="backup-message">
                <h3>Backup Required</h3>
                <p>
                  You have {unbackedUpSeeds.length} seed phrase{unbackedUpSeeds.length > 1 ? 's' : ''} that {unbackedUpSeeds.length > 1 ? 'are' : 'is'} not backed up.
                  Back up your seed phrase{unbackedUpSeeds.length > 1 ? 's' : ''} now to secure your wallets.
                </p>
              </div>
              <div className="backup-actions">
                {unbackedUpSeeds.map(seed => (
                  <button
                    key={seed.hash}
                    onClick={() => handleBackupSeed(seed.hash)}
                    className="btn btn-warning btn-small"
                  >
                    Backup Now
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-overview">
          <div className="overview-stats">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">$0.00</div>
                <div className="stat-label">Total Balance</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👛</div>
              <div className="stat-content">
                <div className="stat-value">{wallets.length}</div>
                <div className="stat-label">Wallets</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌱</div>
              <div className="stat-content">
                <div className="stat-value">{seedPhrases.length}</div>
                <div className="stat-label">Seed Phrases</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{backedUpSeeds}/{seedPhrases.length}</div>
                <div className="stat-label">Backed Up</div>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            <div className="action-card" onClick={handleCreateWallet}>
              <div className="action-icon">➕</div>
              <div className="action-content">
                <h3>Create New Wallet</h3>
                <p>Generate a new wallet with a fresh seed phrase</p>
              </div>
            </div>
            <div className="action-card" onClick={handleImportWallet}>
              <div className="action-icon">📥</div>
              <div className="action-content">
                <h3>Import Wallet</h3>
                <p>Restore an existing wallet using your seed phrase</p>
              </div>
            </div>
            <div className="action-card" onClick={handleDeriveWallet}>
              <div className="action-icon">🔗</div>
              <div className="action-content">
                <h3>Derive New Wallet</h3>
                <p>Create additional wallets from existing seed phrases</p>
              </div>
            </div>
          </div>
        </div>

        {seedPhrases.length > 0 && (
          <div className="seed-phrase-management">
            <h2>Seed Phrase Management</h2>
            <div className="seed-phrase-list">
              {walletsBySeed.map(({ seedPhrase, wallets: seedWallets }) => (
                <div key={seedPhrase.hash} className="seed-phrase-item">
                  <div className="seed-phrase-info">
                    <div className="seed-phrase-header">
                      <h3>Seed Phrase #{seedPhrases.indexOf(seedPhrase) + 1}</h3>
                      <div className="seed-phrase-status">
                        {seedPhrase.isBackedUp ? (
                          <span className="status-badge backed-up">✅ Backed Up</span>
                        ) : (
                          <span className="status-badge not-backed-up">⚠️ Not Backed Up</span>
                        )}
                      </div>
                    </div>
                    <div className="seed-phrase-meta">
                      <span className="wallet-count">{seedWallets.length} wallet{seedWallets.length !== 1 ? 's' : ''}</span>
                      <span className="created-date">
                        Created: {new Date(seedPhrase.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="seed-phrase-actions">
                    {!seedPhrase.isBackedUp && (
                      <button
                        onClick={() => handleBackupSeed(seedPhrase.hash)}
                        className="btn btn-warning btn-small"
                      >
                        Backup Now
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/derive-wallet?seed=${seedPhrase.hash}`)}
                      className="btn btn-secondary btn-small"
                    >
                      Derive New Wallet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <BalanceDashboard />
        <WalletList />

        {wallets.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-content">
              <div className="empty-state-icon">👛</div>
              <h2>No Wallets Yet</h2>
              <p>Get started by creating your first wallet or importing an existing one.</p>
              <div className="empty-state-actions">
                <button onClick={handleCreateWallet} className="btn btn-primary">
                  Create First Wallet
                </button>
                <button onClick={handleImportWallet} className="btn btn-secondary">
                  Import Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
