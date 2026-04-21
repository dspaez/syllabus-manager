'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    table: string;
    id: string;
    confirmMessage?: string;
}

export default function DeleteRowButton({ table, id, confirmMessage }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const message = confirmMessage ?? '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.';
        if (!confirm(message)) return;

        setLoading(true);
        try {
            const supabase = createClient();
            await supabase.from(table).delete().eq('id', id);
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 text-red-600 hover:bg-red-100"
        >
            {loading ? '...' : 'Eliminar'}
        </button>
    );
}
