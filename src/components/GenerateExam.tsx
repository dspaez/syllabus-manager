'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Exam } from '@/lib/exam/schema';

interface Props {
    weekId: string;
    subjectName: string;
    subjectDescription?: string | null;
    weekTopic: string;
    techStack?: string | null;
    accentColor?: string | null;
    exercisePreviousTitles?: string[];
}

type Stage = 'form' | 'content' | 'saved';

export default function GenerateExam({
    weekId, subjectName, subjectDescription, weekTopic, techStack, accentColor, exercisePreviousTitles,
}: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState<Stage>('form');
    const [topic, setTopic] = useState(weekTopic);
    const [numVersiones, setNumVersiones] = useState(4);
    const [tiempoEstimado, setTiempoEstimado] = useState('1 hora 30 minutos');
    const [puntajeTotal, setPuntajeTotal] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [examDraft, setExamDraft] = useState('');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function reset() {
        setStage('form');
        setTopic(weekTopic);
        setNumVersiones(4);
        setTiempoEstimado('1 hora 30 minutos');
        setPuntajeTotal(20);
        setError(null);
        setExamDraft('');
        setFileUrl(null);
    }

    function handleOpen() {
        reset();
        setOpen(true);
    }

    function handleClose() {
        setOpen(false);
    }

    async function handleGenerate() {
        if (!topic.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'exam',
                    subjectName,
                    subjectDescription: subjectDescription ?? undefined,
                    weekTopic: topic.trim(),
                    techStack: techStack ?? undefined,
                    numVersiones,
                    exercisePreviousTitles,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar el examen');
            }

            const data = await res.json() as { exam: Exam };
            setExamDraft(JSON.stringify(data.exam, null, 2));
            setStage('content');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        let parsedExam: unknown;
        try {
            parsedExam = JSON.parse(examDraft);
        } catch {
            setError('El JSON editado no es válido — revisa la sintaxis antes de guardar.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/render-exam-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exam: parsedExam,
                    weekId,
                    subjectName,
                    tiempoEstimado,
                    puntajeTotal,
                    accentColor: accentColor ?? undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar el PDF del examen');
            }

            const data = await res.json() as { url: string };

            const supabase = createClient();
            const label = topic.trim().substring(0, 50);
            const { error: dbError } = await supabase.from('materials').insert({
                name: `Examen (${numVersiones} versiones): ${label}`,
                type: 'pdf',
                file_url: data.url,
                description: examDraft,
                is_published: false,
                week_id: weekId,
                source: 'ai',
            });
            if (dbError) throw dbError;

            setFileUrl(data.url);
            setStage('saved');
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                title="Generar un examen con varias versiones paralelas para tomar en clase"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm3 6.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 7 8.5Zm-.75 2.25a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" clipRule="evenodd" />
                </svg>
                Examen
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 ease-snappy starting:opacity-0">
                    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Examen — <span className="text-rose-700">{subjectName}</span>
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Varias versiones paralelas, mismo alcance y dificultad, distinto dominio de negocio.
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
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200 transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">{error}</p>
                        )}

                        {stage === 'form' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Tema a evaluar</label>
                                    <textarea
                                        rows={2}
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>

                                {exercisePreviousTitles && exercisePreviousTitles.length > 0 ? (
                                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
                                        ✓ Se va a anclar a lo ya dictado en semanas anteriores, para no evaluar contenido que todavía no se dio.
                                    </p>
                                ) : (
                                    <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 border border-gray-200">
                                        No hay semanas anteriores dictadas detectadas — el examen se va a basar solo en el tema indicado arriba.
                                    </p>
                                )}

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Versiones</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={numVersiones}
                                            onChange={(e) => setNumVersiones(Number(e.target.value))}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Tiempo estimado</label>
                                        <input
                                            type="text"
                                            value={tiempoEstimado}
                                            onChange={(e) => setTiempoEstimado(e.target.value)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Puntaje total</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={puntajeTotal}
                                            onChange={(e) => setPuntajeTotal(Number(e.target.value))}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !topic.trim() || numVersiones < 1}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Generando examen...' : `Generar ${numVersiones} versión${numVersiones === 1 ? '' : 'es'}`}
                                </button>
                            </div>
                        )}

                        {stage === 'content' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">
                                        Revisa y edita el contenido antes de generar el PDF
                                    </label>
                                    <textarea
                                        rows={18}
                                        value={examDraft}
                                        onChange={(e) => setExamDraft(e.target.value)}
                                        className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Tiempo estimado ({tiempoEstimado}) y puntaje ({puntajeTotal} pts) van en el PDF tal como los pusiste arriba — volvé atrás si necesitás cambiarlos.
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStage('form')}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {saving ? 'Generando PDF y guardando...' : 'Generar PDF y guardar como material'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {stage === 'saved' && fileUrl && (
                            <div className="flex flex-col gap-3">
                                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200 text-center">
                                    ✓ Examen guardado correctamente
                                </p>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Ver PDF del examen →
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
