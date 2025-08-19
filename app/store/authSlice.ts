import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isUnlocked: boolean;
  sessionStartTime: number | null;
  sessionTimeout: number;
  isSetupComplete: boolean;
  isLoading: boolean;
  error: string | null;
  passwordPrompt: {
    isVisible: boolean;
    title: string;
    message: string;
    resolve: ((_password: string) => void) | null;
    reject: ((_error: Error) => void) | null;
  };
}

const initialState: AuthState = {
  isUnlocked: false,
  sessionStartTime: null,
  sessionTimeout: 30 * 60 * 1000,
  isSetupComplete: false,
  isLoading: false,
  error: null,
  passwordPrompt: {
    isVisible: false,
    title: 'Authentication Required',
    message: 'Please enter your password to continue',
    resolve: null,
    reject: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    unlock: (state) => {
      state.isUnlocked = true;
      state.sessionStartTime = Date.now();
      state.error = null;
    },
    lock: (state) => {
      state.isUnlocked = false;
      state.sessionStartTime = null;
      state.error = null;
    },
    setSetupComplete: (state, action: PayloadAction<boolean>) => {
      state.isSetupComplete = action.payload;
    },
    initializeAuth: (state, action: PayloadAction<{ isSetupComplete: boolean }>) => {
      state.isSetupComplete = action.payload.isSetupComplete;
    },

    setSessionTimeout: (state, action: PayloadAction<number>) => {
      state.sessionTimeout = action.payload;
    },
    checkSessionExpiry: (state) => {
      if (state.isUnlocked && state.sessionStartTime) {
        const now = Date.now();
        if (now - state.sessionStartTime > state.sessionTimeout) {
          state.isUnlocked = false;
          state.sessionStartTime = null;
        }
      }
    },
    refreshSession: (state) => {
      if (state.isUnlocked) {
        state.sessionStartTime = Date.now();
      }
    },
    showPasswordPrompt: (state, action: PayloadAction<{
      title?: string;
      message?: string;
      resolve: (_password: string) => void;
      reject: (_error: Error) => void;
    }>) => {
      state.passwordPrompt = {
        isVisible: true,
        title: action.payload.title || 'Authentication Required',
        message: action.payload.message || 'Please enter your password to continue',
        resolve: action.payload.resolve,
        reject: action.payload.reject,
      };
    },
    hidePasswordPrompt: (state) => {
      state.passwordPrompt = {
        isVisible: false,
        title: 'Authentication Required',
        message: 'Please enter your password to continue',
        resolve: null,
        reject: null,
      };
    },
    resolvePasswordPrompt: (state, action: PayloadAction<string>) => {
      if (state.passwordPrompt.resolve) {
        state.passwordPrompt.resolve(action.payload);
      }
      state.passwordPrompt = {
        isVisible: false,
        title: 'Authentication Required',
        message: 'Please enter your password to continue',
        resolve: null,
        reject: null,
      };
    },
    rejectPasswordPrompt: (state, action: PayloadAction<string>) => {
      if (state.passwordPrompt.reject) {
        state.passwordPrompt.reject(new Error(action.payload));
      }
      state.passwordPrompt = {
        isVisible: false,
        title: 'Authentication Required',
        message: 'Please enter your password to continue',
        resolve: null,
        reject: null,
      };
    },
  },
});

export const {
  setLoading,
  setError,
  unlock,
  lock,
  setSetupComplete,
  initializeAuth,
  setSessionTimeout,
  checkSessionExpiry,
  refreshSession,
  showPasswordPrompt,
  hidePasswordPrompt,
  resolvePasswordPrompt,
  rejectPasswordPrompt,
} = authSlice.actions;

export default authSlice.reducer;
