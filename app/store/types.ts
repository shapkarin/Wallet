export interface WalletData {
  id: string;
  name: string;
  address: string;
  derivationPath: string;
  walletIDHash: string;
  isWalletID: boolean;
  chainId: number;
  isBackedUp: boolean;
}

export interface SeedPhraseData {
  walletIDHash: string;
  walletIDAddress: string;
  encryptedSeed: string;
  salt: string;
  iv: string;
  authTag: string;
  isBackedUp: boolean;
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
