import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import DeleteRowButton from '@/components/DeleteRowButton';

type Semester = {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
};

function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function periodProgress(startDate: string | null, endDate: string | null) {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
}

export default async function SemestersPage() {
    const supabase = createClient(await cookies());
    const { data: semesters, error } = await supabase
        .from('semesters')
        .select('*')
        .order('created_at', { ascending: false });

    const typedSemesters = (semesters ?? []) as Semester[];
    const activeCount = typedSemesters.filter((semester) => semester.is_active).length;

    return (
        <div className="p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Semestres</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestiona períodos académicos y su avance temporal.</p>
                </div>
                <Link
                    href="/admin/semesters/new"
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-violet-700 text-white text-sm font-semibold px-5 py-3 shadow-lg shadow-blue-200/60 hover:shadow-xl transition-shadow"
                >
                    <span className="text-base leading-none">＋</span>
                    Nuevo semestre
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{typedSemesters.length}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Activos</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{activeCount}</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Estado general</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">Timeline académico</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                    No se pudieron cargar los semestres: {error.message}
                </div>
            )}

            {!error && (!semesters || semesters.length === 0) && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 text-center py-20">
                    <p className="text-4xl mb-3">📅</p>
                    <p className="text-base font-bold text-slate-600">Sin semestres aún</p>
                    <p className="text-sm text-slate-500 mt-1">Crea el primero con el botón superior.</p>
                </div>
            )}

            {semesters && semesters.length > 0 && (
                <ul className="space-y-4">
                    {typedSemesters.map((semester) => {
                        const progress = periodProgress(semester.start_date, semester.end_date);

                        return (
                            <li
                                key={semester.id}
                                className={`rounded-3xl border p-5 shadow-sm transition-all ${semester.is_active
                                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-blue-50 shadow-emerald-100/60'
                                    : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-black text-slate-900 truncate">{semester.name}</h2>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${semester.is_active
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${semester.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                {semester.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {formatDate(semester.start_date)} — {formatDate(semester.end_date)}
                                        </p>

                                        <div className="mt-4">
                                            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                                                <span>Progreso del período</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${semester.is_active
                                                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500'
                                                        : 'bg-gradient-to-r from-slate-400 to-slate-300'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-2">
                                        <Link
                                            href={`/admin/semesters/${semester.id}/edit`}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                                                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                            </svg>
                                            Editar
                                        </Link>
                                        <DeleteRowButton
                                            table="semesters"
                                            id={semester.id}
                                            confirmMessage={`¿Eliminar el semestre "${semester.name}"?`}
                                        />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
