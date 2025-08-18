import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean;
  sessionStartTime: number | null;
  sessionTimeout: number;
  isSetupComplete: boolean;
  hasWallets: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  sessionStartTime: null,
  sessionTimeout: 30 * 60 * 1000,
  isSetupComplete: false,
  hasWallets: false,
  isLoading: false,
  error: null,
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
    authenticate: (state) => {
      state.isAuthenticated = true;
      state.sessionStartTime = Date.now();
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.sessionStartTime = null;
      state.error = null;
    },
    setSetupComplete: (state, action: PayloadAction<boolean>) => {
      state.isSetupComplete = action.payload;
    },
    setHasWallets: (state, action: PayloadAction<boolean>) => {
      state.hasWallets = action.payload;
    },
    setSessionTimeout: (state, action: PayloadAction<number>) => {
      state.sessionTimeout = action.payload;
    },
    checkSessionExpiry: (state) => {
      if (state.isAuthenticated && state.sessionStartTime) {
        const now = Date.now();
        if (now - state.sessionStartTime > state.sessionTimeout) {
          state.isAuthenticated = false;
          state.sessionStartTime = null;
        }
      }
    },
    refreshSession: (state) => {
      if (state.isAuthenticated) {
        state.sessionStartTime = Date.now();
      }
    },
  },
});

export const {
  setLoading,
  setError,
  authenticate,
  logout,
  setSetupComplete,
  setHasWallets,
  setSessionTimeout,
  checkSessionExpiry,
  refreshSession,
} = authSlice.actions;

export default authSlice.reducer;
