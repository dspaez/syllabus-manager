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
    source: string | null;
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
    order: number | null;
};

type Subject = {
    color: string | null;
    name: string;
};

function MaterialTypeIcon({ type, source }: { type: string | null; source: string | null }) {
    const isAI = source === 'ai';

    if (isAI) return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-emerald-600 dark:text-emerald-400">
                <path fillRule="evenodd" d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25V4.75A1.75 1.75 0 0 0 16.25 3H3.75Zm2.5 4.25A.75.75 0 0 1 7 8v4a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75Zm6.75 0a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75ZM8.75 9a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 8.75 9Zm0 2a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
        </div>
    );
    if (type === 'pdf') return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-red-600 dark:text-red-400">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V7.56a2.25 2.25 0 0 0-.66-1.59l-3.31-3.31A2.25 2.25 0 0 0 12.44 2H4.25Zm1.5 7.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
        </div>
    );
    if (type === 'pptx') return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-violet-600 dark:text-violet-400">
                <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25V4.75A1.75 1.75 0 0 0 16.25 3H3.75ZM5 7.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V8H5.75A.75.75 0 0 1 5 7.25Zm7.5 0a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0v-5.5Z" />
            </svg>
        </div>
    );
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-blue-600 dark:text-blue-400">
                <path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.243Z" clipRule="evenodd" />
            </svg>
        </div>
    );
}

function getMaterialBadge(type: string | null, source: string | null) {
    if (source === 'ai') return { label: 'Slides IA', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    if (type === 'pdf') return { label: 'PDF', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    if (type === 'pptx') return { label: 'PPTX', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
    if (type === 'doc') return { label: 'DOC', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    return { label: 'Archivo', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
}

export default async function UnitPage({
    params,
}: {
    params: Promise<{ id: string; unitId: string }>;
}) {
    const { id, unitId } = await params;
    const supabase = createClient(await cookies());

    const [
        { data: unit, error: unitError },
        { data: weeks, error: weeksError },
        { data: subject },
    ] = await Promise.all([
        supabase.from('units').select('*').eq('id', unitId).single(),
        supabase
            .from('weeks')
            .select('*, materials(*)')
            .eq('unit_id', unitId)
            .order('number', { ascending: true }),
        supabase.from('subjects').select('color, name').eq('id', id).single(),
    ]);

    if (unitError || !unit) notFound();

    const u = unit as Unit;
    const s = subject as Subject | null;
    const accent = s?.color ?? '#2563eb';

    const totalMaterials = (weeks ?? []).reduce(
        (acc, w) => acc + (w.materials?.length ?? 0), 0
    );
    const publishedMaterials = (weeks ?? []).reduce(
        (acc, w) => acc + (w.materials ?? []).filter((m: Material) => m.is_published).length, 0
    );

    return (
        <div className="p-6 lg:p-8 space-y-5">

            {/* ── Header ── */}
            <div
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
                style={{ borderLeft: `4px solid ${accent}` }}
            >
                <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                    <div className="min-w-0">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2 flex-wrap">
                            <Link href="/admin/subjects" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Asignaturas</Link>
                            <span>/</span>
                            <Link href={`/admin/subjects/${id}`} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                {s?.name ?? 'Asignatura'}
                            </Link>
                            <span>/</span>
                            <span className="text-slate-600 dark:text-slate-300 truncate">{u.name}</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {u.name}
                        </h1>
                        {u.description && (
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xl">{u.description}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <GenerateAllContent unitId={unitId} subjectId={id} />
                        <Link
                            href={`/admin/subjects/${id}/units/${unitId}/weeks/new`}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: accent }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                            </svg>
                            Nueva semana
                        </Link>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="flex items-center divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                    {[
                        { label: 'Semanas', value: (weeks ?? []).length },
                        { label: 'Materiales', value: totalMaterials },
                        { label: 'Publicados', value: publishedMaterials },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex-1 px-5 py-3 text-center">
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Error ── */}
            {weeksError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    No se pudieron cargar las semanas: {weeksError.message}
                </div>
            )}

            {/* ── Empty state ── */}
            {!weeksError && (!weeks || weeks.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-slate-300 dark:text-slate-600 mb-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <p className="text-base font-bold text-slate-500 dark:text-slate-400">Sin semanas aún</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-5">Crea la primera semana para comenzar.</p>
                    <Link
                        href={`/admin/subjects/${id}/units/${unitId}/weeks/new`}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                        style={{ background: accent }}
                    >
                        + Nueva semana
                    </Link>
                </div>
            )}

            {/* ── Weeks list ── */}
            {weeks && weeks.length > 0 && (
                <ul className="space-y-3">
                    {(weeks as Week[]).map((week) => {
                        const matCount = week.materials?.length ?? 0;
                        const pubCount = (week.materials ?? []).filter((m) => m.is_published).length;

                        return (
                            <li
                                key={week.id}
                                className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
                            >
                                {/* Week header */}
                                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                                            style={{ background: accent }}
                                        >
                                            {week.number}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {week.title ?? `Semana ${week.number}`}
                                            </p>
                                            {week.description && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{week.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                        {/* Material count badge */}
                                        {matCount > 0 && (
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                {pubCount}/{matCount} pub.
                                            </span>
                                        )}
                                        <GenerateWithAI weekId={week.id} subjectId={id} unitId={unitId} />
                                        <Link
                                            href={`/admin/subjects/${id}/units/${unitId}/weeks/${week.id}/materials/new`}
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                                                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                                            </svg>
                                            Material
                                        </Link>
                                        <Link
                                            href={`/admin/subjects/${id}/units/${unitId}/weeks/${week.id}/edit`}
                                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                            </svg>
                                        </Link>
                                        <DeleteRowButton
                                            table="weeks"
                                            id={week.id}
                                            confirmMessage={`¿Eliminar la semana ${week.number}${week.title ? ` "${week.title}"` : ''} y todos sus materiales?`}
                                        />
                                    </div>
                                </div>

                                {/* Materials list */}
                                {week.materials && week.materials.length > 0 ? (
                                    <ul className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                        {week.materials.map((material: Material) => {
                                            const badge = getMaterialBadge(material.type, material.source);
                                            return (
                                                <li
                                                    key={material.id}
                                                    className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 dark:bg-slate-800/20"
                                                >
                                                    <MaterialTypeIcon type={material.type} source={material.source} />

                                                    {/* Name (editable) */}
                                                    <div className="flex-1 min-w-0">
                                                        <EditMaterialName materialId={material.id} currentName={material.name} />
                                                    </div>

                                                    {/* Type badge */}
                                                    <span
                                                        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex"
                                                        style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
                                                    >
                                                        {badge.label}
                                                    </span>

                                                    {/* Actions */}
                                                    <div className="shrink-0 flex items-center gap-1.5">
                                                        {material.source === 'ai' && (
                                                            <Link
                                                                href={`/materials/${material.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                                title="Vista previa"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                                                                    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                                                                    <path fillRule="evenodd" d="M1.38 8.28a.87.87 0 0 1 0-.566 7.003 7.003 0 0 1 13.238.006.87.87 0 0 1 0 .566A7.003 7.003 0 0 1 1.379 8.28ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
                                                                </svg>
                                                            </Link>
                                                        )}
                                                        <TogglePublish materialId={material.id} isPublished={material.is_published} />
                                                        <DeleteMaterial materialId={material.id} fileUrl={material.file_url} />
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="px-5 py-3 text-xs text-slate-400 dark:text-slate-500 italic">
                                        Sin materiales — usa "Material" o genera con IA.
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
