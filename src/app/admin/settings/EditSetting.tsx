'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Props {
    settingKey: string;
    initialValue: string;
}

export default function EditSetting({ settingKey, initialValue }: Props) {
    const [value, setValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const isDirty = value !== initialValue;

    async function handleSave() {
        setSaving(true);
        setStatus('idle');
        const supabase = createClient();
        const { error } = await supabase
            .from('settings')
            .update({ value })
            .eq('key', settingKey);
        setSaving(false);
        setStatus(error ? 'error' : 'saved');
        if (!error) setTimeout(() => setStatus('idle'), 2500);
    }

    return (
        <div className="space-y-2">
            <textarea
                value={value}
                onChange={(e) => { setValue(e.target.value); setStatus('idle'); }}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Guardando...
                        </>
                    ) : 'Guardar'}
                </button>
                {status === 'saved' && (
                    <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>
                )}
                {status === 'error' && (
                    <span className="text-xs text-red-600 font-medium">Error al guardar</span>
                )}
            </div>
        </div>
    );
}
