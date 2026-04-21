import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import DeleteRowButton from '@/components/DeleteRowButton';

type Subject = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    created_at: string;
    semesters: { name: string } | null;
    units: { count: number }[];
};

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

export default async function SubjectsPage() {
    const supabase = createClient(await cookies());
    const { data: subjects, error } = await supabase
        .from('subjects')
        .select('*, semesters(name), units(count)')
        .order('created_at', { ascending: false });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Asignaturas</h1>
                    <p className="text-sm text-gray-500 mt-1">Administra las materias y su contenido.</p>
                </div>
                <Link
                    href="/admin/subjects/new"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
                >
                    <span className="text-base leading-none">＋</span>
                    Nueva asignatura
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                    No se pudieron cargar las asignaturas: {error.message}
                </div>
            )}

            {/* Empty state */}
            {!error && (!subjects || subjects.length === 0) && (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl text-center py-20">
                    <p className="text-3xl mb-3">📚</p>
                    <p className="text-base font-semibold text-gray-600">Sin asignaturas aún</p>
                    <p className="text-sm text-gray-400 mt-1">Crea la primera con el botón de arriba.</p>
                </div>
            )}

            {/* Cards grid */}
            {subjects && subjects.length > 0 && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(subjects as Subject[]).map((subject) => {
                        const accentColor = subject.color ?? '#94a3b8';
                        const unitCount = subject.units?.[0]?.count ?? 0;
                        return (
                            <li key={subject.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                                {/* Color banner with initials */}
                                <Link
                                    href={`/admin/subjects/${subject.id}`}
                                    className="h-20 w-full flex items-center justify-center"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    <span className="text-3xl font-bold text-white/90 tracking-tight select-none">
                                        {initials(subject.name)}
                                    </span>
                                </Link>

                                {/* Card body — clickable */}
                                <Link
                                    href={`/admin/subjects/${subject.id}`}
                                    className="flex flex-col gap-2 px-5 pt-4 pb-3 flex-1"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                                            {subject.name}
                                        </p>
                                        {subject.semesters?.name && (
                                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                                {subject.semesters.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {subject.description && (
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                            {subject.description}
                                        </p>
                                    )}

                                    {/* Unit count */}
                                    <p className="mt-auto pt-1 text-xs text-gray-400">
                                        {unitCount} {unitCount === 1 ? 'unidad' : 'unidades'}
                                    </p>
                                </Link>

                                {/* Fixed action bar */}
                                <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100">
                                    <Link
                                        href={`/admin/subjects/${subject.id}/edit`}
                                        className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                        ✏️ Editar
                                    </Link>
                                    <DeleteRowButton
                                        table="subjects"
                                        id={subject.id}
                                        confirmMessage={`¿Eliminar la asignatura "${subject.name}" y todos sus contenidos?`}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

