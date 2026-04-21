'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const navLinks = [
    { href: '/admin/semesters', label: 'Semestres', icon: '📅' },
    { href: '/admin/subjects', label: 'Asignaturas', icon: '📚' },
    { href: '/admin/settings', label: 'Configuración', icon: '⚙️' },
    { href: '/admin/profile', label: 'Perfil', icon: '👤' },
];

function sectionTitle(pathname: string): string {
    if (pathname.startsWith('/admin/semesters')) return 'Semestres';
    if (pathname.startsWith('/admin/subjects')) return 'Asignaturas';
    if (pathname.startsWith('/admin/settings')) return 'Configuración';
    if (pathname.startsWith('/admin/profile')) return 'Perfil';
    return 'Panel de control';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email ?? null);
        });
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const initial = email ? email[0].toUpperCase() : '?';

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-65 shrink-0 bg-white flex flex-col shadow-md">

                {/* Brand — gradient header */}
                <div
                    className="px-5 py-6"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)' }}
                >
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl leading-none">🎓</span>
                        <span className="text-base font-bold text-white tracking-tight">
                            Gestor Académico
                        </span>
                    </div>
                    <p className="text-xs text-blue-200 pl-9">Panel Admin</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-5 space-y-1">
                    <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Menú
                    </p>
                    {navLinks.map(({ href, label, icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1 bottom-1 w-0.75 bg-blue-300 rounded-r-full" />
                                )}
                                <span className="text-base leading-none">{icon}</span>
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User + sign out */}
                <div className="px-3 py-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <span className="shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {initial}
                        </span>
                        <p className="text-xs text-gray-500 truncate flex-1">{email ?? '…'}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <span className="text-base leading-none">🚪</span>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Right column */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top header */}
                <header className="h-16 shrink-0 bg-white border-b border-gray-100 flex items-center px-8 gap-3 shadow-sm">
                    <div>
                        <p className="text-xs text-gray-400">Panel de administración</p>
                        <h1 className="text-sm font-semibold text-gray-800 leading-tight">
                            {sectionTitle(pathname)}
                        </h1>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
