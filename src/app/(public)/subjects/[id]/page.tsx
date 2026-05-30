import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import PoliciesAccordion from './PoliciesAccordion';
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
  materials: Material[];
};

type Unit = {
  id: string;
  name: string;
  description: string | null;
  weeks: Week[];
};

type Subject = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
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
  materials?: RawMaterial[] | null;
};

type RawUnit = {
  id: string | null | undefined;
  name: string | null | undefined;
  description: string | null | undefined;
  weeks?: RawWeek[] | null;
};

type Setting = {
  key: string;
  value: string;
};

function getMaterialDisplayType(material: Material): string {
  if (material.source === 'ai') return 'Código';
  if (material.type === 'pdf') return 'PDF';
  if (material.type === 'pptx') return 'Presentación';
  if (material.type === 'doc') return 'Documento';
  if (material.type === 'video') return 'Video';
  return 'Enlace';
}

function materialMeta(material: Material): string {
  if (material.source === 'ai') return 'Editor interactivo';
  if (material.file_url) return 'Archivo disponible';
  return 'Recurso externo';
}

function isDownloadableFileType(type: string | null): boolean {
  return type === 'pdf' || type === 'doc' || type === 'pptx';
}

function MaterialTypeIcon({ material }: { material: Material }) {
  if (material.type === 'video') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1.75-5.25a.75.75 0 0 1-1.125-.65v-4.2a.75.75 0 0 1 1.125-.65l3.65 2.1a.75.75 0 0 1 0 1.3l-3.65 2.1Z" clipRule="evenodd" />
      </svg>
    );
  }

  if (material.type === 'pdf' || material.type === 'doc' || material.type === 'pptx') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V7.56a2.25 2.25 0 0 0-.66-1.59l-3.31-3.31A2.25 2.25 0 0 0 12.44 2H4.25Zm1.5 7.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    );
  }

  if (material.source === 'ai') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
        <path fillRule="evenodd" d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25V4.75A1.75 1.75 0 0 0 16.25 3H3.75Zm2.5 4.25A.75.75 0 0 1 7 8v4a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75Zm6.75 0a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75ZM8.75 9a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 8.75 9Zm0 2a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
      <path fillRule="evenodd" d="M4.25 5A2.25 2.25 0 0 0 2 7.25v8.5A2.25 2.25 0 0 0 4.25 18h8.5A2.25 2.25 0 0 0 15 15.75v-3a.75.75 0 0 0-1.5 0v3a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75v-8.5A.75.75 0 0 1 4.25 6.5h3a.75.75 0 0 0 0-1.5h-3ZM11 2.75A.75.75 0 0 1 11.75 2h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V4.56l-7.22 7.22a.75.75 0 1 1-1.06-1.06l7.22-7.22h-3.69A.75.75 0 0 1 11 2.75Z" clipRule="evenodd" />
    </svg>
  );
}

function MaterialAction({ material }: { material: Material }) {
  const shouldShowDownloadLabel = isDownloadableFileType(material.type);
  const label = shouldShowDownloadLabel ? 'Descargar' : 'Ver ›';
  const href = material.source === 'ai' ? `/materials/${material.id}` : (material.file_url ?? null);

  if (!href) {
    return <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sin enlace</span>;
  }

  if (material.source === 'ai') {
    return (
      <Link href={href} className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
    >
      {label}
    </a>
  );
}

export default async function PublicSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(await cookies());

  const [{ data: subject, error: subjectError }, { data: units, error: unitsError }, { data: settings }] = await Promise.all([
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
    weeks: (unit.weeks ?? []).map((week: RawWeek) => ({
      id: week.id as string,
      number: week.number as number,
      title: week.title as string | null,
      materials: (week.materials ?? []).map((material: RawMaterial) => ({
        id: material.id as string,
        name: material.name as string,
        type: material.type as string | null,
        source: material.source as string | null,
        file_url: material.file_url as string | null,
        is_published: material.is_published === true,
      })),
    })),
  }));

  const filteredUnits = unitList
    .map((unit) => ({
      ...unit,
      weeks: unit.weeks
        .map((week) => ({
          ...week,
          materials: week.materials.filter((material) => material.is_published),
        }))
        .filter((week) => week.materials.length > 0),
    }))
    .filter((unit) => unit.weeks.length > 0);

  const normalizedSettings: Setting[] = (settings ?? []).map((setting) => ({
    key: setting.key as string,
    value: setting.value as string,
  }));

  const accentColor = s.color ?? '#2563eb';

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <Link href="/" className="mb-5 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          ← Volver a inicio
        </Link>
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            {subjectEmoji(s.name)}
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{s.name}</h1>
            {s.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.description}</p>}
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <span>📘</span>
          Contenido del Curso
        </h2>

        {unitsError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            No se pudieron cargar las unidades: {unitsError.message}
          </div>
        )}

        {!unitsError && filteredUnits.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            No hay materiales publicados aún.
          </div>
        )}

        <div className="space-y-5">
          {filteredUnits.map((unit, unitIndex) => (
            <article key={unit.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <header className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Unidad {unitIndex + 1}</p>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{unit.name}</h3>
                {unit.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{unit.description}</p>}
              </header>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {unit.weeks.map((week) => (
                  <div key={week.id} className="p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Semana {week.number}
                      {week.title ? ` · ${week.title}` : ''}
                    </p>
                    <ul className="space-y-2">
                      {week.materials.map((material) => (
                        <li
                          key={material.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <span className="text-slate-500 dark:text-slate-300">
                            <MaterialTypeIcon material={material} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{material.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {getMaterialDisplayType(material)} • {materialMeta(material)}
                            </p>
                          </div>
                          <MaterialAction material={material} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <PoliciesAccordion settings={normalizedSettings} accentColor={accentColor} />
      </section>
    </div>
  );
}
