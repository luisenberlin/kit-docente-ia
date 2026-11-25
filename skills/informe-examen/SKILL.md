---
name: informe-examen
description: Convierte un examen ya corregido en una plantilla de registro (B/R/M por apartado y alumno), un informe general de la clase, un informe individual por alumno (notas, contenidos y criterios superados, qué reforzar) y una hoja personalizada de tareas por alumno (refuerzo o ampliación) con soluciones al final, eligiendo el idioma de cada alumno por separado. Úsala siempre que el profesor hable de notas del examen, informe de clase o de alumno, plantilla u hoja de resultados, corregir o escanear un examen con B, R y M, contenidos y criterios superados, hoja personalizada, refuerzo y ampliación, o pida la hoja de un alumno en otro idioma (por ejemplo inglés), aunque no diga la palabra «informe». Pensada para exámenes personalizados de Matemáticas Nivel I/II del CEPA (con solucionario y tablas de plano), pero válida para cualquier examen dividido en apartados con puntos.
---

# Informe de examen

Esta skill cubre todo lo que pasa después de poner un examen: anotar cómo ha ido cada apartado, calcular notas, ver qué contenidos y criterios domina cada alumno y darle una hoja de trabajo hecha a su medida. Los números los calculan los scripts (así no hay errores de cuenta); tú te encargas de lo que requiere criterio: leer el escaneo, escribir los comentarios por alumno y diseñar los ejercicios.

Dependencias: `python-docx`, LibreOffice (`soffice`) y poppler (`pdftoppm`, `pdftotext`). Todo se genera en DOCX y se convierte a **ODT** (el profesor usa LibreOffice). Los scripts están en `scripts/`; los formatos de los JSON, en `references/schemas.md`; hay un ejemplo completo en `assets/ejemplo/`.

## Flujo (por fases; el profesor puede entrar en cualquiera)

1. **Plan del examen** → `plan.json`
2. **Plantilla de registro** (imprimible) → `make_template.py`
3. **Lectura del escaneo** → `resultados.json` (con confirmación)
4. **Cálculo** → `compute.py`
5. **Informe de clase + individuales** → `make_informe.py`
6. **Hojas personalizadas** → `make_hojas.py`

Pregunta solo lo que falte de verdad. Si el profesor ya sube la plantilla rellena, ve directo a la fase 3.

### 1. Plan del examen
Necesitas, por apartado: `id` (1a, 1b…), `puntos`, `contenido_corto` (máx. ~28 caracteres, cabe en una celda), `contenidos` (claves) y `criterios`. Búscalo por este orden:
- **Solucionario del examen** (lo generan las skills de exámenes de Nivel I/II): la «Tabla 1 · Plano del examen» trae ejercicio, apartado, puntos, contenido, criterios, DOK y tipo; las tablas 2 y 3 dan los nombres de contenidos y criterios.
- **El propio examen**, si no hay solucionario: define tú los apartados y propón contenidos y criterios del currículo; enséñaselos al profesor y confirma antes de seguir.
- Lo que haya en la conversación (si el examen se hizo en ese mismo chat).

Si el examen excluye contenidos a propósito (por ejemplo, sin potencias ni raíces), apúntalo y respétalo luego en las hojas personalizadas.

### 2. Plantilla de registro
`python scripts/make_template.py plan.json --out plantilla.docx --alumnos "Ana,Luis,…"` genera una hoja A4 apaisada con los apartados en filas y los alumnos numerados en columnas (10 por hoja; con más alumnos salen más hojas). Código de anotación: **B** (75 % o más de los puntos del apartado), **R** (entre 25 % y 75 %), **M** (menos del 25 %), en blanco = no contestado. Los nombres van en una lista numerada arriba, que se lee mejor al escanear que unas cabeceras giradas. Si el profesor ya te da los nombres, ponlos.

### 3. Lectura del escaneo
Es la parte más delicada: un error aquí contamina todo lo demás.
- Los escaneos suelen venir girados. Rasteriza (`pdftoppm -png -r 200`), prueba a girar 90° y quédate con la orientación en la que se lee el título.
- Recorta la tabla en dos mitades y amplía; transcribe fila a fila. Mira las letras dudosas (R/B/P, M/H) con un recorte ampliado.
- Lee los nombres de la lista numerada; las columnas sin nombre ni letras se ignoran.
- Escribe `resultados.json` y **enseña la matriz al profesor** (apartado × alumno) señalando las casillas dudosas. Corrige antes de calcular. Si el profesor ya anotó la nota total, úsala solo para contrastar.

