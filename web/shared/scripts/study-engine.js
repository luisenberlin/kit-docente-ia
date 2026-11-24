/**
 * study-engine.js v2 — Motor de estudio compartido (IIFE)
 * Ruta: hijos/shared/scripts/study-engine.js
 *
 * 6 pestañas: inicio, test (MCr + VFr), tarjetas (CARDr), escribir (OPENr),
 *          clasificar (SORTr), examen (MCr + VFr, hasta 20 preguntas).
 * Además, un test rápido sin pestaña propia (10/20 preguntas, corrección inmediata),
 * lanzado desde Inicio y con el pool filtrado por tema.
 *
 * Formato de datos: ver RECURSO_TEMPLATE.md (sin cambios respecto a la v1).
 * Progreso: localStorage["study_" + CONFIG.key] (formato v2; el progreso de la v1 se ignora).
 * API pública: window.StudyEngine.init(selector, data)
 */
(function () {
  'use strict';

  // ==================== CONSTANTES ====================
  const MODES = [
    ['inicio', 'Inicio'], ['test', 'Test'], ['tarjetas', 'Tarjetas'],
    ['escribir', 'Escribir'], ['clasificar', 'Clasificar'], ['examen', 'Examen']
  ];
  const MODE_TITLES = { test: 'Test', tarjetas: 'Tarjetas', escribir: 'Escribir', clasificar: 'Clasificar', examen: 'Examen', rapido: 'Test rápido' };
  const EMPTY_ICONS = { test: '❓', tarjetas: '🗂️', escribir: '✍️', clasificar: '📂', examen: '📝', rapido: '⚡' };
  const COURSES = { '3eso': '3º ESO', '1bach': '1º Bachillerato' };
  const SRC = { mc: 'MCr', vf: 'VFr', card: 'CARDr', open: 'OPENr', sort: 'SORTr' };
  const EXAM_SIZE = 20;
  const STORAGE_VERSION = 2;

  // ==================== ESTADO ====================
  function freshState() {
    return {
      data: null,
      mode: 'inicio',
      temaFilter: null,                       // número de tema o null
      indices: { test: 0, card: 0, write: 0, sort: 0 },
      answers: { test: {}, card: {}, write: {}, sort: {} },   // por id de pregunta
      results: { write: {}, sort: {} },
      progress: {},                           // id → 'ok' | 'partial' | 'ko'
      cardOrder: null,                        // orden barajado de tarjetas (no se guarda)
      exam: { questions: [], answers: {}, index: 0, startTime: 0, endTime: 0, finished: false, timerId: null },
      // Test rápido: sesión corta y efímera (no se guarda al recargar)
      quick: { questions: [], answers: {}, index: 0, finished: false }
    };
  }
  let state = freshState();
  let root = null;

  // ==================== HELPERS ====================
  const $ = (sel, ctx) => (ctx || root).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || root).querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const clamp = (n, len) => Math.max(0, Math.min(n, Math.max(0, len - 1)));
  const letter = i => String.fromCharCode(65 + i);
  const fmtTime = ms => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const oneDec = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toTop() { try { window.scrollTo(0, 0); } catch (e) { /* sin scroll */ } }

  // ==================== PERSISTENCIA ====================
  function storageKey() {
    const k = state.data && state.data.CONFIG && state.data.CONFIG.key;
    return k ? 'study_' + k : null;
  }

  function save() {
    const key = storageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        v: STORAGE_VERSION,
        mode: state.mode,
        temaFilter: state.temaFilter,
        indices: state.indices,
        answers: state.answers,
        results: state.results,
        progress: state.progress,
        ts: Date.now()
      }));
    } catch (e) { /* almacenamiento no disponible */ }
  }

  function load() {
    const key = storageKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (!p || p.v !== STORAGE_VERSION) return;      // formato antiguo: se descarta
      state.mode = (p.mode && p.mode !== 'examen' && p.mode !== 'rapido') ? p.mode : 'inicio';
      state.temaFilter = typeof p.temaFilter === 'number' ? p.temaFilter : null;
      Object.assign(state.indices, p.indices || {});
      ['test', 'card', 'write', 'sort'].forEach(k => { state.answers[k] = (p.answers && p.answers[k]) || {}; });
      state.results = { write: (p.results && p.results.write) || {}, sort: (p.results && p.results.sort) || {} };
      state.progress = p.progress || {};
    } catch (e) { /* datos corruptos: se ignoran */ }
  }

  function clearSaved() {
    const key = storageKey();
    if (!key) return;
    try { localStorage.removeItem(key); } catch (e) { /* nada */ }
  }

  function toast(msg, isError) {
    let el = document.getElementById('study-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'study-toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.toggle('toast--error', !!isError);
    el.classList.add('toast--show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('toast--show'), 2500);
  }

  // ==================== DATOS ====================
  const secOf = id => state.data.SECS.find(s => s.id === id);

  function filteredSecIds() {
    const f = state.temaFilter;
    return new Set(state.data.SECS.filter(s => f == null || Number(s.tema) === f).map(s => s.id));
  }

  /** Elementos de un tipo (mc, vf, card, open, sort) según el filtro, con id estable "tipo:índice". */
  function items(kind) {
    const ids = filteredSecIds();
    return (state.data[SRC[kind]] || [])
      .map((q, i) => ({ id: kind + ':' + i, kind, secId: q[0], q }))
      .filter(it => ids.has(it.secId));
  }

  function testItems() {
    const order = {};
    state.data.SECS.forEach((s, i) => { order[s.id] = i; });
    return items('mc').concat(items('vf')).sort((a, b) => order[a.secId] - order[b.secId]);
  }

  function cardItems() {
    const list = items('card');
    if (!state.cardOrder) return list;
    const pos = new Map(state.cardOrder.map((id, i) => [id, i]));
    return list.sort((a, b) => (pos.has(a.id) ? pos.get(a.id) : 1e9) - (pos.has(b.id) ? pos.get(b.id) : 1e9));
  }

  // ==================== ESTRUCTURA COMÚN ====================
  function tabsHTML() {
    return `<div class="tabs" role="tablist" aria-label="Modos de estudio">${MODES.map(([m, label]) =>
      `<button class="tab${state.mode === m ? ' tab--active' : ''}" role="tab" data-mode="${m}" aria-selected="${state.mode === m}">${label}</button>`
    ).join('')}</div>`;
  }

  function filterHTML() {
    const temas = (state.data.CONFIG && state.data.CONFIG.temas) || [];
    if (!temas.length) return '';
    return `<div class="filter" role="group" aria-label="Filtrar por tema">
      <button class="filter__btn${state.temaFilter == null ? ' filter__btn--active' : ''}" data-tema="">Todos</button>
      ${temas.map(t => `<button class="filter__btn${state.temaFilter === Number(t.n) ? ' filter__btn--active' : ''}" data-tema="${esc(t.n)}">${esc(t.name)}</button>`).join('')}
    </div>`;
  }

  function shell(o) {
    root.innerHTML = `
      <header class="header">
        ${o.kicker ? `<p class="header__kicker">${esc(o.kicker)}</p>` : ''}
        <h1 class="header__title">${esc(o.title)}</h1>
        ${o.desc ? `<p class="header__desc muted">${esc(o.desc)}</p>` : ''}
      </header>
      ${tabsHTML()}
      ${o.filter === false ? '' : filterHTML()}
      <div class="work">${o.body}</div>
      <footer class="footer">
        <div class="footer__nav">${o.nav || ''}</div>
        <div class="footer__meta">${esc(o.meta || '')}</div>
      </footer>`;
    $$('.tab').forEach(b => b.addEventListener('click', () => switchMode(b.dataset.mode)));
    $$('.filter__btn').forEach(b => b.addEventListener('click', () => setTemaFilter(b.dataset.tema)));
    const tabs = $('.tabs'), act = $('.tab[aria-selected="true"]');
    if (tabs && act) tabs.scrollLeft = Math.max(0, act.offsetLeft - (tabs.clientWidth - act.offsetWidth) / 2);
  }

  function navButtons(idx, total) {
    return `<button class="btn btn--secondary btn--sm" id="btn-prev" ${idx === 0 ? 'disabled' : ''}>Anterior</button>
            <button class="btn btn--primary btn--sm" id="btn-next" ${idx >= total - 1 ? 'disabled' : ''}>Siguiente</button>`;
  }

  function bindNav(kind, total) {
    const go = d => () => {
      state.indices[kind] = clamp(state.indices[kind] + d, total);
      if (kind === 'card') {
        const list = cardItems();
        const cur = list[state.indices.card];
        if (cur) state.answers.card[cur.id] = { flipped: false };
      }
      save(); toTop(); render();
    };
    const prev = $('#btn-prev'), next = $('#btn-next');
    if (prev) prev.addEventListener('click', go(-1));
    if (next) next.addEventListener('click', go(1));
  }

  const kickerFor = secId => {
    const s = secOf(secId);
    return s ? `Apartado ${s.id} · ${s.short || s.name}` : '';
  };
  const metaFor = label => `${label} · ${(state.data.meta && state.data.meta.subject) || ''}`;

  function switchMode(mode) {
    stopTimer();
    state.mode = mode;
    save(); toTop(); render();
  }

  function setTemaFilter(value) {
    const n = (value === '' || value == null) ? null : Number(value);
    if (n === state.temaFilter) return;
    state.temaFilter = n;
    state.indices = { test: 0, card: 0, write: 0, sort: 0 };
    state.cardOrder = null;
    stopTimer();
    state.exam = freshState().exam;       // el examen se rehace con el nuevo filtro
    state.quick = freshState().quick;     // la tanda rápida también
    save(); render();
  }

  function render() {
    const map = { inicio: renderInicio, test: renderTest, tarjetas: renderTarjetas, escribir: renderEscribir, clasificar: renderClasificar, examen: renderExamen, rapido: renderRapido };
    (map[state.mode] || renderInicio)();
  }

  function renderEmpty(mode, msg) {
    shell({
      title: MODE_TITLES[mode] || 'Estudio',
      body: `<div class="empty"><div class="empty__icon">${EMPTY_ICONS[mode] || '📄'}</div><h3 class="empty__title">Sin contenido</h3><p class="empty__desc">${esc(msg)}</p></div>`,
      meta: metaFor(MODE_TITLES[mode] || '')
    });
  }

  // ==================== INICIO ====================
  function renderInicio() {
    const m = state.data.meta || {};
    const count = (kind, onlyOk) => {
      const list = items(kind);
      return { total: list.length, done: list.filter(i => onlyOk ? state.progress[i.id] === 'ok' : state.progress[i.id]).length };
    };
    const mc = count('mc'), vf = count('vf'), card = count('card', true), open = count('open', true), sort = count('sort', true);
    const total = mc.total + vf.total + card.total + open.total + sort.total;
    const stat = (value, label) => `<div class="stat"><div class="stat__value">${value}</div><div class="stat__label">${label}</div></div>`;
    const poolSize = mc.total + vf.total;                       // MC + V/F del filtro activo
    const tema = ((state.data.CONFIG && state.data.CONFIG.temas) || []).find(x => Number(x.n) === state.temaFilter);
    const sizes = poolSize >= 20 ? [10, 20] : (poolSize >= 10 ? [10] : (poolSize ? [poolSize] : []));
    const quickCard = sizes.length ? `
        <div class="card quicklaunch">
          <h2>Test rápido</h2>
          <p class="muted">Tandas cortas con corrección inmediata: eliges cuántas preguntas y ves la respuesta de cada una al contestar.</p>
          <div class="quicklaunch__actions">
            ${sizes.map((s, i) => `<button class="btn ${i === 0 ? 'btn--primary' : 'btn--secondary'} js-quick-start" data-size="${s}" type="button">${s} preguntas</button>`).join('')}
          </div>
          <p class="quicklaunch__note">${poolSize} preguntas disponibles${tema ? ' en «' + esc(tema.name) + '»' : ''}.</p>
        </div>` : '';

    shell({
      kicker: m.kicker || m.subject || 'Recurso de estudio',
      title: m.h1 || m.title || 'Estudio',
      desc: m.description,
      body: `
        <div class="stats" role="region" aria-label="Progreso global">
          ${stat(total, 'Preguntas totales')}
          ${stat(mc.done + '/' + mc.total, 'Test')}
          ${stat(vf.done + '/' + vf.total, 'V/F')}
          ${stat(card.done + '/' + card.total, 'Tarjetas')}
          ${stat(open.done + '/' + open.total, 'Escribir')}
          ${stat(sort.done + '/' + sort.total, 'Clasificar')}
        </div>
        ${quickCard}
        <div class="card">
          <h2 style="margin-top:0">Bienvenido</h2>
          <p class="muted">Elige un modo de estudio en las pestañas. Con los botones de tema puedes limitar las preguntas a una parte de los apuntes.</p>
        </div>`,
      nav: '<button class="btn btn--ghost btn--sm" id="btn-reset">Reiniciar progreso</button>',
      meta: `${m.subject || ''} · ${COURSES[m.course] || m.course || ''}`
    });

    $$('.js-quick-start').forEach(b => b.addEventListener('click', () => startQuick(Number(b.dataset.size))));

    $('#btn-reset').addEventListener('click', () => {
      if (!confirm('¿Borrar todo el progreso guardado?')) return;
      clearSaved();
      const data = state.data;
      state = freshState();
      state.data = data;
      render();
    });
  }

  // ==================== TEST (MCr + VFr) ====================
  const explanationHTML = (ok, text) =>
    `<div class="mc__explanation ${ok ? 'mc__explanation--correct' : 'mc__explanation--incorrect'}">
       <strong>${ok ? '✓ Correcto' : '✗ Incorrecto'}</strong>${text ? ': ' + esc(text) : ''}
     </div>`;

  function renderTest() {
    const list = testItems();
    if (!list.length) return renderEmpty('test', 'No hay preguntas de test para este filtro');
    const idx = state.indices.test = clamp(state.indices.test, list.length);
    const it = list[idx];
    const header = `${idx + 1}/${list.length}: `;
    let body, answered, ok;

    if (it.kind === 'mc') {
      const [, qText, options, explanation] = it.q;
      let a = state.answers.test[it.id];
      if (!a) a = state.answers.test[it.id] = { order: shuffle(options.map((_, i) => i)), sel: null };
      const correctPos = a.order.indexOf(0);          // la opción correcta es la primera del dato
      answered = a.sel !== null;
      ok = a.sel === correctPos;
      body = `<div class="mc" role="group" aria-label="Pregunta ${idx + 1} de ${list.length}">
        <p class="mc__q">${header}${esc(qText)}</p>
        <div class="mc__options">${a.order.map((oi, pos) => {
          let cls = '';
          if (answered) cls = pos === correctPos ? ' mc__opt--correct' : (pos === a.sel ? ' mc__opt--incorrect' : '');
          return `<button class="mc__opt${cls}" data-pos="${pos}" ${answered ? 'disabled' : ''}>
            <span class="mc__opt-letter">${letter(pos)}</span><span>${esc(options[oi])}</span></button>`;
        }).join('')}</div>
        ${answered ? explanationHTML(ok, explanation) : ''}
      </div>`;
    } else {
      const [, statement, value, explanation] = it.q;
      let a = state.answers.test[it.id];
      if (!a) a = state.answers.test[it.id] = { sel: null };
      answered = a.sel !== null;
      ok = a.sel === value;
      const cls = v => {
        if (!answered) return '';
        if (v === value) return ' mc__opt--correct';
        return a.sel === v ? ' mc__opt--incorrect' : '';
      };
      body = `<div class="vf" role="group" aria-label="Pregunta ${idx + 1} de ${list.length}">
        <p class="vf__statement">${header}${esc(statement)}</p>
        <div class="vf__options">
          <button class="btn btn--secondary vf__btn${cls(true)}" data-val="true" ${answered ? 'disabled' : ''}>Verdadero</button>
          <button class="btn btn--secondary vf__btn${cls(false)}" data-val="false" ${answered ? 'disabled' : ''}>Falso</button>
        </div>
        ${answered ? explanationHTML(ok, explanation) : ''}
      </div>`;
    }

    if (answered) body += `<div style="margin-top:var(--space-md)"><button class="btn btn--ghost btn--sm" id="btn-retry">Probar de nuevo</button></div>`;

    shell({ kicker: kickerFor(it.secId), title: 'Test', body, nav: navButtons(idx, list.length), meta: metaFor('Test') });

    const a = state.answers.test[it.id];
    $$('.mc__opt:not([disabled])').forEach(b => b.addEventListener('click', () => {
      a.sel = Number(b.dataset.pos);
      state.progress[it.id] = a.sel === a.order.indexOf(0) ? 'ok' : 'ko';
      save(); render();
    }));
    $$('.vf__btn:not([disabled])').forEach(b => b.addEventListener('click', () => {
      a.sel = b.dataset.val === 'true';
      state.progress[it.id] = a.sel === it.q[2] ? 'ok' : 'ko';
      save(); render();
    }));
    const retry = $('#btn-retry');
    if (retry) retry.addEventListener('click', () => { delete state.answers.test[it.id]; delete state.progress[it.id]; save(); render(); });
    bindNav('test', list.length);
  }

  // ==================== TARJETAS ====================
  function renderTarjetas() {
    const list = cardItems();
    if (!list.length) return renderEmpty('tarjetas', 'No hay tarjetas para este filtro');
    const idx = state.indices.card = clamp(state.indices.card, list.length);
    const it = list[idx];
    const [, concept, definition] = it.q;
    const a = state.answers.card[it.id] || (state.answers.card[it.id] = { flipped: false });
    const mark = state.progress[it.id];

    shell({
      kicker: kickerFor(it.secId),
      title: 'Tarjetas',
      body: `
        <div class="flash" id="flash-card" tabindex="0" role="button" aria-label="Tarjeta ${idx + 1} de ${list.length}. Pulsa para voltear.">
          <div class="flash__inner${a.flipped ? ' flipped' : ''}" id="flash-inner">
            <div class="flash__face flash__front">
              <div class="flash__concept">${esc(concept)}</div>
              <div class="flash__hint">Pulsa para ver la definición</div>
            </div>
            <div class="flash__face flash__back">
              <div class="flash__definition">${esc(definition)}</div>
              <div class="flash__hint">Pulsa para volver</div>
            </div>
          </div>
        </div>
        <div class="flash__nav">
          <button class="btn btn--secondary btn--sm" id="btn-prev" ${idx === 0 ? 'disabled' : ''} aria-label="Tarjeta anterior">← Anterior</button>
          <span style="align-self:center;color:var(--ink-2);font-size:.9rem">${idx + 1} / ${list.length}</span>
          <button class="btn btn--secondary btn--sm" id="btn-next" ${idx >= list.length - 1 ? 'disabled' : ''} aria-label="Tarjeta siguiente">Siguiente →</button>
        </div>
        <div style="margin-top:var(--space-md);display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap">
          <button class="btn btn--ghost btn--sm" id="btn-card-known" ${a.flipped ? '' : 'disabled'}>Sabía la respuesta</button>
          <button class="btn btn--ghost btn--sm" id="btn-card-unknown" ${a.flipped ? '' : 'disabled'}>No la sabía</button>
        </div>
        <p class="muted text-center" id="card-status" style="margin-top:var(--space-sm)">${mark === 'ok' ? '✓ Marcada como sabida' : mark === 'ko' ? 'Marcada para repasar' : ''}</p>`,
      nav: '<button class="btn btn--ghost btn--sm" id="btn-card-shuffle">Barajar</button>',
      meta: metaFor('Tarjetas')
    });

    const card = $('#flash-card'), inner = $('#flash-inner');
    const known = $('#btn-card-known'), unknown = $('#btn-card-unknown');
    const flip = () => {
      a.flipped = !a.flipped;
      inner.classList.toggle('flipped', a.flipped);
      known.disabled = unknown.disabled = !a.flipped;
      save();
    };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    const setMark = v => () => {
      state.progress[it.id] = v;
      $('#card-status').textContent = v === 'ok' ? '✓ Marcada como sabida' : 'Marcada para repasar';
      save();
    };
    known.addEventListener('click', setMark('ok'));
    unknown.addEventListener('click', setMark('ko'));
    $('#btn-card-shuffle').addEventListener('click', () => {
      state.cardOrder = shuffle(items('card').map(i => i.id));
      state.indices.card = 0;
      state.answers.card = {};
      toast('Tarjetas barajadas');
      save(); render();
    });
    bindNav('card', list.length);
  }

  // ==================== ESCRIBIR ====================
  function renderEscribir() {
    const list = items('open');
    if (!list.length) return renderEmpty('escribir', 'No hay preguntas de escribir para este filtro');
    const idx = state.indices.write = clamp(state.indices.write, list.length);
    const it = list[idx];
    const [, qText, model, keywords] = it.q;
    const answer = state.answers.write[it.id] || '';
    const result = state.results.write[it.id];
    const label = { ok: '✓ Bien', partial: '◐ Parcial', ko: '✗ Revisar' };

    shell({
      kicker: kickerFor(it.secId),
      title: 'Escribir',
      body: `<div class="write">
        <p class="write__q">${idx + 1}/${list.length}: ${esc(qText)}</p>
        <textarea class="write__textarea" id="write-input" aria-label="Tu respuesta" placeholder="Escribe tu respuesta aquí...">${esc(answer)}</textarea>
        <div class="write__actions"><button class="btn btn--primary" id="btn-write-check" ${answer.trim() ? '' : 'disabled'}>Comprobar</button></div>
        ${result ? `<div class="write__result write__result--${result.type}">
          <strong>${label[result.type]}</strong>
          <div class="write__keywords">Ideas clave: ${keywords.map(([idea], k) =>
            `<span class="write__keyword${result.found.includes(k) ? ' write__keyword--found' : ''}">${esc(idea)}</span>`).join(' ')}</div>
        </div>` : ''}
        <details class="write__model"${result ? ' open' : ''}>
          <summary>Respuesta modelo</summary>
          <p style="white-space:pre-wrap">${esc(model)}</p>
        </details>
      </div>`,
      nav: navButtons(idx, list.length),
      meta: metaFor('Escribir')
    });

    const ta = $('#write-input'), check = $('#btn-write-check');
    ta.addEventListener('input', () => {
      state.answers.write[it.id] = ta.value;
      check.disabled = !ta.value.trim();
      save();
    });
    check.addEventListener('click', () => {
      const text = norm(ta.value);
      // Cada idea cuenta si aparece alguna de sus palabras (sin distinguir mayúsculas ni tildes)
      const found = [];
      keywords.forEach(([, words], k) => { if (words.some(w => text.includes(norm(w)))) found.push(k); });
      const type = found.length === keywords.length ? 'ok' : (found.length ? 'partial' : 'ko');
      state.results.write[it.id] = { type, found };
      state.progress[it.id] = type;
      save(); render();
    });
    bindNav('write', list.length);
  }

  // ==================== CLASIFICAR ====================
  function newSortAnswer(sortItems) {
    return { order: shuffle(sortItems.map((_, i) => i)), cats: sortItems.map(() => null), checked: false };
  }

  function renderClasificar() {
    const list = items('sort');
    if (!list.length) return renderEmpty('clasificar', 'No hay ejercicios de clasificar para este filtro');
    const idx = state.indices.sort = clamp(state.indices.sort, list.length);
    const it = list[idx];
    const [, title, prompt, categories, sortItems] = it.q;
    let a = state.answers.sort[it.id];
    if (!a || a.cats.length !== sortItems.length) a = state.answers.sort[it.id] = newSortAnswer(sortItems);
    const res = state.results.sort[it.id];

    shell({
      kicker: kickerFor(it.secId),
      title: 'Clasificar',
      body: `<div class="sort">
        <h2 style="margin:0">${esc(title)}</h2>
        <p class="sort__q">${esc(prompt)}</p>
        <div class="sort__categories" role="group" aria-label="Categorías">
          ${categories.map((c, i) => `<span class="sort__cat" data-cat="${i}">${esc(c)}</span>`).join('')}
        </div>
        <div class="sort__items" role="list" aria-label="Elementos para clasificar">
          ${a.order.map(k => {
            const cat = a.cats[k];
            const state_ = a.checked ? (cat === sortItems[k][1] ? ' sort__item--ok' : ' sort__item--ko') : (cat != null ? ' sort__item--placed' : '');
            return `<div class="sort__item${state_}" draggable="${!a.checked}" data-index="${k}" role="listitem">
              <span class="sort__item-text">${esc(sortItems[k][0])}</span>
              <select class="sort__item-select" data-index="${k}" aria-label="Categoría de «${esc(sortItems[k][0])}»" ${a.checked ? 'disabled' : ''}>
                <option value="">Elige…</option>
                ${categories.map((c, j) => `<option value="${j}" ${cat === j ? 'selected' : ''}>${esc(c)}</option>`).join('')}
              </select>
            </div>`;
          }).join('')}
        </div>
        <div class="sort__check">
          ${a.checked
            ? '<button class="btn btn--secondary" id="btn-sort-retry">Probar de nuevo</button>'
            : `<button class="btn btn--primary" id="btn-sort-check" ${a.cats.some(c => c === null) ? 'disabled' : ''}>Comprobar</button>`}
        </div>
        ${a.checked && res ? `<div class="write__result write__result--${res.correct === sortItems.length ? 'ok' : 'ko'}">
          ${res.correct === sortItems.length ? '✓ Todo correcto' : `✗ ${res.correct} de ${sortItems.length} correctos`}</div>` : ''}
      </div>`,
      nav: navButtons(idx, list.length),
      meta: metaFor('Clasificar')
    });

    if (!a.checked) {
      const checkBtn = $('#btn-sort-check');
      const place = (k, cat) => {
        a.cats[k] = cat;
        const row = $(`.sort__item[data-index="${k}"]`);
        row.classList.toggle('sort__item--placed', cat !== null);
        $('select', row).value = cat === null ? '' : String(cat);
        checkBtn.disabled = a.cats.some(c => c === null);
        save();
      };
      $$('.sort__item-select').forEach(sel => sel.addEventListener('change', () => place(Number(sel.dataset.index), sel.value === '' ? null : Number(sel.value))));

      // Arrastrar un elemento sobre una categoría (ordenador); en móvil se usa el desplegable
      let dragged = null;
      $$('.sort__item').forEach(el => {
        el.addEventListener('dragstart', e => { dragged = Number(el.dataset.index); el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragged)); });
        el.addEventListener('dragend', () => { el.classList.remove('dragging'); dragged = null; $$('.sort__cat').forEach(c => c.classList.remove('sort__cat--over')); });
      });
      $$('.sort__cat').forEach(c => {
        c.addEventListener('dragover', e => { e.preventDefault(); c.classList.add('sort__cat--over'); });
        c.addEventListener('dragleave', () => c.classList.remove('sort__cat--over'));
        c.addEventListener('drop', e => { e.preventDefault(); c.classList.remove('sort__cat--over'); if (dragged !== null) place(dragged, Number(c.dataset.cat)); });
      });

      checkBtn.addEventListener('click', () => {
        const correct = sortItems.reduce((n, [, expected], k) => n + (a.cats[k] === expected ? 1 : 0), 0);
        a.checked = true;
        state.results.sort[it.id] = { correct };
        state.progress[it.id] = correct === sortItems.length ? 'ok' : 'ko';
        save(); render();
      });
    } else {
      $('#btn-sort-retry').addEventListener('click', () => {
        state.answers.sort[it.id] = newSortAnswer(sortItems);
        delete state.results.sort[it.id];
        delete state.progress[it.id];
        save(); render();
      });
    }
    bindNav('sort', list.length);
  }

  // ==================== EXAMEN ====================
  function stopTimer() {
    if (state.exam.timerId) { clearInterval(state.exam.timerId); state.exam.timerId = null; }
  }

  function startTimer() {
    stopTimer();
    state.exam.timerId = setInterval(() => {
      const el = root && $('#exam-timer');
      if (el) el.textContent = fmtTime(Date.now() - state.exam.startTime);
    }, 1000);
  }

  function buildExam() {
    const pool = items('mc').map(it => {
      const [, question, options, explanation] = it.q;
      const order = shuffle(options.map((_, i) => i));
      return { type: 'MC', secId: it.secId, question, options: order.map(i => options[i]), correct: order.indexOf(0), explanation };
    }).concat(items('vf').map(it => {
      const [, question, value, explanation] = it.q;
      return { type: 'VF', secId: it.secId, question, correct: value, explanation };
    }));
    const ex = state.exam;
    ex.questions = shuffle(pool).slice(0, EXAM_SIZE);
    ex.answers = {};
    ex.index = 0;
    ex.startTime = Date.now();
    ex.endTime = 0;
    ex.finished = false;
  }

  function renderExamen() {
    const ex = state.exam;
    if (!ex.questions.length) buildExam();
    if (!ex.questions.length) return renderEmpty('examen', 'No hay preguntas suficientes para un examen');
    if (ex.finished) return renderExamResults();

    const idx = ex.index, q = ex.questions[idx];
    const sel = ex.answers[idx] === undefined ? null : ex.answers[idx];
    const selCls = v => (sel === v ? ' mc__opt--selected' : '');
    const content = q.type === 'MC'
      ? `<p class="exam__q">${esc(q.question)}</p>
         <div class="mc__options">${q.options.map((o, i) =>
           `<button class="mc__opt${selCls(i)}" data-val="${i}"><span class="mc__opt-letter">${letter(i)}</span><span>${esc(o)}</span></button>`).join('')}</div>`
      : `<p class="exam__q vf__statement">${esc(q.question)}</p>
         <div class="vf__options">
           <button class="btn btn--secondary vf__btn${selCls(true)}" data-val="true">Verdadero</button>
           <button class="btn btn--secondary vf__btn${selCls(false)}" data-val="false">Falso</button>
         </div>`;

    shell({
      kicker: kickerFor(q.secId),
      title: 'Examen',
      filter: false,
      body: `<div class="exam">
        <div class="exam__header">
          <span class="exam__timer" id="exam-timer">${fmtTime(Date.now() - ex.startTime)}</span>
          <span class="exam__progress">${idx + 1} / ${ex.questions.length}</span>
        </div>
        ${content}
        <div class="exam__actions">
          <button class="btn btn--primary" id="btn-exam-next" ${sel === null ? 'disabled' : ''}>${idx === ex.questions.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
        </div>
      </div>`,
      meta: metaFor('Examen')
    });

    const next = $('#btn-exam-next');
    $$('.mc__opt, .vf__btn').forEach(b => b.addEventListener('click', () => {
      ex.answers[idx] = q.type === 'MC' ? Number(b.dataset.val) : b.dataset.val === 'true';
      $$('.mc__opt, .vf__btn').forEach(x => x.classList.toggle('mc__opt--selected', x === b));
      next.disabled = false;
    }));
    next.addEventListener('click', () => {
      if (idx >= ex.questions.length - 1) {
        ex.finished = true;
        ex.endTime = Date.now();
        stopTimer();
      } else {
        ex.index++;
      }
      toTop(); renderExamen();
    });
    startTimer();
  }

  function renderExamResults() {
    const ex = state.exam;
    const wrong = [];
    ex.questions.forEach((q, i) => { if (ex.answers[i] !== q.correct) wrong.push(q); });
    const total = ex.questions.length, correct = total - wrong.length;
    const grade = total ? (correct / total) * 10 : 0;
    const temas = (state.data.CONFIG && state.data.CONFIG.temas) || [];
    const t = temas.find(x => Number(x.n) === state.temaFilter);
    const answerText = q => q.type === 'MC' ? q.options[q.correct] : (q.correct ? 'Verdadero' : 'Falso');

    shell({
      kicker: 'Resultado',
      title: 'Examen completado',
      filter: false,
      body: `<div class="exam__results">
        <div class="exam__score">${oneDec(grade)}/10</div>
        <div class="exam__grade">${correct} de ${total} correctas</div>
        <div class="exam__grade" style="font-size:1rem;color:var(--ink-2);margin-top:var(--space-xs)">Tiempo: ${fmtTime(ex.endTime - ex.startTime)}</div>
        <div class="exam__details">
          <p><strong>Temas:</strong> ${state.temaFilter != null ? esc(t ? t.name : 'Tema ' + state.temaFilter) : 'Todos'}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          ${wrong.length ? `<h3>Para repasar</h3>${wrong.map(q => `<details style="margin-bottom:var(--space-sm)">
            <summary>${esc(q.question)}</summary>
            <p style="margin:var(--space-xs) 0"><strong>Correcta:</strong> ${esc(answerText(q))}</p>
            ${q.explanation ? `<p style="margin:0">${esc(q.explanation)}</p>` : ''}
          </details>`).join('')}` : '<p>¡Sin errores!</p>'}
        </div>
        <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);justify-content:center;flex-wrap:wrap">
          <button class="btn btn--primary" id="btn-exam-retry">Repetir examen</button>
          <button class="btn btn--secondary" id="btn-exam-inicio">Volver al inicio</button>
        </div>
      </div>`,
      meta: metaFor('Examen')
    });

    $('#btn-exam-retry').addEventListener('click', () => { state.exam = freshState().exam; toTop(); renderExamen(); });
    $('#btn-exam-inicio').addEventListener('click', () => switchMode('inicio'));
  }

  // ==================== TEST RÁPIDO ====================
  /** Pool de preguntas (MC + V/F) del filtro activo, con las opciones ya barajadas. */
  function quickPool() {
    const mc = items('mc').map(it => {
      const [, question, options, explanation] = it.q;
      const order = shuffle(options.map((_, i) => i));
      return { itemId: it.id, type: 'MC', secId: it.secId, question, options: order.map(i => options[i]), correct: order.indexOf(0), explanation };
    });
    const vf = items('vf').map(it => {
      const [, question, value, explanation] = it.q;
      return { itemId: it.id, type: 'VF', secId: it.secId, question, correct: value, explanation };
    });
    return mc.concat(vf);
  }

  function startQuick(size) {
    const pool = quickPool();
    if (!pool.length) return;
    const qk = state.quick = freshState().quick;
    qk.questions = shuffle(pool).slice(0, Math.min(size, pool.length));
    state.mode = 'rapido';
    save(); toTop(); render();
  }

  function renderRapido() {
    const qk = state.quick;
    if (!qk.questions.length) return renderEmpty('rapido', 'No hay preguntas de test para este filtro');
    if (qk.finished) return renderQuickResults();

    const idx = qk.index, q = qk.questions[idx], total = qk.questions.length;
    const sel = qk.answers[idx] === undefined ? null : qk.answers[idx];
    const answered = sel !== null;
    const ok = answered && sel === q.correct;
    const header = `${idx + 1}/${total}: `;
    let okCount = 0, koCount = 0;
    qk.questions.forEach((qq, i) => {
      if (qk.answers[i] === undefined) return;
      if (qk.answers[i] === qq.correct) okCount++; else koCount++;
    });

    const content = q.type === 'MC'
      ? `<div class="mc" role="group" aria-label="Pregunta ${idx + 1} de ${total}">
          <p class="mc__q">${header}${esc(q.question)}</p>
          <div class="mc__options">${q.options.map((o, pos) => {
            let cls = '';
            if (answered) cls = pos === q.correct ? ' mc__opt--correct' : (pos === sel ? ' mc__opt--incorrect' : '');
            return `<button class="mc__opt${cls}" data-pos="${pos}" ${answered ? 'disabled' : ''}>
              <span class="mc__opt-letter">${letter(pos)}</span><span>${esc(o)}</span></button>`;
          }).join('')}</div>
          ${answered ? explanationHTML(ok, q.explanation) : ''}
        </div>`
      : `<div class="vf" role="group" aria-label="Pregunta ${idx + 1} de ${total}">
          <p class="vf__statement">${header}${esc(q.question)}</p>
          <div class="vf__options">${[true, false].map(v => {
            let cls = '';
            if (answered) cls = v === q.correct ? ' mc__opt--correct' : (v === sel ? ' mc__opt--incorrect' : '');
            return `<button class="btn btn--secondary vf__btn${cls}" data-val="${v}" ${answered ? 'disabled' : ''}>${v ? 'Verdadero' : 'Falso'}</button>`;
          }).join('')}</div>
          ${answered ? explanationHTML(ok, q.explanation) : ''}
        </div>`;

    shell({
      kicker: kickerFor(q.secId),
      title: 'Test rápido',
      filter: false,
      body: `<div class="exam">
        <div class="exam__header">
          <span class="exam__progress">Pregunta ${idx + 1} de ${total}</span>
          <span class="quick__score"><b>✓ ${okCount}</b> · ✗ ${koCount}</span>
        </div>
        ${content}
        <div class="exam__actions quick__actions">
          <button class="btn btn--ghost btn--sm" id="btn-quick-exit" type="button">Salir</button>
          <button class="btn btn--primary" id="btn-quick-next" type="button" ${answered ? '' : 'disabled'}>${idx === total - 1 ? 'Ver resultado' : 'Siguiente'}</button>
        </div>
      </div>`,
      meta: metaFor('Test rápido')
    });

    $$('.mc__opt, .vf__btn').forEach(b => b.addEventListener('click', () => {
      qk.answers[idx] = q.type === 'MC' ? Number(b.dataset.pos) : b.dataset.val === 'true';
      state.progress[q.itemId] = qk.answers[idx] === q.correct ? 'ok' : 'ko';
      save(); render();
    }));
    $('#btn-quick-next').addEventListener('click', () => {
      if (idx >= total - 1) qk.finished = true;
      else qk.index++;
      toTop(); render();
    });
    $('#btn-quick-exit').addEventListener('click', () => switchMode('inicio'));
  }

  function renderQuickResults() {
    const qk = state.quick, total = qk.questions.length;
    const wrong = [];
    qk.questions.forEach((q, i) => { if (qk.answers[i] !== q.correct) wrong.push(q); });
    const correct = total - wrong.length;
    const grade = total ? (correct / total) * 10 : 0;
    const poolSize = quickPool().length;
    const retrySizes = [10, 20].filter(s => poolSize >= s);
    if (!retrySizes.length) retrySizes.push(poolSize);

    shell({
      kicker: 'Test rápido',
      title: 'Tanda completada',
      filter: false,
      body: `<div class="exam__results">
        <div class="exam__score">${correct}/${total}</div>
        <div class="exam__grade">${oneDec(grade)}/10 · ${correct} de ${total} correctas</div>
        <div class="exam__details">
          ${wrong.length ? `<h3>Para repasar</h3>${wrong.map(q => `<details style="margin-bottom:var(--space-sm)">
            <summary>${esc(q.question)}</summary>
            <p style="margin:var(--space-xs) 0"><strong>Correcta:</strong> ${esc(q.type === 'MC' ? q.options[q.correct] : (q.correct ? 'Verdadero' : 'Falso'))}</p>
            ${q.explanation ? `<p style="margin:0">${esc(q.explanation)}</p>` : ''}
          </details>`).join('')}` : '<p>¡Sin errores!</p>'}
        </div>
        <div class="quicklaunch__actions" style="justify-content:center;margin-top:var(--space-lg)">
          ${retrySizes.map((s, i) => `<button class="btn ${i === 0 ? 'btn--primary' : 'btn--secondary'} js-quick-again" data-size="${s}" type="button">Otra vez ${s}</button>`).join('')}
          <button class="btn btn--ghost" id="btn-quick-home" type="button">Volver al inicio</button>
        </div>
      </div>`,
      meta: metaFor('Test rápido')
    });

    $$('.js-quick-again').forEach(b => b.addEventListener('click', () => startQuick(Number(b.dataset.size))));
    $('#btn-quick-home').addEventListener('click', () => switchMode('inicio'));
  }

  // ==================== API PÚBLICA ====================
  window.StudyEngine = {
    init(containerSel, data) {
      const el = document.querySelector(containerSel) || document.getElementById('app');
      if (!el) { console.error('StudyEngine: contenedor no encontrado'); return; }
      root = el;
      const fail = (title, desc) => {
        root.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><h3 class="empty__title">${title}</h3><p class="empty__desc">${desc}</p></div>`;
      };
      if (!data) { console.error('StudyEngine: STUDY_DATA no proporcionado'); return fail('Datos no encontrados', 'Falta window.STUDY_DATA'); }
      if (!Array.isArray(data.SECS) || !data.SECS.length) return fail('Datos incompletos', 'SECS está vacío o no existe');
      stopTimer();
      state = freshState();
      state.data = data;
      load();
      render();
    },
    _state: () => state     // para pruebas/depuración
  };
})();
