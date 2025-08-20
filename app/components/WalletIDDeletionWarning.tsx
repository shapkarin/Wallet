import { useState } from 'react';
import type { WalletData } from '../store/types';

interface WalletIDDeletionWarningProps {
  wallet: WalletData;
  relatedWalletsCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WalletIDDeletionWarning({ 
  wallet, 
  relatedWalletsCount, 
  onConfirm, 
  onCancel 
}: WalletIDDeletionWarningProps) {
  const [confirmText, setConfirmText] = useState('');
  const requiredText = `DELETE ${relatedWalletsCount} WALLETS`;
  const canConfirm = confirmText === requiredText;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="deletion-warning-modal">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="warning-content">
        <div className="warning-header">
          <h3>⚠️ Delete Primary Wallet Warning</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="warning-body">
          <p>
            You are about to delete <strong>{wallet.name}</strong>, which is the primary wallet (WalletID) 
            for its seed phrase.
          </p>
          
          <div className="warning-details">
            <p><strong>This action will:</strong></p>
            <ul>
              <li>Delete the entire seed phrase</li>
              <li>Delete ALL {relatedWalletsCount} related wallets</li>
              <li>Remove all associated backup data</li>
              <li className="danger-text">This action CANNOT be undone</li>
            </ul>
          </div>

          <div className="confirmation-input">
            <p>To confirm, type: <strong>{requiredText}</strong></p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type confirmation text here"
              className="confirmation-field"
            />
          </div>
        </div>
        
        <div className="warning-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className={`btn btn-danger ${!canConfirm ? 'disabled' : ''}`}
            disabled={!canConfirm}
          >
            Delete All ({relatedWalletsCount} wallets)
          </button>
        </div>
      </div>
    </div>
  );
}
