'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Slide {
    title: string;
    points?: string[];
    keyword?: string;
    layout?: 'title' | 'list' | 'two-column' | 'code';
    left?: string[];
    right?: string[];
    leftTitle?: string;
    rightTitle?: string;
    code?: string;
    language?: string;
}

interface Props {
    slides: Slide[];
    name: string;
    subjectColor?: string;
}

type AnimState = 'in' | 'out-next' | 'out-prev';

type FullscreenDocument = Document & {
    webkitFullscreenElement?: Element | null;
    webkitFullscreenEnabled?: boolean;
    webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};

const animClasses: Record<AnimState, string> = {
    'in': 'opacity-100 translate-x-0',
    'out-next': 'opacity-0 translate-x-16',
    'out-prev': 'opacity-0 -translate-x-16',
};

// ── Color utilities ────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function darkenColor(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const factor = 1 - percent / 100;
    return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

function adjustColor(
    baseColor: string,
    slideIndex: number,
): { from: string; to: string; accent: string } {
    const basePercent = 80;
    const variance = (slideIndex % 3) * 3;
    const fromPercent = basePercent + variance;
    const toPercent = 95;

    return {
        from: darkenColor(baseColor, fromPercent),
        to: darkenColor(baseColor, toPercent),
        accent: '#60a5fa',
    };
}

// ── Animated pattern component ─────────────────────────────────────────────

function AnimatedPattern({ patternType }: { patternType: number }) {
    const shapes = [];
    const count = 15;

    for (let i = 0; i < count; i++) {
        const size = 30 + (i % 4) * 20;
        const left = (i * 7) % 100;
        const top = (i * 13) % 100;
        const delay = (i * 0.5) % 3;
        const duration = 4 + (i % 3);

        if (patternType % 2 === 0) {
            shapes.push(
                <div
                    key={i}
                    className="absolute animate-float"
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration}s`,
                    }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                        <polygon
                            points="50 1 95 25 95 75 50 99 5 75 5 25"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                        />
                    </svg>
                </div>,
            );
        } else {
            shapes.push(
                <div
                    key={i}
                    className="absolute animate-float"
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration}s`,
                    }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-10">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" />
                    </svg>
                </div>,
            );
        }
    }

    return <div className="absolute inset-0 overflow-hidden pointer-events-none">{shapes}</div>;
}

function cleanText(text: string) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1');
}

function escapeHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveLayout(layout?: Slide['layout']): NonNullable<Slide['layout']> {
    return layout === 'title' || layout === 'list' || layout === 'two-column' || layout === 'code'
        ? layout
        : 'list';
}

