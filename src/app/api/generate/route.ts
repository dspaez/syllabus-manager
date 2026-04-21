import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const PROMPTS: Record<string, (topic: string) => string> = {
    slides: (topic) =>
        `Genera una estructura de presentación sobre ${topic} con 8 slides. ` +
        `Cada slide debe tener: título, 4 puntos clave y un campo "keyword" con 2-3 palabras técnicas en inglés. ` +
        `Para el campo keyword de cada slide, usa términos técnicos específicos en inglés relacionados al contenido exacto de esa slide, NO al título literal. ` +
        `Por ejemplo: si la slide es sobre historia de un lenguaje → keyword: 'software development history'; ` +
        `si es sobre conceptos de POO → keyword: 'object oriented programming code'; ` +
        `si es sobre instalación → keyword: 'computer setup developer'; ` +
        `si es sobre bases de datos → keyword: 'database server technology'; ` +
        `si es sobre redes → keyword: 'network infrastructure cables'. ` +
        `Siempre incluye palabras como 'technology', 'computer', 'software', 'programming' o 'digital' para asegurar imágenes técnicas relevantes. ` +
        `Responde en español en formato JSON: ` +
        `{ "slides": [{ "title": "", "points": [], "keyword": "" }] }`,
    exercises: (topic) =>
        `Genera 5 ejercicios prácticos sobre ${topic}. Cada ejercicio con: ` +
        `enunciado, pistas y solución. Responde en español en formato JSON: ` +
        `{ "exercises": [{ "statement": "", "hints": [], "solution": "" }] }`,
    guide: (topic) =>
        `Genera una guía de estudio sobre ${topic} con: introducción, ` +
        `conceptos clave, ejemplos y resumen. Responde en español en formato JSON: ` +
        `{ "introduction": "", "concepts": [{ "name": "", "explanation": "" }], "examples": [], "summary": "" }`,
};

export async function POST(request: NextRequest) {
    try {
        const { type, topic, modality, hoursPerWeek } = await request.json() as {
            type: string;
            topic: string;
            modality?: string;
            hoursPerWeek?: number;
        };

        if (!type || !topic) {
            return NextResponse.json({ error: 'Missing required fields: type and topic' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

        if (type === 'curriculum') {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                // @ts-expect-error — googleSearch is valid at runtime but missing from SDK types
                tools: [{ googleSearch: {} }],
            });
            const prompt =
                `Eres un experto en educación universitaria. Busca en internet las tendencias más actuales de ${topic} en 2026. ` +
                `Genera un plan curricular de 16 semanas para una asignatura universitaria sobre ${topic}. ` +
                `Modalidad: ${modality ?? 'Presencial'}. Horas semanales: ${hoursPerWeek ?? 4}. ` +
                `IMPORTANTE sobre la modalidad: ` +
                `El contenido y los temas deben ser EXACTAMENTE LOS MISMOS independientemente de la modalidad. ` +
                `Lo que cambia según las horas es la PROFUNDIDAD de cada tema: ` +
                `1 hora (línea): tema introductorio, conceptos clave sin práctica extensa; ` +
                `2 horas (semi): conceptos + ejercicio práctico básico; ` +
                `3-4 horas (presencial): conceptos + práctica + ejercicio aplicado. ` +
                `Agrega un campo 'depth' por semana que indique el nivel de profundidad sugerido según las horas disponibles. ` +
                `Agrupa las semanas en unidades temáticas lógicas. ` +
                `Responde SOLO en JSON sin markdown: ` +
                `{ "summary": "máximo 3 líneas sobre tendencias actuales", "units": [{ "name": "nombre de la unidad", "order": 1, "weeks": [{ "number": 1, "title": "título conciso", "topics": ["tema1", "tema2"], "depth": "descripción de qué tan profundo ir según las horas", "justification": "máximo 1 línea" }] }] }`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
            const parsed = JSON.parse(jsonMatch[1].trim());
            return NextResponse.json(parsed);
        }

        const promptFn = PROMPTS[type];
        if (!promptFn) {
            return NextResponse.json({ error: `Invalid type. Must be one of: curriculum, ${Object.keys(PROMPTS).join(', ')}` }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent(promptFn(topic));
        const text = result.response.text();

        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
        const parsed = JSON.parse(jsonMatch[1].trim());

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Gemini error:', error)
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
