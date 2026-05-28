import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const DASHBOARD_DESCRIPTION = 'Gestiona semestres, asignaturas y materiales académicos desde este panel.';

export default async function AdminPage() {
    const supabase = createClient(await cookies());

    const [
        { count: semesterCount },
        { count: subjectCount },
        { count: materialCount },
        { data: activeSemester },
        { data: recentSubjects },
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

    const metrics = [
        {
            label: 'Semestres',
            value: semesterCount ?? 0,
            description: 'Períodos académicos registrados',
            glow: 'from-blue-700 to-blue-500',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-white/85">
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            label: 'Asignaturas',
            value: subjectCount ?? 0,
            description: 'Materias en el sistema',
            glow: 'from-violet-700 to-violet-500',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-white/85">
                    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                </svg>
            ),
        },
        {
            label: 'Materiales',
            value: materialCount ?? 0,
            description: 'Documentos y recursos',
            glow: 'from-emerald-600 to-emerald-500',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10 text-white/85">
                    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75-6.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-8">
            {/* Welcome */}
            <div className="mb-8 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-900 via-blue-700 to-violet-700 p-8 text-white shadow-xl shadow-blue-200/60">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Bienvenido 👋</h2>
                        <p className="mt-1 text-sm text-blue-100">
                            {DASHBOARD_DESCRIPTION}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                        {activeSemester?.name ?? 'Sin semestre activo'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr,1fr] gap-6">
                <section className="space-y-6">
                    {/* Metric cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {metrics.map(({ label, value, description, glow, icon }) => (
                            <div
                                key={label}
                                className={`relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br ${glow} p-6 text-white shadow-lg transition-transform hover:-translate-y-0.5`}
                            >
                                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
                                <div className="mb-6 opacity-80">{icon}</div>
                                <p className="text-4xl font-black tracking-tight">{value}</p>
                                <p className="text-sm font-bold">{label}</p>
                                <p className="text-xs text-white/80 mt-0.5">{description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick access */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-black tracking-wide text-slate-700 mb-4 uppercase">Acceso rápido</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Link
                                href="/admin/semesters/new"
                                className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold text-blue-700">Nuevo semestre</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">Crear período académico</p>
                                <p className="mt-3 text-xs text-blue-600 group-hover:translate-x-0.5 transition-transform">Comenzar →</p>
                            </Link>
                            <Link
                                href="/admin/subjects/new"
                                className="group rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 transition-all hover:border-violet-300 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold text-violet-700">Nueva asignatura</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">Registrar materia</p>
                                <p className="mt-3 text-xs text-violet-600 group-hover:translate-x-0.5 transition-transform">Comenzar →</p>
                            </Link>
                            <Link
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 transition-all hover:border-emerald-300 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold text-emerald-700">Sitio público</p>
                                <p className="mt-1 text-sm font-bold text-slate-800">Vista para estudiantes</p>
                                <p className="mt-3 text-xs text-emerald-600 group-hover:translate-x-0.5 transition-transform">Abrir →</p>
                            </Link>
                        </div>
                    </div>
                </section>

                <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black tracking-wide text-slate-700 uppercase">Actividad reciente</h3>
                        <Link href="/admin/subjects" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                            Ver todo
                        </Link>
                    </div>

                    {(!recentSubjects || recentSubjects.length === 0) && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <p className="text-sm font-semibold text-slate-500">Sin asignaturas recientes</p>
                        </div>
                    )}

                    {recentSubjects && recentSubjects.length > 0 && (
                        <ul className="space-y-3">
                            {recentSubjects.map((subject) => (
                                <li key={subject.id}>
                                    <Link
                                        href={`/admin/subjects/${subject.id}`}
                                        className="group flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                                    >
                                        <span
                                            className="mt-0.5 h-3 w-3 rounded-full shadow-sm"
                                            style={{ backgroundColor: subject.color ?? '#7c3aed' }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                                                {subject.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {subject.semesters?.name ?? 'Sin semestre'}
                                            </p>
                                            {subject.description && (
                                                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{subject.description}</p>
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
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0 text-blue-500 mt-0.5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800">
                    {DASHBOARD_DESCRIPTION}
                </p>
            </div>
        </div>
    );
}
