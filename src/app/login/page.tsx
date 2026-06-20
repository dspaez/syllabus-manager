'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError('Correo o contraseña incorrectos.');
            setLoading(false);
            return;
        }

        router.push('/admin');
    };

    return (
        <main className="min-h-screen flex bg-slate-50 dark:bg-slate-950">

            {/* ── Panel izquierdo institucional ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 bg-[#0f2a5e] overflow-hidden">

                {/* Grilla de puntos — elemento firma */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.07]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>

                {/* Acento geométrico superior derecho */}
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 border border-blue-400/10" />
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-500/10 border border-indigo-400/10" />

                {/* Acento inferior izquierdo */}
                <div className="absolute -bottom-40 -left-20 w-80 h-80 rounded-full bg-blue-600/10 border border-blue-500/10" />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-white">
                            <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">AulaVirtual</span>
                </div>

                {/* Contenido central */}
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
                        <span className="text-blue-200 text-xs font-medium tracking-wide uppercase">Portal académico</span>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                        Gestión de<br />
                        <span className="text-blue-300">materiales</span><br />
                        académicos
                    </h1>
                    <p className="text-blue-200/70 text-base leading-relaxed max-w-sm">
                        Organiza semestres, asignaturas y recursos de estudio desde un solo lugar.
                    </p>
                </div>

                {/* Cita institucional */}
                <div className="relative z-10 border-l-2 border-blue-400/40 pl-5">
                    <p className="text-blue-100/60 text-sm italic leading-relaxed">
                        "La educación es el arma más poderosa que puedes usar para cambiar el mundo."
                    </p>
                    <p className="text-blue-300/50 text-xs mt-2 font-medium">— Nelson Mandela</p>
                </div>
            </div>

            {/* ── Panel derecho — formulario ── */}
            <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-16 xl:px-24">

                {/* Logo visible solo en móvil */}
                <div className="flex lg:hidden items-center gap-3 mb-10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-white">
                            <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                        </svg>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">AulaVirtual</span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Encabezado del formulario */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            Acceso docente
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                            Ingresa tus credenciales para continuar.
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                                placeholder="nombre@institucion.edu"
                            />
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0 text-red-500 mt-0.5">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verificando...
                                </>
                            ) : (
                                'Ingresar al portal'
                            )}
                        </button>
                    </form>

                    {/* Pie */}
                    <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
                        Solo para personal docente autorizado.
                    </p>
                </div>
            </div>
        </main>
    );
}