### 4. Cálculo
`python scripts/compute.py plan.json resultados.json --out res.json`. Por defecto B = 100 %, R = 50 % y M = 0 %; un contenido o criterio se considera **superado** desde el 70 %, **en proceso** entre el 40 y el 69 %, **a reforzar** por debajo del 40 % (`--r`, `--superado` y `--proceso` lo cambian). La nota es orientativa porque R cubre un rango; dilo siempre al dar las notas. Revisa los `AVISO:` que imprime.

### 5. Informes
Escribe `narrativas.json` con, por alumno, tres frases cortas y concretas (`domina`, `refuerzo`, `hoja`) que citen apartados reales, y una `lectura` del grupo (3 a 5 viñetas: qué domina todo el grupo, puntos débiles comunes, perfiles). Describe, no diagnostiques: «falla al interpretar el resto (6a, 6b)», no «tiene problemas de comprensión».
`python scripts/make_informe.py plan.json res.json --narrativas narrativas.json --out informe.docx` crea el resumen de grupo, la matriz de resultados y una página por alumno.

### 6. Hojas personalizadas
Diseña los ejercicios tú (esto no se puede automatizar) y guárdalos en `hojas.json`; luego `python scripts/make_hojas.py hojas.json --out hojas.docx` (ajusta solo el espacio de respuesta para no pasar de 2 páginas por alumno). Criterios de diseño:
- **Tipo**: `refuerzo` si hay contenidos o criterios por debajo del 70 %; `ampliacion` si todo está por encima del 90 %; si hay un solo fallo puntual, repaso corto más ampliación.
- **Contenido**: apunta a los apartados con M o R (mira qué contenido y criterio tocan en el plan). Entre 3 y 5 ejercicios, cada uno con 2 a 4 apartados, de fácil a difícil. Alumnos con fallos parecidos pueden compartir ejercicios, pero cambia datos y orden para que no se copien.
- **Datos nuevos**: nada que repita enunciados del examen o del modelo de práctica. Respeta las exclusiones del examen.
- **Ampliación**: más pasos, crear problemas propios, retos de cálculo, decidir con umbrales; no más temario.
- **Pistas** en los apartados difíciles (razonar, decidir, inventar) y en alguno medio; nunca regalan la respuesta.
- **Soluciones**: cada apartado lleva su `solucion` corta (con el resultado numérico y, en respuestas abiertas, un ejemplo o el resultado que debe salir). Se imprimen en letra pequeña al final de la hoja para que el alumno se autocorrija. **Verifica con Python todos los resultados numéricos antes de escribir el JSON.**
- Tono animoso y sin notas: la hoja del alumno nunca muestra su puntuación.

## Idioma por alumno
Pregunta (o toma de lo que diga el profesor) qué alumnos necesitan otro idioma. En `resultados.json` y `hojas.json`, cada alumno tiene:
- `idioma`: idioma de su hoja personalizada (`es`, `en`, `fr`…; por defecto `es`). **Escribe en ese idioma todo el texto de sus ejercicios** (enunciados, pistas, soluciones, cabeceras de tabla, `ya` y `vamos`). El script traduce solo las etiquetas fijas (Ejercicio/Exercise, Pista/Hint, soluciones, nombre, fecha) y marca el idioma del texto para el corrector.
- `idioma_informe`: idioma de su informe individual (por defecto `es`, porque suele leerlo el profesor; ponlo en otro idioma solo si el informe se va a entregar al alumno).

Hay etiquetas incluidas para es, en y fr. Para otro idioma, añade `etiquetas` en `hojas.json` (claves en `references/schemas.md`) y el campo `mensaje` de cada alumno con la introducción ya escrita. Los idiomas de derecha a izquierda (árabe) no están soportados del todo: avísalo y revisa el resultado.

Si el profesor pide también el **examen** en otro idioma, eso no lo hace esta skill: usa la skill de exámenes del nivel, o traduce el examen manteniendo los mismos apartados y puntos para que la plantilla siga valiendo.

## Entrega
Revisa visualmente el resultado (convierte a PDF y mira al menos una hoja de cada idioma y un informe individual) antes de entregarlo. Entrega los ODT con `present_files`: plantilla, informe y hojas. Resume en pocas líneas las notas (con la salvedad de que son orientativas), lo más llamativo del grupo y lo que has decidido: umbrales, quién lleva refuerzo o ampliación y en qué idioma. Los nombres y notas de los alumnos son datos personales del profesor: úsalos para los documentos, pero no los guardes en memoria.
