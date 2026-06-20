import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import PoliciesAccordion from './PoliciesAccordion';
import SubjectContent from './SubjectContent';
import { createClient } from '@/utils/supabase/server';
import { subjectEmoji } from '@/utils/subjectEmoji';

export const revalidate = 0;

type Material = {
  id: string;
  name: string;
  type: string | null;
  source: string | null;
  file_url: string | null;
  is_published: boolean;
};

type Week = {
  id: string;
  number: number;
  title: string | null;
  description: string | null;
  materials: Material[];
};

type Unit = {
  id: string;
  name: string;
  description: string | null;
  order: number | null;
  weeks: Week[];
};

type Subject = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
};

type Setting = {
  key: string;
  value: string;
};

type RawMaterial = {
  id: string | null | undefined;
  name: string | null | undefined;
  type: string | null | undefined;
  source: string | null | undefined;
  file_url: string | null | undefined;
  is_published: boolean | null | undefined;
};

type RawWeek = {
  id: string | null | undefined;
  number: number | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
  materials?: RawMaterial[] | null;
};

type RawUnit = {
  id: string | null | undefined;
  name: string | null | undefined;
  description: string | null | undefined;
  order: number | null | undefined;
  weeks?: RawWeek[] | null;
};

export default async function PublicSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(await cookies());

  const [{ data: subject, error: subjectError }, { data: units }, { data: settings }] =
    await Promise.all([
      supabase.from('subjects').select('*').eq('id', id).single(),
      supabase
        .from('units')
        .select('*, weeks(*, materials(*))')
        .eq('subject_id', id)
        .order('order', { ascending: true }),
      supabase.from('settings').select('key, value').order('key', { ascending: true }),
    ]);

  if (subjectError || !subject) notFound();

  const s: Subject = {
    id: subject.id as string,
    name: subject.name as string,
    color: subject.color as string | null,
    description: subject.description as string | null,
  };

  const unitList: Unit[] = (units ?? []).map((unit: RawUnit) => ({
    id: unit.id as string,
    name: unit.name as string,
    description: unit.description as string | null,
    order: unit.order as number | null,
    weeks: ((unit.weeks ?? []) as RawWeek[])
      .map((week) => ({
        id: week.id as string,
        number: week.number as number,
        title: week.title as string | null,
        description: week.description as string | null,
        materials: ((week.materials ?? []) as RawMaterial[])
          .filter((m) => m.is_published === true)
          .map((m) => ({
            id: m.id as string,
            name: m.name as string,
            type: m.type as string | null,
            source: m.source as string | null,
            file_url: m.file_url as string | null,
            is_published: true,
          })),
      }))
      .filter((week) => week.materials.length > 0)
      .sort((a, b) => a.number - b.number),
  })).filter((unit) => unit.weeks.length > 0);

  const normalizedSettings: Setting[] = (settings ?? []).map((s) => ({
    key: s.key as string,
    value: s.value as string,
  }));

  const accentColor = s.color ?? '#2563eb';
  const emoji = subjectEmoji(s.name);

  // Build a flat list of all weeks for the sidebar index
  const allWeeks = unitList.flatMap((unit) =>
    unit.weeks.map((week) => ({ ...week, unitName: unit.name }))
  );

  return (
    <div className="space-y-5">

      {/* Subject strip header — full width */}
      <header
        className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="flex items-center gap-4 px-6 py-5">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            {emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: accentColor }}
            >
              Semestre activo · {unitList.length} {unitList.length === 1 ? 'unidad' : 'unidades'}
            </p>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {s.name}
            </h1>
            {s.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {s.description}
              </p>
            )}
          </div>
          {/* Stats chips */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ background: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}30` }}
            >
              {allWeeks.length} semanas
            </span>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ background: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}30` }}
            >
              {allWeeks.reduce((acc, w) => acc + w.materials.length, 0)} materiales
            </span>
          </div>
        </div>
      </header>

      {/* ── Two-column layout on desktop ── */}
      <div className="flex gap-6 items-start">

        {/* Left — main content (tabs + search) */}
        <div className="flex-1 min-w-0 space-y-5">
          {unitList.length > 0 ? (
            <SubjectContent units={unitList} accentColor={accentColor} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 text-slate-300 dark:text-slate-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No hay materiales publicados aún.
              </p>
            </div>
          )}

          {/* Policies */}
          <PoliciesAccordion settings={normalizedSettings} accentColor={accentColor} />
        </div>

        {/* Right — sticky week index sidebar (desktop only) */}
        {allWeeks.length > 0 && (
          <aside className="hidden xl:block w-60 shrink-0 sticky top-20">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Índice de semanas
                </p>
              </div>
              <div className="py-2 max-h-[70vh] overflow-y-auto">
                {unitList.map((unit, uIdx) => (
                  <div key={unit.id}>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {unit.name.length > 22 ? `Unidad ${uIdx + 1}` : unit.name}
                    </p>
                    {unit.weeks.map((week) => (
                      <div
                        key={week.id}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                          style={{ background: `${accentColor}14`, color: accentColor }}
                        >
                          {week.number}
                        </span>
                        <span className="line-clamp-1 flex-1">
                          {week.title ?? `Semana ${week.number}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
