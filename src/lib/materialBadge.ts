export interface MaterialBadgeInput {
    type: string | null;
    source: string | null;
    fileUrl: string | null;
}

export interface MaterialBadge {
    label: string;
    bg: string;
    color: string;
    border: string;
}

// Un material "source: ai" SIN file_url es contenido JSON del flujo viejo (GenerateWithAI,
// slides/exercises/guide) — se etiqueta genérico "Slides IA". Si tiene file_url es un archivo
// real en Storage (ej. class_kit), y se etiqueta por su type real sin importar el origen.
export function getMaterialBadge({ type, source, fileUrl }: MaterialBadgeInput): MaterialBadge {
    if (source === 'ai' && !fileUrl) return { label: 'Slides IA', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    if (type === 'pdf') return { label: 'PDF', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    if (type === 'pptx') return { label: 'PPTX', bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
    if (type === 'doc') return { label: 'DOC', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (type === 'video') return { label: 'Video', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    return { label: 'Recurso', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
}
