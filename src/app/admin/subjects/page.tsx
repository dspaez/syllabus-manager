import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import DeleteRowButton from '@/components/DeleteRowButton';

type Material = {
    id: string;
};

type Week = {
    id: string;
    materials: Material[];
};

type Unit = {
    id: string;
    weeks: Week[];
};

type Subject = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    created_at: string;
    semester_id: string | null;
    semesters: { name: string } | null;
    units: Unit[];
};

function initials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

function getSubjectStats(units: Unit[]) {
    const unitCount = units.length;
    const weekCount = units.reduce((acc, unit) => acc + (unit.weeks?.length ?? 0), 0);
    const materialCount = units.reduce(
        (acc, unit) => acc + (unit.weeks ?? []).reduce((weekAcc, week) => weekAcc + (week.materials?.length ?? 0), 0),
        0
    );

    return { unitCount, weekCount, materialCount };
}

export default async function SubjectsPage({
    searchParams,
}: {
    searchParams?: Promise<{ semester?: string }>;
}) {
    const params = await searchParams;
    const semesterFilter =
        params?.semester && params.semester.trim() !== '' ? params.semester : undefined;
    const supabase = createClient(await cookies());

    const semestersRequest = supabase
        .from('semesters')
        .select('id, name')
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

    let subjectRequest = supabase
        .from('subjects')
        .select('id, name, description, color, created_at, semester_id, semesters(name), units(id, weeks(id, materials(id)))')
        .order('created_at', { ascending: false });

    if (semesterFilter) {
        subjectRequest = subjectRequest.eq('semester_id', semesterFilter);
    }

    const [{ data: subjects, error }, { data: semesters }] = await Promise.all([
        subjectRequest,
        semestersRequest,
    ]);

    const typedSubjects = (subjects ?? []) as Subject[];
    const totalSubjects = typedSubjects.length;
    const totalUnits = typedSubjects.reduce((acc, subject) => acc + (subject.units?.length ?? 0), 0);
    const activeFilterName =
        semesters?.find((semester) => semester.id === semesterFilter)?.name ?? null;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Asignaturas</h1>
                    <p className="text-sm text-slate-500 mt-1">Administra materias, unidades y recursos de cada semestre.</p>
                </div>
                <Link
                    href="/admin/subjects/new"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-violet-700 text-white text-sm font-semibold px-5 py-3 shadow-lg shadow-blue-200/60 hover:shadow-xl transition-shadow"
                >
                    <span className="text-base leading-none">＋</span>
                    Nueva asignatura
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total asignaturas</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{totalSubjects}</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Unidades</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{totalUnits}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Filtro semestre</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 truncate">{activeFilterName ?? 'Todos'}</p>
                </div>
            </div>

            <div className="mb-7 flex flex-wrap gap-2">
                <Link
                    href="/admin/subjects"
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${!semesterFilter
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                        }`}
                >
                    Todos
                </Link>
                {(semesters ?? []).map((semester) => (
                    <Link
                        key={semester.id}
                        href={`/admin/subjects?semester=${semester.id}`}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${semesterFilter === semester.id
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700'
                            }`}
                    >
                        {semester.name}
                    </Link>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                    No se pudieron cargar las asignaturas: {error.message}
                </div>
            )}

            {/* Empty state */}
            {!error && (!subjects || subjects.length === 0) && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 text-center py-20 px-6">
                    <p className="text-5xl mb-4">🚀</p>
                    <p className="text-lg font-bold text-slate-700">Aún no hay asignaturas en este filtro</p>
                    <p className="text-sm text-slate-500 mt-1">Crea una asignatura nueva para comenzar a estructurar el contenido.</p>
                </div>
            )}

            {/* Cards grid */}
            {subjects && subjects.length > 0 && (
                <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {(subjects as Subject[]).map((subject) => {
                        const accentColor = subject.color ?? '#94a3b8';
                        const { unitCount, weekCount, materialCount } = getSubjectStats(subject.units ?? []);
                        return (
                            <li key={subject.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/60 transition-all duration-200 overflow-hidden flex flex-col">
                                {/* Color banner */}
                                <Link
                                    href={`/admin/subjects/${subject.id}`}
                                    className="relative h-36 w-full flex flex-col items-start justify-end overflow-hidden p-5"
                                    style={{ background: `linear-gradient(135deg, ${accentColor}f2 0%, ${accentColor}b3 55%, #7c3aedb3 100%)` }}
                                >
                                    <div
                                        className="pointer-events-none absolute inset-0 opacity-20"
                                        style={{
                                            backgroundImage: 'linear-gradient(120deg, rgba(255,255,255,.24) 10%, transparent 10%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 60%, transparent 60%, transparent)',
                                            backgroundSize: '36px 36px',
                                        }}
                                    />
                                    {/* Semester badge — top right */}
                                    {subject.semesters?.name && (
                                        <span className="absolute top-3 right-4 text-xs font-semibold text-white bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                            {subject.semesters.name}
                                        </span>
                                    )}
                                    <span className="relative z-10 text-4xl font-black text-white/95 tracking-tight select-none drop-shadow">
                                        {initials(subject.name)}
                                    </span>
                                    <span className="relative z-10 mt-2 text-xs font-semibold text-white/90">
                                        {materialCount} materiales
                                    </span>
                                </Link>

                                {/* Card body */}
                                <Link
                                    href={`/admin/subjects/${subject.id}`}
                                    className="flex flex-col gap-3 px-5 pt-4 pb-3 flex-1"
                                >
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-slate-800 truncate leading-tight group-hover:text-blue-700 transition-colors">
                                            {subject.name}
                                        </p>
                                    </div>

                                    {/* Description */}
                                    {subject.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                            {subject.description}
                                        </p>
                                    )}

                                    <div className="mt-auto grid grid-cols-3 gap-2">
                                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-2 text-center">
                                            <p className="text-sm font-black text-slate-800">{unitCount}</p>
                                            <p className="text-[11px] text-slate-500">Unidades</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-2 text-center">
                                            <p className="text-sm font-black text-slate-800">{weekCount}</p>
                                            <p className="text-[11px] text-slate-500">Semanas</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-2 py-2 text-center">
                                            <p className="text-sm font-black text-slate-800">{materialCount}</p>
                                            <p className="text-[11px] text-slate-500">Materiales</p>
                                        </div>
                                    </div>
                                </Link>

                                {/* Fixed action bar */}
                                <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                                    <Link
                                        href={`/admin/subjects/${subject.id}/edit`}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                    >
                                        {/* Pencil SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                                            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                        </svg>
                                        Editar
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
