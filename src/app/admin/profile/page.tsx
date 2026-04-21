'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type Profile = {
    id: string;
    name: string | null;
    title: string | null;
    bio: string | null;
    avatar_url: string | null;
};

const EMPTY_FORM = {
    name: '',
    title: '',
    bio: '',
    avatar_url: '',
};

export default function ProfilePage() {
    const [profileId, setProfileId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from('profile')
            .select('id, name, title, bio, avatar_url')
            .limit(1)
            .single()
            .then(({ data }) => {
                if (data) {
                    const p = data as Profile;
                    setProfileId(p.id);
                    setForm({
                        name: p.name ?? '',
                        title: p.title ?? '',
                        bio: p.bio ?? '',
                        avatar_url: p.avatar_url ?? '',
                    });
                }
                setLoading(false);
            });
    }, []);

    function set(field: keyof typeof EMPTY_FORM, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setStatus('idle');
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!profileId) return;
        setSaving(true);
        setStatus('idle');
        setErrorMsg(null);

        const supabase = createClient();
        const { error } = await supabase
            .from('profile')
            .update({
                name: form.name || null,
                title: form.title || null,
                bio: form.bio || null,
                avatar_url: form.avatar_url || null,
            })
            .eq('id', profileId);

        setSaving(false);
        if (error) {
            setStatus('error');
            setErrorMsg(error.message);
        } else {
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 3000);
        }
    }

    const initials = form.name
        ? form.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join('')
        : '?';

    if (loading) {
        return (
            <div className="p-8 flex items-center gap-2 text-sm text-gray-400">
                <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
                Cargando perfil...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Perfil del Docente</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Esta información se puede mostrar en la vista pública del sitio.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar preview */}
                <div className="flex items-center gap-5">
                    <div className="shrink-0 h-20 w-20 rounded-full overflow-hidden bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-sm">
                        {form.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={form.avatar_url}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="text-2xl font-bold text-white select-none">{initials}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            URL de foto de perfil
                        </label>
                        <input
                            type="text"
                            value={form.avatar_url}
                            onChange={(e) => set('avatar_url', e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                    {/* Full name */}
                    <div className="px-6 py-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Nombre completo <span className="text-red-400">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={(e) => set('name', e.target.value)}
                            placeholder="Ej: Dr. Juan Pérez López"
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Title / role */}
                    <div className="px-6 py-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Título / Cargo
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            placeholder="Ej: Docente, Ing. en Sistemas, Dr. en Ciencias"
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Bio */}
                    <div className="px-6 py-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Biografía
                        </label>
                        <textarea
                            rows={4}
                            value={form.bio}
                            onChange={(e) => set('bio', e.target.value)}
                            placeholder="Breve descripción profesional..."
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                Guardando...
                            </>
                        ) : 'Guardar cambios'}
                    </button>

                    {status === 'saved' && (
                        <span className="text-sm text-emerald-600 font-medium">✓ Cambios guardados</span>
                    )}
                    {status === 'error' && (
                        <span className="text-sm text-red-600 font-medium">
                            Error: {errorMsg}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
