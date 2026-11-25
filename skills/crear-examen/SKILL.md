---
name: crear-examen
description: Diseña exámenes curriculares balancedados por niveles DOK (Webb) y genera 3 documentos ODT imprimibles y editables (Modelo de Práctica, Examen Real y Solucionario). Guarda las salidas en examenes/. Úsala con /crear-examen.
---

# Crear Examen Curricular en ODT

Diseña y genera una prueba de evaluación completa a partir de las programaciones didácticas en `normativa/`.
Genera siempre **tres documentos ODT editables e imprimibles** en `examenes/`:
1. `Modelo_practica_<tema>.odt`: Versión de ensayo para el alumnado.
2. `Examen_<tema>.odt`: Prueba de evaluación oficial sobre 10 puntos.
3. `Solucionario_<tema>.odt`: Respuestas detalladas y tablas de criterios de evaluación.

Responde siempre en español de España (es-ES).

---

## 1. Parámetros de la Solicitud

Identifica los siguientes parámetros (si no se especifican, usa los valores por defecto):
- **Materia y Curso**: Selecciona la programación de la carpeta `normativa/` (ej: `normativa/ejemplo-ciencias-3eso.md`).
- **Unidades o Temas a evaluar**: Especifica los temas a incluir.
- **Número de ejercicios**: De 7 a 10 ejercicios (por defecto 8).
- **Duración y Calculadora**: Especifica si se permite calculadora y la duración en minutos.

---

## 2. Metodología de Diseño DOK (Depth of Knowledge)

El examen se distribuye de acuerdo con los niveles de complejidad cognitiva DOK de Norman Webb:

- **DOK 1 (Reproducción/Cálculo directo)**: Máximo 30% de la puntuación total. Ejercicios directos de aplicación de reglas o algoritmos.
- **DOK 2 (Conceptos y Aplicación)**: 40-50% de los puntos. Aplicación de conceptos a situaciones dadas, interpretación de datos o esquemas.
- **DOK 3 (Pensamiento Estratégico/Problemas)**: 20-30% de los puntos. Problemas de varios pasos donde se debe seleccionar la estrategia o razonar con pistas de apoyo.

Consulta `references/diseno-examenes.md` para ver las pautas pedagógicas completas.

---

## 3. Generación del Plano del Examen

Antes de redactar las preguntas, construye una tabla con el diseño del examen:

| Ejercicio | Apartado | Puntos | Contenido evaluado | Criterio de evaluación | DOK |
|-----------|----------|--------|---------------------|------------------------|-----|
| 1         | a, b     | 1.0    | Nombre del contenido| Código de criterio     | 1   |

Requisitos:
- Suma total exacta de **10.0 puntos**.
- Asignación explícita de puntuación por apartado.
- Enunciados claros y exentos de ambigüedades.

---

## 4. Estructura de los 3 Documentos ODT

Consulta `references/formato-documentos.md` para el detalle de maquetación:

1. **Modelo de Práctica**: Ejercicios equivalentes con datos distintos, más extensos que el examen (1.5x) y con más pistas aclaratorias. Sin puntuaciones explícitas por apartado.
2. **Examen Real**: Formato limpio, espacio adecuado para responder bajo cada pregunta, puntuaciones indicadas entre corchetes `[1.25 ptos]`.
3. **Solucionario**: Resolución paso a paso, desglose de corrección y **Tablas de Criterios y Contenidos Evaluados**.

---

## 5. Compilación y Generación (`scripts/generar_odt.py`)

Para exportar los documentos a formato ODT editable:

1. Genera las estructuras DOCX intermedias con `python-docx` asegurando idioma `es-ES`.
2. Convierte a ODT mediante LibreOffice headless:
   ```bash
   python3 skills/crear-examen/scripts/generar_odt.py --input <datos_examen.json> --output-dir examenes/
   ```

3. Confirma al usuario la ubicación de los archivos generados en `examenes/`.