function SlideContent({
    slide,
    theme,
}: {
    slide: Slide;
    theme: { accent: string };
}) {
    const layout = resolveLayout(slide.layout);
    const points = (slide.points ?? []).map(cleanText);
    const leftItems = (slide.left ?? []).map(cleanText);
    const rightItems = (slide.right ?? []).map(cleanText);

    if (layout === 'title') {
        return (
            <div className="text-center py-6 md:py-10">
                <h2
                    className="text-6xl md:text-7xl font-black text-white leading-tight mb-6"
                    style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
                >
                    {slide.title}
                </h2>
                {points.length > 0 && (
                    <ul className="space-y-2 max-w-2xl mx-auto">
                        {points.map((point, i) => (
                            <li key={i} className="text-white/70 text-lg leading-relaxed">
                                {point}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    if (layout === 'two-column') {
        return (
            <>
                <h2
                    className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 pl-4"
                    style={{
                        textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                        borderLeft: `4px solid ${theme.accent}`,
                    }}
                >
                    {slide.title}
                </h2>
                <div className="mb-10 h-1 w-16 rounded-full" style={{ background: theme.accent }} />
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/35 backdrop-blur-sm rounded-xl p-4">
                        <h3 className="text-lg font-bold mb-3" style={{ color: theme.accent }}>
                            {slide.leftTitle || 'Columna A'}
                        </h3>
                        <ul className="space-y-2">
                            {leftItems.map((item, i) => (
                                <li key={i} className="text-white/85 text-base leading-relaxed list-disc ml-5">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-black/35 backdrop-blur-sm rounded-xl p-4 md:border-l md:border-white/15">
                        <h3 className="text-lg font-bold mb-3" style={{ color: theme.accent }}>
                            {slide.rightTitle || 'Columna B'}
                        </h3>
                        <ul className="space-y-2">
                            {rightItems.map((item, i) => (
                                <li key={i} className="text-white/85 text-base leading-relaxed list-disc ml-5">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </>
        );
    }

    if (layout === 'code') {
        return (
            <>
                <h2
                    className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 pl-4"
                    style={{
                        textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                        borderLeft: `4px solid ${theme.accent}`,
                    }}
                >
                    {slide.title}
                </h2>
                <div className="mb-8 h-1 w-16 rounded-full" style={{ background: theme.accent }} />
                {points.length > 0 && (
                    <ul className="space-y-2 mb-6 max-w-3xl">
                        {points.slice(0, 3).map((point, i) => (
                            <li key={i} className="flex items-start gap-3 bg-black/35 backdrop-blur-sm rounded-lg px-4 py-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: theme.accent }} />
                                <span className="text-white/85 text-lg font-medium leading-relaxed">{point}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="relative rounded-xl bg-black/60 border border-white/10 p-4">
                    <span
                        className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: theme.accent, background: 'rgba(255,255,255,0.1)' }}
                    >
                        {slide.language || 'code'}
                    </span>
                    <pre className="overflow-x-auto pr-14">
                        <code className="font-mono text-sm leading-6 whitespace-pre" style={{ color: '#86efac' }}>
                            {slide.code || '// Código no disponible'}
                        </code>
                    </pre>
                </div>
            </>
        );
    }

    return (
        <>
            <h2
                className="text-5xl md:text-6xl font-black text-white leading-tight mb-5 pl-4"
                style={{
                    textShadow: '0 2px 20px rgba(0,0,0,0.8)',
                    borderLeft: `4px solid ${theme.accent}`,
                }}
            >
                {slide.title}
            </h2>
            <div className="mb-10 h-1 w-16 rounded-full" style={{ background: theme.accent }} />
            <ul
                role="list"
                aria-label="Puntos de la diapositiva"
                tabIndex={0}
                className="space-y-2 max-w-2xl pr-2 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg"
            >
                {points.map((point, i) => (
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
        </>
    );
}

export default function SlidesPresentation({ slides, name, subjectColor = '#185FA5' }: Props) {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [anim, setAnim] = useState<AnimState>('in');
    // ✅ Fix hydration: always start false on SSR, sync on client via useEffect
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenEnabled, setFullscreenEnabled] = useState(false);

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

    const toggleFullscreen = useCallback(async () => {
        const doc = document as FullscreenDocument;
        const root = document.documentElement as FullscreenElement;
        const activeElement = document.fullscreenElement || doc.webkitFullscreenElement;

        try {
            if (activeElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (doc.webkitExitFullscreen) {
                    await doc.webkitExitFullscreen();
                }
            } else if (root.requestFullscreen) {
                await root.requestFullscreen();
            } else if (root.webkitRequestFullscreen) {
                await root.webkitRequestFullscreen();
            }
        } catch (error) {
            console.warn('Unable to toggle fullscreen mode.', error);
        }
    }, []);

    const exportToPDF = useCallback(() => {
        function buildSlideHTML(
            slide: Slide,
            layout: NonNullable<Slide['layout']>,
            theme: { accent: string },
            index: number,
            total: number,
        ): string {
            const points = (slide.points ?? []).map(p => escapeHTML(cleanText(p)));
            const leftItems = (slide.left ?? []).map(p => escapeHTML(cleanText(p)));
            const rightItems = (slide.right ?? []).map(p => escapeHTML(cleanText(p)));
            const title = escapeHTML(slide.title);
            const leftTitle = escapeHTML(slide.leftTitle || 'Columna A');
            const rightTitle = escapeHTML(slide.rightTitle || 'Columna B');
            const language = escapeHTML(slide.language || 'code');
            const accent = escapeHTML(theme.accent);

            if (layout === 'title') {
                return `<div style="text-align:center;padding:2rem 0;">
  <div style="font-size:0.7rem;letter-spacing:0.2em;color:${accent};margin-bottom:1.5rem;text-transform:uppercase;">${index + 1} / ${total}</div>
  <h1 style="font-size:3rem;font-weight:900;margin:0 0 1.5rem;line-height:1.1;color:white;">${title}</h1>
  <ul style="list-style:none;padding:0;margin:0 auto;max-width:500px;">
    ${points.map(p => `<li style="color:rgba(255,255,255,0.7);font-size:1rem;margin-bottom:0.5rem;">${p}</li>`).join('')}
  </ul>
</div>`;
            }

            if (layout === 'two-column') {
                return `<div>
  <div style="font-size:0.7rem;letter-spacing:0.2em;color:${accent};margin-bottom:0.75rem;text-transform:uppercase;">${index + 1} / ${total}</div>
  <h2 style="font-size:2rem;font-weight:900;border-left:4px solid ${accent};padding-left:1rem;margin:0 0 0.4rem;color:white;">${title}</h2>
  <div style="height:3px;width:2.5rem;background:${accent};border-radius:9999px;margin-bottom:1rem;"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
    <div style="background:rgba(0,0,0,0.3);border-radius:0.5rem;padding:0.75rem;">
      <h3 style="color:${accent};font-weight:700;margin:0 0 0.5rem;font-size:0.95rem;">${leftTitle}</h3>
      <ul style="list-style:disc;padding-left:1.1rem;margin:0;color:white;">
        ${leftItems.map(item => `<li style="margin-bottom:0.3rem;font-size:0.85rem;">${item}</li>`).join('')}
      </ul>
    </div>
    <div style="background:rgba(0,0,0,0.3);border-radius:0.5rem;padding:0.75rem;border-left:1px solid rgba(255,255,255,0.1);">
      <h3 style="color:${accent};font-weight:700;margin:0 0 0.5rem;font-size:0.95rem;">${rightTitle}</h3>
      <ul style="list-style:disc;padding-left:1.1rem;margin:0;color:white;">
        ${rightItems.map(item => `<li style="margin-bottom:0.3rem;font-size:0.85rem;">${item}</li>`).join('')}
      </ul>
    </div>
  </div>
</div>`;
            }

            if (layout === 'code') {
                return `<div>
  <div style="font-size:0.7rem;letter-spacing:0.2em;color:${accent};margin-bottom:0.75rem;text-transform:uppercase;">${index + 1} / ${total}</div>
  <h2 style="font-size:2rem;font-weight:900;border-left:4px solid ${accent};padding-left:1rem;margin:0 0 0.4rem;color:white;">${title}</h2>
  <div style="height:3px;width:2.5rem;background:${accent};border-radius:9999px;margin-bottom:0.75rem;"></div>
  ${points.slice(0, 3).map(p => `<div style="background:rgba(0,0,0,0.3);border-radius:0.4rem;padding:0.3rem 0.75rem;margin-bottom:0.25rem;font-size:0.85rem;color:white;">${p}</div>`).join('')}
  <div style="background:rgba(0,0,0,0.6);border-radius:0.5rem;padding:0.75rem;margin-top:0.5rem;border:1px solid rgba(255,255,255,0.1);position:relative;">
    <span style="position:absolute;top:0.4rem;right:0.5rem;font-size:0.65rem;color:${accent};text-transform:uppercase;letter-spacing:0.1em;">${language}</span>
    <pre style="font-family:monospace;font-size:0.75rem;color:#86efac;margin:0;white-space:pre-wrap;word-break:break-word;">${escapeHTML(slide.code || '// Código no disponible')}</pre>
  </div>
</div>`;
            }

            // default: list
            return `<div>
  <div style="font-size:0.7rem;letter-spacing:0.2em;color:${accent};margin-bottom:0.75rem;text-transform:uppercase;">${index + 1} / ${total}</div>
  <h2 style="font-size:2rem;font-weight:900;border-left:4px solid ${accent};padding-left:1rem;margin:0 0 0.4rem;color:white;">${title}</h2>
  <div style="height:3px;width:2.5rem;background:${accent};border-radius:9999px;margin-bottom:1rem;"></div>
  <ul style="list-style:none;padding:0;margin:0;">
    ${points.map(p => `<li style="display:flex;gap:0.5rem;background:rgba(0,0,0,0.3);border-radius:0.4rem;padding:0.4rem 0.75rem;margin-bottom:0.3rem;font-size:0.9rem;line-height:1.4;color:white;">
      <span style="color:${accent};flex-shrink:0;">✓</span>
      <span>${p}</span>
    </li>`).join('')}
  </ul>
</div>`;
        }

        const printContainer = document.createElement('div');
        printContainer.id = 'slides-print-container';
        // Hidden from normal view; @media print will show it
        printContainer.style.cssText = 'display:none;';

        slides.forEach((slide, index) => {
            const layout = resolveLayout(slide.layout);
            const theme = adjustColor(subjectColor, index);
            const bgColor = layout === 'title'
                ? darkenColor(subjectColor, 55)
                : darkenColor(subjectColor, 80 + (index % 3) * 3);
            const bgColorTo = layout === 'title'
                ? darkenColor(subjectColor, 82)
                : darkenColor(subjectColor, 95);

            const page = document.createElement('div');
            page.className = 'slide-print-page';
            page.style.cssText = `background:linear-gradient(135deg,${bgColor} 0%,${bgColorTo} 100%);color:white;`;
            page.innerHTML = buildSlideHTML(slide, layout, theme, index, slides.length);
            printContainer.appendChild(page);
        });

        const style = document.createElement('style');
        style.id = 'slides-print-styles';
        // ✅ Fix: use @page size + fixed height in mm so each slide fills exactly one printed page
        style.textContent = `
            @page { size: A4 landscape; margin: 0; }
            @media print {
                body * { display: none !important; }
                #slides-print-container { display: block !important; }
                #slides-print-container * { display: revert !important; }
                .slide-print-page {
                    display: flex !important;
                    flex-direction: column;
                    justify-content: center;
                    width: 297mm;
                    height: 210mm;
                    padding: 2cm 2.5cm;
                    box-sizing: border-box;
                    overflow: hidden;
                    page-break-after: always;
                    break-after: page;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .slide-print-page:last-child {
                    page-break-after: avoid;
                    break-after: avoid;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(printContainer);

        const cleanup = () => {
            style.parentNode?.removeChild(style);
            printContainer.parentNode?.removeChild(printContainer);
        };
        window.addEventListener('afterprint', cleanup, { once: true });

        setTimeout(() => {
            window.print();
        }, 150);
    }, [slides, subjectColor]);

    // ✅ Fix hydration: check fullscreen support only on client
    useEffect(() => {
        const doc = document as FullscreenDocument;
        setFullscreenEnabled(
            Boolean(document.fullscreenEnabled || doc.webkitFullscreenEnabled)
        );
    }, []);

    useEffect(() => {
        const doc = document as FullscreenDocument;
        const syncFullscreenState = () =>
            setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));

        document.addEventListener('fullscreenchange', syncFullscreenState);
        document.addEventListener('webkitfullscreenchange', syncFullscreenState);

        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState);
            document.removeEventListener('webkitfullscreenchange', syncFullscreenState);
        };
    }, []);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            const target = e.target as HTMLElement | null;
            const isTypingTarget =
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable);

            if (!isTypingTarget && e.key.toLowerCase() === 'f') toggleFullscreen();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [prev, next, toggleFullscreen]);

    const slide = slides[current];
    const theme = adjustColor(subjectColor, current);
    const activeLayout = resolveLayout(slide?.layout);
    const progress = ((current + 1) / slides.length) * 100;

    return (
        <>
            {/* CSS for animation */}
            <style jsx global>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>

            <div
                className="min-h-screen flex flex-col select-none transition-colors duration-500 relative"
                style={{
                    background:
                        activeLayout === 'title'
                            ? `linear-gradient(135deg, ${darkenColor(subjectColor, 55)} 0%, ${darkenColor(subjectColor, 82)} 100%)`
                            : `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
                }}
            >
                {/* Animated pattern overlay */}
                <AnimatedPattern patternType={current} />

                {/* Large decorative slide number */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                    <span
                        className="text-white font-black opacity-5"
                        style={{ fontSize: '32rem', lineHeight: 1 }}
                    >
                        {current + 1}
                    </span>
                </div>

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
                <div className={`flex items-center justify-between px-8 transition-all ${isFullscreen ? 'py-2 bg-black/20 backdrop-blur-sm' : 'py-4'}`}>
                    <span className={`text-sm truncate max-w-sm transition-colors ${isFullscreen ? 'text-white/30' : 'text-white/40'}`}>{name}</span>
                    <div className="flex items-center gap-1">
                        {fullscreenEnabled && (
                            <button
                                onClick={toggleFullscreen}
                                className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Entrar a pantalla completa'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    {isFullscreen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                    )}
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={exportToPDF}
                            className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Exportar presentación como PDF"
                            title="Exportar como PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </button>
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
                            <div className="mb-8 flex justify-end">
                                <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase"
                                    style={{ background: 'rgba(255,255,255,0.12)', color: theme.accent }}
                                >
                                    {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                                </span>
                            </div>

                            <SlideContent slide={slide} theme={theme} />
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
        </>
    );
}
