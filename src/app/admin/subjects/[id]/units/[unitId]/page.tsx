import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import GenerateWithAI from '@/components/GenerateWithAI';
import TogglePublish from '@/components/TogglePublish';
import DeleteMaterial from '@/components/DeleteMaterial';
import DeleteRowButton from '@/components/DeleteRowButton';
import EditMaterialName from '@/components/EditMaterialName';
import GenerateAllContent from '@/components/GenerateAllContent';

type Material = {
    id: string;
    name: string;
    type: string | null;
    file_url: string | null;
    is_published: boolean;
};

type Week = {
    id: string;
    number: number;
    title: string | null;
    description: string | null;
    materials: Material[];
};

type Unit = {
    id: string;
    name: string;
    description: string | null;
    subject_id: string;
};

const TYPE_ICONS: Record<string, string> = {
    pdf: '📄',
    pptx: '📊',
    doc: '📝',
    ai: '🤖',
};

export default async function UnitPage({
    params,
}: {
    params: Promise<{ id: string; unitId: string }>;
}) {
    const { id, unitId } = await params;
    const supabase = createClient(await cookies());

    const [{ data: unit, error: unitError }, { data: weeks, error: weeksError }] =
        await Promise.all([
            supabase.from('units').select('*').eq('id', unitId).single(),
            supabase
                .from('weeks')
                .select('*, materials(*)')
                .eq('unit_id', unitId)
                .order('number', { ascending: true }),
        ]);

    if (unitError || !unit) notFound();

    const u = unit as Unit;

    return (
        <div className="p-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                <Link href="/admin/subjects" className="hover:text-gray-600 transition-colors">
                    Asignaturas
                </Link>
                <span className="text-gray-300">/</span>
                <Link href={`/admin/subjects/${id}`} className="hover:text-gray-600 transition-colors">
                    Asignatura
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-600">{u.name}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{u.name}</h1>
                    {u.description && (
                        <p className="mt-1 text-sm text-gray-500 max-w-xl">{u.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <GenerateAllContent unitId={unitId} subjectId={id} />
                    <Link
                        href={`/admin/subjects/${id}/units/${unitId}/weeks/new`}
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        + Nueva semana
                    </Link>
                </div>
            </div>

            {/* Weeks error */}
            {weeksError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                    No se pudieron cargar las semanas: {weeksError.message}
                </div>
            )}

            {/* Empty state */}
            {!weeksError && (!weeks || weeks.length === 0) && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg font-medium">Sin semanas aún</p>
                    <p className="text-sm mt-1">Crea la primera con el botón de arriba.</p>
                </div>
            )}

            {/* Weeks list */}
            {weeks && weeks.length > 0 && (
                <ul className="space-y-4">
                    {(weeks as Week[]).map((week) => (
                        <li key={week.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            {/* Week header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                                        {week.number}
                                    </span>
                                    <div>
                                        {week.title && (
                                            <p className="text-sm font-semibold text-gray-800">{week.title}</p>
                                        )}
                                        {week.description && (
                                            <p className="text-xs text-gray-500 mt-0.5">{week.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GenerateWithAI weekId={week.id} subjectId={id} unitId={unitId} />
                                    <Link
                                        href={`/admin/subjects/${id}/units/${unitId}/weeks/${week.id}/materials/new`}
                                        className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        + Material
                                    </Link>
                                    <Link
                                        href={`/admin/subjects/${id}/units/${unitId}/weeks/${week.id}/edit`}
                                        className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    >
                                        Editar
                                    </Link>
                                    <DeleteRowButton
                                        table="weeks"
                                        id={week.id}
                                        confirmMessage={`¿Eliminar la semana ${week.number}${week.title ? ` "${week.title}"` : ''} y todos sus materiales?`}
                                    />
                                </div>
                            </div>

                            {/* Materials */}
                            {week.materials && week.materials.length > 0 ? (
                                <ul className="divide-y divide-gray-50">
                                    {week.materials.map((material) => (
                                        <li
                                            key={material.id}
                                            className="flex items-center gap-3 px-5 py-3"
                                        >
                                            {/* Type icon */}
                                            <span className="shrink-0 text-lg leading-none">
                                                {TYPE_ICONS[material.type ?? ''] ?? '📁'}
                                            </span>

                                            {/* Name */}
                                            <EditMaterialName materialId={material.id} currentName={material.name} />

                                            {/* Actions */}
                                            <div className="shrink-0 flex items-center gap-2">
                                                <TogglePublish materialId={material.id} isPublished={material.is_published} />
                                                <DeleteMaterial materialId={material.id} fileUrl={material.file_url} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-5 py-3 text-xs text-gray-400">Sin materiales aún.</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
