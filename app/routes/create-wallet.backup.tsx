import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectWallets, selectSeedPhrases, selectIsAuthenticated } from '../store/selectors';
import { updateSeedPhraseBackupStatus } from '../store/walletSlice';
import { storageService } from '../services/storage';
import Layout from '../components/Layout';

export default function BackupVerification() {
  const [currentStep, setCurrentStep] = useState<'display' | 'verify-6' | 'verify-12' | 'complete'>('display');
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [verificationWords, setVerificationWords] = useState<string[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSeedHash, setCurrentSeedHash] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wallets = useAppSelector(selectWallets);
  const seedPhrases = useAppSelector(selectSeedPhrases);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/unlock');
      return;
    }

    const loadLatestSeedPhrase = async () => {
      try {
        const unbackedUpSeeds = seedPhrases.filter(sp => !sp.isBackedUp);
        if (unbackedUpSeeds.length === 0) {
          navigate('/dashboard');
          return;
        }

        const latestSeed = unbackedUpSeeds[unbackedUpSeeds.length - 1];
        const password = 'temp_password';
        const decryptedSeed = await storageService.decryptSeedPhrase(latestSeed, password);
        
        setSeedPhrase(decryptedSeed.split(' '));
        setCurrentSeedHash(latestSeed.hash);
      } catch (error) {
        setError('Failed to load seed phrase: ' + (error as Error).message);
      }
    };

    loadLatestSeedPhrase();
  }, [isAuthenticated, seedPhrases, navigate]);

  const generateRandomWords = () => {
    const commonWords = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
      'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
      'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
      'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol'
    ];
    return commonWords.filter(word => !seedPhrase.includes(word)).slice(0, 20);
  };

  const startVerification = () => {
    if (seedPhrase.length !== 12) {
      setError('Invalid seed phrase length');
      return;
    }

    const randomIndices = [];
    while (randomIndices.length < 6) {
      const randomIndex = Math.floor(Math.random() * 12);
      if (!randomIndices.includes(randomIndex)) {
        randomIndices.push(randomIndex);
      }
    }
    randomIndices.sort((a, b) => a - b);

    const wordsToVerify = randomIndices.map(index => seedPhrase[index]);
    const randomWords = generateRandomWords().slice(0, 6);
    const allOptions = [...wordsToVerify, ...randomWords];
    
    setSelectedWords(randomIndices);
    setVerificationWords(wordsToVerify);
    setShuffledOptions(allOptions.sort(() => Math.random() - 0.5));
    setCurrentStep('verify-6');
  };

  const startFullVerification = () => {
    const randomWords = generateRandomWords().slice(0, 12);
    const allOptions = [...seedPhrase, ...randomWords];
    
    setShuffledOptions(allOptions.sort(() => Math.random() - 0.5));
    setCurrentStep('verify-12');
  };

  const handleWordSelection = (word: string, isSelected: boolean) => {
    if (currentStep === 'verify-6') {
      if (isSelected && verificationWords.includes(word)) {
        setVerificationWords(prev => prev.filter(w => w !== word));
      } else if (!isSelected && !verificationWords.includes(word)) {
        if (verificationWords.length < 6) {
          setVerificationWords(prev => [...prev, word]);
        }
      }
    } else if (currentStep === 'verify-12') {
      if (isSelected && verificationWords.includes(word)) {
        setVerificationWords(prev => prev.filter(w => w !== word));
      } else if (!isSelected && !verificationWords.includes(word)) {
        if (verificationWords.length < 12) {
          setVerificationWords(prev => [...prev, word]);
        }
      }
    }
  };

  const verifySelection = () => {
    setIsVerifying(true);
    setError(null);

    setTimeout(() => {
      if (currentStep === 'verify-6') {
        const correctWords = selectedWords.map(index => seedPhrase[index]);
        const isCorrect = correctWords.every(word => verificationWords.includes(word)) && 
                         verificationWords.every(word => correctWords.includes(word));

        if (isCorrect) {
          setVerificationWords([]);
          startFullVerification();
        } else {
          setError('Incorrect words selected. Please try again.');
          setVerificationWords([]);
        }
      } else if (currentStep === 'verify-12') {
        const isCorrect = seedPhrase.every(word => verificationWords.includes(word)) && 
                         verificationWords.every(word => seedPhrase.includes(word));

        if (isCorrect) {
          completeBackup();
        } else {
          setError('Incorrect words selected. Please review your seed phrase and try again.');
          setVerificationWords([]);
        }
      }
      setIsVerifying(false);
    }, 1000);
  };

  const completeBackup = async () => {
    if (!currentSeedHash) return;

    try {
      dispatch(updateSeedPhraseBackupStatus({ seedHash: currentSeedHash, isBackedUp: true }));
      
      const password = 'temp_password';
      const updatedSeedPhrases = seedPhrases.map(sp => 
        sp.hash === currentSeedHash ? { ...sp, isBackedUp: true } : sp
      );
      await storageService.saveSeedPhrases(updatedSeedPhrases, password);
      
      setCurrentStep('complete');
    } catch (error) {
      setError('Failed to update backup status: ' + (error as Error).message);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  if (currentStep === 'complete') {
    return (
      <Layout>
        <div className="backup-verification-page">
          <div className="backup-verification-container">
            <div className="success-header">
              <div className="success-icon">✅</div>
              <h1>Backup Verified!</h1>
              <p>Your seed phrase has been successfully backed up</p>
            </div>

            <div className="success-message">
              <h3>What happens now?</h3>
              <ul>
                <li>Your wallet is now properly backed up</li>
                <li>Keep your written seed phrase in a safe place</li>
                <li>Never share it with anyone</li>
                <li>You can now use your wallet with confidence</li>
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="btn btn-primary btn-large"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (currentStep === 'display') {
    return (
      <Layout>
        <div className="backup-verification-page">
          <div className="backup-verification-container">
            <div className="backup-header">
              <h1>Write Down Your Seed Phrase</h1>
              <p>Carefully write down these 12 words in the exact order shown</p>
            </div>

            <div className="security-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <h4>Important Instructions</h4>
                <ul>
                  <li>Write these words on paper with a pen</li>
                  <li>Do not take a screenshot or photo</li>
                  <li>Keep the paper in a safe, offline location</li>
                  <li>Consider making multiple copies stored separately</li>
                </ul>
              </div>
            </div>

            <div className="seed-phrase-display">
              {seedPhrase.map((word, index) => (
                <div key={index} className="seed-word">
                  <span className="word-number">{index + 1}</span>
                  <span className="word-text">{word}</span>
                </div>
              ))}
            </div>

            <div className="verification-info">
              <h3>Next Step: Verification</h3>
              <p>
                After writing down your seed phrase, you'll be asked to verify it by 
                selecting the correct words. This ensures you've recorded it accurately.
              </p>
            </div>

            <button
              onClick={startVerification}
              className="btn btn-primary btn-large"
            >
              I've Written It Down - Verify Now
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="backup-verification-page">
        <div className="backup-verification-container">
          <div className="verification-header">
            <h1>Verify Your Seed Phrase</h1>
            <p>
              {currentStep === 'verify-6' 
                ? `Select the 6 words that correspond to positions: ${selectedWords.map(i => i + 1).join(', ')}`
                : 'Select all 12 words of your seed phrase in any order'
              }
            </p>
          </div>

          <div className="verification-progress">
            <div className="progress-step">
              <span className={currentStep === 'verify-6' ? 'active' : 'completed'}>1</span>
              <span>Verify 6 words</span>
            </div>
            <div className="progress-step">
              <span className={currentStep === 'verify-12' ? 'active' : ''}>2</span>
              <span>Verify all 12 words</span>
            </div>
          </div>

          <div className="selected-words">
            <h3>Selected Words ({verificationWords.length}/{currentStep === 'verify-6' ? 6 : 12})</h3>
            <div className="selected-words-display">
              {verificationWords.map((word, index) => (
                <span key={index} className="selected-word">
                  {word}
                  <button
                    onClick={() => handleWordSelection(word, true)}
                    className="remove-word"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="word-options">
            <h3>Available Words</h3>
            <div className="word-grid">
              {shuffledOptions.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordSelection(word, false)}
                  disabled={verificationWords.includes(word) || isVerifying}
                  className={`word-option ${verificationWords.includes(word) ? 'selected' : ''}`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="verification-actions">
            <button
              onClick={verifySelection}
              disabled={
                isVerifying || 
                verificationWords.length !== (currentStep === 'verify-6' ? 6 : 12)
              }
              className="btn btn-primary btn-large"
            >
              {isVerifying ? 'Verifying...' : 'Verify Selection'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
