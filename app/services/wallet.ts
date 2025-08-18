import { generateMnemonic, mnemonicToSeed, validateMnemonic } from 'bip39';
import { HDNodeWallet, Wallet, getDefaultProvider } from 'ethers';
import type { WalletData, NetworkConfig } from '../store/types';

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  derivationPath: string;
  mnemonic: string;
}

export interface DerivedWallet {
  address: string;
  privateKey: string;
  derivationPath: string;
}

// TODO: make it dynamic
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://eth-sepolia.public.blastapi.io',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockExplorerUrl: 'https://bscscan.com',
    isTestnet: false,
  },
  {
    chainId: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockExplorerUrl: 'https://testnet.bscscan.com',
    isTestnet: true,
  },
];

export const generateWalletMnemonic = (): string => {
  return generateMnemonic(128);
};

export const validateWalletMnemonic = (mnemonic: string): boolean => {
  return validateMnemonic(mnemonic);
};

export const generateWalletFromMnemonic = async (
  mnemonic: string,
  derivationPath: string = "m/44'/60'/0'/0/0"
): Promise<GeneratedWallet> => {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const seed = await mnemonicToSeed(mnemonic);
  const hdWallet = HDNodeWallet.fromSeed(seed);
  const derivedWallet = hdWallet.derivePath(derivationPath);

  return {
    address: derivedWallet.address,
    privateKey: derivedWallet.privateKey,
    derivationPath,
    mnemonic,
  };
};

export const deriveWalletFromMnemonic = async (
  mnemonic: string,
  derivationPath: string
): Promise<DerivedWallet> => {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  if (!isValidDerivationPath(derivationPath)) {
    throw new Error('Invalid derivation path format');
  }

  const seed = await mnemonicToSeed(mnemonic);
  const hdWallet = HDNodeWallet.fromSeed(seed);
  const derivedWallet = hdWallet.derivePath(derivationPath);

  return {
    address: derivedWallet.address,
    privateKey: derivedWallet.privateKey,
    derivationPath,
  };
};

export const importWalletFromPrivateKey = (privateKey: string): Wallet => {
  return new Wallet(privateKey);
};

export const isValidDerivationPath = (path: string): boolean => {
  const pathRegex = /^m\/44'\/60'\/\d+'\/\d+\/\d+$/;
  return pathRegex.test(path);
};

export const generateStandardDerivationPath = (
  account: number = 0,
  change: number = 0,
  index: number = 0
): string => {
  return `m/44'/60'/${account}'/${change}/${index}`;
};

export const parseDerivationPath = (path: string) => {
  const match = path.match(/^m\/44'\/60'\/(\d+)'\/(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error('Invalid derivation path format');
  }

  return {
    account: parseInt(match[1]),
    change: parseInt(match[2]),
    index: parseInt(match[3]),
  };
};

export const getNextDerivationPath = (usedPaths: string[]): string => {
  const pathNumbers = usedPaths
    .filter(path => isValidDerivationPath(path))
    .map(path => {
      const parsed = parseDerivationPath(path);
      return parsed.account * 1000000 + parsed.change * 1000 + parsed.index;
    })
    .sort((a, b) => a - b);

  if (pathNumbers.length === 0) {
    return generateStandardDerivationPath(0, 0, 0);
  }

  const lastNumber = pathNumbers[pathNumbers.length - 1];
  const account = Math.floor(lastNumber / 1000000);
  const change = Math.floor((lastNumber % 1000000) / 1000);
  const index = lastNumber % 1000;

  return generateStandardDerivationPath(account, change, index + 1);
};

export const getWalletBalance = async (
  address: string,
  networkConfig: NetworkConfig
): Promise<string> => {
  try {
    const provider = getDefaultProvider(networkConfig.rpcUrl);
    const balance = await provider.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw new Error('Failed to fetch wallet balance');
  }
};

export const createWalletData = (
  wallet: GeneratedWallet | DerivedWallet,
  seedPhraseHash: string,
  name: string,
  chainId: number = 1
): WalletData => {
  return {
    id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    address: wallet.address,
    derivationPath: wallet.derivationPath,
    seedPhraseHash,
    chainId,
    createdAt: Date.now(),
    isBackedUp: false,
  };
};
