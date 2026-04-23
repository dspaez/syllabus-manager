import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export default async function AdminPage() {
    const supabase = createClient(await cookies());

    const [
        { count: semesterCount },
        { count: subjectCount },
        { count: materialCount },
    ] = await Promise.all([
        supabase.from('semesters').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
    ]);

    const metrics = [
        {
            label: 'Semestres',
            value: semesterCount ?? 0,
            description: 'Períodos académicos registrados',
            barColor: '#1e40af',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 text-blue-200">
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
                </svg>
            ),
        },
        {
            label: 'Asignaturas',
            value: subjectCount ?? 0,
            description: 'Materias en el sistema',
            barColor: '#7c3aed',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 text-violet-200">
                    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                </svg>
            ),
        },
        {
            label: 'Materiales',
            value: materialCount ?? 0,
            description: 'Documentos y recursos',
            barColor: '#059669',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 text-emerald-200">
                    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75-6.75a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-8 max-w-4xl">
            {/* Welcome */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900">Bienvenido 👋</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Gestiona semestres, asignaturas y materiales académicos desde este panel.
                </p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {metrics.map(({ label, value, description, barColor, icon }) => (
                    <div
                        key={label}
                        className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {/* Icon — top right */}
                        <div className="absolute top-4 right-4 opacity-80">
                            {icon}
                        </div>
                        <p className="text-4xl font-black text-gray-900 mt-2">{value}</p>
                        <p className="text-sm font-bold text-gray-700 mt-1">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                        {/* Bottom color bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl" style={{ backgroundColor: barColor }} />
                    </div>
                ))}
            </div>

            {/* Quick access */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Acceso rápido</h3>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/admin/semesters/new"
                        className="inline-flex items-center gap-2 text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                    >
                        <span>➕</span> Nuevo semestre
                    </Link>
                    <Link
                        href="/admin/subjects/new"
                        className="inline-flex items-center gap-2 text-sm font-medium border border-violet-200 text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-xl transition-colors"
                    >
                        <span>➕</span> Nueva asignatura
                    </Link>
                    <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors"
                    >
                        <span>🔗</span> Ver sitio público
                    </Link>
                </div>
            </div>

            {/* Info message */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0 text-blue-400 mt-0.5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700">
                    Usa el menú lateral para gestionar semestres, asignaturas y materiales.
                </p>
            </div>
        </div>
    );
}

