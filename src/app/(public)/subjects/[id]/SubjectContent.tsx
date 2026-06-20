'use client';

import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function withAlpha(color: string, alphaHex: string): string {
  const value = color.trim();
  if (/^#[\da-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}${alphaHex}`;
  }
  if (/^#[\da-f]{6}$/i.test(value)) return `${value}${alphaHex}`;
  return color;
}

function getMaterialMeta(material: Material) {
  const isAI = material.source === 'ai';
  if (isAI) return { label: 'Slides IA', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', action: 'Abrir' };
  if (material.type === 'pdf') return { label: 'PDF', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', action: 'Descargar' };
  if (material.type === 'pptx') return { label: 'PPTX', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', action: 'Descargar' };
  if (material.type === 'doc') return { label: 'DOC', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', action: 'Descargar' };
  if (material.type === 'video') return { label: 'Video', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', action: 'Ver' };
  return { label: 'Recurso', bg: '#f8fafc', color: '#475569', border: '#e2e8f0', action: 'Abrir' };
}

function getMaterialIcon(material: Material, accentColor: string) {
  const isAI = material.source === 'ai';
  const iconColor = isAI ? '#15803d' : material.type === 'pdf' ? '#b91c1c' : material.type === 'pptx' ? '#6d28d9' : accentColor;
  const iconBg = isAI ? '#f0fdf4' : material.type === 'pdf' ? '#fef2f2' : material.type === 'pptx' ? '#f5f3ff' : withAlpha(accentColor, '18');

  if (isAI) return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={iconColor} className="size-4">
        <path fillRule="evenodd" d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5C2 16.216 2.784 17 3.75 17h12.5A1.75 1.75 0 0 0 18 15.25V4.75A1.75 1.75 0 0 0 16.25 3H3.75Zm2.5 4.25A.75.75 0 0 1 7 8v4a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75Zm6.75 0a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V8a.75.75 0 0 1 .75-.75ZM8.75 9a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 8.75 9Zm0 2a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    </div>
  );

  if (material.type === 'video') return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: '#fff7ed' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#c2410c" className="size-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1.75-5.25a.75.75 0 0 1-1.125-.65v-4.2a.75.75 0 0 1 1.125-.65l3.65 2.1a.75.75 0 0 1 0 1.3l-3.65 2.1Z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: iconBg }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={iconColor} className="size-4">
        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v11.5A2.25 2.25 0 0 0 4.25 18h11.5A2.25 2.25 0 0 0 18 15.75V7.56a2.25 2.25 0 0 0-.66-1.59l-3.31-3.31A2.25 2.25 0 0 0 12.44 2H4.25Zm1.5 7.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

// ── Material row ──────────────────────────────────────────────────────────────

function MaterialRow({ material, accentColor, highlight }: { material: Material; accentColor: string; highlight?: string }) {
  const meta = getMaterialMeta(material);
  const isAI = material.source === 'ai';
  const href = isAI ? `/materials/${material.id}` : (material.file_url ?? null);

  function highlightText(text: string, query: string) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-yellow-800 rounded-sm dark:bg-yellow-900/40 dark:text-yellow-200">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  const inner = (
    <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {getMaterialIcon(material, accentColor)}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {highlight ? highlightText(material.name, highlight) : material.name}
        </p>
      </div>
      <span
        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border"
        style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
      >
        {meta.label}
      </span>
      {href ? (
        <span className="shrink-0 text-xs font-bold" style={{ color: accentColor }}>
          {meta.action} →
        </span>
      ) : (
        <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-slate-500">Sin enlace</span>
      )}
    </div>
  );

  if (!href) return inner;
  if (isAI) return <Link href={href}>{inner}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
}

// ── Week block (expanded) ─────────────────────────────────────────────────────

function WeekExpanded({
  week,
  accentColor,
  isCurrentWeek,
  highlight,
}: {
  week: Week;
  accentColor: string;
  isCurrentWeek: boolean;
  highlight?: string;
}) {
  if (isCurrentWeek) {
    return (
      <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: accentColor }}>
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 border-b"
          style={{ background: withAlpha(accentColor, '12'), borderColor: withAlpha(accentColor, '30') }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-widest text-white rounded-full px-2.5 py-0.5"
            style={{ background: accentColor }}
          >
            Esta semana
          </span>
          <span className="text-sm font-bold flex-1" style={{ color: accentColor }}>
            Semana {week.number}{week.title ? ` — ${week.title}` : ''}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: accentColor }}>
            {week.materials.length} {week.materials.length === 1 ? 'material' : 'materiales'}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 space-y-2">
          {week.materials.map((mat) => (
            <MaterialRow key={mat.id} material={mat} accentColor={accentColor} highlight={highlight} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <WeekCollapsible week={week} accentColor={accentColor} highlight={highlight} defaultOpen={false} />
  );
}

// ── Week collapsible ──────────────────────────────────────────────────────────

function WeekCollapsible({
  week,
  accentColor,
  highlight,
  defaultOpen,
}: {
  week: Week;
  accentColor: string;
  highlight?: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left bg-white hover:bg-slate-50 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/60"
        aria-expanded={open}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{ background: withAlpha(accentColor, '14'), color: accentColor }}
        >
          {week.number}
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 text-left">
          {week.title ?? `Semana ${week.number}`}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
          {week.materials.length} mat.
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="bg-slate-50 dark:bg-slate-800/40 px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700">
          {week.materials.map((mat) => (
            <MaterialRow key={mat.id} material={mat} accentColor={accentColor} highlight={highlight} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Search results ────────────────────────────────────────────────────────────

type SearchResult = {
  material: Material;
  weekNumber: number;
  weekTitle: string | null;
  unitName: string;
};

function SearchResults({ results, accentColor, query }: { results: SearchResult[]; accentColor: string; query: string }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8 text-slate-300 dark:text-slate-600 mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803 7.5 7.5 0 0 0 15.803 15.803Z" />
        </svg>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Sin resultados para "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
        {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para "{query}"
      </p>
      {results.map(({ material, weekNumber, weekTitle, unitName }) => (
        <div key={material.id} className="space-y-1">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
            Semana {weekNumber}{weekTitle ? ` · ${weekTitle}` : ''} · {unitName}
          </p>
          <MaterialRow material={material} accentColor={accentColor} highlight={query} />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SubjectContent({
  units,
  accentColor,
}: {
  units: Unit[];
  accentColor: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten all materials for search
  const allMaterials = useMemo<SearchResult[]>(() => {
    return units.flatMap((unit) =>
      unit.weeks.flatMap((week) =>
        week.materials.map((mat) => ({
          material: mat,
          weekNumber: week.number,
          weekTitle: week.title,
          unitName: unit.name,
        }))
      )
    );
  }, [units]);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allMaterials.filter(
      ({ material, weekTitle, unitName }) =>
        material.name.toLowerCase().includes(q) ||
        (weekTitle ?? '').toLowerCase().includes(q) ||
        unitName.toLowerCase().includes(q)
    );
  }, [searchQuery, allMaterials]);

  const isSearching = searchQuery.trim().length > 0;
  const activeUnit = units[activeTab];

  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">

      {/* ── Search bar ── */}
      <div className="px-4 pt-4 pb-0">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
          >
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar material, semana o tema…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400"
          />
          {isSearching && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Limpiar búsqueda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs — only when not searching ── */}
      {!isSearching && (
        <div className="flex gap-0 border-b border-slate-200 dark:border-slate-700 mt-3 px-4 overflow-x-auto">
          {units.map((unit, idx) => {
            const isActive = idx === activeTab;
            const weekCount = unit.weeks.length;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-current font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                style={isActive ? { color: accentColor, borderColor: accentColor } : undefined}
              >
                {unit.name.length > 20 ? `Unidad ${idx + 1}` : unit.name}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                  style={isActive ? { background: accentColor } : undefined}
                >
                  {weekCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      <div className="p-4 space-y-3">
        {isSearching ? (
          <SearchResults results={searchResults} accentColor={accentColor} query={searchQuery.trim()} />
        ) : activeUnit ? (
          <>
            {activeUnit.weeks.map((week) => (
              <WeekCollapsible
                key={week.id}
                week={week}
                accentColor={accentColor}
                highlight={undefined}
                defaultOpen={false}
              />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
