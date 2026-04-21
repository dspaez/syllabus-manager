'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    materialId: string;
    isPublished: boolean;
}

export default function TogglePublish({ materialId, isPublished }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        setLoading(true);
        try {
            const supabase = createClient();
            await supabase
                .from('materials')
                .update({ is_published: !isPublished })
                .eq('id', materialId);
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isPublished
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
        >
            {loading ? '...' : isPublished ? 'Despublicar' : 'Publicar'}
        </button>
    );
}
