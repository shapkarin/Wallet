import { storageService } from './storage';
import { store } from '../store';
import { showPasswordPrompt } from '../store/authSlice';

class PasswordManager {
  private currentPassword: string | null = null;

  setCurrentPassword(password: string): void {
    this.currentPassword = password;
  }

  getCurrentPassword(): string | null {
    return this.currentPassword;
  }

  clearCurrentPassword(): void {
    this.currentPassword = null;
  }

  async requestPassword(options?: {
    title?: string;
    message?: string;
  }): Promise<string> {
    // Check if setup is complete first
    if (!storageService.isSetupComplete()) {
      throw new Error('Password not set up yet. Please complete initial setup first.');
    }

    if (this.currentPassword) {
      const isValid = await storageService.verifyPassword(this.currentPassword);
      if (isValid) {
        return this.currentPassword;
      }
      this.clearCurrentPassword();
    }

    return new Promise((resolve, reject) => {
      store.dispatch(showPasswordPrompt({
        title: options?.title,
        message: options?.message,
        resolve,
        reject,
      }));
    });
  }

  async validateAndSetPassword(password: string): Promise<boolean> {
    try {
      const isValid = await storageService.verifyPassword(password);
      if (isValid) {
        this.setCurrentPassword(password);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const passwordManager = new PasswordManager();
