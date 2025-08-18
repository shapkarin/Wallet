import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectWallets } from '../store/selectors';
import { SUPPORTED_NETWORKS } from '../services/wallet';
import WalletBalance from './WalletBalance';

export default function BalanceDashboard() {
  const [selectedNetwork, setSelectedNetwork] = useState(11155111); // Ethereum Sepolia testnet
  const [showTestnetsOnly, setShowTestnetsOnly] = useState(true);
  
  const wallets = useAppSelector(selectWallets);

  const availableNetworks = SUPPORTED_NETWORKS.filter(network => 
    showTestnetsOnly ? network.isTestnet : true
  );

  const currentNetwork = availableNetworks.find(n => n.chainId === selectedNetwork);

  const handleNetworkChange = (networkId: number) => {
    setSelectedNetwork(networkId);
  };

  const toggleTestnetsOnly = () => {
    setShowTestnetsOnly(!showTestnetsOnly);
    if (!showTestnetsOnly && currentNetwork && !currentNetwork.isTestnet) {
      const firstTestnet = SUPPORTED_NETWORKS.find(n => n.isTestnet);
      if (firstTestnet) {
        setSelectedNetwork(firstTestnet.chainId);
      }
    }
  };

  if (wallets.length === 0) {
    return (
      <div className="balance-dashboard balance-dashboard--empty">
        <div className="empty-state">
          <h3>No Wallets to Display</h3>
          <p>Create a wallet to see balance information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-dashboard">
      <div className="balance-dashboard__header">
        <h2>Wallet Balances</h2>
        
        <div className="balance-dashboard__controls">
          <div className="network-selector-group">
            <label htmlFor="network-select">Network:</label>
            <select
              id="network-select"
              value={selectedNetwork}
              onChange={(e) => handleNetworkChange(Number(e.target.value))}
              className="network-selector"
            >
              {availableNetworks.map(network => (
                <option key={network.chainId} value={network.chainId}>
                  {network.name} {network.isTestnet ? '(Testnet)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showTestnetsOnly}
                onChange={toggleTestnetsOnly}
              />
              Show testnets only
            </label>
          </div>
        </div>
      </div>

      {currentNetwork && (
        <div className="network-info">
          <div className="network-details">
            <h3>{currentNetwork.name}</h3>
            <p>Currency: {currentNetwork.nativeCurrency.name} ({currentNetwork.nativeCurrency.symbol})</p>
            {currentNetwork.isTestnet && (
              <div className="testnet-notice">
                <p>⚠️ This is a testnet. Tokens have no real value.</p>
                <p>Use this network for testing and development purposes only.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="balance-dashboard__wallets">
        {wallets.map(wallet => (
          <div key={wallet.id} className="wallet-balance-card">
            <div className="wallet-balance-card__header">
              <div className="wallet-info">
                <h4>{wallet.name}</h4>
                <p className="wallet-address">
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </p>
                <p className="derivation-path">
                  Path: {wallet.derivationPath}
                </p>
              </div>
            </div>
            
            <div className="wallet-balance-card__balance">
              <WalletBalance 
                address={wallet.address}
                networkId={selectedNetwork}
                autoRefresh={true}
                refreshInterval={60000}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="balance-dashboard__summary">
        <div className="summary-info">
          <p>
            Showing balances for {wallets.length} wallet(s) on {currentNetwork?.name}
          </p>
          {currentNetwork?.isTestnet && (
            <p className="testnet-reminder">
              💡 Testnet balances are for development purposes only
            </p>
          )}
        </div>
      </div>

      <div className="balance-dashboard__actions">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
        >
          Refresh All Balances
        </button>
      </div>
    </div>
  );
}
