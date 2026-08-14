'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { parseExercisesContent, type Exercise, type ExercisesContent } from '@/lib/exercise/schema';

type GenerateType = 'exercises' | 'guide';
type Dificultad = 'basico' | 'intermedio' | 'avanzado';

interface Concept {
    name: string;
    explanation: string;
}

interface GuideResult {
    introduction: string;
    concepts: Concept[];
    examples: string[];
    summary: string;
}

type GenerateResult = ExercisesContent | GuideResult;

interface Props {
    weekId: string;
    subjectId: string;
    unitId: string;
    subjectName: string;
    weekTopic: string;
    techStack?: string | null;
    courseMode?: string | null;
    accentColor?: string | null;
    /** 'project': technical_document_snapshot más reciente hasta esta semana (no necesariamente
     *  el propio — cae al más reciente disponible si esta semana todavía no tiene uno). */
    exerciseProjectContext?: string | null;
    /** 'topics': títulos de hasta las últimas 4 semanas anteriores ya dictadas. */
    exercisePreviousTitles?: string[];
}

const TYPE_LABELS: Record<GenerateType, string> = {
    exercises: 'Ejercicios prácticos',
    guide: 'Guía de estudio',
};

const DIFICULTAD_LABELS: Record<Dificultad, string> = {
    basico: 'Básico',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado',
};

function ExerciseCard({ ex, label }: { ex: Exercise; label: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">{label}</p>
            <p className="mt-0.5 font-semibold text-gray-800">{ex.titulo}</p>
            <p className="mt-2 text-sm text-gray-700">{ex.contexto}</p>
            {ex.menu && ex.menu.length > 0 && (
                <div className="mt-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700 whitespace-pre-wrap">
                    {ex.menu.join('\n')}
                </div>
            )}
            {ex.requerimientos.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requerimientos</p>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5">
                        {ex.requerimientos.map((req, j) => (
                            <li key={j} className="text-sm text-gray-600">{req}</li>
                        ))}
                    </ul>
                </div>
            )}
            {ex.checklist && ex.checklist.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Checklist de autoevaluación</p>
                    <ul className="mt-1 space-y-0.5">
                        {ex.checklist.map((q, j) => (
                            <li key={j} className="text-sm text-gray-600">☐ {q}</li>
                        ))}
                    </ul>
                </div>
            )}
            <details className="mt-2 rounded-md border border-emerald-200 bg-emerald-50">
                <summary className="cursor-pointer select-none px-3 py-1.5 text-xs font-medium text-emerald-800">
                    Ver solución docente
                </summary>
                <pre className="whitespace-pre-wrap wrap-break-word px-3 pb-2 pt-1 text-xs text-emerald-900 font-mono">{ex.solucionDocente}</pre>
            </details>
        </div>
    );
}

