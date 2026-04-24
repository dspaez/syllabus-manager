import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PoliciesAccordion from './PoliciesAccordion';

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

const TYPE_LABELS: Record<string, string> = {
  pdf: 'Documento PDF',
  pptx: 'Presentación PPTX',
  doc: 'Documento Word',
  ai: 'Presentación interactiva',
};

function TypeBadge({ type }: { type: string | null }) {
  if (type === 'ai') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6A1.5 1.5 0 0 1 12.5 11H9.25l.94 1.5H11a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1 0-1.5h.81l.94-1.5H3.5A1.5 1.5 0 0 1 2 9.5v-6Z" />
        </svg>
        Presentación
      </span>
    );
  }
  if (type === 'pdf') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
          <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm4 7a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 9Zm-1.5-4.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
        </svg>
        PDF
      </span>
    );
  }
  if (type === 'doc' || type === 'pptx') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
          <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.414A2 2 0 0 0 13.414 5L11 2.586A2 2 0 0 0 9.586 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3A.75.75 0 0 1 5.75 10h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 10.75Z" clipRule="evenodd" />
        </svg>
        {type === 'pptx' ? 'PPTX' : 'DOC'}
      </span>
    );
  }
  return null;
}

function MaterialIcon({ type, accentColor }: { type: string | null; accentColor: string }) {
  const bg = `${accentColor}20`;
  if (type === 'ai') {
    return (
      <div className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5" style={{ color: accentColor }}>
          <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v8A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 10.5 2h-7ZM16 6.5A1.5 1.5 0 0 0 14.5 5h-1a.75.75 0 0 0 0 1.5h1v7h-1a.75.75 0 0 0 0 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-7Z" />
        </svg>
      </div>
    );
  }
  if (type === 'pdf') {
    return (
      <div className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5" style={{ color: accentColor }}>
          <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.414a2 2 0 0 0-.586-1.414l-4.414-4.414A2 2 0 0 0 11.586 2H4Zm5 6a.75.75 0 0 1 .75.75v3.69l1.22-1.22a.75.75 0 1 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.22 1.22V8.75A.75.75 0 0 1 9 8Z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  return (
    <div className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5" style={{ color: accentColor }}>
        <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.414a2 2 0 0 0-.586-1.414l-4.414-4.414A2 2 0 0 0 11.586 2H4Zm4 10.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Zm-1.5-3A.75.75 0 0 1 7.25 9h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 6.5 9.75Z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function MaterialLink({ material, accentColor }: { material: Material; accentColor: string }) {
  const isAI = material.source === 'ai';
  const effectiveType = isAI ? 'ai' : material.type;
  const typeLabel = effectiveType ? (TYPE_LABELS[effectiveType] ?? effectiveType) : 'Material';

  if (isAI) {
    return (
      <Link
        href={`/materials/${material.id}`}
        className="flex items-center gap-4 px-6 py-4 hover:bg-white transition-colors group"
      >
        <MaterialIcon type={effectiveType} accentColor={accentColor} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
            {material.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{typeLabel}</p>
        </div>
        <TypeBadge type={effectiveType} />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="shrink-0 size-4 text-gray-300 group-hover:text-blue-500 transition-colors">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </Link>
    );
  }

  return (
    <a
      href={material.file_url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-6 py-4 hover:bg-white transition-colors group"
    >
      <MaterialIcon type={effectiveType} accentColor={accentColor} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
          {material.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{typeLabel}</p>
      </div>
      <TypeBadge type={effectiveType} />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        className="shrink-0 size-4 text-gray-300 group-hover:text-blue-500 transition-colors">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.5-3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V3.56l-4.22 4.22a.75.75 0 0 1-1.06-1.06l4.22-4.22h-1.69a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    </a>
  );
}

function parseKeywords(description: string | null): string[] | null {
  if (!description) return null;
  if (!description.includes(',')) return null;
  const parts = description.split(',').map((kw) => kw.trim()).filter(Boolean);
  return parts.length > 1 ? parts : null;
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

  const s = subject as Subject;
  const unitList = (units ?? []) as Unit[];
  const teacherProfile = profile as Profile | null;

  // Subject color and hero
  const accentColor = s.color ?? '#1e40af';
  const heroStyle = {
    background: s.color
      ? `linear-gradient(135deg, ${s.color} 0%, ${s.color}aa 100%)`
      : 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
  };
  const emoji = subjectEmoji(s.name);

  // Filter to only published materials, then filter weeks with 0 published materials
  const filteredUnits = unitList.map((unit) => ({
    ...unit,
    weeks: (unit.weeks ?? [])
      .map((week) => ({
        ...week,
        materials: (week.materials ?? []).filter((m) => m.is_published),
      }))
      .filter((week) => week.materials.length > 0),
  }));

  return (
    <div>
      {/* Hero header */}
      <header style={heroStyle} className="relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-8 transition-colors bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Todas las asignaturas
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl drop-shadow-lg" aria-hidden>{emoji}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{s.name}</h1>
              {s.description && (
                <p className="mt-2 text-white/75 text-base max-w-xl">{s.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Teacher Profile */}
      {teacherProfile && teacherProfile.name && (
        <div className="max-w-4xl mx-auto px-6 pt-8">
          <div className="relative bg-white border border-gray-200 rounded-xl px-6 py-5 shadow-sm overflow-hidden"
            style={{ borderLeft: `4px solid ${accentColor}` }}>
            {/* "Docente" badge */}
            <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              Docente
            </span>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="shrink-0 h-16 w-16 rounded-full overflow-hidden flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)` }}>
                {teacherProfile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={teacherProfile.avatar_url}
                    alt={teacherProfile.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-white select-none">
                    {teacherProfile.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0].toUpperCase())
                      .join('')}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900">{teacherProfile.name}</h3>
                {teacherProfile.title && (
                  <p className="text-sm text-gray-500 mt-0.5">{teacherProfile.title}</p>
                )}
                {teacherProfile.bio && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{teacherProfile.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-5">
        <PoliciesAccordion settings={(settings ?? []) as { key: string; value: string }[]} accentColor={accentColor} />

        {unitsError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar las unidades: {unitsError.message}
          </div>
        )}

        {!unitsError && filteredUnits.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No hay contenido publicado aún.</p>
          </div>
        )}

        {filteredUnits.map((unit, unitIndex) => {
          const weeksWithContent = unit.weeks.length;
          const hasContent = weeksWithContent > 0;
          return (
            <section key={unit.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Unit header */}
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
                {weeksWithContent > 0 && (
                  <span className="shrink-0 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                    {weeksWithContent} {weeksWithContent === 1 ? 'semana' : 'semanas'}
                  </span>
                )}
              </div>

              {/* Weeks */}
              {!hasContent ? (
                <div className="px-6 py-8 text-center text-gray-400">
                  <p className="text-sm">Los materiales de esta unidad estarán disponibles próximamente.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {unit.weeks.map((week) => {
                    const keywords = parseKeywords(week.description);

                    return (
                      <div key={week.id} className="border-b border-gray-100 last:border-0">
                        {/* Week header */}
                        <div className="flex items-center gap-3 px-6 py-4 bg-white">
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
                        </div>

                        {/* Materials list */}
                        <ul className="divide-y divide-gray-50 bg-gray-50/50">
                          {week.materials.map((material) => (
                            <li key={material.id}>
                              <MaterialLink material={material} accentColor={accentColor} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
