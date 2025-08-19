import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addWallet, setLoading, setError } from '../store/walletSlice';
import { selectSeedPhrases, selectWallets } from '../store/selectors';
import { deriveWalletFromMnemonic, createWalletData, SUPPORTED_NETWORKS } from '../services/wallet';
import { storageService } from '../services/storage';
import Layout from '../components/Layout';
import DerivationPathInput from '../components/DerivationPathInput';

export default function DeriveWallet() {
  const [selectedSeedHash, setSelectedSeedHash] = useState('');
  const [walletName, setWalletName] = useState('');
  const [derivationPath, setDerivationPath] = useState("m/44'/60'/0'/0/0");
  const [customPath, setCustomPath] = useState('');
  const [useCustomPath, setUseCustomPath] = useState(false);
  const [chainId, setChainId] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  
  const seedPhrases = useAppSelector(selectSeedPhrases);
  const wallets = useAppSelector(selectWallets);


  useEffect(() => {
    const seedFromUrl = searchParams.get('seed');
    if (seedFromUrl && seedPhrases.find(sp => sp.hash === seedFromUrl)) {
      setSelectedSeedHash(seedFromUrl);
    } else if (seedPhrases.length > 0) {
      setSelectedSeedHash(seedPhrases[0].hash);
    }

    const pathFromUrl = searchParams.get('path');
    if (pathFromUrl) {
      const decodedPath = decodeURIComponent(pathFromUrl);
      setDerivationPath(decodedPath);
      setCustomPath(decodedPath);
      const isStandardPath = ["m/44'/60'/0'/0/0", "m/44'/60'/1'/0/0", "m/44'/60'/2'/0/0"].includes(decodedPath);
      setUseCustomPath(!isStandardPath);
    }
  }, [searchParams, seedPhrases, navigate]);

  const selectedSeed = seedPhrases.find(sp => sp.hash === selectedSeedHash);
  const walletsForSeed = wallets.filter(w => w.seedPhraseHash === selectedSeedHash);
  const usedPaths = walletsForSeed.map(w => w.derivationPath);

  const generateNextPath = () => {
    let accountIndex = 0;
    let path = `m/44'/60'/${accountIndex}'/0/0`;
    
    while (usedPaths.includes(path)) {
      accountIndex++;
      path = `m/44'/60'/${accountIndex}'/0/0`;
    }
    
    return path;
  };

  const validateDerivationPath = (path: string): boolean => {
    const pathRegex = /^m\/44'\/60'\/\d+'\/0\/0$/;
    return pathRegex.test(path);
  };

  const handleDerive = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSeedHash || !selectedSeed) {
      dispatch(setError('Please select a seed phrase'));
      return;
    }

    if (!walletName.trim()) {
      dispatch(setError('Please enter a wallet name'));
      return;
    }

    const pathToUse = useCustomPath ? customPath : derivationPath;
    
    if (!validateDerivationPath(pathToUse)) {
      dispatch(setError('Invalid derivation path format. Use format: m/44\'/60\'/account\'/0/0'));
      return;
    }

    if (usedPaths.includes(pathToUse)) {
      dispatch(setError('This derivation path is already in use for this seed phrase'));
      return;
    }

    setIsGenerating(true);
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const { passwordManager } = await import('../services/passwordManager');
      const password = await passwordManager.requestPassword();
      const decryptedSeed = await storageService.decryptSeedPhrase(selectedSeed, password);
      
      const wallet = await deriveWalletFromMnemonic(decryptedSeed, pathToUse);
      
      const walletData = createWalletData(
        wallet,
        selectedSeedHash,
        walletName.trim(),
        chainId
      );

      dispatch(addWallet(walletData));

      const existingWallets = await storageService.loadWallets(password);
      await storageService.saveWallets([...existingWallets, walletData], password);

      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to derive wallet';
      dispatch(setError(errorMessage));
    } finally {
      setIsGenerating(false);
      dispatch(setLoading(false));
    }
  };

  const handlePathPresetChange = (preset: string) => {
    if (preset === 'next') {
      setDerivationPath(generateNextPath());
    } else {
      setDerivationPath(preset);
    }
    setUseCustomPath(false);
  };

  if (seedPhrases.length === 0) {
    return (
      <Layout>
        <div className="derive-wallet-page">
          <div className="derive-wallet-container">
            <div className="empty-state">
              <h1>No Seed Phrases Available</h1>
              <p>You need at least one seed phrase to derive new wallets.</p>
              <button
                onClick={() => navigate('/create-wallet')}
                className="btn btn-primary"
              >
                Create New Wallet
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="derive-wallet-page">
        <div className="derive-wallet-container">
          <div className="derive-header">
            <h1>Derive New Wallet</h1>
            <p>Create additional wallets from your existing seed phrases</p>
          </div>

          <div className="seed-selection-info">
            <h3>How Wallet Derivation Works</h3>
            <p>
              HD (Hierarchical Deterministic) wallets allow you to generate multiple wallet addresses 
              from a single seed phrase using different derivation paths. Each path creates a unique 
              wallet with its own address and private key, but they all share the same seed phrase.
            </p>
          </div>

          <form onSubmit={handleDerive} className="derive-form">
            <div className="form-group">
              <label htmlFor="seedPhrase">Select Seed Phrase</label>
              <select
                id="seedPhrase"
                value={selectedSeedHash}
                onChange={(e) => setSelectedSeedHash(e.target.value)}
                disabled={isGenerating}
                required
              >
                {seedPhrases.map((seed, index) => (
                  <option key={seed.hash} value={seed.hash}>
                    Seed Phrase #{index + 1} ({walletsForSeed.length} existing wallets)
                    {!seed.isBackedUp && ' - ⚠️ Not Backed Up'}
                  </option>
                ))}
              </select>
            </div>

            {selectedSeed && walletsForSeed.length > 0 && (
              <div className="existing-wallets">
                <h4>Existing Wallets from this Seed:</h4>
                <div className="wallet-list">
                  {walletsForSeed.map(wallet => (
                    <div key={wallet.id} className="wallet-item">
                      <span className="wallet-name">{wallet.name}</span>
                      <span className="wallet-path">{wallet.derivationPath}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="walletName">Wallet Name</label>
              <input
                id="walletName"
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                disabled={isGenerating}
                required
              />
            </div>

            <DerivationPathInput
              value={useCustomPath ? customPath : derivationPath}
              onChange={(path) => {
                setDerivationPath(path);
                setCustomPath(path);
                setUseCustomPath(!["m/44'/60'/0'/0/0", "m/44'/60'/1'/0/0", "m/44'/60'/2'/0/0", generateNextPath()].includes(path));
              }}
              usedPaths={usedPaths}
              disabled={isGenerating}
              onPresetSelect={(preset) => {
                setDerivationPath(preset);
                setUseCustomPath(false);
              }}
            />

            <div className="form-group">
              <label htmlFor="chainId">Network</label>
              <select
                id="chainId"
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                disabled={isGenerating}
              >
                {SUPPORTED_NETWORKS.map(network => (
                  <option key={network.chainId} value={network.chainId}>
                    {network.name} {network.isTestnet ? '(Testnet)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={
                  isGenerating || 
                  !walletName.trim() || 
                  !selectedSeedHash ||
                  !validateDerivationPath(useCustomPath ? customPath : derivationPath) ||
                  usedPaths.includes(useCustomPath ? customPath : derivationPath)
                }
              >
                {isGenerating ? 'Deriving Wallet...' : 'Derive Wallet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
