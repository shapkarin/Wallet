import type { ReactNode } from 'react';
import { useAuthInitialization } from '../hooks/useAuthInitialization';

interface AppInitializerProps {
  children: ReactNode;
}

export default function AppInitializer({ children }: AppInitializerProps) {
  useAuthInitialization();
  
  return <>{children}</>;
}
