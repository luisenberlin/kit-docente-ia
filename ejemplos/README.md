# Ejemplos Prácticos — Kit Docente con IA

Esta carpeta contiene un caso real completo de Física y Química de 3º ESO («El Átomo y la Materia») para ilustrar cómo se estructura cada componente del kit.

## Contenido de la carpeta
- **`01-recurso-interactivo/`**: Contiene el archivo de datos `data-atomo-y-materia.js` y su página web asociada (también copiados en `web/contenidos/` para probarlos inmediatamente).
- **`02-examen-y-solucionario/`**: Guía del plano del examen y distribución DOK.
- **`03-informe-y-refuerzo/`**: Ejemplos de datos de corrección (`plan.json`, `resultados.json`) para generar informes y tareas personalizadas.

## Cómo probarlo
1. Lanza el servidor local desde la raíz del kit:
   ```bash
   python3 -m http.server 8000 --directory web
   ```
2. Abre en tu navegador: [http://localhost:8000](http://localhost:8000)
3. Verás la tarjeta de «El Átomo y la Materia» lista para probar los 6 modos de estudio interactivos.
