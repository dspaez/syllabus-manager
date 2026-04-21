'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function NewWeekPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = use(params);
  const router = useRouter();
  const [number, setNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const backHref = `/admin/subjects/${id}/units/${unitId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from('weeks').insert({
      number,
      title: title || null,
      description: description || null,
      unit_id: unitId,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(backHref);
  };

  return (
    <div className="p-8 max-w-lg">
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
        <Link href={backHref} className="hover:text-gray-600 transition-colors">
          Unidad
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-600">Nueva semana</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Nueva semana</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5"
      >
        {/* Número */}
        <div className="w-32">
          <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
            Número <span className="text-red-500">*</span>
          </label>
          <input
            id="number"
            type="number"
            required
            min={1}
            value={number}
            onChange={(e) => setNumber(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Introducción a derivadas"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción breve de la semana"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <Link
            href={backHref}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
