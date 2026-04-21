'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const MATERIAL_TYPES = ['pdf', 'pptx', 'doc', 'link', 'img'] as const;

export default function NewMaterialPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string; weekId: string }>;
}) {
  const { id, unitId, weekId } = use(params);
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<string>(MATERIAL_TYPES[0]);
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const backHref = `/admin/subjects/${id}/units/${unitId}`;

  const sanitizeFileName = (name: string) => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    let fileUrl: string | null = null;

    if (file) {
      const sanitizedName = sanitizeFileName(file.name);
      const path = `${weekId}/${Date.now()}-${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file);

      if (uploadError) {
        setError(`Error al subir el archivo: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('materials').insert({
      name,
      type,
      description: description || null,
      is_published: isPublished,
      file_url: fileUrl,
      week_id: weekId,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(backHref);
  };

  return (
    <div className="p-8 max-w-lg">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400 flex-wrap">
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
        <span className="text-gray-600">Nuevo material</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Nuevo material</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5"
      >
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Presentación Semana 1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tipo */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
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
            placeholder="Descripción breve del material"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Archivo */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Archivo
          </label>
          <input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors"
          />
        </div>

        {/* is_published */}
        <div className="flex items-center gap-3">
          <input
            id="is_published"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
            Publicar inmediatamente
          </label>
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
