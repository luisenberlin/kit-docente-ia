# Arquitectura del Kit Docente con IA

El **Kit Docente con IA** está diseñado bajo una premisa radical: **cero dependencias de compilación, cero frameworks pesados, privacidad absoluta y máxima longevidad**.

## 1. Principios de Diseño

- **HTML/CSS/JS Vanilla**: Sin Webpack, sin Vite, sin Node en producción. Los archivos se abren directamente en cualquier navegador o se sirven con cualquier servidor estático básico (`python3 -m http.server`).
- **Privacidad Local (LocalStorage)**: El progreso del alumnado, los tests completados y las notas se almacenan exclusivamente en el navegador (`localStorage`) de cada estudiante. No hay bases de datos en la nube ni telemetría.
- **Independencia de Contenido**: El motor de estudio (`shared/scripts/study-engine.js`) es completamente agnóstico. Todo el contenido y las preguntas residen en archivos de datos independientes (`data-<slug>.js`).
- **Generación Ofimática Estándar**: Los exámenes e informes se generan en formato abierto **ODT** (OpenDocument Text), garantizando su absoluta editabilidad en LibreOffice, Microsoft Word o Google Docs sin dependencias de pago ni formatos privativos.

---

## 2. Componentes del Repositorio

```text
kit-docente-ia/
├── web/                      # Hub estático y motor interactivo
│   ├── index.html            # Portada que lista recursos desde recursos.json
│   ├── recursos.json         # Fuente de verdad de recursos publicados
│   ├── shared/               # Estilos (tokens.css, study.css) y motor (study-engine.js)
│   ├── contenidos/           # Páginas HTML y archivos data-*.js de cada unidad
│   └── tools/                # Validador de esquemas (validar-recurso.js)
├── normativa/                # Programaciones didácticas en Markdown (fuente para la IA)
├── skills/                   # Habilidades modulares de IA para crear recursos, exámenes e informes
├── examenes/                 # Salida de modelos de práctica, exámenes y solucionarios ODT
├── informes/                 # Salida de informes de clase y fichas de refuerzo personalizadas
├── ejemplos/                 # Caso práctico completo de Física y Química 3º ESO
├── install.sh                # Script de verificación y configuración del entorno
└── README.md                 # Guía principal de uso
```

---

## 3. El Motor de Estudio (`study-engine.js`)

El script `study-engine.js` implementa 6 modos de estudio interactivos optimizados para escritorio y dispositivos móviles:
1. **Inicio**: Resumen del tema, desglose por apartados y barra de progreso general.
2. **Test (MC/VF)**: Preguntas de opción múltiple y verdadero/falso con retroalimentación inmediata y explicaciones pedagógicas.
3. **Tarjetas (Flashcards)**: Tarjetas de memoria volteables para memorización de conceptos clave.
4. **Escribir (Open)**: Preguntas de desarrollo conceptual con autocorrección basada en palabras clave.
5. **Clasificar (Sort)**: Retos interactivos de categorización en columnas.
6. **Examen**: Modo cronometrado que evalúa aleatoriamente el temario completo y emite una calificación sobre 10.
