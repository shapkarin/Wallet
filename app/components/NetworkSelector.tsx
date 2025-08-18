import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedChainId } from '../store/walletSlice';
import { selectSelectedChainId } from '../store/selectors';
import { SUPPORTED_NETWORKS } from '../services/wallet';

interface NetworkSelectorProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  disabled?: boolean;
}

export default function NetworkSelector({ 
  className = '', 
  size = 'medium',
  showLabel = true,
  disabled = false 
}: NetworkSelectorProps) {
  const dispatch = useAppDispatch();
  const selectedChainId = useAppSelector(selectSelectedChainId);

  const handleNetworkChange = (chainId: number) => {
    dispatch(setSelectedChainId(chainId));
  };

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === selectedChainId);

  return (
    <div className={`network-selector ${className}`}>
      {showLabel && <label htmlFor="network-select">Network</label>}
      <select
        id="network-select"
        value={selectedChainId}
        onChange={(e) => handleNetworkChange(Number(e.target.value))}
        disabled={disabled}
        className={`network-select network-select--${size}`}
      >
        {SUPPORTED_NETWORKS.map(network => (
          <option key={network.chainId} value={network.chainId}>
            {network.name} {network.isTestnet ? '(Testnet)' : ''}
          </option>
        ))}
      </select>
      {currentNetwork && (
        <div className="network-info">
          <span className="network-currency">{currentNetwork.nativeCurrency.symbol}</span>
          {currentNetwork.isTestnet && (
            <span className="testnet-badge">Testnet</span>
          )}
        </div>
      )}
    </div>
  );
}
