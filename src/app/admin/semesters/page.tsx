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

export default async function SemestersPage() {
    const supabase = createClient(await cookies());
    const { data: semesters, error } = await supabase
        .from('semesters')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Semestres</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona los períodos académicos del sistema.</p>
                </div>
                <Link
                    href="/admin/semesters/new"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                    <span className="text-base leading-none">＋</span>
                    Nuevo semestre
                </Link>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                    No se pudieron cargar los semestres: {error.message}
                </div>
            )}

            {/* Empty state */}
            {!error && (!semesters || semesters.length === 0) && (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl text-center py-20">
                    <p className="text-3xl mb-3">📅</p>
                    <p className="text-base font-semibold text-gray-600">Sin semestres aún</p>
                    <p className="text-sm text-gray-400 mt-1">Crea el primero con el botón de arriba.</p>
                </div>
            )}

            {/* Table */}
            {semesters && semesters.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Nombre
                                </th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Período
                                </th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Estado
                                </th>
                                <th className="px-6 py-3.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(semesters as Semester[]).map((semester) => (
                                <tr
                                    key={semester.id}
                                    className={`hover:bg-blue-50/50 transition-colors ${semester.is_active ? 'border-l-2 border-emerald-500' : ''}`}
                                >
                                    <td className="px-6 py-4 font-semibold text-gray-800">
                                        {semester.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {formatDate(semester.start_date)} — {formatDate(semester.end_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${semester.is_active
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${semester.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                            {semester.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/semesters/${semester.id}/edit`}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                            >
                                                {/* Pencil SVG */}
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

