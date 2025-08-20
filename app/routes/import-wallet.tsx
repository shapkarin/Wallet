import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addWallet, addSeedPhrase, setLoading, setError } from '../store/walletSlice';
import { generateWalletFromMnemonic, createWalletData, validateWalletMnemonic } from '../services/wallet';
import { storageService } from '../services/storage';
import { selectWalletError, selectIsWalletLoading } from '../store/selectors';
import Layout from '../components/Layout';

export default function ImportWallet() {
  const [mnemonic, setMnemonic] = useState('');
  const [walletName, setWalletName] = useState('');
  const [derivationPath, setDerivationPath] = useState("m/44'/60'/0'/0/0");
  const [chainId, setChainId] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const error = useAppSelector(selectWalletError);
  const isLoading = useAppSelector(selectIsWalletLoading);

  const handleMnemonicChange = (value: string) => {
    setMnemonic(value);
    setValidationError(null);
  };

  const validateMnemonicInput = async () => {
    if (!mnemonic.trim()) {
      setValidationError('Please enter a seed phrase');
      return false;
    }

    setIsValidating(true);
    try {
      const isValid = validateWalletMnemonic(mnemonic.trim());
      if (!isValid) {
        setValidationError('Invalid seed phrase. Please check your words and try again.');
        return false;
      }
      setValidationError(null);
      return true;
    } catch (error) {
      setValidationError('Error validating seed phrase: ' + (error as Error).message);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletName.trim()) {
      dispatch(setError('Please enter a wallet name'));
      return;
    }

    const isValid = await validateMnemonicInput();
    if (!isValid) return;

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const cleanMnemonic = mnemonic.trim().toLowerCase();
      const wallet = await generateWalletFromMnemonic(cleanMnemonic, derivationPath);
      
      let password: string;
      
      if (!storageService.isSetupComplete()) {
        // This should trigger password setup flow, but for now show error
        dispatch(setError('Password setup required. Please create a new wallet first to set up your password.'));
        return;
      }
      
      const { passwordManager } = await import('../services/passwordManager');
      password = await passwordManager.requestPassword();
      const seedPhraseData = await storageService.saveEncryptedSeedPhrase(cleanMnemonic, password, wallet.address);
      
      const walletData = createWalletData(
        wallet,
        seedPhraseData.walletIDHash,
        walletName.trim(),
        chainId,
        true  // isWalletID = true (this is the first/primary wallet from imported seed)
      );

      dispatch(addSeedPhrase(seedPhraseData));
      dispatch(addWallet(walletData));

      const existingWallets = [];
      const existingSeedPhrases = [];
      
      try {
        const loadedWallets = await storageService.loadWallets(password);
        const loadedSeedPhrases = await storageService.loadSeedPhrases(password);
        existingWallets.push(...loadedWallets);
        existingSeedPhrases.push(...loadedSeedPhrases);
      } catch {
        // First wallet
      }

      await storageService.saveWallets([...existingWallets, walletData], password);
      await storageService.saveSeedPhrases([...existingSeedPhrases, seedPhraseData], password);

      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import wallet';
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMnemonic(text.trim());
      setValidationError(null);
    } catch (error) {
      setValidationError('Failed to paste from clipboard');
    }
  };

  const mnemonicWords = mnemonic.trim().split(/\s+/).filter(word => word.length > 0);
  const expectedWordCount = 12;

  return (
    <Layout>
      <div className="import-wallet-page">
        <div className="import-wallet-container">
          <div className="import-header">
            <h1>Import Existing Wallet</h1>
            <p>Restore your wallet using your seed phrase</p>
          </div>

          <div className="security-notice">
            <div className="notice-icon">🔐</div>
            <div className="notice-content">
              <h4>Security Notice</h4>
              <ul>
                <li>Only enter your seed phrase on trusted devices</li>
                <li>Make sure no one is watching your screen</li>
                <li>Your seed phrase will be encrypted and stored locally</li>
                <li>We never send your seed phrase to any server</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleImport} className="import-form">
            <div className="form-group">
              <label htmlFor="walletName">Wallet Name</label>
              <input
                id="walletName"
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter a name for this wallet"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <div className="mnemonic-label">
                <label htmlFor="mnemonic">Seed Phrase ({expectedWordCount} words)</label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="btn-link paste-btn"
                  disabled={isLoading}
                >
                  📋 Paste
                </button>
              </div>
              <textarea
                id="mnemonic"
                value={mnemonic}
                onChange={(e) => handleMnemonicChange(e.target.value)}
                placeholder="Enter your seed phrase (12 words separated by spaces)"
                disabled={isLoading}
                rows={4}
                required
              />
              <div className="mnemonic-info">
                <span className={`word-count ${mnemonicWords.length === expectedWordCount ? 'valid' : 'invalid'}`}>
                  {mnemonicWords.length}/{expectedWordCount} words
                </span>
                {isValidating && <span className="validating">Validating...</span>}
              </div>
              {validationError && (
                <div className="error-message">{validationError}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="derivationPath">Derivation Path</label>
              <select
                id="derivationPath"
                value={derivationPath}
                onChange={(e) => setDerivationPath(e.target.value)}
                disabled={isLoading}
              >
                <option value="m/44'/60'/0'/0/0">Standard (Account 0) - m/44'/60'/0'/0/0</option>
                <option value="m/44'/60'/1'/0/0">Account 1 - m/44'/60'/1'/0/0</option>
                <option value="m/44'/60'/2'/0/0">Account 2 - m/44'/60'/2'/0/0</option>
                <option value="m/44'/60'/3'/0/0">Account 3 - m/44'/60'/3'/0/0</option>
              </select>
              <div className="help-text">
                Most wallets use the standard derivation path. Only change this if you know what you're doing.
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="chainId">Network</label>
              <select
                id="chainId"
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                disabled={isLoading}
              >
                <option value={1}>Ethereum Mainnet</option>
                <option value={11155111}>Ethereum Sepolia Testnet</option>
                <option value={56}>BNB Smart Chain</option>
                <option value={97}>BNB Smart Chain Testnet</option>
              </select>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={
                  isLoading || 
                  !walletName.trim() || 
                  !mnemonic.trim() || 
                  mnemonicWords.length !== expectedWordCount ||
                  isValidating
                }
              >
                {isLoading ? 'Importing...' : 'Import Wallet'}
              </button>
            </div>
          </form>

          <div className="import-help">
            <h3>Need Help?</h3>
            <div className="help-section">
              <h4>Common Issues:</h4>
              <ul>
                <li><strong>Invalid seed phrase:</strong> Make sure all words are spelled correctly and in the right order</li>
                <li><strong>Wrong word count:</strong> Most wallets use 12-word seed phrases</li>
                <li><strong>Extra spaces:</strong> Remove any extra spaces between words</li>
                <li><strong>Wrong derivation path:</strong> Try the standard path first</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Security Tips:</h4>
              <ul>
                <li>Never share your seed phrase with anyone</li>
                <li>Double-check that you're on the correct website</li>
                <li>Clear your clipboard after importing</li>
                <li>Consider backing up your seed phrase again after importing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
