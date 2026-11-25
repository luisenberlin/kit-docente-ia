# Formatos JSON

Hay un ejemplo completo en `assets/ejemplo/`.

## plan.json
```json
{
  "titulo": "Examen Tema 1 (UD1, sin potencias ni raíces)",
  "asignatura": "Matemáticas Nivel I", "centro": "CEPA Sierra Norte",
  "contenidos": {"C2": "Números naturales: lectura, valor posicional y orden", "C3": "..."},
  "criterios":  {"1.1": "1.1 Interpretar y organizar los datos", "6.1": "..."},
  "apartados": [
    {"id": "1a", "puntos": 0.25, "contenido_corto": "Escritura de números",
     "contenidos": ["C2"], "criterios": ["1.1"], "dok": 1, "tipo": "concepto"}
  ]
}
```
`contenidos` y `criterios` de cada apartado son claves de los diccionarios de arriba. `dok` y `tipo` son opcionales. `contenido_corto`: máx. ~28 caracteres.

## resultados.json
```json
{"alumnos": [
  {"nombre": "Ana", "idioma": "es", "idioma_informe": "es",
   "respuestas": {"1a": "B", "1b": "R", "1c": "M"}}
]}
```
Valores: `B`, `R`, `M`; vacío o ausente = no contestado (cuenta 0 y `compute.py` avisa si falta algún apartado).

## narrativas.json
```json
{"grupo": {"lectura": ["Todos dominan…", "Punto débil común: …"]},
 "alumnos": {"Ana": {"domina": "…", "refuerzo": "…", "hoja": "Refuerzo: …"}}}
```
Todo opcional. Los textos de cada alumno van en su `idioma_informe`.

## hojas.json
```json
{"unidad": {"es": "Tema 1: Los números naturales", "en": "Unit 1: Natural numbers"},
 "cabecera": {"es": "Matemáticas Nivel I · CEPA Sierra Norte", "en": "Mathematics Level I · CEPA Sierra Norte"},
 "idioma_defecto": "es",
 "etiquetas": {"pt": {"ejercicio": "Exercício", "pista": "Dica", "hoja": "Folha personalizada", "nombre": "Nome", "fecha": "Data", "soluciones": "Soluções: confere quando terminares"}},
 "alumnos": [{
   "nombre": "Awa", "idioma": "en", "tipo": "refuerzo",
   "ya": "natural numbers", "vamos": "division with remainders",
   "mensaje": "(opcional) introducción completa; sustituye a la automática",
   "ejercicios": [{
     "titulo": "Division with remainders", "intro": "A school bus has 42 seats…",
     "tabla": [["Option", "What is hired", "Cost"], ["A", "…", "…"]],
     "partes": [{"texto": "How many buses…?", "lineas": 3, "pista": "…", "solucion": "190 ÷ 42 = 4 remainder 22"}]
   }]
}]}
```
- `unidad` y `cabecera` pueden ser texto o diccionario por idioma.
- `tipo`: `refuerzo` o `ampliacion`. `ya`/`vamos` rellenan la introducción automática (en el idioma del alumno).
- `lineas`: líneas de respuesta deseadas por apartado; el script las reduce solo si la hoja pasa de `--paginas-max` páginas.
- Etiquetas que se pueden sobrescribir: `ejercicio, pista, hoja, nombre, fecha, soluciones, intro_refuerzo, intro_ampliacion` (las dos últimas con `{ya}` y `{vamos}`).
- Se admite `**negrita**` en cualquier texto.
