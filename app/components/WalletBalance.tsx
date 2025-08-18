import { useState, useEffect } from 'react';
import { getWalletBalance, SUPPORTED_NETWORKS } from '../services/wallet';
import type { NetworkConfig } from '../store/types';

interface WalletBalanceProps {
  address: string;
  networkId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function WalletBalance({ 
  address, 
  networkId, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: WalletBalanceProps) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const network = SUPPORTED_NETWORKS.find(n => n.chainId === networkId);

  const fetchBalance = async () => {
    if (!network || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const balanceWei = await getWalletBalance(address, network);
      const balanceEth = (Number(balanceWei) / Math.pow(10, 18)).toFixed(6);
      setBalance(balanceEth);
      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address, networkId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, address, networkId]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.001) return '<0.001';
    return num.toFixed(6);
  };

  const getDisplayBalance = () => {
    if (isLoading) return '...';
    if (error) return 'Error';
    return formatBalance(balance);
  };

  const getBalanceColor = () => {
    if (error) return 'text-error';
    if (isLoading) return 'text-muted';
    const num = parseFloat(balance);
    if (num > 0) return 'text-success';
    return 'text-muted';
  };

  if (!network) {
    return (
      <div className="wallet-balance wallet-balance--error">
        <span className="balance-amount">Unknown Network</span>
      </div>
    );
  }

  return (
    <div className="wallet-balance">
      <div className="balance-display">
        <span className={`balance-amount ${getBalanceColor()}`}>
          {getDisplayBalance()}
        </span>
        <span className="balance-currency">
          {network.nativeCurrency.symbol}
        </span>
        {network.isTestnet && (
          <span className="testnet-badge">
            Testnet
          </span>
        )}
      </div>
      
      <div className="balance-info">
        <span className="network-name">{network.name}</span>
        {lastUpdated && !isLoading && (
          <span className="last-updated">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="balance-error">
          <small>{error}</small>
        </div>
      )}

      <div className="balance-actions">
        <button
          type="button"
          onClick={fetchBalance}
          disabled={isLoading}
          className="btn btn-secondary btn-sm"
          title="Refresh balance"
        >
          {isLoading ? '🔄' : '↻'}
        </button>
      </div>
    </div>
  );
}
