import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch } from '../store/hooks';
import { addWallet, addSeedPhrase, setLoading, setError } from '../store/walletSlice';
import { generateWalletMnemonic, generateWalletFromMnemonic, createWalletData } from '../services/wallet';
import { storageService } from '../services/storage';
// import { selectIsAuthenticated } from '../store/selectors';

interface WalletGeneratorProps {
  onWalletGenerated?: () => void;
}

export default function WalletGenerator({ onWalletGenerated }: WalletGeneratorProps) {
  const [walletName, setWalletName] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleGenerateWallet = async () => {
    console.log('handleGenerateWallet: ', walletName);
    if (!walletName.trim()) {
      dispatch(setError('Please enter a wallet name'));
      return;
    }

    // if (!isAuthenticated) {
    //   dispatch(setError('Please authenticate first'));
    //   return;
    // }

    setIsGenerating(true);
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const mnemonic = generateWalletMnemonic();
      console.log('mnemonic: ', mnemonic);
      const wallet = await generateWalletFromMnemonic(mnemonic);
      console.log('wallet: ', wallet);
      
      const password = 'temp_password';
      
      if (!storageService.isSetupComplete()) {
        await storageService.setupPassword(password);
      }
      
      const seedPhraseData = await storageService.saveEncryptedSeedPhrase(mnemonic, password);
      
      const walletData = createWalletData(
        wallet,
        seedPhraseData.hash,
        walletName.trim(),
        1
      );

      dispatch(addSeedPhrase(seedPhraseData));
      dispatch(addWallet(walletData));

      await storageService.saveWallets([walletData], password);

      setGeneratedMnemonic(mnemonic);
      setShowMnemonic(true);
      
      if (onWalletGenerated) {
        onWalletGenerated();
      }

    } catch (error) {
      console.error('Failed to generate wallet: ', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate wallet';
      dispatch(setError(errorMessage));
    } finally {
      setIsGenerating(false);
      dispatch(setLoading(false));
    }
  };

  const handleCopyMnemonic = async () => {
    if (generatedMnemonic) {
      try {
        await navigator.clipboard.writeText(generatedMnemonic);
      } catch (error) {
        console.error('Failed to copy mnemonic:', error);
      }
    }
  };

  const handleProceedToBackup = () => {
    navigate('/create-wallet/backup-prompt');
  };

  const handleSkipBackup = () => {
    navigate('/dashboard');
  };

  if (showMnemonic && generatedMnemonic) {
    return (
      <div className="wallet-generator">
        <div className="wallet-generator__success">
          <h2>Wallet Generated Successfully!</h2>
          
          <div className="wallet-generator__mnemonic-section">
            <h3>Your Seed Phrase</h3>
            <div className="security-warning">
              <p>⚠️ Write down your seed phrase and store it securely</p>
              <p>This is the ONLY way to recover your wallet</p>
            </div>
            
            <div className="mnemonic-display">
              {generatedMnemonic.split(' ').map((word, index) => (
                <span key={index} className="mnemonic-word">
                  <span className="word-number">{index + 1}</span>
                  <span className="word-text">{word}</span>
                </span>
              ))}
            </div>
            
            <div className="mnemonic-actions">
              <button 
                type="button" 
                onClick={handleCopyMnemonic}
                className="btn btn-secondary"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>

          <div className="wallet-generator__next-steps">
            <h3>What's Next?</h3>
            <p>It's highly recommended to backup your seed phrase now.</p>
            
            <div className="next-step-actions">
              <button 
                type="button" 
                onClick={handleProceedToBackup}
                className="btn btn-primary"
              >
                Backup Now
              </button>
              <button 
                type="button" 
                onClick={handleSkipBackup}
                className="btn btn-secondary"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-generator">
      <div className="wallet-generator__form">
        <h2>Generate New Wallet</h2>
        <p>Create a new wallet with a secure seed phrase</p>
        
        <div className="form-group">
          <label htmlFor="walletName">Wallet Name</label>
          <input
            id="walletName"
            type="text"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="Enter wallet name"
            disabled={isGenerating}
            className="form-input"
          />
        </div>

        <div className="security-info">
          <h3>Security Information</h3>
          <ul>
            <li>Your seed phrase will be encrypted and stored locally</li>
            <li>Only you have access to your private keys</li>
            <li>Make sure to backup your seed phrase</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={handleGenerateWallet}
          disabled={isGenerating || !walletName.trim()}
          className="btn btn-primary btn-generate"
        >
          {isGenerating ? 'Generating...' : 'Generate Wallet'}
        </button>
      </div>
    </div>
  );
}
