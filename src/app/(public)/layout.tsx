import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#subjects', label: 'Asignaturas' },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${inter.variable} font-(family-name:--font-inter) flex min-h-screen flex-col bg-slate-950 text-slate-100`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.16),_transparent_28%)]" />
      </div>

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 shadow-lg shadow-blue-950/40 ring-1 ring-white/15">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 text-white">
                <path d="M12 3 1.5 8.25 12 13.5l8.25-4.125v5.08a2.251 2.251 0 1 1-1.5 0v-4.33L12 13.5 3 9v5.25L12 19.5l9-5.25V9.667l1.5-.75V15L12 21 1.5 15V8.25L12 3Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-white sm:text-lg">Syllabus Manager</p>
              <p className="truncate text-xs font-medium text-slate-300">Explora asignaturas, guías y materiales publicados</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Navegación pública
            </span>
          </div>
        </div>
      </nav>

      <div className="relative flex-1">{children}</div>

      <footer className="relative border-t border-white/10 bg-slate-950/88">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr,1fr,1fr]">
            {/* Brand */}
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-950/40">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-white">
                    <path d="M12 3 1.5 8.25 12 13.5l8.25-4.125v5.08a2.251 2.251 0 1 1-1.5 0v-4.33L12 13.5 3 9v5.25L12 19.5l9-5.25V9.667l1.5-.75V15L12 21 1.5 15V8.25L12 3Z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-black text-white">Syllabus Manager</p>
                  <p className="text-xs text-slate-400">Plataforma académica</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-slate-400">
                Accede a guías, ejercicios y materiales organizados por asignatura,
                unidad y semana desde cualquier dispositivo.
              </p>
            </div>

            {/* Nav */}
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Navegación</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link href="/" className="transition-colors hover:text-white">
                    Página principal
                  </Link>
                </li>
                <li>
                  <Link href="/#subjects" className="transition-colors hover:text-white">
                    Catálogo de asignaturas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Admin */}
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Gestión</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link href="/admin" className="transition-colors hover:text-white">
                    Panel de administración
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="transition-colors hover:text-white">
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 px-6 py-5 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Syllabus Manager · Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
