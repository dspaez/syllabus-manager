'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
    );
}

function BookOpenIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
    );
}

function CogIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );
}

function UserCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );
}

function ArrowRightOnRectangleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
    );
}

function ArrowTopRightOnSquareIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
    );
}

const navLinks = [
    { href: '/admin/semesters', label: 'Semestres', icon: CalendarIcon },
    { href: '/admin/subjects', label: 'Asignaturas', icon: BookOpenIcon },
    { href: '/admin/settings', label: 'Configuración', icon: CogIcon },
    { href: '/admin/profile', label: 'Perfil', icon: UserCircleIcon },
];

type RecentSubject = {
    id: string;
    name: string;
    color: string | null;
};
const NO_ACTIVE_SEMESTER = 'Sin semestre activo';

function sectionTitle(pathname: string): string {
    if (pathname.startsWith('/admin/semesters')) return 'Semestres';
    if (pathname.startsWith('/admin/subjects')) return 'Asignaturas';
    if (pathname.startsWith('/admin/settings')) return 'Configuración';
    if (pathname.startsWith('/admin/profile')) return 'Perfil';
    return 'Panel de control';
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [activeSemester, setActiveSemester] = useState<string | null>(null);
    const [recentSubjects, setRecentSubjects] = useState<RecentSubject[]>([]);

    useEffect(() => {
        const supabase = createClient();
        void Promise.all([
            supabase.auth.getUser(),
            supabase
                .from('semesters')
                .select('name')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle(),
            supabase
                .from('subjects')
                .select('id, name, color')
                .order('created_at', { ascending: false })
                .limit(4),
        ]).then(([{ data: authData }, { data: semesterData }, { data: subjectData }]) => {
            setEmail(authData.user?.email ?? null);
            setActiveSemester(semesterData?.name ?? null);
            setRecentSubjects((subjectData ?? []) as RecentSubject[]);
        }).catch(() => {
            console.error('No se pudo cargar información contextual del admin');
            setEmail(null);
            setActiveSemester(null);
            setRecentSubjects([]);
        });
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const initial = email ? email[0].toUpperCase() : '?';

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            <aside className="w-72 shrink-0 bg-white dark:bg-slate-900 flex flex-col border-r border-slate-200 dark:border-slate-700">

                {/* Brand */}
                <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl leading-none text-white shadow-sm shadow-blue-200/80 dark:shadow-blue-950/40">🎓</span>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                                Gestor Académico
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Panel Admin</p>
                        </div>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Semestre activo: {activeSemester ?? NO_ACTIVE_SEMESTER}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-5 space-y-1.5">
                    <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Menú
                    </p>
                    {navLinks.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={label}
                                className={`group flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 relative ${isActive
                                        ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/80 dark:bg-blue-500/15 dark:text-blue-200 dark:shadow-none'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-0.5 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-blue-500 rounded-r-full dark:bg-blue-400" />
                                )}
                                <Icon className={`size-6 shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
                                {label}
                            </Link>
                        );
                    })}

                    <div className="pt-6">
                        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Acceso rápido
                        </p>
                        <div className="space-y-1.5">
                            {recentSubjects.length === 0 && (
                                <p className="px-3 text-xs text-slate-400 dark:text-slate-500">
                                    Sin asignaturas recientes
                                </p>
                            )}
                            {recentSubjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={`/admin/subjects/${subject.id}`}
                                    className="group flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                >
                                    <span
                                        className="h-2.5 w-2.5 rounded-full shadow-sm"
                                        style={{ backgroundColor: subject.color ?? '#7c3aed' }}
                                    />
                                    <span className="truncate">{subject.name}</span>
                                    <span className="ml-auto text-[10px] text-slate-400 group-hover:text-slate-700 transition-colors dark:text-slate-500 dark:group-hover:text-slate-300">↗</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User + sign out */}
                <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                        <span
                            className="shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 60%, #22c55e 100%)' }}
                        >
                            {initial}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{email ?? '…'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                    >
                        <ArrowRightOnRectangleIcon className="size-5 shrink-0" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Right column */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top header */}
                <header className="h-20 shrink-0 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md flex items-center px-8 gap-3 shadow-sm shadow-slate-300/20 dark:shadow-none">
                    <div className="flex-1">
                        <p className="text-xs text-slate-400 dark:text-slate-500">Panel de administración</p>
                        <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                            {sectionTitle(pathname)}
                        </h1>
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        <Link
                            href="/admin/subjects/new"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-violet-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-200 dark:shadow-blue-950/40 hover:shadow-lg transition-shadow"
                        >
                            + Asignatura
                        </Link>
                        <Link
                            href="/admin/semesters/new"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500/60 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            + Semestre
                        </Link>
                    </div>
                    <ThemeToggle />
                    {/* View public site button */}
                    <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/60 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-2 rounded-xl transition-colors"
                    >
                        Ver sitio público
                        <ArrowTopRightOnSquareIcon className="size-3.5" />
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                    {children}
                </main>
            </div>
        </div>
    );
}
