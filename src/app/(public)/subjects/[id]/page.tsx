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

        <WeeksAccordion units={filteredUnits} accentColor={accentColor} />
      </main>
    </div>
  );
}
