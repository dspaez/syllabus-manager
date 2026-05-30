'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { subjectEmoji } from '@/utils/subjectEmoji';

type Subject = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

// Paleta acentuada azul/violeta para mantener consistencia visual del layout LMS.
const FALLBACK_COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#6366f1', '#9333ea', '#06b6d4'];

function getAccentColor(index: number, color: string | null): string {
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

export default function PublicHomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadSubjects() {
      const { data } = await supabase
        .from('subjects')
        .select('id, name, color, description')
        .order('created_at', { ascending: false });

      const normalized: Subject[] = (data ?? []).map((subject) => ({
        id: subject.id as string,
        name: subject.name as string,
        color: subject.color as string | null,
        description: subject.description as string | null,
      }));

      setSubjects(normalized);
      setLoading(false);
    }

    loadSubjects();
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Resumen de Clases</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Selecciona una asignatura para acceder a los materiales de estudio.
        </p>
      </header>

      {loading && (
        <ul className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <li
              key={index}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="h-1.5 rounded-t-2xl bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-3 p-5">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && subjects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Aún no hay asignaturas publicadas.
        </div>
      )}

      {!loading && subjects.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {subjects.map((subject, index) => {
            const accentColor = getAccentColor(index, subject.color);
            return (
              <li key={subject.id}>
                <Link
                  href={`/subjects/${subject.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
                  <div className="flex h-full flex-col p-5">
                    <span
                      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: withAlpha(accentColor, '24') }}
                    >
                      {subjectEmoji(subject.name)}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{subject.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {subject.description ?? 'Sin descripción disponible.'}
                    </p>
                    <span className="mt-5 inline-flex items-center text-sm font-semibold" style={{ color: accentColor }}>
                      Ir a la clase ›
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
