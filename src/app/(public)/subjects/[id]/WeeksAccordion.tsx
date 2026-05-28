'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

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

type Filter = 'all' | 'presentations' | 'pdf' | 'docs';
type MaterialGroup = 'presentations' | 'pdf' | 'docs';

const FILTER_OPTIONS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'presentations', label: 'Presentaciones' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'docs', label: 'Guías' },
];

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  pptx: 'PPTX',
  doc: 'DOC',
  ai: 'Presentación',
};

const GROUP_META: Record<MaterialGroup, { title: string; classes: string; iconClass: string; icon: ReactNode }> = {
  presentations: {
    title: 'Presentaciones',
    classes: 'bg-violet-50 text-violet-700 border-violet-200',
    iconClass: 'text-violet-700',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H9.25l.94 1.5H11a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5h.81l.94-1.5H3.5A1.5 1.5 0 0 1 2 9.5v-6Z" />
      </svg>
    ),
  },
  pdf: {
    title: 'Documentos PDF',
    classes: 'bg-red-50 text-red-700 border-red-200',
    iconClass: 'text-red-700',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm4 7a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 9Zm0-5.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 3.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
  docs: {
    title: 'Guías y Documentos',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    iconClass: 'text-blue-700',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3A.75.75 0 0 1 5.75 10h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 10.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
};

function parseKeywords(description: string | null): string[] | null {
  if (!description) return null;
  if (!description.includes(',')) return null;
  const parts = description
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : null;
}

function getMaterialGroup(material: Material): MaterialGroup | null {
  const isPresentation = material.source === 'ai' || material.type === 'ai' || material.type === 'pptx';
  if (isPresentation) return 'presentations';
  if (material.type === 'pdf') return 'pdf';
  if (material.type === 'doc') return 'docs';
  return null;
}

function matchesFilter(material: Material, filter: Filter): boolean {
  if (filter === 'all') return true;
  return getMaterialGroup(material) === filter;
}

function toTranslucentBackground(color: string): string {
  const colorInput = color.trim();
  if (/^#[\da-f]{3}$/i.test(colorInput)) {
    const normalized = `#${colorInput[1]}${colorInput[1]}${colorInput[2]}${colorInput[2]}${colorInput[3]}${colorInput[3]}`;
    return `${normalized}1a`;
  }
  if (/^#[\da-f]{6}$/i.test(colorInput)) return `${colorInput}1a`;

  const rgbMatch = colorInput.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }

  const rgbaMatch = colorInput.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*\)$/i);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }

  return 'rgba(30, 64, 175, 0.1)';
}

function TypeBadge({ material }: { material: Material }) {
  const group = getMaterialGroup(material);
  if (!group) return null;
  const classes = GROUP_META[group].classes;
  const type = material.source === 'ai' ? 'ai' : material.type;
  const label = type ? (TYPE_LABELS[type] ?? type.toUpperCase()) : 'Material';

  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function MaterialIcon({ material, accentColor }: { material: Material; accentColor: string }) {
  const group = getMaterialGroup(material) ?? 'docs';
  const icon = GROUP_META[group].icon;

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
      style={{ backgroundColor: toTranslucentBackground(accentColor), color: accentColor }}
    >
      {icon}
    </div>
  );
}

