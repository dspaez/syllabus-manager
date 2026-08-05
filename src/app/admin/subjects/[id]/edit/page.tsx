'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

type Semester = { id: string; name: string };

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#185FA5');
    const [accentColor, setAccentColor] = useState('#3B82F6');
    const [semesterId, setSemesterId] = useState('');
    const [courseMode, setCourseMode] = useState<'project' | 'topics'>('topics');
    const [techStack, setTechStack] = useState('');
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        Promise.all([
            supabase.from('subjects').select('*').eq('id', id).single(),
            supabase.from('semesters').select('id, name').order('created_at', { ascending: false }),
        ]).then(([{ data: subject, error: subjectError }, { data: semestersData }]) => {
            if (subjectError || !subject) {
                setError('No se pudo cargar la asignatura.');
            } else {
                setName(subject.name ?? '');
                setDescription(subject.description ?? '');
                setColor(subject.color ?? '#185FA5');
                setAccentColor(subject.accent_color ?? '#3B82F6');
                setSemesterId(subject.semester_id ?? '');
                setCourseMode(subject.course_mode === 'project' ? 'project' : 'topics');
                setTechStack(subject.tech_stack ?? '');
            }
            if (semestersData) setSemesters(semestersData);
            setLoadingData(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        const supabase = createClient();
        const { error } = await supabase
            .from('subjects')
            .update({
                name,
                description: description || null,
                color,
                accent_color: accentColor,
                semester_id: semesterId || null,
                course_mode: courseMode,
                tech_stack: techStack.trim() || null,
            })
            .eq('id', id);

        if (error) {
            setError(error.message);
            setSaving(false);
            return;
        }

        router.push('/admin/subjects');
    };

    if (loadingData) {
        return (
            <div className="p-8 max-w-lg">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-lg">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Editar asignatura</h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5"
            >
                {/* Nombre */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Cálculo diferencial"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Descripción */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción breve de la asignatura"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Color + Semestre */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                            Color
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="color"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-9 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
                            />
                            <span className="text-xs text-gray-500 font-mono">{color}</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                            Semestre
                        </label>
                        <select
                            id="semester"
                            value={semesterId}
                            onChange={(e) => setSemesterId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Sin semestre</option>
                            {semesters.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tipo de materia + Stack */}
                <div>
                    <label htmlFor="courseMode" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de materia
                    </label>
                    <select
                        id="courseMode"
                        value={courseMode}
                        onChange={(e) => setCourseMode(e.target.value as 'project' | 'topics')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="topics">Temas con ejercicios</option>
                        <option value="project">Proyecto progresivo</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        &ldquo;Proyecto progresivo&rdquo; habilita el documento técnico evolutivo del proyecto.
                    </p>
                </div>

                <div>
                    <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-1">
                        Color de acento (Class Kit)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="accentColor"
                            type="color"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="h-9 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
                        />
                        <span className="text-xs text-gray-500 font-mono">{accentColor}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Color protagonista de la portada y los tags al generar un Class Kit. Los colores por tipo de slide (problema, solución, etc.) son fijos.
                    </p>
                </div>

                <div>
                    <label htmlFor="techStack" className="block text-sm font-medium text-gray-700 mb-1">
                        Stack tecnológico
                    </label>
                    <input
                        id="techStack"
                        type="text"
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        placeholder='Ej. "Python 3.11", "Java 17", "Next.js + Supabase"'
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Se usa como contexto al generar contenido con IA.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <Link
                        href="/admin/subjects"
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
}
