import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const selectWalletState = (state: RootState) => state.wallet;

export const selectWallets = createSelector(
  [selectWalletState],
  (walletState) => walletState.wallets
);

export const selectSeedPhrases = createSelector(
  [selectWalletState],
  (walletState) => walletState.seedPhrases
);

export const selectSelectedWallet = createSelector(
  [selectWallets, selectWalletState],
  (wallets, walletState) => 
    wallets.find(wallet => wallet.id === walletState.selectedWalletId) || null
);

export const selectWalletsBySeedPhrase = createSelector(
  [selectWallets, selectSeedPhrases],
  (wallets, seedPhrases) => {
    return seedPhrases.map(seedPhrase => ({
      seedPhrase,
      wallets: wallets.filter(wallet => wallet.seedPhraseHash === seedPhrase.hash),
    }));
  }
);

export const selectWalletsGroupedBySeed = createSelector(
  [selectWallets],
  (wallets) => {
    const grouped = wallets.reduce((acc, wallet) => {
      if (!acc[wallet.seedPhraseHash]) {
        acc[wallet.seedPhraseHash] = [];
      }
      acc[wallet.seedPhraseHash].push(wallet);
      return acc;
    }, {} as Record<string, typeof wallets>);
    return grouped;
  }
);

export const selectUnbackedUpSeedPhrases = createSelector(
  [selectSeedPhrases],
  (seedPhrases) => seedPhrases.filter(sp => !sp.isBackedUp)
);

export const selectAvailableDerivationPaths = createSelector(
  [selectWallets],
  (wallets) => (seedPhraseHash: string) => {
    const walletsForSeed = wallets.filter(w => w.seedPhraseHash === seedPhraseHash);
    return walletsForSeed.map(w => w.derivationPath);
  }
);

export const selectIsWalletLoading = createSelector(
  [selectWalletState],
  (walletState) => walletState.isLoading
);

export const selectWalletError = createSelector(
  [selectWalletState],
  (walletState) => walletState.error
);

export const selectSelectedChainId = createSelector(
  [selectWalletState],
  (walletState) => walletState.selectedChainId
);

export const selectAuthState = (state: RootState) => state.auth;

export const selectIsUnlocked = createSelector(
  [selectAuthState],
  (authState) => authState.isUnlocked
);

export const selectIsSetupComplete = createSelector(
  [selectAuthState],
  (authState) => authState.isSetupComplete
);



export const selectAuthLoading = createSelector(
  [selectAuthState],
  (authState) => authState.isLoading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (authState) => authState.error
);

export const selectSessionInfo = createSelector(
  [selectAuthState],
  (authState) => ({
    sessionStartTime: authState.sessionStartTime,
    sessionTimeout: authState.sessionTimeout,
    isActive: authState.isUnlocked,
  })
);

export const selectPasswordPrompt = createSelector(
  [selectAuthState],
  (authState) => authState.passwordPrompt
);
