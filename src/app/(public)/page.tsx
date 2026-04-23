'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

type Subject = {
    id: string;
    name: string;
    color: string | null;
    description: string | null;
    semesters: { name: string } | null;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4',
    '#6366f1', '#ec4899', '#14b8a6', '#f97316',
];

function coverColor(index: number, color: string | null): string {
    return color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function subjectEmoji(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('java')) return '☕';
    if (n.includes('python')) return '🐍';
    if (n.includes('web') || n.includes('html')) return '💻';
    if (n.includes('dato') || n.includes('sql') || n.includes('base')) return '🗄️';
    if (n.includes('red') || n.includes('network')) return '🌐';
    if (n.includes('matem') || n.includes('calculo') || n.includes('cálculo')) return '📐';
    if (n.includes('física') || n.includes('fisica')) return '⚛️';
    if (n.includes('diseño')) return '🎨';
    if (n.includes('segur')) return '🔒';
    if (n.includes('intelig') || n.includes('machine')) return '🤖';
    if (n.includes('algoritm')) return '⚙️';
    if (n.includes('sistema')) return '🖥️';
    if (n.includes('proyecto') || n.includes('gestión') || n.includes('gestion')) return '📋';
    if (n.includes('comunic')) return '📡';
    return '📖';
}

function generateTags(name: string): string[] {
    const stopWords = new Set(['para', 'con', 'del', 'los', 'las', 'una', 'unos', 'introduccion']);
    return name
        .toLowerCase()
        .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
        .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w))
        .slice(0, 3)
        .map((w) => `#${w}`);
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PublicHomePage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ subjects: 0, materials: 0, semester: '' });

    useEffect(() => {
        const supabase = createClient();

        async function load() {
            const [
                { data: subjectData },
                { count: materialCount },
                { data: semesterData },
            ] = await Promise.all([
                supabase.from('subjects').select('*, semesters(name)').order('created_at', { ascending: false }),
                supabase.from('materials').select('*', { count: 'exact', head: true }),
                supabase.from('semesters').select('name').order('created_at', { ascending: false }).limit(1),
            ]);

            const subs = (subjectData ?? []) as Subject[];
            setSubjects(subs);
            setStats({
                subjects: subs.length,
                materials: materialCount ?? 0,
                semester: semesterData?.[0]?.name ?? '—',
            });
            setLoading(false);
        }

        load();
    }, []);

    const filtered = useMemo(
        () => subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
        [subjects, search],
    );

    return (
        <div className="flex flex-col">
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section
                className="relative overflow-hidden px-6 py-20 sm:py-28"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #7c3aed 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/3" />
                </div>

                <div className="relative mx-auto max-w-3xl text-center">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-white/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Semestre activo: {loading ? '…' : (stats.semester || 'Sem. Actual')}
                    </div>

                    {/* Title */}
                    <h1 className="mb-4 text-5xl sm:text-6xl font-black leading-tight text-white">
                        Hub de Contenidos<br />
                        <span className="text-blue-300">Educativos</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mx-auto mb-10 max-w-xl text-lg text-white/70">
                        Accede a guías, ejercicios y presentaciones generadas para cada asignatura de tu programa académico.
                    </p>

                    {/* Search bar — glass morphism */}
                    <div className="relative mx-auto mb-10 max-w-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400"
                        >
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                        </svg>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar asignaturas..."
                            className="w-full rounded-2xl bg-white/90 backdrop-blur-sm py-3.5 pl-11 pr-4 text-sm text-gray-900 shadow-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            {
                                label: 'Asignaturas', value: loading ? '…' : stats.subjects,
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 text-blue-300">
                                        <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
                                    </svg>
                                ),
                            },
                            {
                                label: 'Materiales', value: loading ? '…' : stats.materials,
                                icon: (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 text-violet-300">
                                        <path fillRule="evenodd" d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.243Z" clipRule="evenodd" />
                                    </svg>
                                ),
                            },
                        ].map(({ label, value, icon }) => (
                            <div key={label} className="flex items-center gap-3 min-w-36 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
                                {icon}
                                <div>
                                    <p className="text-2xl font-bold text-white leading-none">{value}</p>
                                    <p className="mt-0.5 text-xs text-white/60">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Subjects grid ─────────────────────────────────────────────── */}
            <section id="subjects" className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Asignaturas del Semestre</h2>
                    {!loading && (
                        <p className="mt-1 text-sm text-gray-500">
                            {filtered.length} {filtered.length === 1 ? 'asignatura encontrada' : 'asignaturas encontradas'}
                        </p>
                    )}
                </div>

                {/* Skeleton */}
                {loading && (
                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <li key={i} className="overflow-hidden rounded-2xl bg-gray-100 animate-pulse">
                                <div className="h-40 bg-gray-200" />
                                <div className="p-5 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="py-24 text-center text-gray-400">
                        <p className="mb-4 text-4xl">🔍</p>
                        <p className="text-lg font-medium">
                            {search
                                ? <>No se encontraron asignaturas para <span className="font-semibold text-gray-600">'{search}'</span></>
                                : 'No hay asignaturas disponibles'}
                        </p>
                        {search && (
                            <button onClick={() => setSearch('')} className="mt-3 text-sm text-blue-600 hover:underline">
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                )}

                {/* Cards */}
                {!loading && filtered.length > 0 && (
                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((subject, index) => {
                            const color = coverColor(index, subject.color);
                            const emoji = subjectEmoji(subject.name);
                            const tags = generateTags(subject.name);

                            return (
                                <li key={subject.id}>
                                    <Link
                                        href={`/subjects/${subject.id}`}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                                    >
                                        {/* Gradient cover — h-40 */}
                                        <div
                                            className="relative h-40 overflow-hidden flex flex-col items-center justify-center px-6 py-5"
                                            style={{ background: `linear-gradient(135deg, ${color}ee 0%, ${color}99 100%)` }}
                                        >
                                            {/* Dot pattern overlay */}
                                            <div
                                                className="pointer-events-none absolute inset-0 opacity-20"
                                                style={{
                                                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                                                    backgroundSize: '16px 16px',
                                                }}
                                            />
                                            {/* Semester badge — top right */}
                                            {subject.semesters?.name && (
                                                <span className="absolute top-3 right-3 text-xs font-semibold text-white/80 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                                    {subject.semesters.name}
                                                </span>
                                            )}
                                            {/* Emoji + name */}
                                            <span className="mb-2 text-5xl drop-shadow-lg relative z-10">{emoji}</span>
                                            <h3 className="relative z-10 text-center text-base font-bold leading-snug text-white drop-shadow text-shadow">
                                                {subject.name}
                                            </h3>
                                        </div>

                                        {/* White body */}
                                        <div className="flex flex-1 flex-col p-5">
                                            {subject.description ? (
                                                <p className="line-clamp-2 flex-1 text-sm text-gray-600">{subject.description}</p>
                                            ) : (
                                                <p className="flex-1 text-sm italic text-gray-400">Sin descripción</p>
                                            )}

                                            {tags.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                            style={{ backgroundColor: `${color}18`, color }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-center gap-1">
                                                <span className="text-sm font-semibold transition-all duration-200 group-hover:gap-2" style={{ color }}>
                                                    Ver contenidos →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
