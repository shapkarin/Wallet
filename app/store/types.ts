export interface WalletData {
  id: string;
  name: string;
  address: string;
  derivationPath: string;
  seedPhraseHash: string;
  chainId: number;
  createdAt: number;
  isBackedUp: boolean;
}

export interface SeedPhraseData {
  hash: string;
  encryptedSeed: string;
  salt: string;
  isBackedUp: boolean;
  createdAt: number;
  walletIds: string[];
}

export interface WalletState {
  wallets: WalletData[];
  seedPhrases: SeedPhraseData[];
  selectedWalletId: string | null;
  selectedChainId: number;
  isLoading: boolean;
  error: string | null;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  isTestnet: boolean;
}
