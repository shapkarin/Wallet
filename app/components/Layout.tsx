import type { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <Navigation />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
