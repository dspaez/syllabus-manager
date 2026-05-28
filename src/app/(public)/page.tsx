'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

type Subject = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  semesterName: string | null;
};

const FALLBACK_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

function coverColor(index: number, color: string | null): string {
  return color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function withAlpha(color: string, alphaHex: string): string {
  const value = color.trim();
  if (/^#[\da-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${alphaHex}`;
  }
  if (/^#[\da-f]{6}$/i.test(value)) return `${value}${alphaHex}`;
  return color;
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
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .slice(0, 3)
    .map((word) => `#${word}`);
}

export default function PublicHomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ subjects: 0, materials: 0, semester: '—' });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: subjectData }, { count: materialCount }, { data: semesterData }] = await Promise.all([
        supabase.from('subjects').select('id, name, description, color, semesters(name)').order('created_at', { ascending: false }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('semesters').select('name').order('created_at', { ascending: false }).limit(1),
      ]);

      const normalizedSubjects: Subject[] = (subjectData ?? []).map((subject) => {
        const semester = subject.semesters;
        const semesterName = Array.isArray(semester)
          ? (semester[0]?.name ?? null)
          : (semester as { name: string } | null)?.name ?? null;

        return {
          id: subject.id as string,
          name: subject.name as string,
          description: subject.description as string | null,
          color: subject.color as string | null,
          semesterName,
        };
      });

      setSubjects(normalizedSubjects);
      setStats({
        subjects: normalizedSubjects.length,
        materials: materialCount ?? 0,
        semester: semesterData?.[0]?.name ?? '—',
      });
      setLoading(false);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((subject) => {
      const haystack = [subject.name, subject.description ?? '', subject.semesterName ?? ''].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [subjects, search]);

  return (
    <div className="relative flex flex-col text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,#020617_0%,#0f172a_24%,#1e40af_64%,#7c3aed_100%)] px-6 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.26),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.28),transparent_26%)]" />
          <div className="absolute -left-16 top-16 h-52 w-52 rounded-full bg-blue-400/18 blur-3xl" />
          <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-violet-400/18 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-emerald-400/12 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
          <div className="grid items-center gap-10 xl:grid-cols-[1.1fr,0.9fr]">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-50 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
                Semestre visible: {loading ? 'Cargando…' : stats.semester}
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                Explora tu
                <span className="block bg-gradient-to-r from-blue-200 via-white to-violet-200 bg-clip-text text-transparent">
                  espacio académico
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Descubre asignaturas, revisa contenidos publicados y navega por materiales con una experiencia moderna,
                clara y enfocada en el aprendizaje.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#subjects"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-blue-950/25 transition-transform hover:-translate-y-0.5 hover:shadow-2xl"
                >
                  Ver asignaturas
                </Link>
                <span className="inline-flex items-center rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-slate-100 backdrop-blur-xl">
                  Contenido por unidades, semanas y materiales.
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/35 backdrop-blur-2xl">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-300">Centro de navegación</p>
                <div className="relative mt-5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar asignaturas, semestre o tema…"
                    className="w-full rounded-[1.4rem] border border-white/10 bg-white/92 py-4 pl-12 pr-4 text-sm font-medium text-slate-900 shadow-xl outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  {[
                    { label: 'Asignaturas', value: loading ? '…' : stats.subjects, accent: 'from-blue-600 to-blue-500' },
                    { label: 'Materiales', value: loading ? '…' : stats.materials, accent: 'from-violet-600 to-violet-500' },
                    { label: 'Semestre', value: loading ? '…' : stats.semester, accent: 'from-emerald-600 to-emerald-500' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 text-left shadow-lg shadow-slate-950/10"
                    >
                      <div className={`mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br ${stat.accent} opacity-95`} />
                      <p className="truncate text-2xl font-black text-white">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects grid */}
      <section id="subjects" className="mx-auto w-full max-w-7xl flex-1 px-6 py-14 text-slate-900">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Catálogo público</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Asignaturas del semestre</h2>
            {!loading && (
              <p className="mt-2 text-sm text-slate-300">
                {filtered.length} {filtered.length === 1 ? 'asignatura disponible' : 'asignaturas disponibles'} para explorar.
              </p>
            )}
          </div>
        </div>

        {/* Skeleton */}
        {loading && (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <li key={`skeleton-${index}`} className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/8 animate-pulse">
                <div className="h-48 bg-white/10" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                  <div className="h-7 w-4/5 rounded bg-white/10" />
                  <div className="h-4 w-full rounded bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/6 px-6 py-24 text-center text-slate-300 backdrop-blur-xl">
            <p className="mb-4 text-5xl">🔍</p>
            <p className="text-xl font-bold text-white">
              {search ? <>No encontramos resultados para &quot;{search}&quot;.</> : 'No hay asignaturas disponibles todavía.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((subject, index) => {
              const color = coverColor(index, subject.color);
              const emoji = subjectEmoji(subject.name);
              const tags = generateTags(subject.name);

              return (
                <li key={subject.id}>
                  <Link
                    href={`/subjects/${subject.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[2rem] border bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.85)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_32px_72px_-32px_rgba(15,23,42,0.7)]"
                    style={{
                      borderColor: withAlpha(color, '3a'),
                      backgroundImage: `linear-gradient(180deg, ${withAlpha(color, '18')} 0%, rgba(255,255,255,0.96) 32%)`,
                    }}
                  >
                    {/* Banner */}
                    <div
                      className="relative flex h-48 flex-col justify-between overflow-hidden px-6 py-5"
                      style={{ background: `linear-gradient(135deg, ${color} 0%, ${withAlpha(color, 'aa')} 100%)` }}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:28px_28px] opacity-30" />
                      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                      <div className="relative flex items-start justify-between gap-4">
                        <span className="inline-flex items-center rounded-full border border-white/20 bg-black/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm">
                          {subject.semesterName ?? 'Sin semestre'}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="mb-3 block text-4xl drop-shadow-lg">{emoji}</span>
                        <h3 className="text-xl font-black leading-tight text-white sm:text-2xl">{subject.name}</h3>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-6">
                      {subject.description ? (
                        <p className="line-clamp-3 flex-1 text-sm leading-7 text-slate-600">{subject.description}</p>
                      ) : (
                        <p className="flex-1 text-sm italic leading-7 text-slate-400">Sin descripción.</p>
                      )}

                      {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border px-3 py-1 text-xs font-semibold"
                              style={{
                                color,
                                backgroundColor: withAlpha(color, '12'),
                                borderColor: withAlpha(color, '28'),
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span
                          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-all group-hover:translate-x-1"
                          style={{ backgroundColor: withAlpha(color, '14'), color }}
                        >
                          Ver contenidos
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                            <path fillRule="evenodd" d="M3.22 10a.75.75 0 0 1 .75-.75h10.19l-3.97-3.97a.75.75 0 0 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.97A.75.75 0 0 1 3.22 10Z" clipRule="evenodd" />
                          </svg>
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
