'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { subjectEmoji } from '@/utils/subjectEmoji';

type Material = {
  id: string;
  name: string;
  type: string | null;
  source: string | null;
  is_published: boolean;
};

type Week = {
  id: string;
  number: number;
  title: string | null;
  materials: Material[];
};

type Subject = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  totalWeeks: number;
  totalMaterials: number;
  materialTypes: string[];
};

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

function getMaterialTypePill(type: string) {
  if (type === 'ai') return { label: 'Slides IA', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
  if (type === 'pdf') return { label: 'PDF', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  if (type === 'pptx') return { label: 'PPTX', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
  if (type === 'doc') return { label: 'DOC', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  if (type === 'video') return { label: 'Video', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
  return { label: 'Recurso', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
}

function SubjectCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-6 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function SubjectCard({ subject, index }: { subject: Subject; index: number }) {
  const accentColor = getAccentColor(index, subject.color);

  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Card top — identity */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-4">
        <span
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: withAlpha(accentColor, '18') }}
        >
          {subjectEmoji(subject.name)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
            {subject.name}
          </p>
          {subject.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {subject.description}
            </p>
          )}
        </div>
        <div
          className="w-1 h-12 rounded-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Card body — material types available */}
      <div className="p-5 flex-1">
        {subject.totalMaterials > 0 ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
              Tipos de material disponible
            </p>
            <div className="flex flex-wrap gap-1.5">
              {subject.materialTypes.map((type) => {
                const pill = getMaterialTypePill(type);
                return (
                  <span
                    key={type}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                    style={{ background: pill.bg, color: pill.color, borderColor: pill.border }}
                  >
                    {pill.label}
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Sin materiales publicados aún.
          </p>
        )}
      </div>

      {/* Card footer */}
      <div className="px-5 pb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {subject.totalWeeks} {subject.totalWeeks === 1 ? 'semana' : 'semanas'}
          </span>
          {subject.totalMaterials > 0 && (
            <>
              <span className="text-slate-200 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {subject.totalMaterials} {subject.totalMaterials === 1 ? 'material' : 'materiales'}
              </span>
            </>
          )}
        </div>
        <span
          className="text-xs font-bold shrink-0 group-hover:underline"
          style={{ color: accentColor }}
        >
          Ver materia →
        </span>
      </div>
    </Link>
  );
}

export default function PublicHomePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadSubjects() {
      const { data } = await supabase
        .from('subjects')
        .select('id, name, color, description, units(weeks(id, number, title, materials(id, name, type, source, is_published)))')
        .order('created_at', { ascending: false });

      const normalized: Subject[] = (data ?? []).map((subject) => {
        const allWeeks: Week[] = (subject.units ?? []).flatMap((unit: { weeks?: Week[] }) =>
          (unit.weeks ?? []).map((week) => ({
            id: week.id as string,
            number: week.number as number,
            title: week.title as string | null,
            materials: ((week.materials ?? []) as Material[]).filter((m) => m.is_published),
          }))
        ).sort((a: Week, b: Week) => a.number - b.number);

        // Collect unique material types across all published materials
        const typeSet = new Set<string>();
        allWeeks.forEach((week) =>
          week.materials.forEach((mat) => {
            const key = mat.source === 'ai' ? 'ai' : (mat.type ?? 'link');
            typeSet.add(key);
          })
        );

        const totalMaterials = allWeeks.reduce((acc, w) => acc + w.materials.length, 0);

        return {
          id: subject.id as string,
          name: subject.name as string,
          color: subject.color as string | null,
          description: subject.description as string | null,
          totalWeeks: allWeeks.length,
          totalMaterials,
          materialTypes: Array.from(typeSet),
        };
      });

      setSubjects(normalized);
      setLoading(false);
    }

    loadSubjects();
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
          Portal estudiantil
        </p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Asignaturas disponibles
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Selecciona una materia para acceder a sus materiales y contenido semanal.
        </p>
      </header>

      {loading && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {[...Array(6)].map((_, i) => <SubjectCardSkeleton key={i} />)}
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-10 text-slate-300 dark:text-slate-600 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No hay asignaturas disponibles aún.
          </p>
        </div>
      )}

      {!loading && subjects.length > 0 && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
          {subjects.map((subject, index) => (
            <SubjectCard key={subject.id} subject={subject} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
