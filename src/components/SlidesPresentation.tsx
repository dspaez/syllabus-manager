'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Slide {
    title: string;
    points: string[];
    keyword?: string;
}

interface Props {
    slides: Slide[];
    name: string;
}

type AnimState = 'in' | 'out-next' | 'out-prev';

const THEMES = [
    { from: '#0f172a', to: '#1e3a8a', accent: '#60a5fa' }, // blue
    { from: '#1e1b4b', to: '#6d28d9', accent: '#a78bfa' }, // purple
    { from: '#052e16', to: '#065f46', accent: '#34d399' }, // green
    { from: '#450a0a', to: '#991b1b', accent: '#f87171' }, // red
    { from: '#431407', to: '#9a3412', accent: '#fb923c' }, // orange
    { from: '#083344', to: '#0e7490', accent: '#22d3ee' }, // cyan
];

// Dot grid pattern
const DOT_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='white' fill-opacity='0.06'/%3E%3C/svg%3E")`;

const animClasses: Record<AnimState, string> = {
    'in': 'opacity-100 translate-x-0',
    'out-next': 'opacity-0 translate-x-16',
    'out-prev': 'opacity-0 -translate-x-16',
};

export default function SlidesPresentation({ slides, name }: Props) {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [anim, setAnim] = useState<AnimState>('in');
    // keyword → image URL cache (null = loading, '' = no image found)
    const [imageCache, setImageCache] = useState<Record<string, string | null>>({});

    useEffect(() => {
        const keyword = slides[current]?.keyword;
        if (!keyword) return;
        if (keyword in imageCache) return; // already fetched

        setImageCache((prev) => ({ ...prev, [keyword]: null })); // mark loading

        const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        if (!key) return;

        fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${key}` } },
        )
            .then((r) => r.json())
            .then((data) => {
                const url: string = data?.results?.[0]?.urls?.regular ?? '';
                setImageCache((prev) => ({ ...prev, [keyword]: url }));
            })
            .catch(() => {
                setImageCache((prev) => ({ ...prev, [keyword]: '' }));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    function navigate(newIndex: number, dir: 'next' | 'prev') {
        if (anim !== 'in') return;
        setAnim(dir === 'next' ? 'out-next' : 'out-prev');
        setTimeout(() => {
            setCurrent(newIndex);
            setAnim('in');
        }, 200);
    }

    const prev = useCallback(() => {
        if (current > 0) navigate(current - 1, 'prev');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, anim]);

    const next = useCallback(() => {
        if (current < slides.length - 1) navigate(current + 1, 'next');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, slides.length, anim]);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [prev, next]);

    const slide = slides[current];
    const theme = THEMES[current % THEMES.length];
    const progress = ((current + 1) / slides.length) * 100;
    const keyword = slide?.keyword ?? '';
    const bgImage = keyword ? (imageCache[keyword] ?? null) : null; // null = loading/no keyword

    return (
        <div
            className="min-h-screen flex flex-col select-none transition-colors duration-500 relative"
            style={{
                background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
                backgroundImage: [
                    `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
                    DOT_PATTERN,
                ].join(', '),
            }}
        >
            {/* Unsplash background image + overlay */}
            {bgImage && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                    <div className="absolute inset-0 bg-black/75" />
                </>
            )}

            {/* All slide content sits above the background layers */}
            <div className="relative z-10 flex flex-col flex-1">
                {/* Progress bar */}
                <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%`, background: theme.accent }}
                    />
                </div>

                {/* Top bar */}
                <div className="flex items-center justify-between px-8 py-4">
                    <span className="text-white/40 text-sm truncate max-w-sm">{name}</span>
                    <button
                        onClick={() => router.back()}
                        className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Salir de la presentación"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    </button>
                </div>

                {/* Slide area with side nav */}
                <div className="flex-1 flex items-center gap-2 px-4 sm:px-6">
                    {/* Prev */}
                    <button
                        onClick={prev}
                        disabled={current === 0}
                        className="shrink-0 p-3 rounded-full text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Slide anterior"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Slide content */}
                    <div className="flex-1 flex justify-center py-8">
                        <div className={`w-full max-w-3xl transition-all duration-200 ease-in-out ${animClasses[anim]}`}>

                            {/* Slide number badge */}
                            <div className="mb-8 flex items-center gap-3">
                                <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase"
                                    style={{ background: 'rgba(255,255,255,0.12)', color: theme.accent }}
                                >
                                    {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                                </span>
                            </div>

                            {/* Title */}
                            <h2
                                className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 pl-4"
                                style={{
                                    textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                                    borderLeft: `4px solid ${theme.accent}`,
                                }}
                            >
                                {slide.title}
                            </h2>

                            {/* Accent underline */}
                            <div
                                className="mb-10 h-1 w-16 rounded-full"
                                style={{ background: theme.accent }}
                            />

                            {/* Points */}
                            <ul className="space-y-2 max-w-2xl">
                                {slide.points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                            className="mt-0.5 shrink-0 size-5"
                                            style={{ color: theme.accent }}
                                        >
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-white/85 text-lg font-medium leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Next */}
                    <button
                        onClick={next}
                        disabled={current === slides.length - 1}
                        className="shrink-0 p-3 rounded-full text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Slide siguiente"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Dot navigation */}
                <div className="flex justify-center gap-2 py-6">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => i !== current && navigate(i, i > current ? 'next' : 'prev')}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={
                                i === current
                                    ? { width: '1.5rem', background: theme.accent }
                                    : { width: '0.375rem', background: 'rgba(255,255,255,0.2)' }
                            }
                            aria-label={`Ir a slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>{/* end z-10 wrapper */}
        </div>
    );
}

