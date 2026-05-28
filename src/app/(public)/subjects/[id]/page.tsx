import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PoliciesAccordion from './PoliciesAccordion';
import WeeksAccordion from './WeeksAccordion';

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

type Profile = {
  id: string;
  name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type Setting = {
  key: string;
  value: string;
};

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

function withAlpha(color: string, alphaHex: string): string {
  const value = color.trim();
  if (/^#[\da-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${alphaHex}`;
  }
  if (/^#[\da-f]{6}$/i.test(value)) return `${value}${alphaHex}`;
  return color;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function PublicSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(await cookies());

  const [
    { data: subject, error: subjectError },
    { data: units, error: unitsError },
    { data: settings },
    { data: profile },
  ] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', id).single(),
    supabase
      .from('units')
      .select('*, weeks(*, materials(*))')
      .eq('subject_id', id)
      .order('order', { ascending: true }),
    supabase.from('settings').select('key, value').order('key', { ascending: true }),
    supabase.from('profile').select('id, name, title, bio, avatar_url').limit(1).single(),
  ]);

  if (subjectError || !subject) notFound();

  const s: Subject = {
    id: subject.id as string,
    name: subject.name as string,
    color: subject.color as string | null,
    description: subject.description as string | null,
  };

  const unitList: Unit[] = (units ?? []).map((unit) => ({
    id: unit.id as string,
    name: unit.name as string,
    description: unit.description as string | null,
    order: unit.order as number | null,
    weeks: (unit.weeks ?? []).map((week) => ({
      id: week.id as string,
      number: week.number as number,
      title: week.title as string | null,
      description: week.description as string | null,
      materials: (week.materials ?? []).map((material) => ({
        id: material.id as string,
        name: material.name as string,
        type: material.type as string | null,
        source: material.source as string | null,
        file_url: material.file_url as string | null,
        is_published: material.is_published as boolean,
      })),
    })),
  }));

  const teacherProfile: Profile | null = profile
    ? {
        id: profile.id as string,
        name: profile.name as string | null,
        title: profile.title as string | null,
        bio: profile.bio as string | null,
        avatar_url: profile.avatar_url as string | null,
      }
    : null;

  const normalizedSettings: Setting[] = (settings ?? []).map((setting) => ({
    key: setting.key as string,
    value: setting.value as string,
  }));

  const accentColor = s.color ?? '#1e40af';
  const emoji = subjectEmoji(s.name);

  const filteredUnits = unitList.map((unit) => ({
    ...unit,
    weeks: (unit.weeks ?? [])
      .map((week) => ({
        ...week,
        materials: (week.materials ?? []).filter((material) => material.is_published),
      }))
      .filter((week) => week.materials.length > 0),
  }));

  const publishedUnitCount = filteredUnits.filter((unit) => unit.weeks.length > 0).length;
  const publishedWeekCount = filteredUnits.reduce((acc, unit) => acc + unit.weeks.length, 0);
  const publishedMaterialCount = filteredUnits.reduce(
    (acc, unit) => acc + unit.weeks.reduce((weekAcc, week) => weekAcc + week.materials.length, 0),
    0
  );

  const teacherName = teacherProfile?.name ?? null;

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_30%)]" />

      <header className="relative border-b border-white/10 px-6 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${withAlpha(accentColor, '24')} 0%, rgba(15,23,42,0.1) 55%, rgba(124,58,237,0.22) 100%)` }} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              Volver al catálogo
            </Link>
            <span className="text-slate-500">/</span>
            <span className="truncate font-semibold text-slate-200">{s.name}</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-[2rem] border border-white/12 bg-white/8 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-slate-200">
                <span className="text-2xl leading-none">{emoji}</span>
                Asignatura pública
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
                {s.name}
              </h1>
              {s.description && (
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">{s.description}</p>
              )}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Unidades', value: publishedUnitCount },
                  { label: 'Semanas', value: publishedWeekCount },
                  { label: 'Materiales', value: publishedMaterialCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.6rem] border border-white/10 bg-slate-950/35 px-5 py-4"
                    style={{ boxShadow: `0 22px 40px -36px ${accentColor}` }}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-slate-950/55 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                Docente
              </div>
              {teacherName ? (
                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 text-lg font-black text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #7c3aed 100%)` }}
                    >
                      {teacherProfile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={teacherProfile.avatar_url} alt={teacherName} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(teacherName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black text-white">{teacherName}</p>
                      {teacherProfile?.title && <p className="mt-1 text-sm font-semibold text-blue-100">{teacherProfile.title}</p>}
                    </div>
                  </div>
                  {teacherProfile?.bio && <p className="text-sm leading-7 text-slate-300">{teacherProfile.bio}</p>}
                  <div className="mt-auto rounded-[1.6rem] border border-white/10 bg-white/6 p-4 text-sm text-slate-300">
                    {publishedMaterialCount > 0
                      ? 'El contenido visible ya está organizado por semanas para que los estudiantes accedan rápido a cada recurso.'
                      : 'Aún no hay materiales publicados, pero la estructura del curso ya está lista para activarse.'}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/4 p-5 text-sm leading-7 text-slate-300">
                  Aún no se ha configurado la información del docente para esta asignatura.
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Lineamientos</p>
              <h2 className="mt-2 text-2xl font-black text-white">Políticas y consideraciones del curso</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Consulta las políticas generales antes de revisar el contenido semanal para tener claro el marco de trabajo.
            </p>
          </div>
          <PoliciesAccordion settings={normalizedSettings} accentColor={accentColor} />
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Contenido publicado</p>
              <h2 className="mt-2 text-2xl font-black text-white">Navega por unidades, semanas y materiales</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Usa los filtros para enfocarte en el tipo de recurso que necesitas. El acordeón mantiene la misma lógica y
              ahora se integra con un contexto visual más claro.
            </p>
          </div>

          {unitsError && (
            <div className="rounded-[1.6rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              No se pudieron cargar las unidades: {unitsError.message}
            </div>
          )}

          {!unitsError && filteredUnits.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/4 px-6 py-24 text-center text-slate-300">
              <p className="text-lg font-bold text-white">No hay contenido publicado aún.</p>
            </div>
          )}

          <WeeksAccordion units={filteredUnits} accentColor={accentColor} />
        </section>
      </main>
    </div>
  );
}
