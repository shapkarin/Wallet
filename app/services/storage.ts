import { encryptWithAESGCM, decryptWithAESGCM, hashPassword, verifyPassword } from './encryptionFallback';
import type { WalletData, SeedPhraseData } from '../store/types';

export interface StorageData {
  wallets: WalletData[];
  seedPhrases: SeedPhraseData[];
  passwordHash: string;
  passwordSalt: string;
  version: string;
  lastUpdated: number;
}

export interface SecureStorageService {
  initialize: () => Promise<boolean>;
  isSetupComplete: () => boolean;
  setupPassword: (password: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  saveWallets: (wallets: WalletData[], password: string) => Promise<void>;
  loadWallets: (password: string) => Promise<WalletData[]>;
  saveSeedPhrases: (seedPhrases: SeedPhraseData[], password: string) => Promise<void>;
  loadSeedPhrases: (password: string) => Promise<SeedPhraseData[]>;
  saveEncryptedSeedPhrase: (seedPhrase: string, password: string) => Promise<SeedPhraseData>;
  decryptSeedPhrase: (seedPhraseData: SeedPhraseData, password: string) => Promise<string>;
  clearAllData: () => void;
  exportData: (password: string) => Promise<string>;
  importData: (data: string, password: string) => Promise<void>;
}

const STORAGE_KEYS = {
  WALLET_DATA: 'trustwallet_data',
  PASSWORD_HASH: 'trustwallet_auth',
  VERSION: '1.0.0',
} as const;

class LocalStorageService implements SecureStorageService {
  async initialize(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
      return stored !== null;
    } catch {
      return false;
    }
  }

  isSetupComplete(): boolean {
    try {
      const authData = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
      return authData !== null;
    } catch {
      return false;
    }
  }

  async setupPassword(password: string): Promise<void> {
    const { hash, salt } = await hashPassword(password);
    
    const authData = {
      hash,
      salt,
      createdAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, JSON.stringify(authData));
    
    const initialData: StorageData = {
      wallets: [],
      seedPhrases: [],
      passwordHash: hash,
      passwordSalt: salt,
      version: STORAGE_KEYS.VERSION,
      lastUpdated: Date.now(),
    };

    const encrypted = await encryptWithAESGCM(JSON.stringify(initialData), password);
    localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(encrypted));
  }

  async verifyPassword(password: string): Promise<boolean> {
    try {
      const authDataStr = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
      if (!authDataStr) return false;

      const authData = JSON.parse(authDataStr);
      return await verifyPassword(password, authData.hash, authData.salt);
    } catch {
      return false;
    }
  }

  async saveWallets(wallets: WalletData[], password: string): Promise<void> {
    const currentData = await this.loadStorageData(password);
    currentData.wallets = wallets;
    currentData.lastUpdated = Date.now();
    
    await this.saveStorageData(currentData, password);
  }

  async loadWallets(password: string): Promise<WalletData[]> {
    const data = await this.loadStorageData(password);
    return data.wallets;
  }

  async saveSeedPhrases(seedPhrases: SeedPhraseData[], password: string): Promise<void> {
    const currentData = await this.loadStorageData(password);
    currentData.seedPhrases = seedPhrases;
    currentData.lastUpdated = Date.now();
    
    await this.saveStorageData(currentData, password);
  }

  async loadSeedPhrases(password: string): Promise<SeedPhraseData[]> {
    const data = await this.loadStorageData(password);
    return data.seedPhrases;
  }

  async saveEncryptedSeedPhrase(seedPhrase: string, password: string): Promise<SeedPhraseData> {
    const encrypted = await encryptWithAESGCM(seedPhrase, password);
    const hash = await this.generateSeedPhraseHash(seedPhrase);
    
    const seedPhraseData: SeedPhraseData = {
      hash,
      encryptedSeed: encrypted.encrypted,
      salt: encrypted.salt,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      isBackedUp: false,
      createdAt: Date.now(),
      walletIds: [],
    };

    const currentData = await this.loadStorageData(password);
    const existingIndex = currentData.seedPhrases.findIndex(sp => sp.hash === hash);
    
    if (existingIndex >= 0) {
      currentData.seedPhrases[existingIndex] = seedPhraseData;
    } else {
      currentData.seedPhrases.push(seedPhraseData);
    }
    
    await this.saveStorageData(currentData, password);
    return seedPhraseData;
  }

  async decryptSeedPhrase(seedPhraseData: SeedPhraseData, password: string): Promise<string> {
    return await decryptWithAESGCM(
      seedPhraseData.encryptedSeed,
      password,
      seedPhraseData.salt,
      seedPhraseData.iv,
      seedPhraseData.authTag
    );
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
      localStorage.removeItem(STORAGE_KEYS.PASSWORD_HASH);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  async exportData(password: string): Promise<string> {
    const data = await this.loadStorageData(password);
    return JSON.stringify(data);
  }

  async importData(dataStr: string, password: string): Promise<void> {
    try {
      const data: StorageData = JSON.parse(dataStr);
      
      if (!this.validateStorageData(data)) {
        throw new Error('Invalid data format');
      }

      await this.saveStorageData(data, password);
    } catch (error) {
      throw new Error('Failed to import data: ' + (error as Error).message);
    }
  }

  private async loadStorageData(password: string): Promise<StorageData> {
    try {
      const encryptedStr = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
      if (!encryptedStr) {
        throw new Error('No wallet data found');
      }

      const encryptedData = JSON.parse(encryptedStr);
      const decryptedStr = await decryptWithAESGCM(
        encryptedData.encrypted,
        password,
        encryptedData.salt,
        encryptedData.iv,
        encryptedData.authTag
      );
      
      const data: StorageData = JSON.parse(decryptedStr);
      
      if (!this.validateStorageData(data)) {
        throw new Error('Invalid storage data format');
      }

      return data;
    } catch (error) {
      throw new Error('Failed to load wallet data: ' + (error as Error).message);
    }
  }

  private async saveStorageData(data: StorageData, password: string): Promise<void> {
    try {
      const encrypted = await encryptWithAESGCM(JSON.stringify(data), password);
      localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(encrypted));
    } catch (error) {
      throw new Error('Failed to save wallet data: ' + (error as Error).message);
    }
  }

  private validateStorageData(data: any): data is StorageData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.wallets) &&
      Array.isArray(data.seedPhrases) &&
      typeof data.version === 'string' &&
      typeof data.lastUpdated === 'number'
    );
  }

  private async generateSeedPhraseHash(seedPhrase: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(seedPhrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const storageService = new LocalStorageService();
