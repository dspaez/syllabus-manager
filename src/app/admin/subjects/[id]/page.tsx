import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DeleteRowButton from '@/components/DeleteRowButton';
import CurriculumPlanner from '@/components/CurriculumPlanner';
import ExportSyllabus from '@/components/ExportSyllabus';
import { subjectEmoji } from '@/utils/subjectEmoji';

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
        number: number;
        title: string | null;
        materials: { id: string; is_published: boolean }[];
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
                .select('id, name, description, order, weeks(id, number, title, materials(id, is_published))')
                .eq('subject_id', id)
                .order('order', { ascending: true }),
        ]);

    if (subjectError || !subject) notFound();

    const s = subject as Subject;
    const typedUnits = (units ?? []) as Unit[];
    const accent = s.color ?? '#1e40af';
    const emoji = subjectEmoji(s.name);

    const totalWeeks = typedUnits.reduce((acc, u) => acc + (u.weeks?.length ?? 0), 0);
    const totalMaterials = typedUnits.reduce(
        (acc, u) => acc + (u.weeks ?? []).reduce((wa, w) => wa + (w.materials?.length ?? 0), 0), 0
    );
    const publishedMaterials = typedUnits.reduce(
        (acc, u) => acc + (u.weeks ?? []).reduce((wa, w) =>
            wa + (w.materials ?? []).filter((m) => m.is_published).length, 0), 0
    );

    return (
        <div className="p-6 lg:p-8 space-y-6">

            {/* ── Subject header ── */}
            <div
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
                style={{ borderLeft: `4px solid ${accent}` }}
            >
                <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                    <div className="min-w-0 flex items-start gap-4">
                        <span
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                            style={{ background: `${accent}18` }}
                        >
                            {emoji}
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Link href="/admin/subjects" className="text-xs text-slate-400 hover:text-slate-600 transition-colors dark:text-slate-500">
                                    Asignaturas
                                </Link>
                                <span className="text-slate-300 dark:text-slate-700">/</span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                            </div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                {s.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {s.semesters?.name && (
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                                        style={{ background: `${accent}12`, color: accent, borderColor: `${accent}30` }}
                                    >
                                        {s.semesters.name}
                                    </span>
                                )}
                                {s.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{s.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <CurriculumPlanner subjectId={s.id} subjectName={s.name} />
                        <ExportSyllabus subjectId={s.id} subjectName={s.name} />
                        <Link
                            href={`/admin/subjects/${id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                            </svg>
                            Editar
                        </Link>
                        <Link
                            href={`/admin/subjects/${id}/units/new`}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors"
                            style={{ background: accent }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                            </svg>
                            Nueva unidad
                        </Link>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="flex items-center gap-0 border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
                    {[
                        { label: 'Unidades', value: typedUnits.length },
                        { label: 'Semanas', value: totalWeeks },
                        { label: 'Materiales', value: totalMaterials },
                        { label: 'Publicados', value: publishedMaterials },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex-1 px-5 py-3 text-center">
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{value}</p>
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Error state ── */}
            {unitsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    No se pudieron cargar las unidades: {unitsError.message}
                </div>
            )}

            {/* ── Empty state ── */}
            {!unitsError && typedUnits.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-slate-300 dark:text-slate-600 mb-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                    <p className="text-base font-bold text-slate-500 dark:text-slate-400">Sin unidades aún</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-5">Crea la primera unidad para comenzar el programa.</p>
                    <Link
                        href={`/admin/subjects/${id}/units/new`}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                        style={{ background: accent }}
                    >
                        + Nueva unidad
                    </Link>
                </div>
            )}

            {/* ── Units list ── */}
            {typedUnits.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
                    <ul className="space-y-3">
                        {typedUnits.map((unit) => {
                            const weekCount = unit.weeks?.length ?? 0;
                            const matCount = (unit.weeks ?? []).reduce((a, w) => a + (w.materials?.length ?? 0), 0);
                            const pubCount = (unit.weeks ?? []).reduce((a, w) =>
                                a + (w.materials ?? []).filter((m) => m.is_published).length, 0);

                            return (
                                <li key={unit.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                                    {/* Unit header */}
                                    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                        <span
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                                            style={{ background: accent }}
                                        >
                                            {unit.order}
                                        </span>
                                        <Link
                                            href={`/admin/subjects/${id}/units/${unit.id}`}
                                            className="flex-1 min-w-0 group"
                                        >
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors truncate">
                                                {unit.name}
                                            </p>
                                            {unit.description && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{unit.description}</p>
                                            )}
                                        </Link>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Link
                                                href={`/admin/subjects/${id}/units/${unit.id}/edit`}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                                    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                                </svg>
                                            </Link>
                                            <DeleteRowButton
                                                table="units"
                                                id={unit.id}
                                                confirmMessage={`¿Eliminar la unidad "${unit.name}" y todas sus semanas y materiales?`}
                                            />
                                        </div>
                                    </div>

                                    {/* Unit stats + weeks preview */}
                                    <div className="px-5 py-3 flex items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{weekCount}</span> semanas
                                            </span>
                                            <span className="text-slate-200 dark:text-slate-700">·</span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{matCount}</span> materiales
                                            </span>
                                            {matCount > 0 && (
                                                <>
                                                    <span className="text-slate-200 dark:text-slate-700">·</span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{pubCount}</span> publicados
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <Link
                                            href={`/admin/subjects/${id}/units/${unit.id}`}
                                            className="text-xs font-semibold transition-colors"
                                            style={{ color: accent }}
                                        >
                                            Ver semanas →
                                        </Link>
                                    </div>

                                    {/* Weeks quick preview */}
                                    {unit.weeks && unit.weeks.length > 0 && (
                                        <div className="px-5 pb-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {unit.weeks
                                                    .sort((a, b) => a.number - b.number)
                                                    .slice(0, 8)
                                                    .map((week) => (
                                                        <Link
                                                            key={week.id}
                                                            href={`/admin/subjects/${id}/units/${unit.id}`}
                                                            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                                                            style={{
                                                                borderColor: `${accent}30`,
                                                                background: `${accent}08`,
                                                                color: accent,
                                                            }}
                                                        >
                                                            S{week.number}
                                                            {week.materials && week.materials.length > 0 && (
                                                                <span className="text-slate-400 dark:text-slate-500">
                                                                    {week.materials.length}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    ))}
                                                {unit.weeks.length > 8 && (
                                                    <span className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                                                        +{unit.weeks.length - 8}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {/* Sidebar summary */}
                    <aside className="space-y-4 h-fit">
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Resumen</p>
                            </div>
                            <div className="p-4 space-y-3">
                                {[
                                    { label: 'Unidades', value: typedUnits.length, color: accent },
                                    { label: 'Semanas totales', value: totalWeeks, color: accent },
                                    { label: 'Materiales totales', value: totalMaterials, color: accent },
                                    { label: 'Publicados', value: publishedMaterials, color: '#059669' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                                        <span className="text-sm font-black" style={{ color }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Link
                            href={`/admin/subjects/${id}/units/new`}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: accent }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                            </svg>
                            Agregar unidad
                        </Link>
                    </aside>
                </div>
            )}
        </div>
    );
}
