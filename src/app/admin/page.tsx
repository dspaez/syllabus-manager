import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const DASHBOARD_DESCRIPTION = 'Gestiona semestres, asignaturas y materiales académicos desde este panel.';

type RecentSubject = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    semesterName: string | null;
};

export default async function AdminPage() {
    const supabase = createClient(await cookies());

    const [
        { count: semesterCount },
        { count: subjectCount },
        { count: materialCount },
        { data: activeSemester },
        { data: recentSubjectsRaw },
    ] = await Promise.all([
        supabase.from('semesters').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('semesters').select('name').eq('is_active', true).limit(1).maybeSingle(),
        supabase
            .from('subjects')
            .select('id, name, description, color, semesters(name)')
            .order('created_at', { ascending: false })
            .limit(5),
    ]);

    const recentSubjects: RecentSubject[] = (recentSubjectsRaw ?? []).map((s) => {
        const sem = s.semesters;
        const semesterName = Array.isArray(sem)
            ? (sem[0]?.name ?? null)
            : (sem as { name: string } | null)?.name ?? null;
        return {
            id: s.id as string,
            name: s.name as string,
            description: s.description as string | null,
            color: s.color as string | null,
            semesterName,
        };
    });

    const metrics = [
        {
            label: 'Semestres',
            value: semesterCount ?? 0,
            description: 'Períodos académicos registrados',
            accent: 'text-blue-700 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            label: 'Asignaturas',
            value: subjectCount ?? 0,
            description: 'Materias en el sistema',
            accent: 'text-violet-700 bg-violet-50 border-violet-100 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                </svg>
            ),
        },
        {
            label: 'Materiales',
            value: materialCount ?? 0,
            description: 'Documentos y recursos',
            accent: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75-6.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-8 text-slate-900 dark:text-slate-100">
            {/* Welcome */}
            <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Bienvenido 👋</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {DASHBOARD_DESCRIPTION}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {activeSemester?.name ?? 'Sin semestre activo'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr,1fr] gap-6">
                <section className="space-y-6">
                    {/* Metric cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {metrics.map(({ label, value, description, accent, icon }) => (
                            <div
                                key={label}
                                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className={`mb-6 inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${accent}`}>
                                    {icon}
                                </div>
                                <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick access */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <h3 className="text-sm font-black tracking-wide text-slate-700 dark:text-slate-200 mb-4 uppercase">Acceso rápido</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Link
                                href="/admin/semesters/new"
                                className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white dark:border-blue-500/30 dark:from-blue-500/10 dark:to-slate-900 p-4 transition-all hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold text-blue-700">Nuevo semestre</p>
                                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">Crear período académico</p>
                                <p className="mt-3 text-xs text-blue-600 dark:text-blue-300 group-hover:translate-x-0.5 transition-transform">Comenzar →</p>
                            </Link>
                            <Link
                                href="/admin/subjects/new"
                                className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/30 dark:from-violet-500/10 dark:to-slate-900 p-4 transition-all hover:border-violet-300 dark:hover:border-violet-500/50 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold text-violet-700">Nueva asignatura</p>
                                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">Registrar materia</p>
                                <p className="mt-3 text-xs text-violet-600 dark:text-violet-300 group-hover:translate-x-0.5 transition-transform">Comenzar →</p>
                            </Link>
                            <Link
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-slate-900 p-4 transition-all hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold text-emerald-700">Sitio público</p>
                                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">Vista para estudiantes</p>
                                <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300 group-hover:translate-x-0.5 transition-transform">Abrir →</p>
                            </Link>
                        </div>
                    </div>
                </section>

                <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black tracking-wide text-slate-700 dark:text-slate-200 uppercase">Actividad reciente</h3>
                        <Link href="/admin/subjects" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            Ver todo
                        </Link>
                    </div>

                    {recentSubjects.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 p-8 text-center">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sin asignaturas recientes</p>
                        </div>
                    )}

                    {recentSubjects.length > 0 && (
                        <ul className="space-y-3">
                            {recentSubjects.map((subject) => (
                                <li key={subject.id}>
                                    <Link
                                        href={`/admin/subjects/${subject.id}`}
                                        className="group flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:border-blue-200 dark:hover:border-blue-500/40 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 transition-colors"
                                    >
                                        <span
                                            className="mt-0.5 h-3 w-3 shrink-0 rounded-full shadow-sm"
                                            style={{ backgroundColor: subject.color ?? '#7c3aed' }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                                {subject.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {subject.semesterName ?? 'Sin semestre'}
                                            </p>
                                            {subject.description && (
                                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{subject.description}</p>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            </div>

            {/* Info message */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10 px-5 py-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0 text-blue-500 dark:text-blue-300 mt-0.5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.75 13h.5a.75.75 0 0 0 0-1.5h-.5a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.25 7H9Z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    {DASHBOARD_DESCRIPTION}
                </p>
            </div>
        </div>
    );
}
