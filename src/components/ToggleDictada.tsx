'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    weekId: string;
    dictada: boolean;
}

export default function ToggleDictada({ weekId, dictada }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        setLoading(true);
        try {
            const supabase = createClient();
            await supabase
                .from('weeks')
                .update({ dictada: !dictada })
                .eq('id', weekId);
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            title="Marcar si esta clase ya se dio — el contexto real que usan las sugerencias de próxima semana depende de esto, no de si generaste materiales."
            className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-1 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${dictada
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                }`}
        >
            {dictada ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-3">
                    <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
                </svg>
            )}
            {loading ? '...' : dictada ? 'Dictada' : 'Sin dictar'}
        </button>
    );
}
