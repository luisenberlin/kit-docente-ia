# Guía Normativa y Curricular

Para que tu asistente de IA (mediante las skills `crear-examen` e `informe-examen`) redacte pruebas perfectamente adaptadas a los criterios de tu centro o administración educativa, el kit utiliza la carpeta **`normativa/`**.

## ¿Cómo funciona?

En lugar de tener que explicarle a la IA en cada conversación qué ley sigues, qué criterios evalúas o qué distribución de dificultad necesitas, la IA lee los archivos Markdown situados en `normativa/`.

1. **Plantilla base**: Dispones de `normativa/PLANTILLA_NORMATIVA.md`.
2. **Ejemplo real**: Tienes disponible `normativa/ejemplo-ciencias-3eso.md`.

---

## Estructura de un Archivo Normativo

Cada archivo debe estructurarse en secciones claras:

### 1. Datos Generales
Define la materia, el curso, las horas semanales y la temporalización en trimestres o unidades.

### 2. Normas de Evaluación y Taxonomía DOK
Establece el reparto de la puntuación según la profundidad cognitiva de Norman Webb:
- **DOK 1 (Recuerdo y Reproducción)**: ~25-30% (cálculo directo, definiciones).
- **DOK 2 (Aplicación de Conceptos)**: ~40% (resolución de problemas estándar).
- **DOK 3 (Pensamiento Estratégico)**: ~20-25% (razonamiento, justificación, casos complejos).
- **DOK 4 (Pensamiento Extendido)**: ~10% (contextualización real).

### 3. Unidades Didácticas
Para cada unidad, detalla los **Contenidos** (`C1.1`, `C1.2`...) y los **Criterios de Evaluación** (`Crit 1.1`, `Crit 1.2`...). Cuando crees un examen, la IA asociará cada ejercicio directamente a estos códigos normativos.
