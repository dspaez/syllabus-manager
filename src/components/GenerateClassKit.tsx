'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { ClassKitContent } from '@/lib/classKit/schema';

interface Props {
    weekId: string;
    subjectName: string;
    weekNumber: number;
    weekTopic: string;
    techStack?: string | null;
    accentColor?: string | null;
}

type Stage = 'form' | 'content' | 'files';
type Theme = 'dark' | 'light';

export default function GenerateClassKit({ weekId, subjectName, weekNumber, weekTopic, techStack, accentColor }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState<Stage>('form');
    const [topic, setTopic] = useState(weekTopic);
    const [theme, setTheme] = useState<Theme>('dark');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [includeGuion, setIncludeGuion] = useState(true);
    const [includeGuia, setIncludeGuia] = useState(true);

    const [contentDraft, setContentDraft] = useState('');
    const [files, setFiles] = useState<{ pptxUrl?: string; guionUrl?: string; guiaUrl?: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    function reset() {
        setStage('form');
        setTopic(weekTopic);
        setTheme('dark');
        setIncludeGuion(true);
        setIncludeGuia(true);
        setError(null);
        setContentDraft('');
        setFiles(null);
        setSaved(false);
    }

    function handleOpen() {
        reset();
        setOpen(true);
    }

    function handleClose() {
        setOpen(false);
    }

    async function handleGenerateContent() {
        if (!topic.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'class_kit',
                    subjectName,
                    weekTopic: topic.trim(),
                    techStack: techStack ?? undefined,
                    include: [
                        'slides',
                        ...(includeGuion ? ['guionDocente'] : []),
                        ...(includeGuia ? ['guiaTecnica'] : []),
                    ],
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar el contenido');
            }

            const data = await res.json() as { content: ClassKitContent };
            setContentDraft(JSON.stringify(data.content, null, 2));
            setStage('content');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleRenderFiles() {
        let parsedContent: unknown;
        try {
            parsedContent = JSON.parse(contentDraft);
        } catch {
            setError('El JSON editado no es válido — revisa la sintaxis antes de generar los archivos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/render-class-kit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: parsedContent,
                    accentColor: accentColor ?? undefined,
                    theme,
                    weekId,
                    subjectName,
                    weekNumber,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar los archivos');
            }

            const data = await res.json() as { pptxUrl?: string; guionUrl?: string; guiaUrl?: string };
            setFiles(data);
            setStage('files');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveAsMaterials() {
        if (!files) return;
        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();
            const label = topic.trim().substring(0, 60);

            const candidates = [
                { name: `Slides: ${label}`, type: 'pptx', file_url: files.pptxUrl },
                { name: `Guión docente: ${label}`, type: 'pdf', file_url: files.guionUrl },
                { name: `Guía técnica: ${label}`, type: 'pdf', file_url: files.guiaUrl },
            ];
            // Solo se crea un material por archivo realmente generado — si no se pidió
            // guión/guía, su URL no vino en la respuesta y no debe insertarse un registro vacío.
            const rows = candidates
                .filter((r): r is typeof r & { file_url: string } => Boolean(r.file_url))
                .map((r) => ({ ...r, week_id: weekId, source: 'ai', is_published: false }));

            const { error: dbError } = await supabase.from('materials').insert(rows);
            if (dbError) throw dbError;

            setSaved(true);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                title="Generar kit de clase completo (slides + guión docente + guía técnica)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 10.5v-6ZM5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Z" />
                </svg>
                Class Kit
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Class Kit — <span className="text-amber-700">{subjectName}</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Slides + guión docente + guía técnica en un solo kit.
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">{error}</p>
                        )}

                        {/* Stage 1: form */}
                        {stage === 'form' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Tema de la clase</label>
                                    <textarea
                                        rows={2}
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">Qué incluir</label>
                                    <label className="flex items-center gap-2 text-sm text-gray-500">
                                        <input type="checkbox" checked disabled className="size-4 rounded border-gray-300 text-amber-600" />
                                        Presentación (slides) — siempre incluida
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={includeGuion}
                                            onChange={(e) => setIncludeGuion(e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        Guión docente
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={includeGuia}
                                            onChange={(e) => setIncludeGuia(e.target.checked)}
                                            className="size-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        Guía técnica
                                    </label>
                                </div>

                                <button
                                    onClick={handleGenerateContent}
                                    disabled={loading || !topic.trim()}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Generando contenido...' : 'Generar contenido'}
                                </button>
                            </div>
                        )}

                        {/* Stage 2: review/edit JSON content before rendering files */}
                        {stage === 'content' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">
                                        Revisa y edita el contenido antes de generar los archivos
                                    </label>
                                    <textarea
                                        rows={18}
                                        value={contentDraft}
                                        onChange={(e) => setContentDraft(e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Tema</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTheme('dark')}
                                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                theme === 'dark'
                                                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                                                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Oscuro
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTheme('light')}
                                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                                theme === 'light'
                                                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                                                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Claro
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Claro es mejor para proyectores/aulas con mucha luz. El color de acento de portada y tags viene de la materia.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStage('form')}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        onClick={handleRenderFiles}
                                        disabled={loading}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading ? 'Generando archivos...' : 'Generar archivos finales'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Stage 3: files ready — explicit confirm to save as materials */}
                        {stage === 'files' && files && (
                            <div className="flex flex-col gap-3">
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                                    {files.pptxUrl && (
                                        <a href={files.pptxUrl} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-amber-700 hover:underline">
                                            ↓ Descargar slides (.pptx)
                                        </a>
                                    )}
                                    {files.guionUrl && (
                                        <a href={files.guionUrl} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-amber-700 hover:underline">
                                            ↓ Descargar guión docente (.pdf)
                                        </a>
                                    )}
                                    {files.guiaUrl && (
                                        <a href={files.guiaUrl} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-amber-700 hover:underline">
                                            ↓ Descargar guía técnica (.pdf)
                                        </a>
                                    )}
                                </div>

                                {saved ? (
                                    <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200 text-center">
                                        ✓ Class kit guardado como materiales de la semana
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleSaveAsMaterials}
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {saving ? 'Guardando...' : 'Guardar como materiales de la semana'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