function MaterialCard({ material, accentColor }: { material: Material; accentColor: string }) {
  const isAI = material.source === 'ai';

  if (isAI) {
    return (
      <Link
        href={`/materials/${material.id}`}
        className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <MaterialIcon material={material} accentColor={accentColor} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{material.name}</p>
        </div>
        <TypeBadge material={material} />
        <span className="shrink-0 rounded-xl px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: accentColor }}>
          Abrir
        </span>
      </Link>
    );
  }

  return (
    <a
      href={material.file_url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <MaterialIcon material={material} accentColor={accentColor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{material.name}</p>
      </div>
      <TypeBadge material={material} />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-600">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
      </svg>
    </a>
  );
}

function WeekMaterials({
  materials,
  accentColor,
}: {
  materials: Material[];
  accentColor: string;
}) {
  const groups = useMemo(
    () => ({
      presentations: materials.filter((material) => getMaterialGroup(material) === 'presentations'),
      pdf: materials.filter((material) => getMaterialGroup(material) === 'pdf'),
      docs: materials.filter((material) => getMaterialGroup(material) === 'docs'),
    }),
    [materials]
  );

  return (
    <div className="space-y-4 bg-slate-50/75 px-4 pb-4 pt-2 sm:px-6">
      {(Object.keys(groups) as MaterialGroup[]).map((group) => {
        const items = groups[group];
        if (items.length === 0) return null;

        return (
          <section key={group} className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
              <span className={GROUP_META[group].iconClass}>{GROUP_META[group].icon}</span>
              {GROUP_META[group].title}
            </div>
            <div className="space-y-2">
              {items.map((material) => (
                <MaterialCard key={material.id} material={material} accentColor={accentColor} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function WeeksAccordion({
  units,
  accentColor,
}: {
  units: Unit[];
  accentColor: string;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [weekOpenState, setWeekOpenState] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    units.forEach((unit) => {
      const firstWeekId = unit.weeks[0]?.id;
      if (firstWeekId) initialState[firstWeekId] = true;
    });
    return initialState;
  });

  const filteredUnits = useMemo(
    () =>
      units
        .map((unit) => ({
          ...unit,
          weeks: unit.weeks
            .map((week) => ({
              ...week,
              materials: week.materials.filter((material) => matchesFilter(material, filter)),
            }))
            .filter((week) => week.materials.length > 0),
        }))
        .filter((unit) => unit.weeks.length > 0),
    [filter, units]
  );

  if (units.length === 0) return null;

  return (
    <>
      <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Filtros</p>
            <p className="mt-1 text-sm font-semibold text-white">Selecciona el tipo de material que quieres ver</p>
          </div>
          <span className="text-xs text-slate-400">Los resultados se actualizan sin cambiar la estructura del contenido.</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {FILTER_OPTIONS.map((option) => {
            const active = option.value === filter;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-white/10 bg-slate-950/30 text-slate-200 hover:border-white/20 hover:bg-white/8'
                }`}
                style={active ? { backgroundColor: accentColor, boxShadow: `0 14px 30px -18px ${accentColor}` } : undefined}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredUnits.length === 0 && (
        <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-white/4 py-20 text-center text-slate-300">
          <p className="text-base font-medium">No hay semanas con materiales para este filtro.</p>
        </div>
      )}

      {filteredUnits.map((unit, unitIndex) => (
        <section
          key={unit.id}
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/92 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.9)]"
        >
          <div
            className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-6 py-5"
            style={{ background: `linear-gradient(135deg, ${toTranslucentBackground(accentColor)} 0%, rgba(248,250,252,0.96) 70%)` }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {unitIndex + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black leading-tight text-slate-900">{unit.name}</h2>
              {unit.description && <p className="mt-1 text-sm text-slate-500">{unit.description}</p>}
            </div>
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {unit.weeks.length} {unit.weeks.length === 1 ? 'semana' : 'semanas'}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {unit.weeks.map((week) => {
              const isOpen = weekOpenState[week.id] ?? false;
              const keywords = parseKeywords(week.description);

              return (
                <div key={week.id} className="last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOpenState((current) => {
                        const currentValue = current[week.id] ?? false;
                        return {
                          ...current,
                          [week.id]: !currentValue,
                        };
                      });
                    }}
                    className="flex w-full items-center gap-3 bg-white px-6 py-4 text-left transition-colors hover:bg-slate-50"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-black"
                      style={{ backgroundColor: toTranslucentBackground(accentColor), color: accentColor }}
                    >
                      {week.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      {week.title && <p className="text-sm font-bold text-slate-900">{week.title}</p>}
                      {keywords ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {keywords.map((keyword, index) => (
                            <span
                              key={`${week.id}-kw-${index}`}
                              className="rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: toTranslucentBackground(accentColor), color: accentColor }}
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        week.description && <p className="mt-0.5 text-xs text-slate-500">{week.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-400">
                      {week.materials.length} {week.materials.length === 1 ? 'material' : 'materiales'}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`size-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isOpen && <WeekMaterials materials={week.materials} accentColor={accentColor} />}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
