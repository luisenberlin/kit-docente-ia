# Flujo de Trabajo Docente con IA

El Kit Docente con IA cubre el ciclo completo del proceso de enseñanza y evaluación en tres sencillos pasos:

```text
 1. CREAR RECURSO INTERACTIVO          2. GENERAR EXAMEN OFICIAL            3. INFORME Y REFUERZO
    (Apuntes / PDF → Web)                 (Normativa → 3 ODTs)                 (Corrección → Fichas)
┌──────────────────────────────┐     ┌──────────────────────────────┐     ┌──────────────────────────────┐
│  /crear-recurso              │     │  /crear-examen               │     │  /informe-examen             │
│  - Test MC / VF              │     │  - Modelo de Práctica        │     │  - Estadísticas por alumno   │
│  - Flashcards y Escribir     │     │  - Examen Real sobre 10      │     │  - Informes de clase y padres│
│  - Registro en web hub       │     │  - Solucionario con DOK      │     │  - Hojas de refuerzo / ampli │
└──────────────────────────────┘     └──────────────────────────────┘     └──────────────────────────────┘
```

---

## Paso 1: Crear Recursos Interactivos (`/crear-recurso`)
Pega tus apuntes, notas o adjunta un PDF en tu chat con el agente y ejecuta `/crear-recurso`.  
El agente generará la página interactiva en `web/contenidos/`, la validará y la añadirá automáticamente al hub principal (`web/index.html`).

## Paso 2: Diseñar la Evaluación (`/crear-examen`)
Basándose en tu programación curricular de `normativa/`, ejecuta `/crear-examen` indicando el tema.  
El asistente generará tres documentos ODT en `examenes/`:
1. **Modelo de práctica**: Para que el alumnado practique sin presión de nota.
2. **Examen oficial**: Prueba formal graduada por niveles DOK.
3. **Solucionario**: Resolución paso a paso y tabla de especificaciones.

## Paso 3: Analizar Resultados y Personalizar (`/informe-examen`)
Tras corregir el examen (anotando los resultados por apartado), ejecuta `/informe-examen`.  
El sistema generará:
- La plantilla de registro de clase.
- El informe general de grupo.
- Informes individuales por alumno.
- Hojas de tarea personalizadas de refuerzo o ampliación con soluciones.
