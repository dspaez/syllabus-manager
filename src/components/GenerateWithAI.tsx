'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type GenerateType = 'slides' | 'exercises' | 'guide';

interface Slide {
    title: string;
    points: string[];
}

interface Exercise {
    statement: string;
    hints: string[];
    solution: string;
}

interface Concept {
    name: string;
    explanation: string;
}

interface SlidesResult {
    slides: Slide[];
}

interface ExercisesResult {
    exercises: Exercise[];
}

interface GuideResult {
    introduction: string;
    concepts: Concept[];
    examples: string[];
    summary: string;
}

type GenerateResult = SlidesResult | ExercisesResult | GuideResult;

interface Props {
    weekId: string;
    subjectId: string;
    unitId: string;
}

const TYPE_LABELS: Record<GenerateType, string> = {
    slides: 'Estructura de diapositivas',
    exercises: 'Ejercicios prácticos',
    guide: 'Guía de estudio',
};

function SlidesView({ data }: { data: SlidesResult }) {
    return (
        <div className="space-y-3">
            {data.slides.map((slide, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="font-semibold text-gray-800">
                        {i + 1}. {slide.title}
                    </p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5">
                        {slide.points.map((point, j) => (
                            <li key={j} className="text-sm text-gray-600">{point}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

function ExercisesView({ data }: { data: ExercisesResult }) {
    return (
        <div className="space-y-4">
            {data.exercises.map((ex, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="font-semibold text-gray-800">Ejercicio {i + 1}</p>
                    <p className="mt-1 text-sm text-gray-700">{ex.statement}</p>
                    {ex.hints.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pistas</p>
                            <ul className="mt-1 list-disc pl-5 space-y-0.5">
                                {ex.hints.map((hint, j) => (
                                    <li key={j} className="text-sm text-gray-600">{hint}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Solución</p>
                        <p className="mt-1 text-sm text-gray-700">{ex.solution}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function GuideView({ data }: { data: GuideResult }) {
    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Introducción</p>
                <p className="mt-1 text-sm text-gray-700">{data.introduction}</p>
            </div>
            {data.concepts.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conceptos clave</p>
                    <div className="mt-1 space-y-2">
                        {data.concepts.map((c, i) => (
                            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                                <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                                <p className="text-sm text-gray-600">{c.explanation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {data.examples.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ejemplos</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5">
                        {data.examples.map((ex, i) => (
                            <li key={i} className="text-sm text-gray-600">{ex}</li>
                        ))}
                    </ul>
                </div>
            )}
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resumen</p>
                <p className="mt-1 text-sm text-gray-700">{data.summary}</p>
            </div>
        </div>
    );
}

function ResultView({ type, result }: { type: GenerateType; result: GenerateResult }) {
    if (type === 'slides') return <SlidesView data={result as SlidesResult} />;
    if (type === 'exercises') return <ExercisesView data={result as ExercisesResult} />;
    return <GuideView data={result as GuideResult} />;
}

export default function GenerateWithAI({ weekId }: Props) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<GenerateType>('slides');
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GenerateResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    function handleOpen() {
        setOpen(true);
        setResult(null);
        setError(null);
        setSaved(false);
    }

    function handleClose() {
        setOpen(false);
        setTopic('');
        setResult(null);
        setError(null);
        setSaved(false);
    }

    async function handleGenerate() {
        if (!topic.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setSaved(false);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, topic: topic.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar contenido');
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!result) return;
        setSaving(true);

        try {
            const supabase = createClient();
            
            // Generate concise name with prefix
            const prefix = type === 'slides' ? 'Diapositivas' : type === 'exercises' ? 'Ejercicios' : 'Guía';
            const truncatedTopic = topic.trim().substring(0, 50);
            const materialName = `${prefix}: ${truncatedTopic}`;
            
            // Determine type based on content type
            const materialType = type === 'slides' ? 'pptx' : 'doc';
            
            const { error: dbError } = await supabase.from('materials').insert({
                name: materialName,
                type: materialType,
                description: JSON.stringify(result),
                is_published: false,
                week_id: weekId,
                source: 'ai',
            });

            if (dbError) throw dbError;
            setSaved(true);
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
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.184a1 1 0 0 1 .633.632l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.632l.551-.184a1 1 0 0 0 0-1.898l-.551-.183a1 1 0 0 1-.633-.633l-.183-.551Z" />
                </svg>
                Generar con IA
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Generar contenido con IA</h2>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Tipo de contenido</label>
                                <select
                                    value={type}
                                    onChange={(e) => { setType(e.target.value as GenerateType); setResult(null); setSaved(false); }}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                >
                                    {(Object.entries(TYPE_LABELS) as [GenerateType, string][]).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1 sm:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Tema</label>
                                <textarea
                                    rows={2}
                                    placeholder="Describe el tema a desarrollar..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !topic.trim()}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Generando contenido...
                                </>
                            ) : (
                                'Generar'
                            )}
                        </button>

                        {/* Error */}
                        {error && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">{error}</p>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="flex flex-col gap-3">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 max-h-80 overflow-y-auto">
                                    <ResultView type={type} result={result} />
                                </div>

                                {saved ? (
                                    <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200 text-center">
                                        ✓ Material guardado correctamente
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
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
                                            'Guardar como material'
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
