'use client';

import { useState } from 'react';

type Setting = {
    key: string;
    value: string;
};

const KEY_LABELS: Record<string, { label: string; borderColor: string; icon: React.ReactNode }> = {
    policy_attendance: {
        label: 'Asistencia y Puntualidad',
        borderColor: '#3b82f6',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
            </svg>
        ),
    },
    policy_tasks: {
        label: 'Tareas y Actividades',
        borderColor: '#8b5cf6',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="M5.127 3.502 5.25 3.5h9.5c.041 0 .082 0 .123.002A2.251 2.251 0 0 0 12.75 2h-5.5a2.25 2.25 0 0 0-2.123 1.502ZM1 10.25A2.25 2.25 0 0 1 3.25 8h13.5A2.25 2.25 0 0 1 19 10.25v5.5A2.25 2.25 0 0 1 16.75 18H3.25A2.25 2.25 0 0 1 1 15.75v-5.5ZM3.25 6.5c-.04 0-.082 0-.123.002A2.25 2.25 0 0 1 5.25 5h9.5c.98 0 1.814.627 2.123 1.502a3.819 3.819 0 0 0-.123-.002H3.25Z" />
            </svg>
        ),
    },
    policy_evaluation: {
        label: 'Evaluación General',
        borderColor: '#f59e0b',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06A.75.75 0 1 1 6.11 5.173L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.061l1.061-1.06a.75.75 0 0 1 1.06 0ZM3 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 8Zm11 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 8Zm-6.828 2.172a.75.75 0 0 1 0 1.06L6.11 12.295a.75.75 0 0 1-1.06-1.06l1.06-1.063a.75.75 0 0 1 1.06 0Zm3.656 0a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 0 1-1.061 1.062l-1.06-1.061a.75.75 0 0 1 0-1.061ZM10 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 13ZM10 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" clipRule="evenodd" />
            </svg>
        ),
    },
    policy_ethics: {
        label: 'Ética Académica',
        borderColor: '#10b981',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.84 11.256a.48.48 0 0 1-.316 0C5.26 16.563 2 12.162 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
        ),
    },
    policy_delivery: {
        label: 'Entrega de Trabajos',
        borderColor: '#f43f5e',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
        ),
    },
};

export default function PoliciesAccordion({ settings, accentColor }: { settings: Setting[]; accentColor?: string }) {
    const [open, setOpen] = useState(false);

    if (settings.length === 0) return null;

    return (
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Toggle header */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-6 py-5 hover:bg-gray-50 transition-colors text-left"
                aria-expanded={open}
            >
                {/* Book icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className="size-5 shrink-0 text-gray-500">
                    <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
                </svg>
                <span className="flex-1 text-base font-semibold text-gray-900">
                    Consideraciones Generales
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`size-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                >
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Content with CSS transition */}
            <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open ? '2000px' : '0px' }}
            >
                <div className="border-t border-gray-100 px-6 py-5 grid gap-4 sm:grid-cols-2">
                    {settings.map((s) => {
                        const meta = KEY_LABELS[s.key];
                        const borderColor = meta?.borderColor ?? (accentColor ?? '#94a3b8');
                        return (
                            <div
                                key={s.key}
                                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4 overflow-hidden"
                                style={{ borderLeft: `3px solid ${borderColor}` }}
                            >
                                <div className="flex items-center gap-2 mb-2" style={{ color: borderColor }}>
                                    {meta?.icon}
                                    <p className="text-sm font-semibold text-gray-800">
                                        {meta?.label ?? s.key}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {s.value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
