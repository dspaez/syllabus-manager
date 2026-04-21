import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SlidesPresentation from '@/components/SlidesPresentation';
import PDFViewer from '@/components/PDFViewer';

// ── Types ──────────────────────────────────────────────────────────────────

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

interface SlidesContent {
    slides: Slide[];
}

interface ExercisesContent {
    exercises: Exercise[];
}

interface GuideContent {
    introduction: string;
    concepts: Concept[];
    examples: string[];
    summary: string;
}

type AIContent = SlidesContent | ExercisesContent | GuideContent;

type MaterialRow = {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
    source: string | null;
    file_url: string | null;
    weeks: {
        unit_id: string;
        units: { subject_id: string } | null;
    } | null;
};

// ── Content-type detection ─────────────────────────────────────────────────

function detectType(content: AIContent): 'slides' | 'exercises' | 'guide' {
    if ('slides' in content) return 'slides';
    if ('exercises' in content) return 'exercises';
    return 'guide';
}

// ── Renderers ─────────────────────────────────────────────────────────────

function ExercisesView({ data }: { data: ExercisesContent }) {
    return (
        <div className="space-y-5">
            {data.exercises.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-600">
                        <span className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
                            {i + 1}
                        </span>
                        <p className="text-sm font-semibold text-white">Ejercicio {i + 1}</p>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                        {/* Statement */}
                        <p className="text-sm text-gray-800 leading-relaxed">{ex.statement}</p>

                        {/* Hints — native collapsible, no JS needed */}
                        {ex.hints.length > 0 && (
                            <details className="group rounded-lg border border-amber-200 bg-amber-50">
                                <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-800 marker:content-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                        className="size-4 shrink-0 transition-transform group-open:rotate-90">
                                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                    Pistas ({ex.hints.length})
                                </summary>
                                <ul className="px-4 pb-3 pt-1 space-y-1.5 border-t border-amber-200">
                                    {ex.hints.map((hint, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-amber-900">
                                            <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-amber-400" />
                                            {hint}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}

                        {/* Solution */}
                        <details className="group rounded-lg border border-emerald-200 bg-emerald-50">
                            <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-800 marker:content-none">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                    className="size-4 shrink-0 transition-transform group-open:rotate-90">
                                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                                Ver solución
                            </summary>
                            <div className="px-4 pb-3 pt-2 border-t border-emerald-200">
                                <p className="text-sm text-emerald-900 leading-relaxed">{ex.solution}</p>
                            </div>
                        </details>
                    </div>
                </div>
            ))}
        </div>
    );
}

function GuideView({ data }: { data: GuideContent }) {
    return (
        <div className="space-y-8">
            {/* Introduction */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Introducción</h2>
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-5">
                    <p className="text-sm text-gray-700 leading-relaxed">{data.introduction}</p>
                </div>
            </section>

            {/* Key concepts */}
            {data.concepts.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Conceptos clave</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {data.concepts.map((concept, i) => (
                            <div key={i} className="rounded-2xl border border-violet-100 bg-white shadow-sm overflow-hidden">
                                <div className="bg-violet-600 px-4 py-2.5">
                                    <p className="text-sm font-bold text-white">{concept.name}</p>
                                </div>
                                <p className="px-4 py-3 text-sm text-gray-700 leading-relaxed">{concept.explanation}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Examples */}
            {data.examples.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ejemplos</h2>
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
                        {data.examples.map((example, i) => (
                            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                                <span className="shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed">{example}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Summary */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Resumen</h2>
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5">
                    <p className="text-sm text-blue-900 leading-relaxed">{data.summary}</p>
                </div>
            </section>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MaterialPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createClient(await cookies());

    const { data: material, error } = await supabase
        .from('materials')
        .select('*, weeks(unit_id, units(subject_id))')
        .eq('id', id)
        .single<MaterialRow>();

    if (error || !material) notFound();

    const m = material as MaterialRow;
    const subjectId = m.weeks?.units?.subject_id ?? null;

    // Parse AI-generated content
    let content: AIContent | null = null;
    let parseError = false;
    if (m.description) {
        try {
            content = JSON.parse(m.description) as AIContent;
        } catch {
            parseError = true;
        }
    }

    const contentType = content ? detectType(content) : null;

    // PDF upload → full-screen viewer
    if (m.type === 'pdf' && m.source === 'upload' && m.file_url) {
        return <PDFViewer url={m.file_url} name={m.name} />;
    }

    // Slides → full-screen presentation mode
    if (contentType === 'slides') {
        return (
            <SlidesPresentation
                slides={(content as SlidesContent).slides}
                name={m.name}
            />
        );
    }

    // Exercises & Guide layout
    const TYPE_LABELS: Record<string, string> = {
        exercises: 'Ejercicios prácticos',
        guide: 'Guía de estudio',
    };

    const backHref = subjectId ? `/subjects/${subjectId}` : '/';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                    <Link
                        href={backHref}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Volver"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                        </svg>
                    </Link>
                    <span className="text-gray-300">/</span>
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-base font-semibold text-gray-900 truncate">{m.name}</h1>
                        {contentType && (
                            <span className="shrink-0 text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full">
                                {TYPE_LABELS[contentType]}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-4xl mx-auto px-6 py-10">
                {parseError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                        No se pudo procesar el contenido de este material.
                    </div>
                )}

                {!content && !parseError && (
                    <div className="text-center py-24 text-gray-400">
                        <p className="text-lg font-medium">Este material no tiene contenido.</p>
                    </div>
                )}

                {content && contentType === 'exercises' && (
                    <ExercisesView data={content as ExercisesContent} />
                )}
                {content && contentType === 'guide' && (
                    <GuideView data={content as GuideContent} />
                )}
            </main>
        </div>
    );
}
