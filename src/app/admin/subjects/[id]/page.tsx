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
    weeks: {
        id: string;
        materials: { id: string }[];
    }[];
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
            supabase
                .from('units')
                .select('id, name, description, order, weeks(id, materials(id))')
                .eq('subject_id', id)
                .order('order', { ascending: true }),
        ]);

    if (subjectError || !subject) notFound();

    const s = subject as Subject;
    const typedUnits = (units ?? []) as Unit[];
    const totalWeeks = typedUnits.reduce((acc, unit) => acc + (unit.weeks?.length ?? 0), 0);
    const totalMaterials = typedUnits.reduce(
        (acc, unit) => acc + (unit.weeks ?? []).reduce((weeksAcc, week) => weeksAcc + (week.materials?.length ?? 0), 0),
        0
    );
    const accent = s.color ?? '#1e40af';

    return (
        <div className="p-8">
            <div
                className="mb-8 rounded-3xl border border-slate-200 px-6 py-6 shadow-sm"
                style={{
                    background: `linear-gradient(135deg, ${accent}20 0%, #ffffff 35%, #7c3aed12 100%)`,
                }}
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/admin/subjects" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                Asignaturas
                            </Link>
                            <span className="text-slate-300">/</span>
                            <span className="text-sm text-slate-700 truncate">{s.name}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{s.name}</h1>
                        {s.semesters?.name && (
                            <span className="inline-block mt-2 text-xs font-semibold bg-white/80 border border-white px-3 py-1 rounded-full text-slate-700">
                                {s.semesters.name}
                            </span>
                        )}
                        {s.description && (
                            <p className="mt-2 text-sm text-slate-600 max-w-2xl">{s.description}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <CurriculumPlanner subjectId={s.id} subjectName={s.name} />
                        <ExportSyllabus subjectId={s.id} subjectName={s.name} />
                        <Link
                            href={`/admin/subjects/${id}/units/new`}
                            className="shrink-0 rounded-xl bg-gradient-to-r from-blue-700 to-violet-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-blue-200 hover:shadow-lg transition-shadow"
                        >
                            + Nueva unidad
                        </Link>
                    </div>
                </div>
            </div>

            {unitsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                    No se pudieron cargar las unidades: {unitsError.message}
                </div>
            )}

            {!unitsError && (!units || units.length === 0) && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 text-center py-20 text-slate-500">
                    <p className="text-lg font-bold">Sin unidades aún</p>
                    <p className="text-sm mt-1">Crea la primera con el botón superior para comenzar el programa.</p>
                </div>
            )}

            {units && units.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-[1.25fr,360px] gap-6">
                    <ul className="space-y-4">
                        {typedUnits.map((unit) => {
                            const weekCount = unit.weeks?.length ?? 0;
                            const materialCount = (unit.weeks ?? []).reduce(
                                (acc, week) => acc + (week.materials?.length ?? 0),
                                0
                            );

                            return (
                                <li key={unit.id} className="relative pl-9">
                                    <span
                                        className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-blue-300 via-violet-300 to-transparent"
                                    />
                                    <span
                                        className="absolute left-0 top-6 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-[11px] font-black text-white"
                                        style={{ backgroundColor: accent }}
                                    >
                                        {unit.order}
                                    </span>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-wrap items-start gap-3">
                                            <Link href={`/admin/subjects/${id}/units/${unit.id}`} className="min-w-0 flex-1 group">
                                                <p className="text-base font-black text-slate-800 group-hover:text-blue-700 transition-colors">
                                                    {unit.name}
                                                </p>
                                                {unit.description && (
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{unit.description}</p>
                                                )}
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/subjects/${id}/units/${unit.id}/edit`}
                                                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
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
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                                <p className="text-xs text-slate-500">Semanas</p>
                                                <p className="text-lg font-black text-slate-800">{weekCount}</p>
                                            </div>
                                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                                <p className="text-xs text-slate-500">Materiales</p>
                                                <p className="text-lg font-black text-slate-800">{materialCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xs font-black tracking-wide uppercase text-slate-500 mb-4">Resumen</h2>
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Unidades</p>
                                <p className="text-3xl font-black text-slate-900">{typedUnits.length}</p>
                            </div>
                            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                                <p className="text-xs text-violet-700 font-semibold uppercase tracking-wide">Semanas</p>
                                <p className="text-3xl font-black text-slate-900">{totalWeeks}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Materiales</p>
                                <p className="text-3xl font-black text-slate-900">{totalMaterials}</p>
                            </div>
                        </div>
                        <Link
                            href={`/admin/subjects/${id}/units/new`}
                            className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                            + Agregar unidad
                        </Link>
                    </aside>
                </div>
            )}
        </div>
    );
}
