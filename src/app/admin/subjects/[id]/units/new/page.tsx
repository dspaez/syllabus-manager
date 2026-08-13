'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function NewUnitPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [order, setOrder] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.from('units').insert({
            name,
            description: description || null,
            order,
            subject_id: id,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push(`/admin/subjects/${id}`);
    };

    return (
        <div className="p-8 max-w-lg">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-400 dark:text-slate-500">
                <Link href="/admin/subjects" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    Asignaturas
                </Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <Link href={`/admin/subjects/${id}`} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    Detalle
                </Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-slate-600 dark:text-slate-400">Nueva unidad</span>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Nueva unidad</h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-5"
            >
                {/* Nombre */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Límites y continuidad"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción breve de la unidad"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Orden */}
                <div className="w-32">
                    <label htmlFor="order" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Orden
                    </label>
                    <input
                        id="order"
                        type="number"
                        min={1}
                        value={order}
                        onChange={(e) => setOrder(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2 transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">
                        {error}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-[background-color,transform] duration-100 ease-snappy active:scale-[0.98]"
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <Link
                        href={`/admin/subjects/${id}`}
                        className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
}
