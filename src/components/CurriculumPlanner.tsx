'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    subjectId: string;
    subjectName: string;
}

type Modality = 'presencial' | 'semipresencial' | 'linea';

const MODALITY_LABELS: Record<Modality, string> = {
    presencial: 'Presencial (3-4 horas)',
    semipresencial: 'Semipresencial (2 horas)',
    linea: 'En línea (1 hora)',
};

const MODALITY_HOURS: Record<Modality, number> = {
    presencial: 4,
    semipresencial: 2,
    linea: 1,
};

interface PlanWeek {
    number: number;
    title: string;
    topics: string[];
    depth?: string;
    justification: string;
}

interface PlanUnit {
    name: string;
    order: number;
    weeks: PlanWeek[];
}

interface CurriculumPlan {
    summary: string;
    units: PlanUnit[];
}

export default function CurriculumPlanner({ subjectId, subjectName }: Props) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [modality, setModality] = useState<Modality>('presencial');
    const [hoursPerWeek, setHoursPerWeek] = useState<number>(4);
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<CurriculumPlan | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Collapsible units — stores order numbers of collapsed units
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

    // Save state
    const [savingStep, setSavingStep] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    function openModal() {
        setPlan(null);
        setError(null);
        setTopic('');
        setModality('presencial');
        setHoursPerWeek(4);
        setSaved(false);
        setSavingStep(null);
        setCollapsed(new Set());
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
    }

    function handleModalityChange(m: Modality) {
        setModality(m);
        setHoursPerWeek(MODALITY_HOURS[m]);
    }

    function toggleUnit(order: number) {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(order)) next.delete(order);
            else next.add(order);
            return next;
        });
    }

    async function handleGenerate() {
        if (!topic.trim()) return;
        setLoading(true);
        setError(null);
        setPlan(null);
        setSaved(false);
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'curriculum',
                    topic: topic.trim(),
                    modality: MODALITY_LABELS[modality],
                    hoursPerWeek,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Error al generar el plan');
            }
            const data: CurriculumPlan = await res.json();
            setPlan(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!plan) return;
        setError(null);
        const supabase = createClient();
        try {
            // 1 — Insert units
            setSavingStep('Creando unidades...');
            const { data: insertedUnits, error: unitsError } = await supabase
                .from('units')
                .insert(
                    plan.units.map((u) => ({
                        subject_id: subjectId,
                        name: u.name,
                        order: u.order,
                        description: null,
                    }))
                )
                .select('id, order');

            if (unitsError) throw new Error(unitsError.message);
            if (!insertedUnits) throw new Error('No se recibieron las unidades creadas');

            const unitIdByOrder: Record<number, string> = {};
            for (const u of insertedUnits) unitIdByOrder[u.order] = u.id;

            // 2 — Insert weeks
            setSavingStep('Creando semanas...');
            const weekRows = plan.units.flatMap((u) =>
                u.weeks.map((w) => ({
                    unit_id: unitIdByOrder[u.order],
                    number: w.number,
                    title: w.title,
                    description: w.topics.join(', '),
                }))
            );

            const { error: weeksError } = await supabase.from('weeks').insert(weekRows);
            if (weeksError) throw new Error(weeksError.message);

            setSaved(true);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSavingStep(null);
        }
    }

    const totalWeeks = plan?.units.reduce((acc, u) => acc + u.weeks.length, 0) ?? 0;

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={openModal}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
                🔍 Planificar con IA
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeModal}
                    />

                    {/* Panel */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                        {/* Header */}
                        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    Planificador Curricular con IA
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Genera un plan de 16 semanas basado en tendencias actuales
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

                            {/* Modality + hours row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-700">Modalidad</label>
                                    <select
                                        value={modality}
                                        onChange={(e) => handleModalityChange(e.target.value as Modality)}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    >
                                        {(Object.entries(MODALITY_LABELS) as [Modality, string][]).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-700">Horas semanales</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={8}
                                        value={hoursPerWeek}
                                        onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            </div>

                            {/* Topic input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Describe la asignatura o tecnología a planificar
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    rows={3}
                                    placeholder="Ej: Programación en Java para estudiantes de primer año"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Generate button */}
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !topic.trim()}
                                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        Buscando tendencias actuales...
                                    </>
                                ) : (
                                    '✨ Generar plan'
                                )}
                            </button>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            {/* Results */}
                            {plan && (
                                <div className="space-y-4">

                                    {/* Summary */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4">
                                        <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">
                                            Tendencias encontradas
                                        </p>
                                        <p className="text-sm text-blue-900 leading-relaxed">{plan.summary}</p>
                                    </div>

                                    {/* Stats */}
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {plan.units.length} unidades · {totalWeeks} semanas
                                    </p>

                                    {/* Collapsible units */}
                                    <div className="space-y-3">
                                        {plan.units.map((unit) => {
                                            const isOpen = !collapsed.has(unit.order);
                                            return (
                                                <div key={unit.order} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleUnit(unit.order)}
                                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="shrink-0 h-5 w-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                                                                {unit.order}
                                                            </span>
                                                            <span className="text-sm font-semibold text-gray-800">{unit.name}</span>
                                                            <span className="text-xs text-gray-400">{unit.weeks.length} semanas</span>
                                                        </div>
                                                        <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="divide-y divide-gray-50">
                                                            {unit.weeks.map((week) => (
                                                                <div key={week.number} className="px-4 py-3">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="shrink-0 h-5 w-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                                                                            {week.number}
                                                                        </span>
                                                                        <p className="text-sm font-medium text-gray-800">{week.title}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5 mb-1.5 pl-7">
                                                                        {week.topics.map((t) => (
                                                                            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                                                {t}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {week.depth && (
                                                                        <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1 mb-1.5 ml-7">
                                                                            🎯 {week.depth}
                                                                        </p>
                                                                    )}
                                                                    {week.justification && (
                                                                        <p className="text-xs text-gray-400 leading-relaxed pl-7">
                                                                            {week.justification}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Save */}
                                    {saved ? (
                                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl font-medium">
                                            ✅ {plan.units.length} unidades y {totalWeeks} semanas creadas correctamente.
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            disabled={!!savingStep}
                                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed"
                                        >
                                            {savingStep ? (
                                                <>
                                                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                    {savingStep}
                                                </>
                                            ) : (
                                                `📥 Crear todo (${plan.units.length} unidades, ${totalWeeks} semanas)`
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
