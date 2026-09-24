import { z } from 'zod';

// Tiempo estimado y puntaje NO se generan acá — son decisiones administrativas del
// docente (ver ExamOptions en route.ts), nunca inventadas por el modelo. Mismo principio
// anti-alucinación que el resto de la app: no se fabrica lo que el docente ya controla.

const RequisitoSchema = z.object({
    titulo: z.string().describe('Enunciado breve del requisito, ej. "Registrar nuevo elemento".'),
    detalle: z.string().describe('Explicación completa y evaluable de qué debe hacer el estudiante — nombres exactos de clases/métodos/mensajes, no descripciones vagas.'),
    subitems: z.array(z.string()).optional().describe('Sub-puntos o casos especiales (ej. una excepción específica a manejar), si aplica.'),
});

const ExamVersionSchema = z.object({
    version: z.string().describe('Identificador corto de la versión, ej. "A", "B", "C".'),
    nombrePrograma: z.string().describe('Materias por temas: nombre de la clase/programa principal, ej. "ConsultorioDental". Materias por proyecto: nombre corto de la funcionalidad a implementar, ej. "Gestión de categorías".'),
    contexto: z.string().describe('Materias por temas: escenario de negocio de esta versión, con un dominio distinto al de las demás. Materias por proyecto: qué funcionalidad del proyecto real se implementa y sobre qué entidad.'),
    // Opcional desde que existe el examen de modo proyecto (apps web/móviles, sin menú de
    // consola) — los exámenes ya guardados con menú siguen validando igual.
    menu: z.array(z.string()).optional().describe('SOLO programas de consola: líneas EXACTAS del menú, en orden, mismas opciones en todas las versiones. Omitir en materias por proyecto.'),
    requisitos: z.array(RequisitoSchema),
    entregable: z.string().describe('Qué debe entregar el estudiante exactamente, ej. el archivo fuente, o en un proyecto los archivos/rama/commit con la funcionalidad.'),
});

export const ExamSchema = z.object({
    titulo: z.string().describe('Título de la evaluación, ej. "Evaluación Práctica: Listas y Manejo de Excepciones".'),
    instrucciones: z.array(z.string()).describe('Reglas generales del examen (herramientas permitidas, qué entregar, manejo de errores esperado) — sin repetir tiempo/puntaje, esos van aparte.'),
    versiones: z.array(ExamVersionSchema),
});

export type Exam = z.infer<typeof ExamSchema>;
export type ExamVersion = z.infer<typeof ExamVersionSchema>;
export type Requisito = z.infer<typeof RequisitoSchema>;
