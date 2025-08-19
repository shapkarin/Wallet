import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { initializeAuth } from '../store/authSlice';
import { storageService } from '../services/storage';

export const useAuthInitialization = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        // Check if setup is complete
        const isSetupComplete = storageService.isSetupComplete();
        
        dispatch(initializeAuth({
          isSetupComplete,
        }));
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        // If there's an error, assume setup is not complete
        dispatch(initializeAuth({
          isSetupComplete: false,
        }));
      }
    };

    initializeAuthState();
  }, [dispatch]);
};
