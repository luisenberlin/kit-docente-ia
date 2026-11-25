# AI Teaching Kit · Starter Kit 🇬🇧

[![Release](https://img.shields.io/badge/version-v1.0.0-blue.svg)](https://github.com/luisenberlin/kit-docente-ia)
[![License: MIT](https://img.shields.io/badge/License-MIT-success.svg)](LICENSE)
[![Languages: Spanish / English](https://img.shields.io/badge/docs-English%20%7C%20Espa%C3%B1ol-informational.svg)](README.md)

[🇪🇸 Versión en Español](README.md)

---

## What is it?

**AI Teaching Kit** is an open-source starter kit for educators and parents to generate interactive study resources, printable exams, and personalized student reports using AI. No programming or complex technical setup required.

- **Create interactive web study resources** (quizzes, flashcards, writing practice, sorting, exams) for any subject.
- **Design printable ODT exams** balanced by DOK (Depth of Knowledge) cognitive levels and official curriculum criteria.
- **Generate student performance reports and tailored reinforcement sheets** after grading.
- **Zero bloat, zero dependencies**: Pure HTML/CSS/JS, fully offline-capable, runs on any computer and browser.

---

## Installation & Requirements

1. Clone the repository:
   ```bash
   git clone https://github.com/luisenberlin/kit-docente-ia.git
   cd kit-docente-ia
   ```
2. Check your environment and dependencies:
   ```bash
   ./install.sh
   ```
   **Requirements:**
   - Node.js (for web validation)
   - Python 3 (for exam & report generators)
   - LibreOffice (`soffice`, for ODT export)
   - python-docx (`pip3 install python-docx`)

---

## Quick Start: Your First Resource in 3 Minutes

1. **Launch the local web server:**
   ```bash
   python3 -m http.server 8000 --directory web
   # Open http://localhost:8000 in your browser
   ```
2. Explore the preloaded example "The Atom and Matter" (`El Átomo y la Materia`).
3. Create your own resources using the `/crear-recurso` AI skill following the example structure (see `ejemplos/` and `docs/`).

---

## Repository Structure

- `web/`          — Static web hub & interactive engine
- `normativa/`    — Curriculum templates and examples (Markdown)
- `skills/`       — AI skills (`crear-recurso`, `crear-examen`, `informe-examen`)
- `examenes/`     — Generated ODT exams and answer keys
- `informes/`     — Student diagnostic reports and reinforcement worksheets
- `ejemplos/`     — Complete practical case (3rd ESO Physics & Chemistry)
- `docs/`         — Architecture, curriculum guidelines, and workflow guides

Learn more in [`docs/arquitectura.md`](docs/arquitectura.md).

---

## For Families & Non-Technical Educators

- Fully operable through browsers and Markdown/text editors without touching code.
- **Privacy-first**: Student progress and quiz scores are stored exclusively locally on their device (`localStorage`).
- Assessments and reports are driven by natural language prompts and markdown curriculum files.

---

## License & Contribution

Distributed under the MIT License. Contributions, feedback, and educational curriculum examples are welcome!
