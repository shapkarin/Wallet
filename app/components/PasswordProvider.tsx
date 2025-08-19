import type { ReactNode } from 'react';
import PasswordPrompt from './PasswordPrompt';

interface PasswordProviderProps {
  children: ReactNode;
}

export default function PasswordProvider({ children }: PasswordProviderProps) {
  return (
    <>
      {children}
      <PasswordPrompt />
    </>
  );
}
