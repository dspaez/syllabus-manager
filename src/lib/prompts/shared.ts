// Piezas de prompt compartidas entre /api/generate y los botones "Copiar prompt para el chat"
// (el mismo texto en los dos caminos — la app arma el contexto, el chat solo genera).

export const techStackContext = (techStack?: string) =>
    techStack?.trim()
        ? `\nCONTEXTO DEL CURSO: el stack tecnológico de la materia es "${techStack.trim()}". ` +
          `Todo código, sintaxis y ejemplos deben usar ese stack — no asumas otro lenguaje o tecnología.\n`
        : '';

// Los ejemplos de los prompts de ejercicios/examen estaban escritos en Java (private String,
// isXxx(), do-while, InputMismatchException) y empujaban al modelo a Java o a un Python
// "javificado" aunque el stack de la materia fuera otro (POO se dicta en Python). Los ejemplos
// ahora son neutrales y esta regla traduce cada convención al lenguaje real del curso.
export function languageConventionsRule(subjectName: string | undefined, techStack: string | undefined): string {
    const languageSource = techStack?.trim()
        ? `el lenguaje del stack indicado ("${techStack.trim()}")`
        : subjectName?.trim()
        ? `el lenguaje que corresponde a la materia "${subjectName.trim()}" — si el nombre no lo deja claro, ` +
          `elegí el más coherente con el tema y nombralo explícitamente en el contexto; nunca asumas Java por defecto`
        : `el lenguaje más coherente con el tema — nombralo explícitamente en el contexto; nunca asumas Java por defecto`;
    return (
        `
CONVENCIONES DEL LENGUAJE: todo el código, los nombres y las convenciones se escriben en ${languageSource}, ` +
        `de forma idiomática para ese lenguaje — nunca traslades convenciones de otro lenguaje. Los ejemplos de ` +
        `abajo son ilustrativos; tradúcelos a ese lenguaje. En particular:
` +
        `- Visibilidad/encapsulamiento: usá el mecanismo real del lenguaje (ej. Java/C#: private/public; Python: ` +
        `prefijo _ o __ y @property — Python no tiene modificadores private/public).
` +
        `- Tipos: indicá el tipo exacto con la sintaxis del lenguaje (ej. Java: String/double; Python: str/float ` +
        `como type hints).
` +
        `- Accesores de booleanos y nombres de métodos: seguí la convención del lenguaje (ej. Java: isActivo(); ` +
        `Python: propiedad esta_activo o método en snake_case).
` +
        `- Menú interactivo: el bucle idiomático del lenguaje (ej. Java/C#: do-while; Python: while True con break ` +
        `— Python no tiene do-while).
` +
        `- Excepciones: las que ese lenguaje realmente lanza en cada caso (ej. entrada no numérica — Java: ` +
        `InputMismatchException/NumberFormatException; Python: ValueError), nunca nombres de otro lenguaje.
`
    );
}
