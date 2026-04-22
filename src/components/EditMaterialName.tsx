'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Props {
    materialId: string;
    currentName: string;
}

export default function EditMaterialName({ materialId, currentName }: Props) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentName);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    async function handleSave() {
        if (saving || name.trim() === currentName.trim()) {
            setIsEditing(false);
            setName(currentName);
            return;
        }

        if (!name.trim()) {
            setName(currentName);
            setIsEditing(false);
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('materials')
                .update({ name: name.trim() })
                .eq('id', materialId);

            if (error) throw error;

            setIsEditing(false);
            router.refresh();
        } catch (err) {
            console.error('Error updating material name:', err);
            setName(currentName);
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    }

    function handleCancel() {
        setName(currentName);
        setIsEditing(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    }

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                disabled={saving}
                className="flex-1 min-w-0 text-sm text-gray-700 bg-white border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-1.5 flex-1 min-w-0 text-left hover:text-blue-600 transition-colors"
        >
            <span className="flex-1 min-w-0 truncate text-sm text-gray-700 group-hover:text-blue-600">
                {currentName}
            </span>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="shrink-0 size-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
            </svg>
        </button>
    );
}
