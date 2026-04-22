import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DeleteRowButton from '@/components/DeleteRowButton';
import CurriculumPlanner from '@/components/CurriculumPlanner';
import ExportSyllabus from '@/components/ExportSyllabus';

type Subject = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    semesters: { name: string } | null;
};

type Unit = {
    id: string;
    name: string;
    description: string | null;
    order: number;
};

export default async function SubjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createClient(await cookies());

    const [{ data: subject, error: subjectError }, { data: units, error: unitsError }] =
        await Promise.all([
            supabase.from('subjects').select('*, semesters(name)').eq('id', id).single(),
            supabase.from('units').select('*').eq('subject_id', id).order('order', { ascending: true }),
        ]);

    if (subjectError || !subject) notFound();

    const s = subject as Subject;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4">
                <div className="flex items-start gap-4">
                    {s.color && (
                        <span
                            className="mt-1 shrink-0 h-4 w-4 rounded-full"
                            style={{ backgroundColor: s.color }}
                        />
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/admin/subjects"
                                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Asignaturas
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm text-gray-600">{s.name}</span>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-800">{s.name}</h1>
                        {s.semesters?.name && (
                            <span className="inline-block mt-1 text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                                {s.semesters.name}
                            </span>
                        )}
                        {s.description && (
                            <p className="mt-2 text-sm text-gray-500 max-w-xl">{s.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <CurriculumPlanner subjectId={s.id} subjectName={s.name} />
                    <ExportSyllabus subjectId={s.id} subjectName={s.name} />
                    <Link
                        href={`/admin/subjects/${id}/units/new`}
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        + Nueva unidad
                    </Link>
                </div>
            </div>

            {/* Units error */}
            {unitsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                    No se pudieron cargar las unidades: {unitsError.message}
                </div>
            )}

            {/* Empty state */}
            {!unitsError && (!units || units.length === 0) && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg font-medium">Sin unidades aún</p>
                    <p className="text-sm mt-1">Crea la primera con el botón de arriba.</p>
                </div>
            )}

            {/* Units list */}
            {units && units.length > 0 && (
                <ul className="space-y-3">
                    {(units as Unit[]).map((unit) => (
                        <li key={unit.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                            <div className="flex items-start gap-4 px-5 py-4">
                                {/* Order badge */}
                                <span className="shrink-0 mt-0.5 h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                                    {unit.order}
                                </span>

                                {/* Name + description (clickable) */}
                                <Link href={`/admin/subjects/${id}/units/${unit.id}`} className="flex-1 min-w-0 group">
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{unit.name}</p>
                                    {unit.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{unit.description}</p>
                                    )}
                                </Link>

                                {/* Actions */}
                                <div className="shrink-0 flex items-center gap-2">
                                    <Link
                                        href={`/admin/subjects/${id}/units/${unit.id}/edit`}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        Editar
                                    </Link>
                                    <DeleteRowButton
                                        table="units"
                                        id={unit.id}
                                        confirmMessage={`¿Eliminar la unidad "${unit.name}" y todas sus semanas y materiales?`}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
