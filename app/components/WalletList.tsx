import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  selectWallets, 
  selectWalletsGroupedBySeed, 
  selectSeedPhrases,
  selectSelectedChainId,
  selectUnbackedUpSeedPhrases
} from '../store/selectors';
import { setSelectedWallet, removeWallet } from '../store/walletSlice';
import { SUPPORTED_NETWORKS } from '../services/wallet';
import type { WalletData } from '../store/types';

export default function WalletList() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedNetwork, setSelectedNetwork] = useState(1);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const wallets = useAppSelector(selectWallets);
  const groupedWallets = useAppSelector(selectWalletsGroupedBySeed);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  const selectedChainId = useAppSelector(selectSelectedChainId);
  const unbackedUpSeeds = useAppSelector(selectUnbackedUpSeedPhrases);

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === selectedNetwork);

  useEffect(() => {
    setSelectedNetwork(selectedChainId);
  }, [selectedChainId]);

  const toggleGroupExpansion = (seedHash: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(seedHash)) {
      newExpanded.delete(seedHash);
    } else {
      newExpanded.add(seedHash);
    }
    setExpandedGroups(newExpanded);
  };

  const handleWalletClick = (wallet: WalletData) => {
    dispatch(setSelectedWallet(wallet.id));
    navigate(`/wallet/${wallet.id}`);
  };

  const handleViewPrivateKey = (wallet: WalletData) => {
    navigate(`/wallet/${wallet.id}/private-key`);
  };

  const handleViewMnemonic = (wallet: WalletData) => {
    navigate(`/wallet/${wallet.id}/mnemonic`);
  };

  const handleDeriveWallet = (seedHash: string) => {
    navigate(`/derive-wallet?seed=${seedHash}`);
  };

  const handleDeleteWallet = (walletId: string) => {
    if (confirm('Are you sure you want to delete this wallet? This action cannot be undone.')) {
      dispatch(removeWallet(walletId));
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSeedPhraseInfo = (seedHash: string) => {
    return seedPhrases.find(sp => sp.hash === seedHash);
  };

  if (wallets.length === 0) {
    return (
      <div className="wallet-list wallet-list--empty">
        <div className="empty-state">
          <h3>No Wallets Found</h3>
          <p>You haven't created any wallets yet.</p>
          <button 
            onClick={() => navigate('/create-wallet')}
            className="btn btn-primary"
          >
            Create Your First Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-list">
      <div className="wallet-list__header">
        <h2>Your Wallets ({wallets.length})</h2>
        
        <div className="wallet-list__controls">
          <select 
            value={selectedNetwork} 
            onChange={(e) => setSelectedNetwork(Number(e.target.value))}
            className="network-selector"
          >
            {SUPPORTED_NETWORKS.map(network => (
              <option key={network.chainId} value={network.chainId}>
                {network.name} {network.isTestnet ? '(Testnet)' : ''}
              </option>
            ))}
          </select>
          
          <button 
            onClick={() => navigate('/create-wallet')}
            className="btn btn-primary btn-sm"
          >
            Add Wallet
          </button>
        </div>
      </div>

      {unbackedUpSeeds.length > 0 && (
        <div className="backup-reminder">
          <h3>⚠️ Backup Required</h3>
          <p>You have {unbackedUpSeeds.length} seed phrase(s) that need to be backed up.</p>
          <button className="btn btn-warning btn-sm">
            Backup Now
          </button>
        </div>
      )}

      <div className="wallet-list__groups">
        {Object.entries(groupedWallets).map(([seedHash, walletsInGroup]) => {
          const seedInfo = getSeedPhraseInfo(seedHash);
          const isExpanded = expandedGroups.has(seedHash);
          
          return (
            <div key={seedHash} className="wallet-group">
              <div 
                className="wallet-group__header"
                onClick={() => toggleGroupExpansion(seedHash)}
              >
                <div className="wallet-group__info">
                  <h3>Seed Phrase ({walletsInGroup.length} wallets)</h3>
                  <span className="seed-hash">{seedHash.slice(0, 8)}...{seedHash.slice(-8)}</span>
                  {seedInfo && !seedInfo.isBackedUp && (
                    <span className="backup-status backup-status--pending">Not Backed Up</span>
                  )}
                </div>
                <div className="wallet-group__actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeriveWallet(seedHash);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Derive Wallet
                  </button>
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="wallet-group__wallets">
                  {walletsInGroup.map(wallet => (
                    <div key={wallet.id} className="wallet-item">
                      <div 
                        className="wallet-item__main"
                        onClick={() => handleWalletClick(wallet)}
                      >
                        <div className="wallet-item__info">
                          <h4>{wallet.name}</h4>
                          <p className="wallet-address">
                            {formatAddress(wallet.address)}
                          </p>
                          <p className="derivation-path">
                            Path: {wallet.derivationPath}
                          </p>
                          <p className="wallet-network">
                            Network: {currentNetwork?.name || 'Unknown'}
                          </p>
                        </div>
                        
                        <div className="wallet-item__balance">
                          <span className="balance-amount">0.00</span>
                          <span className="balance-currency">{currentNetwork?.nativeCurrency.symbol}</span>
                        </div>
                      </div>
                      
                      <div className="wallet-item__actions">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPrivateKey(wallet);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Private Key
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMnemonic(wallet);
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          Mnemonic
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWallet(wallet.id);
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
