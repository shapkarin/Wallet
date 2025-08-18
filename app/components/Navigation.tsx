import { Link, useLocation } from 'react-router';

export default function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/create-wallet', label: 'Create Wallet', icon: '➕' },
    { path: '/import-wallet', label: 'Import Wallet', icon: '📥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="navigation">
      <div className="navigation__brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">🔐</span>
          <span className="brand-text">TrustWallet</span>
        </Link>
      </div>
      
      <div className="navigation__menu">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'nav-item--active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
