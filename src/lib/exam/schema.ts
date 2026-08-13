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
    nombrePrograma: z.string().describe('Nombre de la clase/programa principal en el stack indicado, ej. "ConsultorioDental".'),
    contexto: z.string().describe('Escenario de negocio de esta versión — dominio distinto al de las demás versiones, mismo patrón estructural.'),
    menu: z.array(z.string()).describe('Líneas EXACTAS del menú que el programa debe mostrar, en orden — mismas opciones que las demás versiones, solo cambia el dominio.'),
    requisitos: z.array(RequisitoSchema),
    entregable: z.string().describe('Qué debe entregar el estudiante exactamente, ej. nombre del archivo .java.'),
});

export const ExamSchema = z.object({
    titulo: z.string().describe('Título de la evaluación, ej. "Evaluación Práctica: Arreglos Dinámicos (ArrayList)".'),
    instrucciones: z.array(z.string()).describe('Reglas generales del examen (herramientas permitidas, qué entregar, manejo de errores esperado) — sin repetir tiempo/puntaje, esos van aparte.'),
    versiones: z.array(ExamVersionSchema),
});

export type Exam = z.infer<typeof ExamSchema>;
export type ExamVersion = z.infer<typeof ExamVersionSchema>;
export type Requisito = z.infer<typeof RequisitoSchema>;
