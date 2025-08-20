import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectWallets } from '../store/selectors';
import type { WalletData } from '../store/types';

interface DerivationPathHistoryProps {
  currentWalletIDHash: string;
  onCreateWallet?: (suggestedPath: string) => void;
  onViewWallet?: (walletId: string) => void;
}

interface PathInfo {
  path: string;
  account: number;
  change: number;
  index: number;
  wallet?: WalletData;
  isGap: boolean;
}

export default function DerivationPathHistory({
  currentWalletIDHash,
  onCreateWallet,
  onViewWallet
}: DerivationPathHistoryProps) {
  const allWallets = useAppSelector(selectWallets);
  
  const walletData = useMemo(() => {
    const walletsForSeed = allWallets.filter(w => w.walletIDHash === currentWalletIDHash);
    
    const pathInfos: PathInfo[] = walletsForSeed.map(wallet => {
      const pathParts = wallet.derivationPath.split('/');
      const account = parseInt(pathParts[3]?.replace("'", "") || '0');
      const change = parseInt(pathParts[4] || '0');
      const index = parseInt(pathParts[5] || '0');
      
      return {
        path: wallet.derivationPath,
        account,
        change,
        index,
        wallet,
        isGap: false
      };
    });

    pathInfos.sort((a, b) => {
      if (a.account !== b.account) return a.account - b.account;
      if (a.change !== b.change) return a.change - b.change;
      return a.index - b.index;
    });

    const gaps: PathInfo[] = [];
    const usedAccounts = [...new Set(pathInfos.map(p => p.account))].sort((a, b) => a - b);
    
    if (usedAccounts.length > 1) {
      for (let i = usedAccounts[0]; i < usedAccounts[usedAccounts.length - 1]; i++) {
        if (!usedAccounts.includes(i)) {
          gaps.push({
            path: `m/44'/60'/${i}'/0/0`,
            account: i,
            change: 0,
            index: 0,
            isGap: true
          });
        }
      }
    }

    const allPaths = [...pathInfos, ...gaps];
    allPaths.sort((a, b) => {
      if (a.account !== b.account) return a.account - b.account;
      if (a.change !== b.change) return a.change - b.change;
      return a.index - b.index;
    });

    const groupedByAccount = allPaths.reduce((groups, pathInfo) => {
      if (!groups[pathInfo.account]) {
        groups[pathInfo.account] = [];
      }
      groups[pathInfo.account].push(pathInfo);
      return groups;
    }, {} as Record<number, PathInfo[]>);

    return {
      pathInfos,
      gaps,
      groupedByAccount,
      totalWallets: walletsForSeed.length,
      usedAccounts: usedAccounts.length,
      gapCount: gaps.length
    };
  }, [allWallets, currentWalletIDHash]);

  const generateNextPath = (): string => {
    const maxAccount = Math.max(...Object.keys(walletData.groupedByAccount).map(Number), -1);
    return `m/44'/60'/${maxAccount + 1}'/0/0`;
  };

  const generateBatchPaths = (count: number): string[] => {
    const paths: string[] = [];
    let currentAccount = 0;
    
    while (paths.length < count) {
      const path = `m/44'/60'/${currentAccount}'/0/0`;
      if (!walletData.pathInfos.some(p => p.path === path)) {
        paths.push(path);
      }
      currentAccount++;
    }
    
    return paths;
  };

  if (walletData.totalWallets === 0) {
    return (
      <div className="derivation-path-history">
        <div className="history-header">
          <h3>Derivation Path History</h3>
          <p>No wallets have been created from this seed phrase yet.</p>
        </div>
        
        <div className="empty-state">
          <div className="empty-actions">
            {onCreateWallet && (
              <button
                onClick={() => onCreateWallet("m/44'/60'/0'/0/0")}
                className="btn btn-primary"
              >
                Create First Wallet (m/44'/60'/0'/0/0)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="derivation-path-history">
      <div className="history-header">
        <h3>Derivation Path History</h3>
        <div className="history-stats">
          <div className="stat-item">
            <span className="stat-label">Total Wallets:</span>
            <span className="stat-value">{walletData.totalWallets}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Used Accounts:</span>
            <span className="stat-value">{walletData.usedAccounts}</span>
          </div>
          {walletData.gapCount > 0 && (
            <div className="stat-item warning">
              <span className="stat-label">Account Gaps:</span>
              <span className="stat-value">{walletData.gapCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="path-groups">
        {Object.entries(walletData.groupedByAccount).map(([account, paths]) => (
          <div key={account} className="account-group">
            <div className="account-header">
              <h4>Account {account}</h4>
              <span className="path-count">{paths.filter(p => !p.isGap).length} wallet(s)</span>
            </div>
            
            <div className="paths-list">
              {paths.map((pathInfo, index) => (
                <div 
                  key={`${pathInfo.path}-${index}`}
                  className={`path-item ${pathInfo.isGap ? 'gap' : 'used'}`}
                >
                  <div className="path-info">
                    <div className="path-details">
                      <code className="path-value">{pathInfo.path}</code>
                      {pathInfo.isGap ? (
                        <span className="path-status gap-status">
                          ⚠️ Gap - Unused account between used ones
                        </span>
                      ) : (
                        <div className="wallet-details">
                          <span className="wallet-name">{pathInfo.wallet?.name}</span>
                          <span className="wallet-address">
                            {pathInfo.wallet?.address.slice(0, 6)}...{pathInfo.wallet?.address.slice(-4)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="path-breakdown">
                      <span className="breakdown-label">Change:</span>
                      <span className="breakdown-value">
                        {pathInfo.change === 0 ? 'External' : 'Internal'}
                      </span>
                      <span className="breakdown-label">Index:</span>
                      <span className="breakdown-value">{pathInfo.index}</span>
                    </div>
                  </div>
                  
                  <div className="path-actions">
                    {pathInfo.isGap && onCreateWallet && (
                      <button
                        onClick={() => onCreateWallet(pathInfo.path)}
                        className="btn btn-secondary btn-sm"
                      >
                        Fill Gap
                      </button>
                    )}
                    {pathInfo.wallet && onViewWallet && (
                      <button
                        onClick={() => onViewWallet(pathInfo.wallet!.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        View Wallet
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {onCreateWallet && (
        <div className="batch-actions">
          <h4>Batch Operations</h4>
          <div className="batch-controls">
            <button
              onClick={() => onCreateWallet(generateNextPath())}
              className="btn btn-primary btn-sm"
            >
              Create Next Account ({generateNextPath()})
            </button>
            
            {walletData.gapCount > 0 && (
              <div className="gap-warning">
                <p>⚠️ You have {walletData.gapCount} account gap(s). Consider filling gaps before creating new accounts.</p>
              </div>
            )}
          </div>
          
          <div className="batch-create">
            <h5>Quick Create Sequential Accounts</h5>
            <div className="batch-buttons">
              {[3, 5, 10].map(count => (
                <button
                  key={count}
                  onClick={() => {
                    const paths = generateBatchPaths(count);
                    paths.forEach(path => onCreateWallet(path));
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Create {count} Accounts
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="path-explanation">
        <h5>Understanding Derivation Paths</h5>
        <div className="explanation-content">
          <div className="explanation-item">
            <strong>Account Gaps:</strong>
            <p>Gaps occur when you skip account numbers (e.g., using accounts 0, 2, 4 but not 1, 3). Some wallet software may not detect wallets beyond gaps.</p>
          </div>
          <div className="explanation-item">
            <strong>Best Practice:</strong>
            <p>Use sequential account numbers starting from 0. Fill gaps before creating new accounts with higher numbers.</p>
          </div>
          <div className="explanation-item">
            <strong>Change Addresses:</strong>
            <p>Change=0 addresses are for receiving funds. Change=1 addresses are typically used internally for change from transactions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