function ExercisesView({ data }: { data: ExercisesContent }) {
    return (
        <div className="space-y-4">
            {data.ejerciciosPractica.map((ex, i) => (
                <ExerciseCard key={`p${i}`} ex={ex} label={data.ejerciciosPractica.length > 1 ? `Práctica ${i + 1}` : 'Ejercicio de práctica'} />
            ))}
            {data.ejerciciosTarea.map((ex, i) => (
                <ExerciseCard key={`t${i}`} ex={ex} label={`Tarea — variante ${i + 1}`} />
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
    if (type === 'exercises') return <ExercisesView data={result as ExercisesContent} />;
    return <GuideView data={result as GuideResult} />;
}

export default function GenerateWithAI({ weekId, subjectName, weekTopic, techStack, courseMode, accentColor, exerciseProjectContext, exercisePreviousTitles }: Props) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<GenerateType>('exercises');
    const [topic, setTopic] = useState(weekTopic);
    const [dificultad, setDificultad] = useState<Dificultad>('intermedio');
    const [cantidadPractica, setCantidadPractica] = useState(1);
    const [cantidadTarea, setCantidadTarea] = useState(2);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GenerateResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [savedFileUrl, setSavedFileUrl] = useState<string | null>(null);

    const [generatingDocente, setGeneratingDocente] = useState(false);
    const [docenteSolutionUrl, setDocenteSolutionUrl] = useState<string | null>(null);

    function handleOpen() {
        setOpen(true);
        setTopic(weekTopic);
        setDificultad('intermedio');
        setCantidadPractica(1);
        setCantidadTarea(2);
        setResult(null);
        setError(null);
        setSaved(false);
        setSavedFileUrl(null);
        setDocenteSolutionUrl(null);
    }

    function handleClose() {
        setOpen(false);
        setResult(null);
        setError(null);
        setSaved(false);
        setSavedFileUrl(null);
        setDocenteSolutionUrl(null);
    }

    async function handleGenerate() {
        if (!topic.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setSaved(false);
        setSavedFileUrl(null);
        setDocenteSolutionUrl(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    topic: topic.trim(),
                    techStack: techStack ?? undefined,
                    ...(type === 'exercises' ? {
                        courseMode: courseMode ?? undefined,
                        exerciseProjectContext: courseMode === 'project' ? (exerciseProjectContext ?? undefined) : undefined,
                        exercisePreviousTitles: courseMode === 'topics' ? exercisePreviousTitles : undefined,
                        nivelDificultad: dificultad,
                        cantidadPractica,
                        cantidadTarea,
                    } : {}),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar contenido');
            }

            const data = await res.json();
            if (type === 'exercises') {
                const parsed = parseExercisesContent(JSON.stringify(data));
                if (!parsed) throw new Error('La respuesta no tiene el formato esperado');
                setResult(parsed);
            } else {
                setResult(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!result) return;
        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();

            const prefix = type === 'exercises' ? 'Ejercicios' : 'Guía';
            const truncatedTopic = topic.trim().substring(0, 50);
            const materialName = `${prefix}: ${truncatedTopic}`;

            // Para "exercises" también generamos un PDF real del enunciado (sin solucionDocente)
            // para que el docente pueda descargarlo/imprimirlo — `description` se guarda igual con
            // el JSON completo (con solución) porque el resto del sistema lo sigue usando como
            // contexto real (Class Kit, próxima semana, próximos ejercicios).
            let fileUrl: string | undefined;
            if (type === 'exercises') {
                const content = result as ExercisesContent;
                const res = await fetch('/api/render-exercise-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ejerciciosPractica: content.ejerciciosPractica,
                        ejerciciosTarea: content.ejerciciosTarea,
                        weekId,
                        subjectName,
                        weekTopic: topic.trim(),
                        accentColor: accentColor ?? undefined,
                    }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error ?? 'Error al generar el PDF del enunciado');
                }
                const data = await res.json() as { url: string };
                fileUrl = data.url;
            }

            const { error: dbError } = await supabase.from('materials').insert({
                name: materialName,
                type: fileUrl ? 'pdf' : 'doc',
                description: JSON.stringify(result),
                file_url: fileUrl ?? null,
                is_published: false,
                week_id: weekId,
                source: 'ai',
            });

            if (dbError) throw dbError;
            setSavedFileUrl(fileUrl ?? null);
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    }

    // PDF aparte SOLO para el docente (incluye la solución completa de cada ejercicio) — nunca
    // se guarda como fila en `materials`, así que nunca aparece en la lista de materiales ni
    // tiene una URL pública tipo /materials/{id}. El link solo se muestra acá, en esta sesión de
    // admin — es la forma de mantenerlo "solo para vos" con la arquitectura actual (ver detalle
    // de la limitación en la respuesta al usuario: el archivo en Storage no tiene otra protección
    // más que no estar enlazado desde ningún lado de la app).
    async function handleGenerateDocenteSolution() {
        if (!result || type !== 'exercises') return;
        setGeneratingDocente(true);
        setError(null);

        try {
            const content = result as ExercisesContent;
            const res = await fetch('/api/render-docente-solution-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ejerciciosPractica: content.ejerciciosPractica,
                    ejerciciosTarea: content.ejerciciosTarea,
                    weekId,
                    subjectName,
                    weekTopic: topic.trim(),
                    accentColor: accentColor ?? undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar la solución para el docente');
            }
            const data = await res.json() as { url: string };
            setDocenteSolutionUrl(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGeneratingDocente(false);
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
                Material para estudiantes
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 ease-snappy starting:opacity-0">
                    <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-200 ease-snappy starting:opacity-0 starting:scale-95 motion-reduce:starting:scale-100">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Generar material para estudiantes</h2>
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
                                    onChange={(e) => { setType(e.target.value as GenerateType); setResult(null); setSaved(false); setSavedFileUrl(null); setDocenteSolutionUrl(null); }}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                >
                                    {(Object.entries(TYPE_LABELS) as [GenerateType, string][]).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {type === 'exercises' && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Dificultad</label>
                                    <select
                                        value={dificultad}
                                        onChange={(e) => setDificultad(e.target.value as Dificultad)}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                    >
                                        {(Object.entries(DIFICULTAD_LABELS) as [Dificultad, string][]).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

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

                            {type === 'exercises' && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Cantidad de práctica</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={5}
                                            value={cantidadPractica}
                                            onChange={(e) => setCantidadPractica(Number(e.target.value))}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">Cantidad de tarea</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={5}
                                            value={cantidadTarea}
                                            onChange={(e) => setCantidadTarea(Number(e.target.value))}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Contexto real detectado — solo aplica al tipo "exercises", igual que
                            class_kit/Doc. técnico: 'project' ancla al proyecto real, 'topics' a lo
                            ya dictado, nunca mezclados. */}
                        {type === 'exercises' && (
                            courseMode === 'project' && exerciseProjectContext ? (
                                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
                                    ✓ Se va a anclar al documento técnico real del proyecto (lo más reciente disponible hasta esta semana).
                                </p>
                            ) : courseMode === 'topics' && exercisePreviousTitles && exercisePreviousTitles.length > 0 ? (
                                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
                                    ✓ Se va a apoyar en las últimas {exercisePreviousTitles.length} semana{exercisePreviousTitles.length === 1 ? '' : 's'} ya dictadas, para no repetir temas.
                                </p>
                            ) : (
                                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 border border-gray-200">
                                    No hay contexto real todavía para esta semana — se va a proponer un ejercicio genérico.
                                </p>
                            )
                        )}

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
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200 transition-[opacity,transform] duration-150 ease-snappy starting:opacity-0 starting:-translate-y-1 motion-reduce:starting:translate-y-0">{error}</p>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="flex flex-col gap-3">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 max-h-80 overflow-y-auto">
                                    <ResultView type={type} result={result} />
                                </div>

                                {saved ? (
                                    <p className="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200 text-center">
                                        ✓ Material guardado correctamente
                                        {savedFileUrl && (
                                            <a
                                                href={savedFileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-semibold underline"
                                            >
                                                Ver PDF del enunciado →
                                            </a>
                                        )}
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
                                                {type === 'exercises' ? 'Generando PDF y guardando...' : 'Guardando...'}
                                            </>
                                        ) : (
                                            'Guardar como material'
                                        )}
                                    </button>
                                )}

                                {type === 'exercises' && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                        <p className="text-xs font-medium text-amber-900">
                                            Solución para vos — nunca se publica ni aparece en la lista de materiales del estudiante.
                                        </p>
                                        {docenteSolutionUrl ? (
                                            <a
                                                href={docenteSolutionUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 underline"
                                            >
                                                Ver solución docente (PDF) →
                                            </a>
                                        ) : (
                                            <button
                                                onClick={handleGenerateDocenteSolution}
                                                disabled={generatingDocente}
                                                className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                                            >
                                                {generatingDocente ? 'Generando...' : 'Generar PDF de solución (docente)'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
