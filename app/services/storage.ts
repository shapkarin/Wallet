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
  saveEncryptedSeedPhrase: (seedPhrase: string, password: string, walletIDAddress: string) => Promise<SeedPhraseData>;
  decryptSeedPhrase: (seedPhraseData: SeedPhraseData, password: string) => Promise<string>;
  clearAllData: () => void;
  resetApplication: () => void;
  exportData: (password: string) => Promise<string>;
  importData: (data: string, password: string) => Promise<void>;
  migrateFromSeedHashToWalletIDHash: (password: string) => Promise<void>;
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
    let currentData: StorageData;
    try {
      currentData = await this.loadStorageData(password);
    } catch (error) {
      if (!this.isSetupComplete()) {
        await this.setupPassword(password);
        currentData = await this.loadStorageData(password);
      } else {
        throw error;
      }
    }
    
    currentData.wallets = wallets;
    currentData.lastUpdated = Date.now();
    
    await this.saveStorageData(currentData, password);
  }

  async loadWallets(password: string): Promise<WalletData[]> {
    const data = await this.loadStorageData(password);
    return data.wallets;
  }

  async saveSeedPhrases(seedPhrases: SeedPhraseData[], password: string): Promise<void> {
    let currentData: StorageData;
    try {
      currentData = await this.loadStorageData(password);
    } catch (error) {
      if (!this.isSetupComplete()) {
        await this.setupPassword(password);
        currentData = await this.loadStorageData(password);
      } else {
        throw error;
      }
    }
    
    currentData.seedPhrases = seedPhrases;
    currentData.lastUpdated = Date.now();
    
    await this.saveStorageData(currentData, password);
  }

  async loadSeedPhrases(password: string): Promise<SeedPhraseData[]> {
    const data = await this.loadStorageData(password);
    return data.seedPhrases;
  }

  async saveEncryptedSeedPhrase(seedPhrase: string, password: string, walletIDAddress: string): Promise<SeedPhraseData> {
    const encrypted = await encryptWithAESGCM(seedPhrase, password);
    const walletIDHash = await this.generateWalletIDHash(walletIDAddress);
    
    const seedPhraseData: SeedPhraseData = {
      walletIDHash,
      walletIDAddress,
      encryptedSeed: encrypted.encrypted,
      salt: encrypted.salt,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      isBackedUp: false,
      createdAt: Date.now(),
      walletIds: [],
    };

    let currentData: StorageData;
    try {
      currentData = await this.loadStorageData(password);
    } catch (error) {
      if (!this.isSetupComplete()) {
        await this.setupPassword(password);
        currentData = await this.loadStorageData(password);
      } else {
        throw error;
      }
    }

    const existingIndex = currentData.seedPhrases.findIndex(sp => sp.walletIDHash === walletIDHash);
    
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

  resetApplication(): void {
    try {
      // Clear all wallet data
      localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
      localStorage.removeItem(STORAGE_KEYS.PASSWORD_HASH);
      
      // Clear session data
      localStorage.removeItem('trustwallet_session');
      sessionStorage.removeItem('trustwallet_session');
      sessionStorage.removeItem('trustwallet_session_expiry');
      
      // Clear any other application state
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trustwallet_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
    } catch (error) {
      console.error('Error resetting application:', error);
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

  private async generateWalletIDHash(walletIDAddress: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(walletIDAddress);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async migrateFromSeedHashToWalletIDHash(password: string): Promise<void> {
    const existingData = await this.loadStorageData(password);
    
    for (const seedPhrase of existingData.seedPhrases) {
      if ((seedPhrase as any).hash && !seedPhrase.walletIDHash) {
        // Find first wallet (WalletID) that uses this seed phrase
        const walletID = existingData.wallets.find(w => 
          (w as any).seedPhraseHash === (seedPhrase as any).hash && 
          w.derivationPath === "m/44'/60'/0'/0/0"
        );
        
        if (walletID) {
          // Generate walletIDHash from walletID's address
          seedPhrase.walletIDHash = await this.generateWalletIDHash(walletID.address);
          seedPhrase.walletIDAddress = walletID.address;
          delete (seedPhrase as any).hash;
        }
      }
    }
    
    // Update all wallet references
    for (const wallet of existingData.wallets) {
      if ((wallet as any).seedPhraseHash && !wallet.walletIDHash) {
        // Find the corresponding seed phrase to get walletIDHash
        const seedPhrase = existingData.seedPhrases.find(sp => 
          (sp as any).hash === (wallet as any).seedPhraseHash || sp.walletIDAddress
        );
        
        if (seedPhrase && seedPhrase.walletIDHash) {
          wallet.walletIDHash = seedPhrase.walletIDHash;
          wallet.isWalletID = (wallet.derivationPath === "m/44'/60'/0'/0/0");
          delete (wallet as any).seedPhraseHash;
        }
      }
    }
    
    // Save migrated data
    await this.saveStorageData(existingData, password);
  }
}

export const storageService = new LocalStorageService();
