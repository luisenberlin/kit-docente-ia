---
name: crear-recurso
description: Genera una página web interactiva de estudio (6 modos: Inicio, Test, Tarjetas, Escribir, Clasificar y Examen) a partir de apuntes o PDFs. Guarda los archivos en web/contenidos/ y actualiza web/recursos.json. Úsala con /crear-recurso.
---

# Crear Recurso Interactivo de Estudio

Convierte apuntes, temas o documentos PDF en un recurso interactivo de estudio de 6 modos (Inicio, Test, Tarjetas, Escribir, Clasificar y Examen) totalmente autónomo y adaptado para móviles y ordenadores.

Responde siempre en español.

---

## 1. Leer el contenido de origen

- **Texto pegado en el chat**: Úsalo directamente.
- **PDF adjunto**: Lee y extrae el texto del archivo PDF.
- **Documento Word (.docx)**: Lee el contenido textual.
- **Imágenes o capturas de apuntes**: Extrae el texto mediante lectura directa de la imagen.
- Si no hay contenido adjunto ni pegado, pídelo amablemente antes de continuar.

---

## 2. Estructurar el temario

1. Identifica los **temas principales** (máximo 3 temas por recurso; si hay más, agrúpalos) y sus **apartados numerados** (1.1, 1.2, 2.1...).
2. Asigna un identificador corto y único a cada apartado (`secId` como `"1.1"`, `"1.2"`).
3. Genera un `<slug>` descriptivo en minúsculas y sin tildes ni espacios (ej: `el-atomo-y-la-materia`, `fracciones-y-decimales`).

---

## 3. Generar los archivos en `web/contenidos/`

### A. Archivo de Datos (`web/contenidos/data-<slug>.js`)

Crea la variable global `window.STUDY_DATA` con la siguiente estructura:

```javascript
window.STUDY_DATA = {
  meta: {
    title: "Título completo del tema",
    kicker: "Curso / Nivel",
    h1: "Título principal visible",
    subject: "Nombre de la Asignatura",
    course: "Código o nivel (ej: 3eso, 1bach, primaria)",
    color: "#2563EB", // Color de acento CSS en hex
    description: "Descripción breve del contenido"
  },
  CONFIG: {
    key: "<slug>-v1",
    temas: [
      { n: 1, name: "Nombre del Tema 1" },
      { n: 2, name: "Nombre del Tema 2" }
    ]
  },
  SECS: [
    { id: "1.1", tema: 1, name: "1.1 Nombre completo", short: "Etiqueta corta" }
  ],
  MCr: [
    // [secId, "Pregunta", ["Opción A", "Opción B", "Opción C", "Opción D"], "Explicación breve de la respuesta correcta"]
  ],
  VFr: [
    // [secId, "Afirmación para evaluar", true_o_false, "Explicación de por qué es verdadero o falso"]
  ],
  CARDr: [
    // [secId, "Concepto o término", "Definición clara y sintética"]
  ],
  OPENr: [
    // [secId, "Pregunta de desarrollo", "Modelo de respuesta esperado", ["palabra_clave1", "palabra_clave2"]]
  ],
  SORTr: [
    // [secId, "Concepto o elemento", "Categoría A", "Categoría B", ...]
  ]
};
```

#### Reglas de Calidad para el Contenido:
- **Test (`MCr`)**: Mínimo 4 preguntas por apartado. 4 opciones plausibles. Explicación educativa.
- **Verdadero/Falso (`VFr`)**: Balanceado entre afirmativas y falsas.
- **Tarjetas (`CARDr`)**: Definiciones concisas y fáciles de memorizar.
- **Escribir (`OPENr`)**: Incluir palabras clave para autocorrección.

---

### B. Archivo HTML (`web/contenidos/<slug>.html`)

Genera el archivo HTML usando la plantilla base `web/tools/templates/recurso.html`:

```html
<!doctype html>
<lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Título del Recurso</title>
  <script>
    (function() {
      try {
        var theme = localStorage.getItem('kitdocente:theme') || 'auto';
        var root = document.documentElement;
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          root.setAttribute('data-theme', 'dark');
        } else {
          root.setAttribute('data-theme', 'light');
        }
      } catch (e) {}
    })();
  </script>
  <link rel="stylesheet" href="../shared/styles/study.css">
  <style>
    :root {
      --subject-color: #2563EB;
      --subject-ink: #FFFFFF;
    }
  </style>
</head>
<body>
  <header class="sitebar">
    <nav class="crumbs" aria-label="Navegación">
      <a href="../index.html">Inicio</a><span class="crumbs__sep">/</span>
      <span id="crumb-level">Asignatura</span><span class="crumbs__sep">/</span>
      <span id="crumb-current" aria-current="page">Tema</span>
    </nav>
    <button id="theme-toggle" class="themebtn" type="button" aria-label="Cambiar tema">
      🌓
    </button>
  </header>

  <div id="app"></div>

  <script src="data-<slug>.js"></script>
  <script src="../shared/scripts/study-engine.js"></script>
  <script src="../shared/scripts/theme.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (window.StudyEngine && window.STUDY_DATA) {
        window.StudyEngine.init('#app', window.STUDY_DATA);
      }
    });
  </script>
</body>
</html>
```

---

## 4. Registrar en el catálogo `web/recursos.json`

Lee `web/recursos.json` e inserta una nueva entrada en la lista `"recursos"`:

```json
{
  "id": "<slug>",
  "title": "Título del tema",
  "description": "Descripción breve del contenido y temas que abarca",
  "course": "Nivel o Curso (ej: 3º ESO)",
  "subject": "Nombre de la Asignatura",
  "color": "#2563EB",
  "icon": "book-open",
  "path": "contenidos/<slug>.html",
  "tags": ["Física", "Química"],
  "date": "YYYY-MM-DD"
}
```

---

## 5. Validación

Ejecuta el script de validación para asegurar la integridad de los datos:

```bash
node web/tools/validar-recurso.js web/contenidos/data-<slug>.js
```

Si todo es correcto, confirma al usuario la creación del recurso y proporciona la ruta para abrirlo localmente.
