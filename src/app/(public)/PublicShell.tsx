'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { subjectEmoji } from '@/utils/subjectEmoji';

type SubjectNavItem = {
  id: string;
  name: string;
  color: string | null;
};

function isSubjectRoute(pathname: string, subjectId: string): boolean {
  return pathname === `/subjects/${subjectId}`;
}

export default function PublicShell({
  children,
  subjects,
}: {
  children: ReactNode;
  subjects: SubjectNavItem[];
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-slate-100/90 px-4 py-5 shadow-sm transition-transform dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link href="/" className="mb-8 flex items-center gap-3 rounded-xl px-2 py-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
            📚
          </span>
          <span className="text-lg font-black text-blue-700 dark:text-blue-300">AulaVirtual</span>
        </Link>

        <nav className="space-y-6 overflow-y-auto">
          <div>
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                pathname === '/'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>🏠</span>
              Inicio
            </Link>
          </div>

          <div>
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Mis asignaturas
            </p>
            <ul className="space-y-1">
              {subjects.map((subject) => {
                const isActive = isSubjectRoute(pathname, subject.id);
                return (
                  <li key={subject.id}>
                    <Link
                      href={`/subjects/${subject.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-base">{subjectEmoji(subject.name)}</span>
                      <span className="truncate">{subject.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú lateral"
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Abrir menú lateral"
          >
            ☰
          </button>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">E</span>
              Hola, Estudiante
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
