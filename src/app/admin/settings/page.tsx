import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import EditSetting from './EditSetting';

type Setting = {
    id: string;
    key: string;
    value: string;
    description: string | null;
};

const KEY_LABELS: Record<string, string> = {
    policy_attendance: '📅 Asistencia y Puntualidad',
    policy_tasks:      '📝 Tareas y Actividades',
    policy_evaluation: '📊 Evaluación General',
    policy_ethics:     '⚖️ Ética Académica',
    policy_delivery:   '📬 Entrega de Trabajos',
};

const KEY_DESCRIPTIONS: Record<string, string> = {
    policy_attendance: 'Define los requisitos mínimos de asistencia, criterios de puntualidad y consecuencias por ausencias injustificadas.',
    policy_tasks:      'Establece las normas para la entrega de tareas, actividades en clase y trabajo extraclase.',
    policy_evaluation: 'Describe los criterios de calificación, ponderación de parciales y condiciones de acreditación.',
    policy_ethics:     'Regula el comportamiento ético, manejo de plagio, uso de IA y honestidad académica.',
    policy_delivery:   'Indica los canales, formatos y plazos oficiales para la entrega de trabajos y proyectos.',
};

export default async function SettingsPage() {
    const supabase = createClient(await cookies());
    const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .order('key', { ascending: true });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuración General</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Políticas que aplican a todas las asignaturas
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-6">
                    No se pudo cargar la configuración: {error.message}
                </div>
            )}

            {/* Empty state */}
            {!error && (!settings || settings.length === 0) && (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center py-20">
                    <p className="text-3xl mb-3">⚙️</p>
                    <p className="text-base font-semibold text-slate-600 dark:text-slate-400">Sin configuraciones aún</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        Agrega registros en la tabla <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">settings</code> de Supabase.
                    </p>
                </div>
            )}

            {/* Settings list */}
            {settings && settings.length > 0 && (
                <div className="space-y-4 max-w-2xl">
                    {(settings as Setting[]).map((setting) => (
                        <div
                            key={setting.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-5"
                        >
                            <div className="mb-3">
                                <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-0.5">
                                    {KEY_LABELS[setting.key] ?? setting.key}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mb-1">{setting.key}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {KEY_DESCRIPTIONS[setting.key] ?? setting.description}
                                </p>
                            </div>
                            <EditSetting settingKey={setting.key} initialValue={setting.value} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
