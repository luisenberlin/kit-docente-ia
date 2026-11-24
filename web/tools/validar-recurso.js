#!/usr/bin/env node
/**
 * Validador de recursos de estudio (data-<slug>.js)
 * Uso: node validar-recurso.js <archivo.js>
 * Código de salida: 0 = OK, 1 = errores
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = process.argv[2];
if (!file) {
  console.error('Uso: node validar-recurso.js <archivo.js>');
  process.exit(1);
}

const absPath = path.resolve(file);
if (!fs.existsSync(absPath)) {
  console.error(`Archivo no encontrado: ${absPath}`);
  process.exit(1);
}

const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const code = fs.readFileSync(absPath, 'utf8');
const context = { window: {}, console };
vm.createContext(context);

try {
  vm.runInContext(code, context, { filename: absPath, timeout: 2000 });
} catch (e) {
  console.error(`❌ Error de sintaxis en ${file}:`, e.message);
  process.exit(1);
}

const data = context.window.STUDY_DATA;
if (!data) {
  console.error(`❌ window.STUDY_DATA no definido en ${file}`);
  process.exit(1);
}

let errors = 0;
let warnings = 0;

function err(msg) { console.error(`❌ ${msg}`); errors++; }
function warn(msg) { console.warn(`⚠️  ${msg}`); warnings++; }
function ok(msg) { console.log(`✓ ${msg}`); }

// ==================== VALIDACIONES ====================

// 1. Estructura básica
const requiredMeta = ['title', 'kicker', 'h1', 'subject', 'course', 'color', 'icon'];
requiredMeta.forEach(k => {
  if (!data.meta?.[k]) err(`meta.${k} faltante`);
  else ok(`meta.${k} presente`);
});

if (!['3eso', '1bach'].includes(data.meta?.course)) err(`meta.course debe ser "3eso" o "1bach" (es "${data.meta?.course}")`);

if (!data.CONFIG?.key) err('CONFIG.key faltante (necesario para localStorage)');
else {
  ok(`CONFIG.key = "${data.CONFIG.key}"`);
  if (!/-v\d+$/.test(data.CONFIG.key)) warn(`CONFIG.key "${data.CONFIG.key}" no termina en -v<número> (convención: slug-v1)`);
  // La clave debe ser única entre los recursos de la misma carpeta (comparten localStorage)
  const dir = path.dirname(absPath);
  fs.readdirSync(dir).filter(f => /^data-.*\.js$/.test(f) && f !== path.basename(absPath)).forEach(f => {
    const m = fs.readFileSync(path.join(dir, f), 'utf8').match(/"key"\s*:\s*"([^"]+)"/);
    if (m && m[1] === data.CONFIG.key) err(`CONFIG.key "${m[1]}" duplicada en ${f}: los dos recursos compartirían el progreso`);
  });
}

if (!data.CONFIG?.temas?.length) warn('CONFIG.temas vacío o ausente');
else {
  ok(`CONFIG.temas: ${data.CONFIG.temas.length} temas`);
  data.CONFIG.temas.forEach((t, i) => {
    if (typeof t.n !== 'number') err(`CONFIG.temas[${i}]: "n" debe ser un número (es ${typeof t.n}); el filtro del motor compara por número`);
    if (!t.name) warn(`CONFIG.temas[${i}]: name vacío`);
  });
}

const arrayFields = ['SECS', 'MCr', 'VFr', 'CARDr', 'OPENr', 'SORTr'];
arrayFields.forEach(f => {
  if (!Array.isArray(data[f])) err(`${f} no es un array`);
  else ok(`${f}: ${data[f].length} items`);
});

// 2. Validar SECS
if (Array.isArray(data.SECS)) {
  const secIds = new Set();
  data.SECS.forEach((sec, i) => {
    if (!sec.id) err(`SECS[${i}]: id faltante`);
    else if (secIds.has(sec.id)) err(`SECS[${i}]: id duplicado "${sec.id}"`);
    else secIds.add(sec.id);
    if (typeof sec.tema !== 'number') err(`SECS[${i}] (${sec.id}): "tema" debe ser un número (es ${typeof sec.tema})`);
    else if (data.CONFIG?.temas?.length && !data.CONFIG.temas.some(t => t.n === sec.tema)) err(`SECS[${i}] (${sec.id}): tema ${sec.tema} no existe en CONFIG.temas`);
    if (!sec.name) warn(`SECS[${i}] (${sec.id}): name faltante`);
  });
  ok(`SECS: ${secIds.size} IDs únicos`);
}

// 3. Validar MCr (test)
if (Array.isArray(data.MCr)) {
  data.MCr.forEach((q, i) => {
    if (!Array.isArray(q) || q.length < 4) { err(`MCr[${i}]: estructura inválida (necesita [sec, pregunta, opciones[], explicación])`); return; }
    const [sec, pregunta, opciones, explicacion] = q;
    if (!sec) err(`MCr[${i}]: sec faltante`);
    if (!pregunta || typeof pregunta !== 'string') err(`MCr[${i}]: pregunta inválida`);
    if (!Array.isArray(opciones) || opciones.length !== 4) err(`MCr[${i}]: necesita exactamente 4 opciones`);
    else {
      if (opciones.some(o => typeof o !== 'string')) { err(`MCr[${i}]: todas las opciones deben ser texto`); return; }
      const uniq = new Set(opciones.map(o => o.trim().toLowerCase()));
      if (uniq.size !== 4) warn(`MCr[${i}]: opciones no son todas distintas`);
      // La correcta debe ser la primera en el array original (índice 0)
      // Esto se comprueba en el motor, aquí solo avisamos si la correcta no parece obvia
    }
    if (!explicacion || typeof explicacion !== 'string') warn(`MCr[${i}]: explicación vacía`);
  });
  ok(`MCr: ${data.MCr.length} preguntas validadas`);
}

// 4. Validar VFr (verdadero/falso)
if (Array.isArray(data.VFr)) {
  data.VFr.forEach((q, i) => {
    if (!Array.isArray(q) || q.length < 4) { err(`VFr[${i}]: estructura inválida (necesita [sec, afirmación, boolean, explicación])`); return; }
    const [sec, afirmacion, valor, explicacion] = q;
    if (typeof valor !== 'boolean') err(`VFr[${i}]: el tercer elemento debe ser boolean (true/false)`);
    if (!explicacion || typeof explicacion !== 'string') warn(`VFr[${i}]: explicación vacía`);
  });
  ok(`VFr: ${data.VFr.length} preguntas validadas`);
}

// 5. Validar CARDr (tarjetas)
if (Array.isArray(data.CARDr)) {
  data.CARDr.forEach((q, i) => {
    if (!Array.isArray(q) || q.length < 3) { err(`CARDr[${i}]: estructura inválida (necesita [sec, concepto, definición])`); return; }
    const [sec, concepto, definicion] = q;
    if (!concepto || !definicion) warn(`CARDr[${i}]: concepto o definición vacía`);
  });
  ok(`CARDr: ${data.CARDr.length} tarjetas validadas`);
}

// 6. Validar OPENr (escribir)
if (Array.isArray(data.OPENr)) {
  data.OPENr.forEach((q, i) => {
    if (!Array.isArray(q) || q.length < 4) { err(`OPENr[${i}]: estructura inválida (necesita [sec, pregunta, respuestaModelo, keywords[]])`); return; }
    const [sec, pregunta, respuesta, keywords] = q;
    if (!Array.isArray(keywords) || keywords.length === 0) err(`OPENr[${i}]: keywords debe ser array no vacío`);
    else {
      keywords.forEach((kw, j) => {
        if (!Array.isArray(kw) || kw.length < 2) { err(`OPENr[${i}].keywords[${j}]: debe ser [idea, [palabras...]]`); return; }
        const [idea, palabras] = kw;
        if (!Array.isArray(palabras) || palabras.length === 0) err(`OPENr[${i}].keywords[${j}]: palabras debe ser array no vacío`);
        else {
          palabras.forEach(p => {
            if (typeof p !== 'string') { err(`OPENr[${i}].keywords[${j}]: palabra no es string`); return; }
            // El motor normaliza (minúsculas y sin tildes) tanto la respuesta como la palabra clave,
            // así que aquí solo se recomienda escribirlas normalizadas.
            if (p !== norm(p)) warn(`OPENr[${i}].keywords[${j}]: "${p}" mejor en minúsculas y sin tildes ("${norm(p)}")`);
          });
        }
        // Verificar que las palabras clave aparecen en la respuesta modelo
        // Al menos una palabra de cada idea debería aparecer en la respuesta modelo (comparando sin tildes)
        if (Array.isArray(palabras) && palabras.length && typeof respuesta === 'string' && !palabras.some(p => norm(respuesta).includes(norm(p)))) {
          warn(`OPENr[${i}]: ninguna palabra de la idea "${idea}" aparece en la respuesta modelo`);
        }
      });
    }
  });
  ok(`OPENr: ${data.OPENr.length} preguntas validadas`);
}

// 7. Validar SORTr (clasificar)
if (Array.isArray(data.SORTr)) {
  data.SORTr.forEach((q, i) => {
    if (!Array.isArray(q) || q.length < 5) { err(`SORTr[${i}]: estructura inválida (necesita [sec, título, pregunta, categorías[], items[]])`); return; }
    const [sec, titulo, pregunta, categorias, items] = q;
    if (!Array.isArray(categorias) || categorias.length < 2) err(`SORTr[${i}]: necesita al menos 2 categorías`);
    if (!Array.isArray(items) || items.length === 0) err(`SORTr[${i}]: items debe ser array no vacío`);
    else {
      items.forEach((item, j) => {
        if (!Array.isArray(item) || item.length < 2) { err(`SORTr[${i}].items[${j}]: debe ser [elemento, índiceCategoría]`); return; }
        const [elem, catIdx] = item;
        if (typeof catIdx !== 'number' || catIdx < 0 || catIdx >= categorias.length) {
          err(`SORTr[${i}].items[${j}]: índiceCategoría inválido (${catIdx}, rango 0-${categorias.length - 1})`);
        }
      });
    }
  });
  ok(`SORTr: ${data.SORTr.length} ejercicios validados`);
}

// 8. Comprobar referencias SEC válidas
const secIds = new Set(data.SECS?.map(s => s.id) || []);
// El motor descarta en silencio lo que apunta a un apartado inexistente: es un error, no un aviso
['MCr', 'VFr', 'CARDr', 'OPENr', 'SORTr'].forEach(nombre => {
  (data[nombre] || []).forEach((q, i) => {
    if (!secIds.has(q[0])) err(`${nombre}[${i}]: referencia a apartado inexistente "${q[0]}"`);
  });
});

// 9. Avisos de cantidad mínima por apartado
if (data.SECS) {
  data.SECS.forEach(sec => {
    const mc = (data.MCr || []).filter(q => q[0] === sec.id).length;
    const vf = (data.VFr || []).filter(q => q[0] === sec.id).length;
    const card = (data.CARDr || []).filter(q => q[0] === sec.id).length;
    const open = (data.OPENr || []).filter(q => q[0] === sec.id).length;
    const sort = (data.SORTr || []).filter(q => q[0] === sec.id).length;
    const total = mc + vf + card + open + sort;
    if (total < 9) warn(`Apartado ${sec.id} (${sec.name}): solo ${total} items totales (recomendado ≥9)`);
  });
}

// 10. Detectar preguntas duplicadas (misma pregunta en MCr)
if (Array.isArray(data.MCr)) {
  const seen = new Map();
  data.MCr.forEach((q, i) => {
    const key = q[1]?.trim().toLowerCase();
    if (key) {
      if (seen.has(key)) warn(`MCr[${i}]: pregunta duplicada (también en ${seen.get(key)})`);
      else seen.set(key, i);
    }
  });
}

// ==================== RESUMEN ====================
console.log('\n=== Resumen ===');
console.log(`Errores: ${errors}`);
console.log(`Avisos: ${warnings}`);

if (errors > 0) {
  console.log('\n❌ Validación FALLIDA');
  process.exit(1);
} else {
  console.log('\n✅ Validación OK');
  process.exit(0);
}
