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
        units: {
            subject_id: string;
            subjects: {
                name: string | null;
                color: string | null;
            } | null;
        } | null;
    } | null;
};

// ── Content-type detection ─────────────────────────────────────────────────

function detectType(content: AIContent): 'slides' | 'exercises' | 'guide' {
    if ('slides' in content) return 'slides';
    if ('exercises' in content) return 'exercises';
    return 'guide';
}

// ── Renderers ─────────────────────────────────────────────────────────────

function ExercisesView({ data, accentColor }: { data: ExercisesContent; accentColor: string }) {
    return (
        <div className="space-y-5">
            {data.exercises.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Header with subject accent color */}
                    <div
                        className="flex items-center gap-3 px-5 py-3.5"
                        style={{ background: `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor}99 100%)` }}
                    >
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
                            <details className="group rounded-xl border border-amber-200 bg-amber-50">
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
                        <details className="group rounded-xl border border-emerald-200 bg-emerald-50">
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

function GuideView({ data, accentColor }: { data: GuideContent; accentColor: string }) {
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
                            <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                <div
                                    className="flex items-center gap-3 px-4 py-2.5"
                                    style={{ background: `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor}99 100%)` }}
                                >
                                    <span className="shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm font-bold text-white">{concept.name}</p>
                                </div>
                                <p className="px-4 py-3 text-sm text-gray-600 leading-relaxed">{concept.explanation}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Examples — timeline style */}
            {data.examples.length > 0 && (
                <section>
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Ejemplos</h2>
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-5 py-4">
                        <div className="relative pl-6 space-y-4">
                            {/* Vertical timeline line */}
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
                            {data.examples.map((example, i) => (
                                <div key={i} className="relative flex items-start gap-3">
                                    {/* Timeline bullet */}
                                    <span
                                        className="absolute -left-4 shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {i + 1}
                                    </span>
                                    <p className="text-sm text-gray-700 leading-relaxed">{example}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Summary — bookmark card */}
            <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Resumen</h2>
                <div
                    className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-5 overflow-hidden"
                    style={{ borderLeft: `4px solid ${accentColor}` }}
                >
                    <div className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                            className="size-5 shrink-0 mt-0.5" style={{ color: accentColor }}>
                            <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
                    </div>
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
        .select('*, weeks!inner(unit_id, units!inner(subject_id, subjects!inner(name, color)))')
        .eq('id', id)
        .single<MaterialRow>();

    if (error || !material) notFound();

    const m = material as MaterialRow;
    const subjectId = m.weeks?.units?.subject_id ?? null;
    const subjectColor = m.weeks?.units?.subjects?.color || '#185FA5';
    const subjectName = m.weeks?.units?.subjects?.name ?? null;

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
                subjectColor={subjectColor}
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
            {/* Header with accent color bar */}
            <header className="bg-white border-b border-gray-200">
                {/* Color bar top */}
                <div className="h-1 w-full" style={{ backgroundColor: subjectColor }} />
                <div className="max-w-4xl mx-auto px-6 py-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Link href="/" className="hover:text-gray-600 transition-colors">Inicio</Link>
                        {subjectName && (
                            <>
                                <span>/</span>
                                <Link href={backHref} className="hover:text-gray-600 transition-colors">{subjectName}</Link>
                            </>
                        )}
                        <span>/</span>
                        <span className="text-gray-600 truncate">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={backHref}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Volver"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                            </svg>
                        </Link>
                        <div className="flex items-center gap-2 min-w-0">
                            <h1 className="text-base font-semibold text-gray-900 truncate">{m.name}</h1>
                            {contentType && (
                                <span
                                    className="shrink-0 text-xs font-medium border px-2 py-0.5 rounded-full"
                                    style={{
                                        borderColor: `${subjectColor}40`,
                                        backgroundColor: `${subjectColor}10`,
                                        color: subjectColor,
                                    }}
                                >
                                    {TYPE_LABELS[contentType]}
                                </span>
                            )}
                        </div>
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
                    <ExercisesView data={content as ExercisesContent} accentColor={subjectColor} />
                )}
                {content && contentType === 'guide' && (
                    <GuideView data={content as GuideContent} accentColor={subjectColor} />
                )}
            </main>
        </div>
    );
}
