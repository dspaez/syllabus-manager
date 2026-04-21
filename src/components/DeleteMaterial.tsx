'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    materialId: string;
    fileUrl: string | null;
}

export default function DeleteMaterial({ materialId, fileUrl }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm('¿Estás seguro de que quieres eliminar este material? Esta acción no se puede deshacer.')) return;

        setLoading(true);
        try {
            const supabase = createClient();

            // If the material has an associated storage file, delete it first
            if (fileUrl) {
                // Extract the path after the storage bucket prefix
                const match = fileUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
                if (match) {
                    const bucket = match[1];
                    const path = match[2];
                    await supabase.storage.from(bucket).remove([path]);
                }
            }

            await supabase.from('materials').delete().eq('id', materialId);
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
