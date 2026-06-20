'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export default function ThemeToggle() {
  // Always start as 'light' on SSR — sync with localStorage after mount
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the real theme from localStorage after hydration
    const stored = localStorage.getItem(STORAGE_KEY);
    const resolved: Theme = stored === 'dark' ? 'dark' : 'light';
    setTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      suppressHydrationWarning
    >
      {/* Suppress hydration warning on the icon wrapper since it differs server/client */}
      <span suppressHydrationWarning>
        {!mounted || theme === 'light' ? (
          // Moon icon — shown before mount (SSR default) and in light mode
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M17.293 13.293A8 8 0 0 1 6.707 2.707a.75.75 0 0 0-.974-.91A9.5 9.5 0 1 0 18.203 14.267a.75.75 0 0 0-.91-.974Z" />
          </svg>
        ) : (
          // Sun icon — shown in dark mode
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M10 2.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 10 2.75Zm0 11a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75ZM4.47 4.47a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 1 1-1.06 1.06L4.47 5.53a.75.75 0 0 1 0-1.06Zm9.293 9.293a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06ZM2.75 10a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 2.75 10Zm11 0a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75ZM5.177 13.763a.75.75 0 1 1 1.06 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707Zm9.646-9.646a.75.75 0 0 1 0 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707a.75.75 0 0 1 1.06 0ZM10 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
