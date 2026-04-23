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
  color: string | null; description: string | null;
};

type Profile = {
  id: string;
  name: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
};

const TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  pptx: '📊',
  doc: '📝',
  ai: '🤖',
};

const TYPE_BADGES: Record<string, { label: string; classes: string }> = {
  pdf: { label: 'PDF', classes: 'bg-red-50 text-red-600 border-red-200' },
  pptx: { label: 'PPTX', classes: 'bg-orange-50 text-orange-600 border-orange-200' },
  doc: { label: 'DOC', classes: 'bg-blue-50 text-blue-600 border-blue-200' },
  ai: { label: 'Presentación ✨', classes: 'bg-violet-50 text-violet-600 border-violet-200' },
};

function TypeBadge({ type }: { type: string | null }) {
  const badge = type ? TYPE_BADGES[type] : undefined;
  if (!badge) return null;
  return (
    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.classes}`}>
      {badge.label}
    </span>
  );
}

function MaterialIcon({ type }: { type: string | null }) {
  const icon = type ? (TYPE_ICONS[type] ?? '📋') : '📋';
  return <span className="shrink-0 text-base leading-none" aria-hidden>{icon}</span>;
}

function MaterialLink({ material, accentColor }: { material: Material; accentColor: string }) {
  const isAI = material.source === 'ai';
  const effectiveType = isAI ? 'ai' : material.type;

  if (isAI) {
    return (
      <Link
        href={`/materials/${material.id}`}
        className="group flex items-center gap-3 px-5 py-4 hover:bg-blue-50/80 transition-colors"
      >
        <MaterialIcon type={effectiveType} />
        <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-700 font-medium truncate transition-colors">
          {material.name}
        </span>
        <TypeBadge type={effectiveType} />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="shrink-0 size-3.5 transition-transform group-hover:translate-x-0.5 transition-colors"
          style={{ color: accentColor }}>
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
      className="group flex items-center gap-3 px-5 py-4 hover:bg-blue-50/80 transition-colors"
    >
      <MaterialIcon type={effectiveType} />
      <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-700 font-medium truncate transition-colors">
        {material.name}
      </span>
      <TypeBadge type={effectiveType} />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="shrink-0 size-3.5 text-gray-300 group-hover:text-blue-400 transition-colors">
        <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.5-3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V3.56l-4.22 4.22a.75.75 0 0 1-1.06-1.06l4.22-4.22h-1.69a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
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

  // Hero uses subject color directly
  const accentColor = s.color ?? '#1e40af';
  const heroStyle = {
    background: s.color
      ? `linear-gradient(135deg, ${s.color}dd 0%, ${s.color}88 100%)`
      : 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
  };

  // Filter to only published materials
  const filteredUnits = unitList.map((unit) => ({
    ...unit,
    weeks: (unit.weeks ?? []).map((week) => ({
      ...week,
      materials: (week.materials ?? []).filter((m) => m.is_published),
    })),
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
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-8 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Todas las asignaturas
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{s.name}</h1>
          {s.description && (
            <p className="mt-3 text-white/70 text-base max-w-xl">{s.description}</p>
          )}
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
              {/* Avatar — h-16 w-16 */}
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
          const weekCount = unit.weeks.length;
          return (
            <section key={unit.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Unit header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <span
                  className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl text-white text-xs font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  {unitIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{unit.name}</h2>
                  {unit.description && (
                    <p className="mt-0.5 text-xs text-gray-500">{unit.description}</p>
                  )}
                </div>
                {weekCount > 0 && (
                  <span className="shrink-0 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {weekCount} {weekCount === 1 ? 'semana' : 'semanas'}
                  </span>
                )}
              </div>

              {/* Weeks as collapsible sections */}
              <div className="divide-y divide-gray-50">
                {unit.weeks.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-gray-400">Sin semanas publicadas.</p>
                ) : (
                  unit.weeks.map((week) => (
                    <details key={week.id} className="group" open>
                      <summary className="flex cursor-pointer select-none list-none items-center gap-3 px-6 py-3.5 hover:bg-gray-50/80 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                          className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90">
                          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                        <span className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {week.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          {week.title && (
                            <p className="text-sm font-medium text-gray-800">{week.title}</p>
                          )}
                          {week.description && (
                            <p className="text-xs text-gray-500">{week.description}</p>
                          )}
                        </div>
                        <span className="ml-auto shrink-0 text-xs text-gray-400">
                          {week.materials.length} {week.materials.length === 1 ? 'material' : 'materiales'}
                        </span>
                      </summary>

                      {week.materials.length === 0 ? (
                        <div className="pl-16 pr-6 pb-5 pt-2 flex items-center gap-2 text-sm text-gray-400">
                          <span>📭</span>
                          <span>Sin materiales publicados aún</span>
                        </div>
                      ) : (
                        <ul className="border-t border-gray-50 divide-y divide-gray-50">
                          {week.materials.map((material) => (
                            <li key={material.id}>
                              <MaterialLink material={material} accentColor={accentColor} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
