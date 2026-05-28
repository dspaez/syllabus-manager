'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';

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
        <div className="flex min-h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-72 shrink-0 bg-slate-950 text-white flex flex-col border-r border-slate-900/80 shadow-2xl shadow-blue-950/20">

                {/* Brand — gradient header */}
                <div
                    className="px-6 py-6 border-b border-white/10"
                    style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e40af 55%, #7c3aed 100%)' }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl leading-none">🎓</span>
                        <span className="text-base font-bold text-white tracking-tight">
                            Gestor Académico
                        </span>
                    </div>
                    <p className="text-xs text-blue-100/90 pl-10">Panel Admin</p>
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                        Semestre activo: {activeSemester ?? NO_ACTIVE_SEMESTER}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-5 space-y-1.5">
                    <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
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
                                        ? 'bg-gradient-to-r from-blue-500/30 to-violet-500/30 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-200/90 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                                    }`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-300 rounded-r-full" />
                                )}
                                <Icon className={`size-6 shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
                                {label}
                            </Link>
                        );
                    })}

                    <div className="pt-6">
                        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                            Acceso rápido
                        </p>
                        <div className="space-y-1.5">
                            {recentSubjects.length === 0 && (
                                <p className="px-3 text-xs text-slate-400">
                                    Sin asignaturas recientes
                                </p>
                            )}
                            {recentSubjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={`/admin/subjects/${subject.id}`}
                                    className="group flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <span
                                        className="h-2.5 w-2.5 rounded-full shadow-sm"
                                        style={{ backgroundColor: subject.color ?? '#7c3aed' }}
                                    />
                                    <span className="truncate">{subject.name}</span>
                                    <span className="ml-auto text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors">↗</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User + sign out */}
                <div className="px-4 py-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                        <span
                            className="shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 60%, #22c55e 100%)' }}
                        >
                            {initial}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{email ?? '…'}</p>
                            <p className="text-xs text-slate-300">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/15 hover:text-red-200 transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="size-5 shrink-0" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Right column */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top header */}
                <header className="h-20 shrink-0 border-b border-slate-200/80 bg-white/85 backdrop-blur-md flex items-center px-8 gap-3 shadow-sm shadow-slate-300/20">
                    <div className="flex-1">
                        <p className="text-xs text-slate-400">Panel de administración</p>
                        <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight">
                            {sectionTitle(pathname)}
                        </h1>
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        <Link
                            href="/admin/subjects/new"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-violet-700 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-200 hover:shadow-lg transition-shadow"
                        >
                            + Asignatura
                        </Link>
                        <Link
                            href="/admin/semesters/new"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                        >
                            + Semestre
                        </Link>
                    </div>
                    {/* View public site button */}
                    <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
                    >
                        Ver sitio público
                        <ArrowTopRightOnSquareIcon className="size-3.5" />
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
