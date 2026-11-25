# Kit Docente con IA · Starter Kit 🇪🇸

[![Release](https://img.shields.io/badge/version-v1.0.0-blue.svg)](https://github.com/luisenberlin/kit-docente-ia/releases/tag/v1.0.0)
[![Libre, sin dependencias](https://img.shields.io/badge/LibreSinDependencias-100%25-success.svg)](#arquitectura)
[![Languages: Spanish / English](https://img.shields.io/badge/docs-Espa%C3%B1ol%20%7C%20English-informational.svg)](README_EN.md)

[🇬🇧 English version available](README_EN.md)

---

<p align="center">
  <img src="assets/kit-preview.svg" alt="Kit Docente con IA - Vista previa del Hub Interactivo" width="100%">
</p>

---

## ¿Qué es?

**Kit Docente con IA** es un starter kit de código abierto para generar recursos interactivos de estudio, exámenes imprimibles y diagnósticos personalizados con IA, dirigido a docentes y familias, sin necesidad de programación ni configuraciones técnicas.

- **Genera recursos web interactivos** (test, tarjetas, escribir, clasificar, examen) para cualquier asignatura.
- **Diseña exámenes imprimibles en ODT** equilibrados por niveles DOK y criterios del currículo oficial.
- **Crea informes y hojas de refuerzo personalizadas** tras la corrección.
- Sin dependencias ni instalación complicada: HTML/CSS/JS puro, compatible con cualquier ordenador y navegador.

---

## 🤖 Compatibilidad con Agentes de IA

Las habilidades (`skills/`) incluidas en este kit están diseñadas y probadas rigurosamente en **OpenCode**, y son totalmente compatibles con **Claude Code** u otros arneses de agentes de IA compatibles con skills estructuradas. 
Al invocar comandos como `/crear-recurso`, `/crear-examen` o `/informe-examen`, el agente lee automáticamente las referencias normativas (`normativa/`) y ejecuta los flujos correspondientes.

---

## 🔄 Flujo de Trabajo del Kit

```mermaid
graph TD
    A[Apuntes / PDF / Temario] -->|"/crear-recurso"| B(Web Interactiva de Estudio<br/>6 Modos: Test, Tarjetas, Examen...)
    C[Programación normativa/MD] -->|"/crear-examen"| D(Exámenes ODT & Solucionario<br/>Graduados por Niveles DOK)
    D --> E[Corrección del Alumnado]
    E -->|"/informe-examen"| F(Informes de clase &<br/>Hojas de Refuerzo Personalizadas)

    style B fill:#0D9488,stroke:#fff,stroke-width:2px,color:#fff
    style D fill:#2563EB,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#9333EA,stroke:#fff,stroke-width:2px,color:#fff
```

---

## Instalación y requisitos

1. Clona el repositorio:
   ```bash
   git clone https://github.com/luisenberlin/kit-docente-ia.git
   cd kit-docente-ia
   ```
2. Verifica tu entorno y dependencias:
   ```bash
   ./install.sh
   ```
   **Necesitas:**
   - Node.js (validador web)
   - Python 3 (generación exámenes/informes)
   - LibreOffice (exportar ODT)
   - python-docx (`pip3 install python-docx`)

---

## Inicio rápido: tu primer recurso en 3 minutos

1. **Lanza el servidor local web:**
   ```bash
   python3 -m http.server 8000 --directory web
   # Visita http://localhost:8000
   ```
2. Abre el hub y prueba el ejemplo "El Átomo y la Materia"
3. Crea tus propios recursos usando la skill `/crear-recurso` y siguiendo la estructura del ejemplo (ver carpeta `ejemplos/` y docs)

---

## Estructura del repositorio

- `web/`          — Hub web e interactivo
- `normativa/`    — Plantillas y ejemplos de currículo (Markdown)
- `skills/`       — Skills de IA autoinstalables (crear-recurso, crear-examen, informe-examen)
- `examenes/`     — Exámenes y solucionarios generados
- `informes/`     — Informes y hojas de refuerzo por alumno
- `ejemplos/`     — Caso práctico completo (Física y Química 3º ESO)
- `docs/`         — Arquitectura, guía curricular y flujo de trabajo

Más detalle en [`docs/arquitectura.md`](docs/arquitectura.md).

---

## Para familias y docentes no técnicos

- Puedes usar todo el kit desde el navegador y editores de texto sin tocar código.
- La privacidad está garantizada: el avance del alumno sólo existe en su dispositivo.
- La creación de exámenes e informes es mediante comandos de skill y plantillas; la IA hace el resto según tu currículum.

---

## Licencia y aportaciones

Este proyecto es liberado bajo la Licencia MIT.
Las aportaciones, sugerencias de mejora y ejemplos de otras etapas educativas son bienvenidas.
