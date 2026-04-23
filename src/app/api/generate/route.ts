import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const PROMPTS: Record<string, (topic: string) => string> = {
    slides: (topic) =>
        `Eres un docente universitario experto. Genera una presentación académica COMPLETA sobre ${topic} para estudiantes universitarios de tecnología. ` +
        `\n\nREGLAS IMPORTANTES:\n` +
        `- NO uses markdown (**negrita**, *itálica*) en ningún punto\n` +
        `- Escribe todo en español\n` +
        `- Cada punto debe ser una explicación completa de 1-2 líneas\n` +
        `- Incluye conceptos técnicos precisos con terminología correcta\n` +
        `- Agrega ejemplos concretos y casos de uso reales\n` +
        `- El contenido debe ser de nivel universitario, no básico\n` +
        `\nGenera entre 15 y 20 slides (según la complejidad del tema) y usa layouts variados.\n` +
        `\nReglas de layout por slide:\n` +
        `- Slide 1 SIEMPRE debe tener "layout": "title" y puntos introductorios\n` +
        `- Usa "layout": "two-column" en slides conceptuales de comparación (ej: IA vs ML, ventajas vs desventajas)\n` +
        `- Usa "layout": "code" en slides con ejemplos de código (Python o pseudocódigo)\n` +
        `- El resto de slides usa "layout": "list"\n` +
        `- Si usas "two-column", incluye: leftTitle, rightTitle, left (array), right (array)\n` +
        `- Si usas "code", incluye: points (máximo 3), code (código real y funcional) y language\n` +
        `- Si usas "list" o "title", incluye points con máximo 5 elementos\n` +
        `- Todas las slides deben incluir keyword\n` +
        `\nResponde SOLO en JSON sin markdown ni bloques de código con esta estructura exacta de ejemplo: ` +
        `{ "slides": [` +
        `{ "title": "", "points": [], "keyword": "", "layout": "title" },` +
        `{ "title": "", "points": [], "keyword": "", "layout": "list" },` +
        `{ "title": "", "left": [], "right": [], "leftTitle": "", "rightTitle": "", "keyword": "", "layout": "two-column" },` +
        `{ "title": "", "points": [], "code": "", "language": "python", "keyword": "", "layout": "code" }` +
        `] }` +
        `\nAsegúrate de alternar layouts de forma pedagógica según el contenido de cada slide.`,
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
                generationConfig: { maxOutputTokens: 8192 },
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
            
            // Si el JSON está truncado, intentar repararlo
            let jsonStr = text.trim();
            // Remover markdown si existe
            jsonStr = jsonStr.replace(/```json|```/g, '').trim();
            // Intentar parsear, si falla intentar reparar
            let parsed;
            try {
                parsed = JSON.parse(jsonStr);
            } catch {
                // Truncar en el último objeto completo
                const lastValidIndex = jsonStr.lastIndexOf('}]');
                if (lastValidIndex > 0) {
                    jsonStr = jsonStr.substring(0, lastValidIndex + 2) + '}';
                    parsed = JSON.parse(jsonStr);
                } else {
                    throw new Error('JSON inválido');
                }
            }
            return NextResponse.json(parsed);
        }

        const promptFn = PROMPTS[type];
        if (!promptFn) {
            return NextResponse.json({ error: `Invalid type. Must be one of: curriculum, ${Object.keys(PROMPTS).join(', ')}` }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { maxOutputTokens: 8192 }
        });

        const result = await model.generateContent(promptFn(topic));
        const text = result.response.text();

        // Si el JSON está truncado, intentar repararlo
        let jsonStr = text.trim();
        // Remover markdown si existe
        jsonStr = jsonStr.replace(/```json|```/g, '').trim();
        // Intentar parsear, si falla intentar reparar
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            // Truncar en el último objeto completo
            const lastValidIndex = jsonStr.lastIndexOf('}]');
            if (lastValidIndex > 0) {
                jsonStr = jsonStr.substring(0, lastValidIndex + 2) + '}';
                parsed = JSON.parse(jsonStr);
            } else {
                throw new Error('JSON inválido');
            }
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('Gemini error:', error)
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
