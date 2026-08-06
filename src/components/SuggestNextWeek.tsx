'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface RecentWeek {
    title: string | null;
    description: string | null;
    exerciseTitle: string | null;
}

interface Props {
    unitId: string;
    targetWeekId: string | null;
    targetWeekNumber: number;
    subjectName: string;
    subjectDescription?: string | null;
    courseMode: string | null;
    techStack?: string | null;
    technicalDocument?: string | null;
    recentWeeks: RecentWeek[];
    accent: string;
}

type Stage = 'idle' | 'result';

export default function SuggestNextWeek({
    unitId, targetWeekId, targetWeekNumber, subjectName, subjectDescription,
    courseMode, techStack, technicalDocument, recentWeeks, accent,
}: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState<Stage>('idle');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const hasRealContext = courseMode === 'project'
        ? Boolean(technicalDocument?.trim())
        : recentWeeks.length > 0;

    function reset() {
        setStage('idle');
        setError(null);
        setTitle('');
        setDescription('');
        setSaving(false);
        setSaved(false);
    }

    function handleOpen() {
        reset();
        setOpen(true);
    }

    function handleClose() {
        setOpen(false);
    }

    async function handleGenerate() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'suggest_next_week',
                    subjectName,
                    subjectDescription: subjectDescription ?? undefined,
                    courseMode,
                    techStack: techStack ?? undefined,
                    technicalDocument: courseMode === 'project' ? (technicalDocument ?? undefined) : undefined,
                    recentWeeks: courseMode === 'topics' ? recentWeeks : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar la sugerencia');
            }

            const data = await res.json() as { title: string; description: string };
            setTitle(data.title);
            setDescription(data.description);
            setStage('result');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!title.trim()) return;
        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();
            if (targetWeekId) {
                const { error: dbError } = await supabase
                    .from('weeks')
                    .update({ title: title.trim(), description: description.trim() || null })
                    .eq('id', targetWeekId);
                if (dbError) throw dbError;
            } else {
                const { error: dbError } = await supabase
                    .from('weeks')
                    .insert({
                        unit_id: unitId,
                        number: targetWeekNumber,
                        title: title.trim(),
                        description: description.trim() || null,
                    });
                if (dbError) throw dbError;
            }

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
                className="inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ borderColor: accent, color: accent }}
                title="Proponer el tema de la próxima semana según cómo avanzó realmente la clase"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                    <path d="M8 1a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-1.5 0v-.5A.75.75 0 0 1 8 1ZM3.05 3.05a.75.75 0 0 1 1.06 0l.354.353a.75.75 0 1 1-1.06 1.061l-.354-.353a.75.75 0 0 1 0-1.061Zm9.9 0a.75.75 0 0 1 0 1.06l-.353.354a.75.75 0 1 1-1.061-1.06l.353-.354a.75.75 0 0 1 1.061 0ZM8 4.5a3.5 3.5 0 0 0-2 6.368V12.5a.75.75 0 0 0 .75.75h2.5a.75.75 0 0 0 .75-.75v-1.632A3.5 3.5 0 0 0 8 4.5ZM6.5 14.25a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0-.75.75Z" />
                </svg>
                Sugerir próxima semana
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Sugerir semana {targetWeekNumber} — <span style={{ color: accent }}>{subjectName}</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {targetWeekId
                                        ? 'Va a completar esta semana (todavía sin materiales).'
                                        : 'No hay semana siguiente creada — se va a crear una nueva.'}
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

                        {hasRealContext ? (
                            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
                                ✓ Se va a basar en {courseMode === 'project'
                                    ? 'el documento técnico actual del proyecto'
                                    : `las últimas ${recentWeeks.length} semana${recentWeeks.length === 1 ? '' : 's'} ya dictadas`}.
                            </p>
                        ) : (
                            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 border border-gray-200">
                                No hay clases anteriores registradas todavía — se va a proponer un punto de partida.
                            </p>
                        )}

                        {stage === 'idle' && (
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                style={{ background: accent }}
                            >
                                {loading ? 'Generando sugerencia...' : 'Generar sugerencia'}
                            </button>
                        )}

                        {stage === 'result' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Título</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
                                        className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Revisá y ajustá antes de guardar — recién se genera contenido (ejercicios, class kit) cuando lo pidas aparte para esta semana.
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? 'Regenerando...' : 'Regenerar'}
                                    </button>
                                    {saved ? (
                                        <p className="flex-1 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200 text-center">
                                            ✓ Semana {targetWeekNumber} guardada
                                        </p>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || !title.trim()}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            style={{ background: accent }}
                                        >
                                            {saving ? 'Guardando...' : `Guardar como semana ${targetWeekNumber}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
