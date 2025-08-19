import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSessionTimeout, logout } from '../store/authSlice';
import { setSelectedChain } from '../store/walletSlice';
import { selectSessionInfo, selectIsAuthenticated } from '../store/selectors';
import { selectSelectedChainId, selectWallets, selectSeedPhrases } from '../store/selectors';
import { SUPPORTED_NETWORKS } from '../services/wallet';
import { storageService } from '../services/storage';
import Layout from '../components/Layout';

export default function Settings() {
  const [autoLockTime, setAutoLockTime] = useState(30);
  const [selectedNetwork, setSelectedNetwork] = useState(1);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const sessionInfo = useAppSelector(selectSessionInfo);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const selectedChainId = useAppSelector(selectSelectedChainId);
  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/unlock');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (sessionInfo.sessionTimeout) {
      setAutoLockTime(sessionInfo.sessionTimeout / (60 * 1000));
    }
    setSelectedNetwork(selectedChainId);
  }, [sessionInfo.sessionTimeout, selectedChainId]);

  const handleAutoLockTimeChange = (minutes: number) => {
    setAutoLockTime(minutes);
    dispatch(setSessionTimeout(minutes * 60 * 1000));
  };

  const handleNetworkChange = (chainId: number) => {
    setSelectedNetwork(chainId);
    dispatch(setSelectedChain(chainId));
  };

  const handleExportAllData = async () => {
    const confirmed = confirm(
      'This will export all your encrypted wallet data. ' +
      'Keep this backup file secure and never share it with anyone. Continue?'
    );

    if (!confirmed) return;

    setIsExporting(true);
    try {
      const password = 'temp_password';
      const exportedData = await storageService.exportData(password);
      
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustwallet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = () => {
    const confirmed = confirm(
      'WARNING: This will permanently delete ALL your wallets and data from this device. ' +
      'Make sure you have backed up your seed phrases before proceeding. ' +
      'This action cannot be undone. Are you absolutely sure?'
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      'FINAL WARNING: You are about to delete all your wallets. ' +
      'Without your seed phrase backups, you will lose access to your funds forever. ' +
      'Type "DELETE" in the next prompt to confirm.'
    );

    if (!doubleConfirm) return;

    const confirmation = prompt('Type "DELETE" to confirm permanent deletion:');
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    setIsClearing(true);
    try {
      storageService.clearAllData();
      dispatch(logout());
      navigate('/onboarding');
    } catch (error) {
      alert('Failed to clear data: ' + (error as Error).message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/unlock');
  };

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === selectedNetwork);

  return (
    <Layout>
      <div className="settings-page">
        <div className="settings-container">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your wallet preferences and security settings</p>
          </div>

          <div className="settings-sections">
            <section className="settings-section">
              <h2>Security</h2>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Auto-lock Timer</h3>
                  <p>Automatically lock the wallet after period of inactivity</p>
                </div>
                <div className="setting-control">
                  <select
                    value={autoLockTime}
                    onChange={(e) => handleAutoLockTimeChange(Number(e.target.value))}
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={0}>Never (not recommended)</option>
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Session Status</h3>
                  <p>Current session information</p>
                </div>
                <div className="setting-control">
                  <div className="session-info">
                    <span className={`session-status ${sessionInfo.isActive ? 'active' : 'inactive'}`}>
                      {sessionInfo.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {sessionInfo.sessionStartTime && (
                      <span className="session-time">
                        Started: {new Date(sessionInfo.sessionStartTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h2>Network</h2>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Default Network</h3>
                  <p>Choose the default network for new wallets and transactions</p>
                </div>
                <div className="setting-control">
                  <select
                    value={selectedNetwork}
                    onChange={(e) => handleNetworkChange(Number(e.target.value))}
                  >
                    {SUPPORTED_NETWORKS.map(network => (
                      <option key={network.chainId} value={network.chainId}>
                        {network.name} {network.isTestnet ? '(Testnet)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentNetwork && (
                <div className="network-details">
                  <h4>Current Network Details</h4>
                  <div className="network-info">
                    <div className="network-item">
                      <span className="label">Name:</span>
                      <span className="value">{currentNetwork.name}</span>
                    </div>
                    <div className="network-item">
                      <span className="label">Chain ID:</span>
                      <span className="value">{currentNetwork.chainId}</span>
                    </div>
                    <div className="network-item">
                      <span className="label">Currency:</span>
                      <span className="value">{currentNetwork.nativeCurrency.symbol}</span>
                    </div>
                    <div className="network-item">
                      <span className="label">RPC URL:</span>
                      <span className="value rpc-url">{currentNetwork.rpcUrl}</span>
                    </div>
                    <div className="network-item">
                      <span className="label">Explorer:</span>
                      <a 
                        href={currentNetwork.blockExplorerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="value link"
                      >
                        {currentNetwork.blockExplorerUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="settings-section">
              <h2>Wallet Management</h2>
              
              <div className="wallet-stats">
                <div className="stat-item">
                  <div className="stat-number">{seedPhrases.length}</div>
                  <div className="stat-label">Seed Phrases</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{wallets.length}</div>
                  <div className="stat-label">Wallets</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {seedPhrases.filter(sp => sp.isBackedUp).length}
                  </div>
                  <div className="stat-label">Backed Up</div>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Export All Data</h3>
                  <p>Download an encrypted backup of all your wallet data</p>
                </div>
                <div className="setting-control">
                  <button
                    onClick={handleExportAllData}
                    disabled={isExporting}
                    className="btn btn-secondary"
                  >
                    {isExporting ? 'Exporting...' : 'Export Backup'}
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h2>Session</h2>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Lock Wallet</h3>
                  <p>Lock the wallet and return to the unlock screen</p>
                </div>
                <div className="setting-control">
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                  >
                    Lock Wallet
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-section danger-zone">
              <div className="danger-zone-header" onClick={() => setShowDangerZone(!showDangerZone)}>
                <h2>⚠️ Danger Zone</h2>
                <span className={`toggle-icon ${showDangerZone ? 'expanded' : ''}`}>▼</span>
              </div>
              
              {showDangerZone && (
                <div className="danger-zone-content">
                  <div className="danger-warning">
                    <h4>⚠️ Destructive Actions</h4>
                    <p>
                      These actions are permanent and cannot be undone. 
                      Make sure you have backed up your seed phrases before proceeding.
                    </p>
                  </div>

                  <div className="setting-item danger-item">
                    <div className="setting-info">
                      <h3>Clear All Data</h3>
                      <p>Permanently delete all wallets and data from this device</p>
                    </div>
                    <div className="setting-control">
                      <button
                        onClick={handleClearAllData}
                        disabled={isClearing}
                        className="btn btn-danger"
                      >
                        {isClearing ? 'Clearing...' : 'Clear All Data'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
