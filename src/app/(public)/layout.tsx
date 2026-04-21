import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`${inter.variable} font-(family-name:--font-inter) min-h-screen`} style={{ background: '#f8fafc' }}>
            {children}
        </div>
    );
}
