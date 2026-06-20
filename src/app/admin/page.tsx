import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { subjectEmoji } from '@/utils/subjectEmoji';

type RecentSubject = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    semesterName: string | null;
    materialCount: number;
};

type Profile = {
    name: string | null;
    title: string | null;
    institution_name: string | null;
};

export default async function AdminPage() {
    const supabase = createClient(await cookies());

    const [
        { count: semesterCount },
        { count: subjectCount },
        { count: materialCount },
        { data: activeSemester },
        { data: recentSubjectsRaw },
        { data: profileRaw },
    ] = await Promise.all([
        supabase.from('semesters').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('semesters').select('name').eq('is_active', true).limit(1).maybeSingle(),
        supabase
            .from('subjects')
            .select('id, name, description, color, semesters(name), units(weeks(materials(id)))')
            .order('created_at', { ascending: false })
            .limit(6),
        supabase.from('profile').select('name, title, institution_name').limit(1).maybeSingle(),
    ]);

    const profile: Profile = {
        name: (profileRaw as Profile | null)?.name ?? null,
        title: (profileRaw as Profile | null)?.title ?? null,
        institution_name: (profileRaw as Profile | null)?.institution_name ?? null,
    };

    const recentSubjects: RecentSubject[] = (recentSubjectsRaw ?? []).map((s) => {
        const sem = s.semesters;
        const semesterName = Array.isArray(sem)
            ? (sem[0]?.name ?? null)
            : (sem as { name: string } | null)?.name ?? null;

        // Count total materials across all units/weeks
        const materialCount = (s.units ?? []).reduce((uAcc: number, unit: { weeks?: { materials?: { id: string }[] }[] }) =>
            uAcc + (unit.weeks ?? []).reduce((wAcc: number, week: { materials?: { id: string }[] }) =>
                wAcc + (week.materials?.length ?? 0), 0), 0);

        return {
            id: s.id as string,
            name: s.name as string,
            description: s.description as string | null,
            color: s.color as string | null,
            semesterName,
            materialCount,
        };
    });

    const metrics = [
        {
            label: 'Semestres',
            value: semesterCount ?? 0,
            sub: 'Períodos registrados',
            color: '#2563eb',
            lightBg: '#eff6ff',
            border: '#bfdbfe',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
                </svg>
            ),
            href: '/admin/semesters',
        },
        {
            label: 'Asignaturas',
            value: subjectCount ?? 0,
            sub: 'Materias en el sistema',
            color: '#7c3aed',
            lightBg: '#f5f3ff',
            border: '#ddd6fe',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                </svg>
            ),
            href: '/admin/subjects',
        },
        {
            label: 'Materiales',
            value: materialCount ?? 0,
            sub: 'Documentos y recursos',
            color: '#059669',
            lightBg: '#ecfdf5',
            border: '#a7f3d0',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75-6.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
            ),
            href: '/admin/subjects',
        },
    ];

    const firstName = profile.name?.split(' ')[0] ?? 'Docente';

    return (
        <div className="p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">

            {/* ── Institutional banner ── */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-violet-600 to-blue-400" />
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                    <div>
                        {profile.institution_name && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                                {profile.institution_name}
                            </p>
                        )}
                        <h2 className="text-2xl font-black tracking-tight">
                            Bienvenido, {firstName}
                        </h2>
                        {profile.title && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{profile.title}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {activeSemester?.name ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {activeSemester.name}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Sin semestre activo
                            </span>
                        )}
                        <Link
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                                <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
                            </svg>
                            Ver portal
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Metrics ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map(({ label, value, sub, color, lightBg, border, icon, href }) => (
                    <Link
                        key={label}
                        href={href}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl border"
                                style={{ background: lightBg, borderColor: border, color }}
                            >
                                {icon}
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                className="size-4 text-slate-300 group-hover:text-slate-400 transition-colors dark:text-slate-600">
                                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">{label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
                    </Link>
                ))}
            </div>

            {/* ── Two column layout ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

                {/* Left — recent subjects */}
                <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            Asignaturas recientes
                        </p>
                        <Link href="/admin/subjects" className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                            Ver todas →
                        </Link>
                    </div>

                    {recentSubjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-slate-200 dark:text-slate-700 mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                            </svg>
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Sin asignaturas aún</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentSubjects.map((subject) => {
                                const accentColor = subject.color ?? '#7c3aed';
                                return (
                                    <li key={subject.id}>
                                        <Link
                                            href={`/admin/subjects/${subject.id}`}
                                            className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* Color + emoji */}
                                            <span
                                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                                                style={{ background: `${accentColor}18` }}
                                            >
                                                {subjectEmoji(subject.name)}
                                            </span>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                                    {subject.name}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {subject.semesterName ?? 'Sin semestre'}
                                                </p>
                                            </div>

                                            {/* Material count */}
                                            <div className="shrink-0 text-right">
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: `${accentColor}14`, color: accentColor }}
                                                >
                                                    {subject.materialCount} mat.
                                                </span>
                                            </div>

                                            {/* Accent bar */}
                                            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: accentColor }} />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Right — quick access */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Acceso rápido
                            </p>
                        </div>
                        <div className="p-4 space-y-3">
                            <Link
                                href="/admin/semesters/new"
                                className="group flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:border-blue-500/20 dark:bg-blue-500/5 dark:hover:border-blue-500/40"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nuevo semestre</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Crear período académico</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0">
                                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </Link>

                            <Link
                                href="/admin/subjects/new"
                                className="group flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3 hover:border-violet-300 hover:bg-violet-50 transition-colors dark:border-violet-500/20 dark:bg-violet-500/5 dark:hover:border-violet-500/40"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nueva asignatura</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Registrar materia</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0">
                                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </Link>

                            <Link
                                href="/admin/settings"
                                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 hover:border-slate-300 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white dark:bg-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Configuración</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Políticas del curso</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0">
                                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
