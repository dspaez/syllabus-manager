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
        <div className="min-h-screen flex flex-col">
            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section
                className="relative overflow-hidden px-6 py-20 sm:py-28"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #7c3aed 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
                    <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5" />
                </div>

                <div className="relative mx-auto max-w-3xl text-center">
                    {/* Icon */}
                    <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-4xl backdrop-blur-sm">
                        🎓
                    </div>

                    {/* Title */}
                    <h1 className="mb-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                        Hub de Contenidos Educativos
                    </h1>

                    {/* Subtitle */}
                    <p className="mx-auto mb-8 max-w-xl text-lg text-white/70">
                        Accede a guías, ejercicios y presentaciones generadas para cada asignatura de tu programa académico.
                    </p>

                    {/* Search bar */}
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
                            className="w-full rounded-2xl bg-white py-3.5 pl-11 pr-4 text-sm text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                    </div>

                    {/* Stats */}
                    <div className="mb-10 flex flex-wrap justify-center gap-3">
                        {[
                            { label: 'Asignaturas', value: loading ? '…' : stats.subjects },
                            { label: 'Materiales', value: loading ? '…' : stats.materials },
                            { label: 'Semestre activo', value: loading ? '…' : stats.semester },
                        ].map(({ label, value }) => (
                            <div key={label} className="min-w-36 rounded-2xl bg-white/10 px-6 py-4 backdrop-blur-sm">
                                <p className="text-2xl font-bold text-white">{value}</p>
                                <p className="mt-0.5 text-xs text-white/60">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href="#subjects"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-colors hover:bg-blue-50"
                        >
                            Ver Asignaturas
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path fillRule="evenodd" d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06L7.25 11.44V2.75A.75.75 0 0 1 8 2Z" clipRule="evenodd" />
                            </svg>
                        </a>
                        <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                            📅 {loading ? '…' : (stats.semester || 'Semestre Actual')}
                        </div>
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
                            <li key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
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
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                                    >
                                        {/* Gradient cover */}
                                        <div
                                            className="flex h-36 flex-col items-center justify-center px-6 py-5"
                                            style={{ background: `linear-gradient(135deg, ${color}ee 0%, ${color}99 100%)` }}
                                        >
                                            <span className="mb-2 text-4xl drop-shadow">{emoji}</span>
                                            <h3 className="text-center text-base font-bold leading-snug text-white drop-shadow">
                                                {subject.name}
                                            </h3>
                                            {subject.semesters?.name && (
                                                <p className="mt-1 text-xs text-white/60">{subject.semesters.name}</p>
                                            )}
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
                                                        <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-4">
                                                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color }}>
                                                    Ver Contenidos →
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

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
                © 2026 Gestor Académico
            </footer>
        </div>
    );
}
