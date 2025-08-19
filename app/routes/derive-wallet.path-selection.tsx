import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAppSelector } from '../store/hooks';

import SeedPhraseSelector from '../components/SeedPhraseSelector';
import Layout from '../components/Layout';

export default function PathSelection() {
  const [selectedSeedHash, setSelectedSeedHash] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  useEffect(() => {
    const seedFromUrl = searchParams.get('seed');
    if (seedFromUrl) {
      setSelectedSeedHash(seedFromUrl);
    }
  }, [searchParams, navigate]);

  const handleSeedSelect = (seedHash: string) => {
    setSelectedSeedHash(seedHash);
  };

  const handleRevealSeedPhrase = (seedHash: string) => {
    navigate(`/wallet/${seedHash}/mnemonic`);
  };

  const handleProceedToDerivation = () => {
    if (selectedSeedHash) {
      navigate(`/derive-wallet?seed=${selectedSeedHash}`);
    }
  };

  return (
    <Layout>
      <div className="path-selection-page">
        <div className="path-selection-container">
          <div className="path-selection-header">
            <h1>Select Seed Phrase</h1>
            <p>Choose which seed phrase to derive a new wallet from</p>
          </div>

          <SeedPhraseSelector
            selectedSeedHash={selectedSeedHash}
            onSeedSelect={handleSeedSelect}
            onRevealSeedPhrase={handleRevealSeedPhrase}
          />

          {selectedSeedHash && (
            <div className="path-selection-actions">
              <button
                onClick={handleProceedToDerivation}
                className="btn btn-primary btn-large"
              >
                Continue to Derivation Path Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
