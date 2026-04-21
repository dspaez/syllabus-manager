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
        { label: 'Semestres', value: semesterCount ?? 0, icon: '📅', description: 'Períodos académicos registrados' },
        { label: 'Asignaturas', value: subjectCount ?? 0, icon: '📚', description: 'Materias en el sistema' },
        { label: 'Materiales', value: materialCount ?? 0, icon: '📄', description: 'Documentos y recursos subidos' },
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {metrics.map(({ label, value, icon, description }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <span className="text-2xl leading-none">{icon}</span>
                        <p className="text-3xl font-bold text-gray-900 mt-4">{value}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

