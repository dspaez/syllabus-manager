'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    subjectId: string;
    subjectName: string;
    /** Documento sobre el que se extiende ESTA semana: el snapshot de la última semana anterior
     *  que tenga uno (ver technicalDocBaseFor en units/[unitId]/page.tsx), o null si esta semana
     *  arranca el proyecto. Nunca subjects.technical_document a secas si hay semanas posteriores. */
    baseDocument: { document: string; label: string | null } | null;
    /** Semanas posteriores que ya tienen snapshot — si hay alguna, esta semana no es la punta. */
    laterSnapshotWeeks: string[];
    techStack: string | null;
    weekTopic: string;
    weekId: string;
    /** "Semana X — Nombre de unidad" del documento actual de la materia (subjects.technical_document),
     *  o null si no hay dato. */
    lastUpdatedLabel: string | null;
    /** Si ESTA semana (weekId) ya tiene technical_document_snapshot propio. */
    hasSnapshot: boolean;
}

export default function GenerateTechnicalDoc({
    subjectId, subjectName, baseDocument, laterSnapshotWeeks, techStack, weekTopic, weekId, lastUpdatedLabel, hasSnapshot,
}: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState(weekTopic);
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const hasPrevious = Boolean(baseDocument?.document.trim());
    // Si una semana posterior ya tiene snapshot, el documento de la materia (la punta) sigue
    // siendo el de esa semana — guardar acá solo reemplaza el snapshot de esta semana.
    const isLatest = laterSnapshotWeeks.length === 0;

    function handleOpen() {
        setOpen(true);
        setTopic(weekTopic);
        setDraft(null);
        setError(null);
        setSaved(false);
    }

    function handleClose() {
        setOpen(false);
        setDraft(null);
        setError(null);
        setSaved(false);
    }

    async function handleGenerate() {
        if (!topic.trim()) return;
        setLoading(true);
        setError(null);
        setDraft(null);
        setSaved(false);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'technical_doc',
                    subjectName,
                    weekTopic: topic.trim(),
                    previousDocument: hasPrevious ? baseDocument?.document : undefined,
                    techStack: techStack ?? undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar el documento');
            }

            const data = await res.json() as { document: string };
            setDraft(data.document);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!draft || !draft.trim()) return;
        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();
            // weeks.technical_document_snapshot (congelado para ESTA semana — evita que class_kit
            // de una semana anterior lea arquitectura de semanas futuras) se guarda siempre.
            // subjects.technical_document (la punta, usada por "Sugerir próxima semana") solo si
            // esta semana es la última con documento — si no, se pisaría la versión más reciente.
            const { error: weekError } = await supabase
                .from('weeks')
                .update({ technical_document_snapshot: draft })
                .eq('id', weekId);
            if (weekError) throw weekError;

            if (isLatest) {
                const { error: subjectError } = await supabase
                    .from('subjects')
                    .update({
                        technical_document: draft,
                        technical_document_updated_at: new Date().toISOString(),
                        technical_document_week_id: weekId,
                    })
                    .eq('id', subjectId);
                if (subjectError) throw subjectError;
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
                className="relative inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                title={
                    (hasSnapshot ? 'Esta semana ya tiene documento técnico propio anclado. ' : 'Esta semana todavía no tiene documento técnico propio — el class kit no tendrá contexto real de proyecto. ') +
                    (hasPrevious ? 'Extender el documento técnico del proyecto' : 'Crear el documento técnico del proyecto')
                }
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                    <path fillRule="evenodd" d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
                Doc. técnico
                {hasSnapshot && (
                    <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" className="size-2 text-white">
                            <path d="M2.5 6.25L4.75 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 ease-snappy starting:opacity-0">
                    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Documento técnico — <span className="text-teal-700">{subjectName}</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {hasPrevious
                                        ? `Se extenderá el documento de ${baseDocument?.label ?? 'la semana anterior'} con el tema de esta semana.`
                                        : 'No hay documento en semanas anteriores — se generará la versión inicial del proyecto.'}
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

                        {!isLatest && (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                Ya hay documento en semanas posteriores ({laterSnapshotWeeks.join(', ')}). Al guardar solo se
                                reemplaza el documento de esta semana: el de la materia
                                {lastUpdatedLabel ? ` (${lastUpdatedLabel})` : ''} no cambia, y esas semanas no se
                                actualizan solas — si este cambio les afecta, regeneralas después.
                            </p>
                        )}

                        {/* Documento base — antes no había forma de verlo sin generar uno nuevo encima */}
                        {hasPrevious && (
                            <details open className="rounded-lg border border-gray-200 bg-gray-50">
                                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-gray-700">
                                    Documento base
                                    {baseDocument?.label && (
                                        <span className="ml-2 font-normal text-gray-500">— {baseDocument.label}</span>
                                    )}
                                </summary>
                                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap wrap-break-word border-t border-gray-200 px-3 py-2 text-xs text-gray-700 font-mono">
                                    {baseDocument?.document}
                                </pre>
                            </details>
                        )}

                        {/* Week topic */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Tema de la semana</label>
                            <textarea
                                rows={2}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !topic.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generando documento...
                                </>
                            ) : (
                                hasPrevious ? 'Extender documento' : 'Generar documento inicial'
                            )}
                        </button>

                        {/* Error */}
                        {error && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200 transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">{error}</p>
                        )}

                        {/* Draft review — el usuario edita antes de guardar, nunca se autoguarda */}
                        {draft !== null && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">
                                        Revisa y edita antes de guardar
                                    </label>
                                    <textarea
                                        rows={18}
                                        value={draft}
                                        onChange={(e) => { setDraft(e.target.value); setSaved(false); }}
                                        className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>

                                {saved ? (
                                    <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200 text-center">
                                        ✓ Documento técnico guardado correctamente
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || !draft.trim()}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {saving ? (
                                            <>
                                                <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Guardando...
                                            </>
                                        ) : (
                                            isLatest ? 'Confirmar y guardar en la materia' : 'Confirmar y guardar solo en esta semana'
                                        )}
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
