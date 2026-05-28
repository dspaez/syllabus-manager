'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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

const GROUP_META: Record<MaterialGroup, { title: string; classes: string; icon: JSX.Element }> = {
  presentations: {
    title: 'Presentaciones',
    classes: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H9.25l.94 1.5H11a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5h.81l.94-1.5H3.5A1.5 1.5 0 0 1 2 9.5v-6Z" />
      </svg>
    ),
  },
  pdf: {
    title: 'Documentos PDF',
    classes: 'bg-red-50 text-red-700 border-red-200',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
        <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm4 7a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 9Zm-1.5-4.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
      </svg>
    ),
  },
  docs: {
    title: 'Guías y Documentos',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
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
  const parts = description.split(',').map((kw) => kw.trim()).filter(Boolean);
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

function TypeBadge({ material }: { material: Material }) {
  const group = getMaterialGroup(material);
  if (!group) return null;
  const classes = GROUP_META[group].classes;
  const type = material.source === 'ai' ? 'ai' : material.type;
  const label = type ? (TYPE_LABELS[type] ?? type.toUpperCase()) : 'Material';

  return (
    <span className={`shrink-0 inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${classes}`}>
      {label}
    </span>
  );
}

function MaterialIcon({ material, accentColor }: { material: Material; accentColor: string }) {
  const group = getMaterialGroup(material) ?? 'docs';
  const bg = `${accentColor}1a`;
  const icon = GROUP_META[group].icon;

  return (
    <div className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg, color: accentColor }}>
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
        className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <MaterialIcon material={material} accentColor={accentColor} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{material.name}</p>
        </div>
        <TypeBadge material={material} />
        <span
          className="shrink-0 text-xs font-semibold px-3 py-1 rounded-lg text-white"
          style={{ backgroundColor: accentColor }}
        >
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
      className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <MaterialIcon material={material} accentColor={accentColor} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{material.name}</p>
      </div>
      <TypeBadge material={material} />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        className="shrink-0 size-4 text-gray-300 group-hover:text-gray-600 transition-colors">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.5-3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V3.56l-4.22 4.22a.75.75 0 0 1-1.06-1.06l4.22-4.22h-1.69a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
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
  const groups = useMemo(() => ({
    presentations: materials.filter((material) => getMaterialGroup(material) === 'presentations'),
    pdf: materials.filter((material) => getMaterialGroup(material) === 'pdf'),
    docs: materials.filter((material) => getMaterialGroup(material) === 'docs'),
  }), [materials]);

  return (
    <div className="px-4 pb-4 space-y-4 bg-gray-50/60">
      {(Object.keys(groups) as MaterialGroup[]).map((group) => {
        const items = groups[group];
        if (items.length === 0) return null;

        return (
          <section key={group} className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white text-gray-700 border-gray-200">
              <span className={GROUP_META[group].classes.split(' ')[1]}>{GROUP_META[group].icon}</span>
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
  const [weekOpenState, setWeekOpenState] = useState<Record<string, boolean>>({});

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
  const defaultOpenWeekIds = useMemo(
    () => new Set(filteredUnits.map((unit) => unit.weeks[0]?.id).filter(Boolean)),
    [filteredUnits]
  );

  if (units.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => {
          const active = option.value === filter;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${active
                ? 'text-white border-transparent'
                : 'text-gray-600 bg-white border-gray-200 hover:border-gray-300 hover:text-gray-900'}`}
              style={active ? { backgroundColor: accentColor } : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {filteredUnits.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base font-medium">No hay semanas con materiales para este filtro.</p>
        </div>
      )}

      {filteredUnits.map((unit, unitIndex) => (
        <section key={unit.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-5 bg-gray-50 border-b border-gray-100">
            <span
              className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full text-white text-sm font-bold shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {unitIndex + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-gray-900 leading-tight">{unit.name}</h2>
              {unit.description && (
                <p className="mt-0.5 text-xs text-gray-500">{unit.description}</p>
              )}
            </div>
            <span className="shrink-0 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
              {unit.weeks.length} {unit.weeks.length === 1 ? 'semana' : 'semanas'}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {unit.weeks.map((week) => {
              const isOpen = weekOpenState[week.id] ?? defaultOpenWeekIds.has(week.id);
              const keywords = parseKeywords(week.description);

              return (
                <div key={week.id} className="border-b border-gray-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      setWeekOpenState((current) => {
                        const currentValue = current[week.id] ?? defaultOpenWeekIds.has(week.id);
                        return {
                          ...current,
                          [week.id]: !currentValue,
                        };
                      });
                    }}
                    className="w-full text-left flex items-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {week.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      {week.title && (
                        <p className="font-semibold text-gray-900 text-sm">{week.title}</p>
                      )}
                      {keywords ? (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {keywords.map((kw, idx) => (
                            <span key={`${week.id}-kw-${idx}`} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        week.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{week.description}</p>
                        )
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {week.materials.length} {week.materials.length === 1 ? 'material' : 'materiales'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                      className={`shrink-0 size-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isOpen && (
                    <WeekMaterials materials={week.materials} accentColor={accentColor} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
