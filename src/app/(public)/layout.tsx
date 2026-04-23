import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`${inter.variable} font-(family-name:--font-inter) min-h-screen flex flex-col`} style={{ background: '#f8fafc' }}>
            {/* Global navbar */}
            <nav className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <span className="text-xl">🎓</span>
                        <span className="font-bold text-gray-900 text-sm">Gestor Académico</span>
                    </Link>
                </div>
            </nav>

            {/* Page content */}
            <div className="flex-1">
                {children}
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
                © 2026 Gestor Académico · Plataforma educativa
            </footer>
        </div>
    );
}
