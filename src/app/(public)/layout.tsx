import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import PublicShell from './PublicShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.variable} font-(family-name:--font-inter)`}>
      <PublicShell>{children}</PublicShell>
    </div>
  );
}
