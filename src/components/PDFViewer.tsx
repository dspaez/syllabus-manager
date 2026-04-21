'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    url: string;
    name: string;
}

function Fallback({ url, name }: { url: string; name: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-5xl mb-5">📄</p>
            <p className="text-base font-semibold text-white mb-2">
                No se puede mostrar el PDF aquí
            </p>
            <p className="text-sm text-gray-400 mb-7 max-w-xs">
                Tu navegador está bloqueando la visualización en línea. Puedes abrirlo directamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors"
                >
                    Abrir en nueva pestaña ↗
                </a>
                <a
                    href={url}
                    download={name}
                    className="text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl transition-colors"
                >
                    ⬇ Descargar
                </a>
            </div>
        </div>
    );
}

export default function PDFViewer({ url, name }: Props) {
    const router = useRouter();
    const [failed, setFailed] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
                {/* Close / back */}
                <button
                    onClick={() => router.back()}
                    aria-label="Volver"
                    className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                </button>

                <span className="flex-1 text-sm font-medium text-gray-100 truncate">
                    📄 {name}
                </span>

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-semibold text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Abrir en nueva pestaña ↗
                </a>
                <a
                    href={url}
                    download={name}
                    className="shrink-0 text-xs font-semibold text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                    ⬇ Descargar
                </a>
            </div>

            {/* Viewer */}
            {failed ? (
                <Fallback url={url} name={name} />
            ) : (
                <div className="relative flex-1 flex flex-col">
                    <embed
                        src={url}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        className="flex-1"
                    />
                    {/* Hint for browsers that don't support embed PDF */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                        <p className="text-xs text-gray-400 bg-gray-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-auto">
                            ¿No se muestra el PDF?{' '}
                            <button
                                onClick={() => setFailed(true)}
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                            >
                                Ver opciones
                            </button>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
