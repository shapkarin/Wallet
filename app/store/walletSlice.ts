import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { WalletState, WalletData, SeedPhraseData } from './types';

const initialState: WalletState = {
  wallets: [],
  seedPhrases: [],
  selectedWalletId: null,
  selectedChainId: 1,
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addSeedPhrase: (state, action: PayloadAction<SeedPhraseData>) => {
      state.seedPhrases.push(action.payload);
    },
    updateSeedPhraseBackupStatus: (state, action: PayloadAction<{ hash: string; isBackedUp: boolean }>) => {
      const seedPhrase = state.seedPhrases.find(sp => sp.hash === action.payload.hash);
      if (seedPhrase) {
        seedPhrase.isBackedUp = action.payload.isBackedUp;
      }
    },
    addWallet: (state, action: PayloadAction<WalletData>) => {
      state.wallets.push(action.payload);
      const seedPhrase = state.seedPhrases.find(sp => sp.hash === action.payload.seedPhraseHash);
      if (seedPhrase && !seedPhrase.walletIds.includes(action.payload.id)) {
        seedPhrase.walletIds.push(action.payload.id);
      }
    },
    updateWallet: (state, action: PayloadAction<Partial<WalletData> & { id: string }>) => {
      const index = state.wallets.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.wallets[index] = { ...state.wallets[index], ...action.payload };
      }
    },
    removeWallet: (state, action: PayloadAction<string>) => {
      const wallet = state.wallets.find(w => w.id === action.payload);
      if (wallet) {
        state.wallets = state.wallets.filter(w => w.id !== action.payload);
        const seedPhrase = state.seedPhrases.find(sp => sp.hash === wallet.seedPhraseHash);
        if (seedPhrase) {
          seedPhrase.walletIds = seedPhrase.walletIds.filter(id => id !== action.payload);
        }
        if (state.selectedWalletId === action.payload) {
          state.selectedWalletId = null;
        }
      }
    },
    setSelectedWallet: (state, action: PayloadAction<string | null>) => {
      state.selectedWalletId = action.payload;
    },
    setSelectedChain: (state, action: PayloadAction<number>) => {
      state.selectedChainId = action.payload;
    },
    loadWalletsFromStorage: (state, action: PayloadAction<{ wallets: WalletData[]; seedPhrases: SeedPhraseData[] }>) => {
      state.wallets = action.payload.wallets;
      state.seedPhrases = action.payload.seedPhrases;
    },
    clearAllWallets: (state) => {
      state.wallets = [];
      state.seedPhrases = [];
      state.selectedWalletId = null;
    },
  },
});

export const {
  setLoading,
  setError,
  addSeedPhrase,
  updateSeedPhraseBackupStatus,
  addWallet,
  updateWallet,
  removeWallet,
  setSelectedWallet,
  setSelectedChain,
  loadWalletsFromStorage,
  clearAllWallets,
} = walletSlice.actions;

export default walletSlice.reducer;
