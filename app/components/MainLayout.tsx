import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAppSelector } from '../store/hooks';
import { selectWallets, selectSeedPhrases, selectUnbackedUpSeedPhrases, selectIsUnlocked } from '../store/selectors';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
}

export default function MainLayout({ children, showSidebar = true, sidebarContent }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  const unbackedUpSeeds = useAppSelector(selectUnbackedUpSeedPhrases);
  const isUnlocked = useAppSelector(selectIsUnlocked);

  const isActivePath = (path: string) => location.pathname === path;

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create':
        navigate('/create-wallet');
        break;
      case 'import':
        navigate('/import-wallet');
        break;
      case 'derive':
        navigate('/derive-wallet');
        break;
      default:
        break;
    }
  };

  const renderSidebarContent = () => {
    if (sidebarContent) {
      return sidebarContent;
    }



    return (
      <>
        <div className="sidebar-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button
              onClick={() => handleQuickAction('create')}
              className="quick-action-btn create"
            >
              <span className="action-icon">➕</span>
              <span className="action-text">Create Wallet</span>
            </button>
            <button
              onClick={() => handleQuickAction('import')}
              className="quick-action-btn import"
            >
              <span className="action-icon">📥</span>
              <span className="action-text">Import Wallet</span>
            </button>
            <button
              onClick={() => handleQuickAction('derive')}
              className="quick-action-btn derive"
              disabled={seedPhrases.length === 0}
            >
              <span className="action-icon">🔗</span>
              <span className="action-text">Derive Wallet</span>
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Wallet Overview</h3>
          <div className="wallet-stats">
            <div className="stat-card">
              <div className="stat-value">{wallets.length}</div>
              <div className="stat-label">Total Wallets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{seedPhrases.length}</div>
              <div className="stat-label">Seed Phrases</div>
            </div>
            {unbackedUpSeeds.length > 0 && (
              <div className="stat-card warning">
                <div className="stat-value">{unbackedUpSeeds.length}</div>
                <div className="stat-label">Need Backup</div>
              </div>
            )}
          </div>
        </div>

        {wallets.length > 0 && (
          <div className="sidebar-section">
            <h3>Recent Wallets</h3>
            <div className="recent-wallets">
              {wallets.slice(0, 3).map(wallet => (
                <div
                  key={wallet.id}
                  className="recent-wallet-item"
                  onClick={() => navigate(`/wallet/${wallet.id}`)}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">{wallet.name}</div>
                    <div className="wallet-address">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </div>
                  </div>
                  <div className="wallet-arrow">→</div>
                </div>
              ))}
              {wallets.length > 3 && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="view-all-btn"
                >
                  View All Wallets ({wallets.length})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="sidebar-section">
          <h3>Navigation</h3>
          <nav className="sidebar-nav">
            <a
              href="/dashboard"
              className={`nav-link ${isActivePath('/dashboard') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </a>
            <a
              href="/settings"
              className={`nav-link ${isActivePath('/settings') ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </a>
          </nav>
        </div>
      </>
    );
  };

  return (
    <div className="main-layout">
      <Navigation />
      
      <div className="layout-body">
        {showSidebar && (
          <aside className={`layout-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <h2>TrustWallet</h2>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="sidebar-toggle"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
            </div>
            
            <div className="sidebar-content">
              {!sidebarCollapsed && renderSidebarContent()}
            </div>
          </aside>
        )}
        
        <main className={`layout-main ${!showSidebar ? 'full-width' : ''}`}>
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
      
      <footer className="layout-footer">
        <div className="footer-content">
          <div className="footer-section">
            <p>&copy; 2024 TrustWallet. Built with React and Vite.</p>
          </div>
          <div className="footer-section">
            <div className="footer-links">
              <span className="footer-link">Privacy</span>
              <span className="footer-link">Security</span>
              <span className="footer-link">Support</span>
            </div>
          </div>
          <div className="footer-section">
            <div className="footer-status">
              <span className="status-indicator online"></span>
              <span className="status-text">Secure Connection</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
