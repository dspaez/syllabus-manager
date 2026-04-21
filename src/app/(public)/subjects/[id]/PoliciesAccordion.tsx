'use client';

import { useState } from 'react';

type Setting = {
    key: string;
    value: string;
};

const KEY_LABELS: Record<string, string> = {
    policy_attendance: '📅 Asistencia y Puntualidad',
    policy_tasks:      '📝 Tareas y Actividades',
    policy_evaluation: '📊 Evaluación General',
    policy_ethics:     '⚖️ Ética Académica',
    policy_delivery:   '📬 Entrega de Trabajos',
};

export default function PoliciesAccordion({ settings }: { settings: Setting[] }) {
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
                <span className="flex-1 text-base font-semibold text-gray-900">
                    📋 Consideraciones Generales
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

            {/* Content */}
            {open && (
                <div className="border-t border-gray-100 px-6 py-5 grid gap-4 sm:grid-cols-2">
                    {settings.map((s) => (
                        <div
                            key={s.key}
                            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4"
                        >
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                                {KEY_LABELS[s.key] ?? s.key}
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
