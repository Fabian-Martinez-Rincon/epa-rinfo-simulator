(function () {
  'use strict';
  var DATA = window.EPA_DATA;
  var RInfo = window.RInfo;
  var PROJECTS = DATA.PROJECTS, VOCAB = DATA.VOCAB,
      SOLUTIONS = DATA.SOLUTIONS;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ============ VOCAB ============
  function renderVocab() {
    var rows = [
      ['Primitivas de movimiento/accion', VOCAB.primitivas],
      ['Sensores de estado', VOCAB.sensores],
      ['Posicionamiento / E-S', VOCAB.es],
      ['Control', VOCAB.control],
      ['Logica', VOCAB.logica],
      ['Tipos de dato', VOCAB.tipos],
      ['Operadores', VOCAB.operadores],
      ['Modularizacion', VOCAB.modulos]
    ];
    var tbody = $('#vocabBody');
    rows.forEach(function (r) {
      tbody.appendChild(el('tr', {}, [
        el('th', {}, [r[0]]),
        el('td', {}, [el('div', { class: 'pill-row' }, r[1].map(function (v) { return el('span', { class: 'pill' }, [v]); }))])
      ]));
    });
  }

  // ============ CATALOG ============
  var filterState = { text: '', tier: 'all', onlyFlagged: false, expanded: false };
  var CATALOG_PAGE_SIZE = 3;

  function projectMatches(p) {
    if (filterState.onlyFlagged && !p.validacion) return false;
    if (filterState.tier !== 'all' && p.tier !== filterState.tier) return false;
    if (filterState.text) {
      var hay = (p.nombre + ' ' + p.resumen + ' ' + p.verbos.join(' ') + ' ' + p.categoria).toLowerCase();
      if (hay.indexOf(filterState.text.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function tierLabel(t) {
    return { U2: 'Unidad 2', U3: 'Unidad 2-3', U4: 'Repaso U2-4', U5: 'Unidad 5', U6: 'Unidad 6', U7: 'Unidad 7', U8: 'Unidad 8' }[t] || t;
  }

  function renderCard(p) {
    var card = el('div', { class: 'card', 'data-id': p.id }, [
      el('div', { class: 'card-top' }, [
        el('div', {}, [el('span', { class: 'card-id' }, [p.id + ' · ' + tierLabel(p.tier)]), el('h3', {}, [p.nombre])]),
        el('span', { class: 'badge diff' }, ['Dif. ' + p.dificultad + '/10'])
      ]),
      el('p', {}, [p.resumen]),
      el('div', { class: 'card-verbs' }, p.verbos.map(function (v) { return el('span', {}, [v]); }).concat(
        p.validacion ? [el('span', { class: 'badge warn', style: 'margin-left:auto' }, ['⚠ no validado'])] : []
      )),
      el('div', { class: 'card-actions' }, [
        el('button', { class: 'btn small', onclick: function () { toggleDetail(p.id); } }, ['Ver detalle']),
        el('button', { class: 'btn small primary', onclick: function () { openInSimulator(p.id); } }, ['Abrir en simulador'])
      ])
    ]);
    return card;
  }

  function renderCatalog() {
    var grid = $('#catalogGrid');
    grid.innerHTML = '';
    var visible = PROJECTS.filter(projectMatches);
    var shown = filterState.expanded ? visible : visible.slice(0, CATALOG_PAGE_SIZE);
    shown.forEach(function (p) { grid.appendChild(renderCard(p)); });
    $('#catalogCount').textContent = visible.length + ' de ' + PROJECTS.length + ' proyectos R-info';
    var moreWrap = $('#catalogMoreWrap');
    var hidden = visible.length - shown.length;
    if (hidden > 0) {
      moreWrap.style.display = '';
      $('#catalogMoreBtn').textContent = 'Ver ' + hidden + ' más';
    } else {
      moreWrap.style.display = 'none';
    }
    $('#detailSlot').innerHTML = '';
  }

  function toggleDetail(id) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var slot = $('#detailSlot');
    if (slot.dataset.open === id) { slot.innerHTML = ''; slot.removeAttribute('data-open'); return; }
    slot.dataset.open = id;
    slot.innerHTML = '';
    var box = el('div', { class: 'detail' }, [
      el('div', { class: 'card-top' }, [
        el('h3', {}, [p.id + ' — ' + p.nombre]),
        el('button', { class: 'btn small ghost', onclick: function () { slot.innerHTML = ''; slot.removeAttribute('data-open'); } }, ['Cerrar ✕'])
      ]),
      el('p', {}, [p.resumen]),
      el('div', { class: 'pill-row' }, [
        el('span', { class: 'pill' }, ['Prerrequisito: ' + p.prereq]),
        el('span', { class: 'pill' }, ['Categoria: ' + p.categoria]),
        el('span', { class: 'pill' }, ['Dificultad ' + p.dificultad + '/10'])
      ]),
      el('h4', {}, ['Precondicion']), el('p', {}, [p.precondicion]),
      el('h4', {}, ['Postcondicion']), el('p', {}, [p.postcondicion]),
      el('h4', {}, ['Descomposicion Top-Down (asi esta resuelto en el simulador)']),
      el('ol', {}, p.topdown.map(function (t) { return el('li', {}, [t]); })),
      el('h4', {}, ['Caso de prueba sugerido']), el('p', {}, [p.casoPrueba]),
      el('h4', {}, ['Variante avanzada']), el('p', {}, [p.varianteAvanzada]),
      el('h4', {}, ['Archivos que fundamentan este proyecto']),
      el('div', {}, p.fundamento.map(function (f) { return el('span', { class: 'filepath' }, [f]); })),
    ]);
    if (p.validacion) {
      box.appendChild(el('div', { class: 'callout warn' }, [el('b', {}, ['⚠ Dependencia no validada: ']), p.validacion]));
    }
    box.appendChild(el('div', { class: 'card-actions', style: 'margin-top:14px' }, [
      el('button', { class: 'btn primary', onclick: function () { openInSimulator(p.id); } }, ['Abrir en simulador'])
    ]));
    slot.appendChild(box);
    if (typeof slot.scrollIntoView === 'function') slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ============ SIMULATOR ============
  var sim = {
    city: new Map(),
    origin: { av: 1, ca: 1 },
    size: 10,
    trace: [], traceIdx: 0, stepTimer: null, rafId: null,
    liveRobot: { av: 1, ca: 1, dir: 'N', bagFlor: 0, bagPapel: 0 },
    liveCity: new Map(),
    // Lista de tramos: Pos() (teletransporte) arranca un tramo nuevo en vez de
    // trazar una linea recta hasta ahi, que no representa un desplazamiento real.
    trail: [[{ av: 1, ca: 1 }]],
    followRobot: true, sizeBeforeFollow: 25,
    viewMode: '2d',
    running: false,
    anim: { fromAv: 1, fromCa: 1, toAv: 1, toCa: 1, startedAt: 0, duration: 220 }
  };

  function pushTrail(av, ca, teleport) {
    var seg = sim.trail[sim.trail.length - 1];
    var last = seg[seg.length - 1];
    if (last && last.av === av && last.ca === ca) return;
    if (teleport) sim.trail.push([{ av: av, ca: ca }]);
    else seg.push({ av: av, ca: ca });
  }

  function cellKey(av, ca) { return av + ',' + ca; }
  function getCell(map, av, ca) { return map.get(cellKey(av, ca)) || { flor: 0, papel: 0 }; }
  function setCell(map, av, ca, val) {
    if (val.flor === 0 && val.papel === 0) map.delete(cellKey(av, ca));
    else map.set(cellKey(av, ca), val);
  }
  function cloneCity(map) { var m = new Map(); map.forEach(function (v, k) { m.set(k, { flor: v.flor, papel: v.papel }); }); return m; }

  function populateProjectSelect() {
    var sel = $('#projectSelect');
    PROJECTS.forEach(function (p) {
      sel.appendChild(el('option', { value: p.id }, [p.id + ' — ' + p.nombre]));
    });
    sel.addEventListener('change', function () { loadProjectIntoEditor(sel.value); });
  }

  function loadProjectIntoEditor(id) {
    var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
    var sol = SOLUTIONS[id];
    if (!p || !sol) return;

    stopAnimation();
    sim.currentTrace = null;
    sim.currentResult = null;
    sim.traceIdx = 0;

    $('#editor').value = sol.code;
    syncGutter();
    $('#projectSelect').value = id;

    sim.city = new Map();
    Object.keys(sol.demoCity || {}).forEach(function (k) {
      var v = sol.demoCity[k];
      sim.city.set(k, { flor: v.flor || 0, papel: v.papel || 0 });
    });
    sim.liveCity = cloneCity(sim.city);
    $('#bagFlor').value = sol.demoBagFlor || 0;
    $('#bagPapel').value = sol.demoBagPapel || 0;
    sim.liveRobot = { av: 1, ca: 1, dir: 'N', bagFlor: sol.demoBagFlor || 0, bagPapel: sol.demoBagPapel || 0 };
    sim.trail = [[{ av: 1, ca: 1 }]];
    redraw();

    logConsole('Cargado ' + p.id + ' — ' + p.nombre + ' con una solucion de referencia ya funcional y una ciudad de ejemplo. Dale a Ejecutar.', 'muted');
  }

  function openInSimulator(id) {
    loadProjectIntoEditor(id);
    var simSection = document.getElementById('simulador');
    if (typeof simSection.scrollIntoView === 'function') simSection.scrollIntoView({ behavior: 'smooth' });
    setActiveNav('simulador');
  }
  window.openInSimulator = openInSimulator;

  function syncGutter() {
    var lines = $('#editor').value.split('\n').length;
    var g = $('#gutter');
    var out = '';
    for (var i = 1; i <= lines; i++) out += i + '\n';
    g.textContent = out;
    syncHighlight();
  }

  // ---- syntax highlighting (textarea stays invisible on top; this layer shows through) ----
  var RINFO_STRUCT = ['programa', 'procesos', 'proceso', 'areas', 'robots', 'robot', 'variables', 'comenzar', 'fin'];
  var RINFO_CTRL = ['si', 'sino', 'repetir', 'mientras'];
  var RINFO_TYPE = ['numero', 'boolean', 'E', 'ES'];
  var RINFO_BUILTIN = ['mover', 'derecha', 'tomarFlor', 'tomarPapel', 'depositarFlor', 'depositarPapel',
    'Pos', 'Informar', 'AsignarArea', 'Iniciar', 'AreaC',
    'PosAv', 'PosCa', 'HayFlorEnLaEsquina', 'HayPapelEnLaEsquina', 'HayFlorEnLaBolsa', 'HayPapelEnLaBolsa'];

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var TOKEN_RE = new RegExp(
    '(\\{[^}]*\\})' +                                   // 1 comment
    '|(\\b(?:' + RINFO_STRUCT.join('|') + ')\\b)' +      // 2 structure keyword
    '|(\\b(?:' + RINFO_CTRL.join('|') + ')\\b)' +        // 3 control flow
    '|(\\b(?:' + RINFO_TYPE.join('|') + ')\\b)' +        // 4 type / parameter class
    '|(\\b(?:' + RINFO_BUILTIN.join('|') + ')\\b)' +     // 5 builtin/primitive
    '|(\\b[VF]\\b)' +                                    // 6 boolean literal
    '|(\\b\\d+\\b)' +                                    // 7 number
    '|(:=|&lt;=|&gt;=|&lt;&gt;|&lt;|&gt;|&amp;|[+\\-*/|~=(),:;])', // 8 operator (matched post-escape)
    'g'
  );

  function highlightRInfo(code) {
    var escaped = escapeHtml(code);
    return escaped.replace(TOKEN_RE, function (m, com, kw, ctrl, type, prim, bool, num, op) {
      if (com) return '<span class="tok-com">' + com + '</span>';
      if (kw) return '<span class="tok-kw">' + kw + '</span>';
      if (ctrl) return '<span class="tok-ctrl">' + ctrl + '</span>';
      if (type) return '<span class="tok-type">' + type + '</span>';
      if (prim) return '<span class="tok-prim">' + prim + '</span>';
      if (bool) return '<span class="tok-bool">' + bool + '</span>';
      if (num) return '<span class="tok-num">' + num + '</span>';
      if (op) return '<span class="tok-op">' + op + '</span>';
      return m;
    });
  }

  function syncHighlight() {
    var code = $('#editor').value;
    $('#highlightLayer code').innerHTML = highlightRInfo(code) + '\n';
  }

  function logConsole(msg, cls) {
    var c = $('#consoleOut');
    var line = el('div', { class: cls || '' }, [msg]);
    c.appendChild(line);
    c.scrollTop = c.scrollHeight;
  }
  function clearConsole() { $('#consoleOut').innerHTML = ''; }

  // ---- canvas rendering ----
  var canvas = null, cctx = null;
  function initCanvas() {
    canvas = $('#cityCanvas');
    var dpr = window.devicePixelRatio || 1;
    // El 3D usa un lienzo mas ancho que alto (el rombo isometrico no llena un
    // cuadrado); el 2D sigue siendo cuadrado. La clase is-3d cambia el
    // aspect-ratio por CSS antes de medir.
    canvas.classList.toggle('is-3d', sim.viewMode === '3d');
    var cssW = canvas.clientWidth || 600;
    var cssH = canvas.clientHeight || cssW;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    cctx = canvas.getContext('2d');
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.__cssSize = cssW; // usado por la vista 2D, siempre cuadrada
    canvas.__cssW = cssW; canvas.__cssH = cssH;
  }

  function cellToScreen(av, ca) {
    var cellPx = canvas.__cssSize / sim.size;
    var x = (av - sim.origin.av) * cellPx;
    var y = (sim.origin.ca + sim.size - 1 - ca) * cellPx;
    return { x: x, y: y, s: cellPx };
  }
  function screenToCell(x, y) {
    var cellPx = canvas.__cssSize / sim.size;
    var av = Math.floor(x / cellPx) + sim.origin.av;
    var ca = sim.origin.ca + sim.size - 1 - Math.floor(y / cellPx);
    return { av: av, ca: ca };
  }

  // Robotito estilo droide: cuerpo redondeado + "ojo" de color de marca
  // corrido hacia el frente para marcar la orientacion (reemplaza la flechita).
  function drawRobotIcon(ctx, rr, cBody, cEye) {
    ctx.fillStyle = cBody;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-rr, -rr, rr * 2, rr * 2, rr * 0.42);
    else ctx.rect(-rr, -rr, rr * 2, rr * 2);
    ctx.fill();
    // antena atras (opuesta a la mirada), le da mas caracter de robot visto desde arriba
    ctx.strokeStyle = shade(cBody, -.3); ctx.lineWidth = Math.max(1, rr * 0.14); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-rr * 0.55, 0); ctx.lineTo(-rr * 1.05, 0); ctx.stroke();
    ctx.fillStyle = cEye;
    ctx.beginPath(); ctx.arc(-rr * 1.12, 0, rr * 0.15, 0, Math.PI * 2); ctx.fill();
    // visor/ojo adelante, en la direccion de la mirada
    ctx.beginPath();
    ctx.arc(rr * 0.42, 0, rr * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flor y papel vistos derecho desde arriba (2D), con la misma forma que la
  // version isometrica en vez de una bolita/cuadrado liso.
  function drawFlor2D(ctx, cx, cy, r, cFlor, cStem) {
    ctx.strokeStyle = cStem; ctx.lineWidth = Math.max(1, r * 0.16); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy + r * 0.85); ctx.lineTo(cx, cy + r * 0.1); ctx.stroke();
    var petals = 5;
    for (var i = 0; i < petals; i++) {
      var ang = (i / petals) * Math.PI * 2 - Math.PI / 2;
      var px = cx + Math.cos(ang) * r * 0.5, py = cy + Math.sin(ang) * r * 0.5;
      ctx.fillStyle = shade(cFlor, i % 2 === 0 ? .1 : -.08);
      ctx.beginPath(); ctx.ellipse(px, py, r * 0.42, r * 0.3, ang, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = shade(cFlor, .55);
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2); ctx.fill();
  }
  function drawPapel2D(ctx, cx, cy, r, cPapel, cFold) {
    var w = r * 1.5, h = r * 1.7;
    ctx.fillStyle = cPapel;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = cFold;
    ctx.beginPath();
    ctx.moveTo(cx + w / 2, cy - h / 2); ctx.lineTo(cx + w / 2 - w * 0.4, cy - h / 2); ctx.lineTo(cx + w / 2, cy - h / 2 + w * 0.4);
    ctx.closePath(); ctx.fill();
  }

  // ---- color shading (para las caras del bloque isometrico) ----
  // Resuelve cualquier color CSS valido (hex, hsl(), etc.) a RGB pintando un
  // pixel y leyendolo, asi no hace falta parsear cada formato a mano.
  var __shadeCanvas = null, __shadeCtx = null;
  function resolveColorRGB(colorStr) {
    if (!__shadeCanvas) { __shadeCanvas = document.createElement('canvas'); __shadeCanvas.width = __shadeCanvas.height = 1; __shadeCtx = __shadeCanvas.getContext('2d'); }
    __shadeCtx.clearRect(0, 0, 1, 1);
    __shadeCtx.fillStyle = colorStr;
    __shadeCtx.fillRect(0, 0, 1, 1);
    var d = __shadeCtx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  function shade(colorStr, amount) {
    var rgb = resolveColorRGB(colorStr);
    var target = amount < 0 ? 0 : 255;
    var k = Math.min(1, Math.abs(amount));
    var r = Math.round(rgb[0] + (target - rgb[0]) * k);
    var g = Math.round(rgb[1] + (target - rgb[1]) * k);
    var b = Math.round(rgb[2] + (target - rgb[2]) * k);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ---- proyeccion isometrica ----
  // Reusa el mismo sim.origin/sim.size que la vista 2D: son "que esquinas
  // estan a la vista", nada mas cambia como se proyectan a pantalla.
  // Layout isometrico generico: no asume canvas ni bounds cuadrados, asi lo
  // puede reusar tanto el simulador principal como la animacion del hero.
  function isoLayout(cssW, cssH, bounds) {
    var avCount = bounds.avMax - bounds.avMin + 1;
    var caCount = bounds.caMax - bounds.caMin + 1;
    var effN = avCount + caCount;
    var padX = 6, padY = 6, bottomMargin = 12; // aire abajo para la sombra difusa, para que no quede recortada por el borde del canvas
    var k = 0.74; // alto de baldosa relativo al ancho; mas alto = vista menos inclinada/mas "cuadrada"
    // "clearance" reserva aire arriba del piso para el objeto mas alto (el robot
    // humanoide de pie, cabeza + antena incluida: ~1*tw sobre su propio punto de apoyo).
    var estBlockH = 9;
    var twByWidth = 2 * (cssW - padX * 2) / effN;
    var twByHeight = (cssH - padY * 2 - estBlockH - bottomMargin) / (effN * k / 2 + 1);
    var tw = Math.max(2, Math.min(twByWidth, twByHeight));
    var th = tw * k;
    var blockH = Math.min(th * 0.55, 9);
    var clearance = tw * 1;
    var totalH = effN * (th / 2) + blockH + clearance;
    var availableH = cssH - padY * 2 - bottomMargin;
    // si el area no es cuadrada (avCount != caCount) el diamante no es simetrico
    // en X respecto al origen; recentramos para que quede en medio del canvas.
    var originX = cssW / 2 - ((avCount - caCount) / 2) * (tw / 2);
    var originY = padY + clearance + Math.max(0, (availableH - totalH) / 2);
    return { tw: tw, th: th, blockH: blockH, originX: originX, originY: originY, detailed: tw >= 8, bounds: bounds, effN: effN };
  }
  // (rav,rca) en unidades de esquina relativas a bounds.avMin/caMin (no celda).
  // Se invierte el eje Y (effN - rav - rca) para que la esquina de origen quede
  // ABAJO/cerca del punto de vista, igual que en la vista 2D (Ca 1 abajo), en vez
  // de arriba/lejos.
  function isoPoint(iso, rav, rca) {
    return { x: iso.originX + (rav - rca) * (iso.tw / 2), y: iso.originY + (iso.effN - rav - rca) * (iso.th / 2) };
  }
  // Banda de ancho fijo en pantalla entre dos puntos (para las calles); calcula
  // el vector perpendicular a la linea y arma un cuadrilatero angosto.
  function isoBand(ctx, p1, p2, halfW, color) {
    var dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var px = -dy / len * halfW, py = dx / len * halfW;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x + px, p1.y + py); ctx.lineTo(p2.x + px, p2.y + py);
    ctx.lineTo(p2.x - px, p2.y - py); ctx.lineTo(p1.x - px, p1.y - py);
    ctx.closePath(); ctx.fill();
  }
  // Piso isometrico compartido: una superficie plana (sin baldosas con paredes
  // individuales, que se veian recargadas) con calles derechas y linea central
  // punteada; usado tanto por el simulador principal como por la demo del hero.
  function drawIsoGround(ctx, iso, avCount, caCount, cGround, cLine, cStreet, cStreetLine) {
    var gTop = isoPoint(iso, 0, 0), gRight = isoPoint(iso, avCount, 0);
    var gBottom = isoPoint(iso, avCount, caCount), gLeft = isoPoint(iso, 0, caCount);
    ctx.fillStyle = cGround;
    ctx.beginPath();
    ctx.moveTo(gTop.x, gTop.y); ctx.lineTo(gRight.x, gRight.y);
    ctx.lineTo(gBottom.x, gBottom.y); ctx.lineTo(gLeft.x, gLeft.y);
    ctx.closePath(); ctx.fill();
    if (!iso.detailed) { ctx.strokeStyle = cLine; ctx.lineWidth = 1; ctx.stroke(); return; }
    var streetHalfW = Math.max(1.4, iso.tw * 0.09);
    for (var lv = 0; lv <= avCount; lv++) { isoBand(ctx, isoPoint(iso, lv, 0), isoPoint(iso, lv, caCount), streetHalfW, cStreet); }
    for (var lh = 0; lh <= caCount; lh++) { isoBand(ctx, isoPoint(iso, 0, lh), isoPoint(iso, avCount, lh), streetHalfW, cStreet); }
    ctx.strokeStyle = cStreetLine; ctx.lineWidth = Math.max(1, streetHalfW * 0.35);
    ctx.setLineDash([Math.max(2, iso.tw * 0.1), Math.max(2, iso.tw * 0.1)]);
    ctx.beginPath();
    for (var lv2 = 0; lv2 <= avCount; lv2++) { var la = isoPoint(iso, lv2, 0), lb = isoPoint(iso, lv2, caCount); ctx.moveTo(la.x, la.y); ctx.lineTo(lb.x, lb.y); }
    for (var lh2 = 0; lh2 <= caCount; lh2++) { var lc = isoPoint(iso, 0, lh2), ld = isoPoint(iso, avCount, lh2); ctx.moveTo(lc.x, lc.y); ctx.lineTo(ld.x, ld.y); }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Encuadre 3D del simulador: arranca en la ventana visible (sim.origin/size)
  // y se expande para cubrir todo el rastro recorrido, asi nunca queda cortado
  // aunque el robot se haya salido de la ventana original.
  function isoBounds() {
    var avMin = sim.origin.av, avMax = sim.origin.av + sim.size - 1;
    var caMin = sim.origin.ca, caMax = sim.origin.ca + sim.size - 1;
    if (sim.trail) {
      sim.trail.forEach(function (seg) {
        seg.forEach(function (p) {
          if (p.av < avMin) avMin = p.av; if (p.av > avMax) avMax = p.av;
          if (p.ca < caMin) caMin = p.ca; if (p.ca > caMax) caMax = p.ca;
        });
      });
    }
    avMin = Math.max(1, Math.floor(avMin)); caMin = Math.max(1, Math.floor(caMin));
    avMax = Math.min(100, Math.ceil(avMax)); caMax = Math.min(100, Math.ceil(caMax));
    return { avMin: avMin, avMax: avMax, caMin: caMin, caMax: caMax };
  }
  function screenToCellIso(x, y) {
    var bounds = isoBounds();
    var iso = isoLayout(canvas.__cssW, canvas.__cssH, bounds);
    var relX = x - iso.originX, relY = y - iso.originY;
    var a = relX / (iso.tw / 2);
    var sum = iso.effN - relY / (iso.th / 2); // rav + rca, invertido igual que en isoPoint
    var rav = Math.floor((sum + a) / 2), rca = Math.floor((sum - a) / 2);
    return { av: bounds.avMin + rav, ca: bounds.caMin + rca };
  }

  function drawCity(cityMap, robot) {
    if (sim.viewMode === '3d') drawCity3D(cityMap, robot);
    else drawCity2D(cityMap, robot);
  }

  function drawCity3D(cityMap, robot) {
    if (!cctx) return;
    var cssW = canvas.__cssW, cssH = canvas.__cssH;
    cctx.globalAlpha = 1; cctx.lineWidth = 1;
    cctx.clearRect(0, 0, cssW, cssH);

    var styles = getComputedStyle(document.documentElement);
    var cBgSunken = styles.getPropertyValue('--bg-sunken').trim() || '#e4ece6';
    var cGround = styles.getPropertyValue('--line-strong').trim() || '#a9bdb2';
    var cLine = styles.getPropertyValue('--line').trim() || '#8a97a8';
    var cFlor = styles.getPropertyValue('--accent-flor').trim() || '#c97418';
    var cPapel = styles.getPropertyValue('--accent-papel').trim() || '#4c6478';
    var cRobot = styles.getPropertyValue('--accent-robot').trim() || '#16324a';
    var cTrail = styles.getPropertyValue('--danger').trim() || '#b23a26';
    var cBrand = styles.getPropertyValue('--brand').trim() || '#c24d36';
    var cStem = styles.getPropertyValue('--success').trim() || '#2f7a4f';

    var bounds = isoBounds();
    var iso = isoLayout(cssW, cssH, bounds);
    var avCount = bounds.avMax - bounds.avMin + 1, caCount = bounds.caMax - bounds.caMin + 1;

    // fondo
    cctx.fillStyle = cBgSunken;
    cctx.fillRect(0, 0, cssW, cssH);

    // sombra suave debajo de toda la plataforma, para asentarla visualmente
    var footBack = isoPoint(iso, 0, 0), footRight = isoPoint(iso, avCount, 0);
    var footFront = isoPoint(iso, avCount, caCount), footLeft = isoPoint(iso, 0, caCount);
    cctx.save();
    cctx.filter = 'blur(' + Math.max(3, iso.tw * 0.28) + 'px)';
    cctx.fillStyle = 'rgba(0,0,0,.28)';
    cctx.beginPath();
    cctx.moveTo(footBack.x, footBack.y + 4); cctx.lineTo(footRight.x, footRight.y + 4);
    cctx.lineTo(footFront.x, footFront.y + 6); cctx.lineTo(footLeft.x, footLeft.y + 4);
    cctx.closePath(); cctx.fill();
    cctx.restore();

    var sideEastPapel = shade(cPapel, -0.28);
    var cStreet3D = '#33383f';
    var cLine3D = 'rgba(255,214,102,.55)';

    // piso: una unica superficie plana (sin baldosas con paredes individuales,
    // que se veian recargadas/tipo gofre), con calles derechas de asfalto y
    // linea central punteada cruzando por encima, igual de criterio que la 2D.
    drawIsoGround(cctx, iso, avCount, caCount, cGround, cLine, cStreet3D, cLine3D);

    // rastro: linea elevada sobre el piso, un tramo por corrida continua de mover().
    if (sim.trail && sim.trail.length > 0) {
      cctx.save();
      cctx.strokeStyle = cTrail;
      cctx.lineWidth = Math.max(1.5, iso.tw * 0.12);
      cctx.lineJoin = 'round'; cctx.lineCap = 'round';
      sim.trail.forEach(function (seg) {
        if (seg.length < 2) return;
        cctx.beginPath();
        for (var ti = 0; ti < seg.length; ti++) {
          var pt = isoPoint(iso, seg[ti].av - bounds.avMin + .5, seg[ti].ca - bounds.caMin + .5);
          var py = pt.y - iso.blockH - 1;
          if (ti === 0) cctx.moveTo(pt.x, py); else cctx.lineTo(pt.x, py);
        }
        cctx.stroke();
      });
      cctx.restore();
    }

    // objetos: flores, papeles y el robot, ordenados de atras hacia adelante
    // (por profundidad) para que se tapen entre si correctamente.
    var drawables = [];
    cityMap.forEach(function (v, k) {
      var parts = k.split(','); var av = parseInt(parts[0], 10), ca = parseInt(parts[1], 10);
      if (av < bounds.avMin || av > bounds.avMax) return;
      if (ca < bounds.caMin || ca > bounds.caMax) return;
      if (!v.flor && !v.papel) return;
      var rav = av - bounds.avMin, rca = ca - bounds.caMin;
      drawables.push({
        depth: rav + rca, draw: function () {
          var base = isoPoint(iso, rav + .5, rca + .5);
          var by = base.y - iso.blockH;
          var offset = (v.flor && v.papel) ? iso.tw * 0.18 : 0;
          if (v.flor) drawFlorIso(cctx, base.x - offset, by, iso.tw, cFlor, cStem);
          if (v.papel) drawPapelIso(cctx, base.x + offset, by, iso.tw, iso.th, cPapel, sideEastPapel);
        }
      });
    });
    if (robot && robot.av >= bounds.avMin && robot.av <= bounds.avMax && robot.ca >= bounds.caMin && robot.ca <= bounds.caMax) {
      var rrav = robot.av - bounds.avMin, rrca = robot.ca - bounds.caMin;
      drawables.push({
        depth: rrav + rrca + 0.5, draw: function () {
          var base = isoPoint(iso, rrav + .5, rrca + .5);
          drawRobotIso(cctx, base.x, base.y - iso.blockH, iso.tw, robot.dir, cRobot, cBrand, robot.moving ? robot.stepT : 0);
        }
      });
    }
    drawables.sort(function (a, b) { return a.depth - b.depth; });
    drawables.forEach(function (d) { d.draw(); });
  }

  // Flor: tallo + 5 petalos alrededor de un centro, en vez de una esfera lisa.
  function drawFlorIso(ctx, cx, cy, tw, cFlor, cStem) {
    var r = tw * 0.16;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 1, r * 0.95, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();

    var headY = cy - r * 1.5;
    ctx.strokeStyle = cStem || shade(cFlor, -.3);
    ctx.lineWidth = Math.max(1, r * 0.26); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, headY + r * 0.3); ctx.stroke();

    var petals = 5;
    for (var i = 0; i < petals; i++) {
      var ang = (i / petals) * Math.PI * 2 - Math.PI / 2;
      var px = cx + Math.cos(ang) * r * 0.62, py = headY + Math.sin(ang) * r * 0.62 * 0.72;
      ctx.fillStyle = shade(cFlor, (i % 2 === 0) ? .1 : -.08);
      ctx.beginPath(); ctx.ellipse(px, py, r * 0.5, r * 0.34, ang, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = shade(cFlor, .55);
    ctx.beginPath(); ctx.arc(cx, headY, r * 0.38, 0, Math.PI * 2); ctx.fill();
  }

  // Papel: hoja chata apoyada en el piso (no una caja), con la puntita doblada.
  function drawPapelIso(ctx, cx, cy, tw, th, cPapel, cFold) {
    var hw = tw * 0.19, hh = th * 0.34, lift = 2;
    var p1 = { x: cx, y: cy - hh - lift }, p2 = { x: cx + hw, y: cy - lift };
    var p3 = { x: cx, y: cy + hh - lift }, p4 = { x: cx - hw, y: cy - lift };
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 2, hw * 1.15, hh * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cPapel;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath(); ctx.fill();
    // un segundo pliego corrido, sugiriendo una pila
    ctx.save(); ctx.globalAlpha = .85;
    ctx.beginPath();
    ctx.moveTo(p1.x - 1, p1.y - 1); ctx.lineTo(p2.x - 1, p2.y - 1);
    ctx.lineTo(p3.x - 1, p3.y - 3); ctx.lineTo(p4.x - 1, p4.y - 3); ctx.closePath(); ctx.fill();
    ctx.restore();
    // esquina doblada
    ctx.fillStyle = cFold;
    ctx.beginPath(); ctx.moveTo(p2.x, p2.y); ctx.lineTo(p2.x - hw * 0.42, p2.y - hh * 0.32); ctx.lineTo(p2.x - hw * 0.1, p2.y + hh * 0.05); ctx.closePath(); ctx.fill();
  }

  // Robot humanoide de pie: piernas + torso + brazos + cabeza con antena,
  // parado sobre su sombra en vez de fundido con ella (era un "puck" achatado antes).
  // walkT (0..1, opcional): progreso del paso actual: si se esta moviendo, anima
  // un ciclo de caminata (piernas alternadas + rebote de cabeza); en reposo queda
  // parado quieto (walkT=0/ausente).
  function drawRobotIso(ctx, cx, cy, tw, dir, cBody, cEye, walkT) {
    var s = tw * 0.27;
    var legH = s, torsoH = s * 1.05, headR = s * 0.46, neckGap = s * 0.1;
    var footY = cy, hipY = cy - legH, shoulderY = hipY - torsoH;
    var legGap = s * 0.24, legW = s * 0.22;
    var torsoHalfW = s * 0.48, armW = s * 0.2, armGap = torsoHalfW + armW * 0.5 + s * 0.06;
    var phase = (walkT || 0) * Math.PI * 2;
    var swing = Math.sin(phase);
    var lift = s * 0.42, headBob = s * 0.1 * Math.abs(swing), armSwing = s * 0.18 * swing;
    var shoulderYw = shoulderY - headBob;
    var headCy = shoulderYw - neckGap - headR;
    var legLenL = legH - lift * Math.max(0, swing);
    var legLenR = legH - lift * Math.max(0, -swing);
    function rrPath(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,.24)';
    ctx.beginPath(); ctx.ellipse(cx, footY + 2, s * 0.75, s * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    // piernas: cada una se acorta (levanta el pie) cuando le toca el paso de vuelo
    ctx.fillStyle = shade(cBody, -0.22);
    rrPath(cx - legGap - legW / 2, hipY, legW, legLenL, legW * 0.3); ctx.fill();
    rrPath(cx + legGap - legW / 2, hipY, legW, legLenR, legW * 0.3); ctx.fill();
    // brazos, se hamacan en contrafase con las piernas
    ctx.fillStyle = shade(cBody, -0.12);
    rrPath(cx - armGap - armW / 2, shoulderYw + armSwing, armW, torsoH * 0.92, armW * 0.35); ctx.fill();
    rrPath(cx + armGap - armW / 2, shoulderYw - armSwing, armW, torsoH * 0.92, armW * 0.35); ctx.fill();
    // torso, con una franja mas clara al medio para sugerir volumen
    ctx.fillStyle = cBody;
    rrPath(cx - torsoHalfW, shoulderYw, torsoHalfW * 2, torsoH, torsoHalfW * 0.35); ctx.fill();
    ctx.fillStyle = shade(cBody, .12);
    rrPath(cx - torsoHalfW * 0.55, shoulderYw, torsoHalfW * 0.35, torsoH, torsoHalfW * 0.2); ctx.fill();
    // cabeza
    ctx.fillStyle = shade(cBody, .08);
    ctx.beginPath(); ctx.arc(cx, headCy, headR, 0, Math.PI * 2); ctx.fill();
    // visor orientado hacia la direccion del robot
    var ang = { N: -Math.PI / 2, E: 0, S: Math.PI / 2, O: Math.PI }[dir];
    ctx.save(); ctx.translate(cx, headCy); ctx.rotate(ang);
    ctx.fillStyle = cEye;
    rrPath(headR * 0.15, -headR * 0.32, headR * 0.62, headR * 0.64, headR * 0.16); ctx.fill();
    ctx.restore();
    // antena
    ctx.strokeStyle = shade(cBody, -.35); ctx.lineWidth = Math.max(1, s * 0.1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, headCy - headR * 0.85); ctx.lineTo(cx, headCy - headR * 1.55); ctx.stroke();
    ctx.fillStyle = cEye;
    ctx.beginPath(); ctx.arc(cx, headCy - headR * 1.62, s * 0.13, 0, Math.PI * 2); ctx.fill();
  }

  function drawCity2D(cityMap, robot) {
    if (!cctx) return;
    var css = canvas.__cssSize;
    var s = css / sim.size;

    // Defensive reset: a branch skipped in a previous frame (e.g. axis labels
    // hidden at low zoom) can leave globalAlpha/fillStyle/lineWidth dirty for
    // the next frame, which looks like ghosting/trailing on fast redraws.
    cctx.globalAlpha = 1;
    cctx.fillStyle = '#000';
    cctx.strokeStyle = '#000';
    cctx.lineWidth = 1;

    var styles = getComputedStyle(document.documentElement);
    var cLine = styles.getPropertyValue('--line').trim() || '#8a97a8';
    var cFlor = styles.getPropertyValue('--accent-flor').trim() || '#c97418';
    var cPapel = styles.getPropertyValue('--accent-papel').trim() || '#4c6478';
    var cRobot = styles.getPropertyValue('--accent-robot').trim() || '#16324a';
    var cInk = styles.getPropertyValue('--ink').trim() || '#16324a';
    var cTrail = styles.getPropertyValue('--danger').trim() || '#b23a26';
    var cBrand = styles.getPropertyValue('--brand').trim() || '#c24d36';
    var cBlock = styles.getPropertyValue('--line-strong').trim() || '#a9bdb2';
    var cStem = styles.getPropertyValue('--success').trim() || '#2f7a4f';

    cctx.clearRect(0, 0, css, css);

    var detailed = s >= 14;

    // ciudad: manzanas (veredas) + calles de asfalto con linea central punteada,
    // en vez de una simple grilla de lineas. A poco zoom se simplifica a lineas
    // finas para que no se sature ni pese el redibujado.
    if (detailed) {
      cctx.fillStyle = cBlock;
      cctx.fillRect(0, 0, css, css);
      var streetW = Math.max(3, s * 0.16);
      var cStreet = '#33383f';
      cctx.fillStyle = cStreet;
      for (var gi = 0; gi <= sim.size; gi++) {
        var gx = gi * s;
        cctx.fillRect(gx - streetW / 2, 0, streetW, css);
        cctx.fillRect(0, gx - streetW / 2, css, streetW);
      }
      cctx.strokeStyle = 'rgba(255,214,102,.65)';
      cctx.lineWidth = Math.max(1, streetW * 0.16);
      cctx.setLineDash([Math.max(3, s * 0.14), Math.max(3, s * 0.14)]);
      cctx.beginPath();
      for (var gi2 = 0; gi2 <= sim.size; gi2++) {
        var gx2 = gi2 * s;
        cctx.moveTo(gx2, 0); cctx.lineTo(gx2, css);
        cctx.moveTo(0, gx2); cctx.lineTo(css, gx2);
      }
      cctx.stroke();
      cctx.setLineDash([]);
    } else {
      cctx.strokeStyle = cLine; cctx.lineWidth = 1;
      cctx.beginPath();
      for (var i = 0; i <= sim.size; i++) {
        cctx.moveTo(i * s + .5, 0); cctx.lineTo(i * s + .5, css);
        cctx.moveTo(0, i * s + .5); cctx.lineTo(css, i * s + .5);
      }
      cctx.stroke();
    }

    // rastro: un tramo por cada corrida continua de mover() (linea solida, sin
    // huecos de grilla); un Pos() arranca un tramo nuevo sin conectar el salto.
    if (sim.trail && sim.trail.length > 0) {
      cctx.save();
      cctx.strokeStyle = cTrail;
      cctx.lineWidth = Math.max(2, s * 0.16);
      cctx.lineJoin = 'round';
      cctx.lineCap = 'round';
      sim.trail.forEach(function (seg) {
        if (seg.length < 2) return;
        cctx.beginPath();
        var tp0 = cellToScreen(seg[0].av, seg[0].ca);
        cctx.moveTo(tp0.x + s / 2, tp0.y + s / 2);
        for (var ti = 1; ti < seg.length; ti++) {
          var tp = cellToScreen(seg[ti].av, seg[ti].ca);
          cctx.lineTo(tp.x + s / 2, tp.y + s / 2);
        }
        cctx.stroke();
      });
      cctx.restore();
    }

    // contents
    function countBadge(bx, by) {
      cctx.fillStyle = cBrand;
      cctx.beginPath(); cctx.arc(bx, by, Math.max(6, s * 0.13), 0, Math.PI * 2); cctx.fill();
      cctx.fillStyle = '#fff'; cctx.font = 'bold ' + Math.max(8, s * 0.16) + 'px var(--font-mono)';
      cctx.textAlign = 'center'; cctx.textBaseline = 'middle';
    }
    cityMap.forEach(function (v, k) {
      var parts = k.split(','); var av = parseInt(parts[0], 10), ca = parseInt(parts[1], 10);
      if (av < sim.origin.av || av > sim.origin.av + sim.size - 1) return;
      if (ca < sim.origin.ca || ca > sim.origin.ca + sim.size - 1) return;
      var pos = cellToScreen(av, ca);
      var cx = pos.x + s / 2, cy = pos.y + s / 2;
      if (detailed) {
        if (v.flor > 0) {
          var fox = v.papel > 0 ? -s * 0.17 : 0;
          drawFlor2D(cctx, cx + fox, cy, s * 0.27, cFlor, cStem);
          if (v.flor > 1) { countBadge(cx + fox + s * 0.2, cy - s * 0.22); cctx.fillText(v.flor, cx + fox + s * 0.2, cy - s * 0.22 + 1); }
        }
        if (v.papel > 0) {
          var pox = v.flor > 0 ? s * 0.19 : 0;
          drawPapel2D(cctx, cx + pox, cy, s * 0.17, cPapel, shade(cPapel, -.28));
          if (v.papel > 1) { countBadge(cx + pox + s * 0.17, cy - s * 0.26); cctx.fillText(v.papel, cx + pox + s * 0.17, cy - s * 0.26 + 1); }
        }
      } else {
        if (v.flor > 0 && v.papel > 0) { cctx.fillStyle = cFlor; cctx.fillRect(pos.x, pos.y, s / 2, s); cctx.fillStyle = cPapel; cctx.fillRect(pos.x + s / 2, pos.y, s / 2, s); }
        else if (v.flor > 0) { cctx.fillStyle = cFlor; cctx.fillRect(pos.x + 1, pos.y + 1, s - 2, s - 2); }
        else if (v.papel > 0) { cctx.fillStyle = cPapel; cctx.fillRect(pos.x + 1, pos.y + 1, s - 2, s - 2); }
      }
    });

    // robot
    if (robot && robot.av >= sim.origin.av && robot.av <= sim.origin.av + sim.size - 1 && robot.ca >= sim.origin.ca && robot.ca <= sim.origin.ca + sim.size - 1) {
      var rp = cellToScreen(robot.av, robot.ca);
      var rcx = rp.x + s / 2, rcy = rp.y + s / 2, rr = s * 0.34;
      var ang = { N: -Math.PI / 2, E: 0, S: Math.PI / 2, O: Math.PI }[robot.dir];
      cctx.save();
      cctx.translate(rcx, rcy); cctx.rotate(ang);
      drawRobotIcon(cctx, rr, cRobot, cBrand);
      cctx.restore();
    }

    // axis labels
    if (s >= 10) {
      cctx.fillStyle = cInk; cctx.globalAlpha = .55;
      cctx.font = Math.min(11, s * 0.4) + 'px var(--font-mono)';
      var step = sim.size <= 25 ? 1 : (sim.size <= 50 ? 5 : 10);
      // El origen puede ser fraccionario (seguimiento suave del robot); las
      // etiquetas siempre tienen que caer en lineas de grilla enteras.
      var avStart = Math.ceil(sim.origin.av), avEnd = Math.floor(sim.origin.av + sim.size - 1);
      var caStart = Math.ceil(sim.origin.ca), caEnd = Math.floor(sim.origin.ca + sim.size - 1);
      cctx.textAlign = 'center'; cctx.textBaseline = 'bottom';
      for (var av2 = avStart; av2 <= avEnd; av2++) {
        if (av2 % step !== 0) continue;
        var px = cellToScreen(av2, sim.origin.ca).x + s / 2;
        cctx.fillText(av2, px, css - 2);
      }
      cctx.textAlign = 'left'; cctx.textBaseline = 'middle';
      for (var ca2 = caStart; ca2 <= caEnd; ca2++) {
        if (ca2 % step !== 0) continue;
        var py = cellToScreen(sim.origin.av, ca2).y + s / 2;
        cctx.fillText(ca2, 2, py);
      }
      cctx.globalAlpha = 1;
    }
  }

  function refreshReadout(robot) {
    $('#posReadout').textContent = robot ? ('Av ' + robot.av + ', Ca ' + robot.ca + ' · ' + robot.dir) : '—';
  }

  function renderPosition() {
    var a = sim.anim;
    var t = a.duration > 0 ? Math.min(1, (performance.now() - a.startedAt) / a.duration) : 1;
    return {
      av: a.fromAv + (a.toAv - a.fromAv) * t,
      ca: a.fromCa + (a.toCa - a.fromCa) * t,
      dir: sim.liveRobot.dir,
      moving: a.fromAv !== a.toAv || a.fromCa !== a.toCa,
      stepT: t
    };
  }

  function redraw() {
    var robot = sim.running ? renderPosition() : { av: sim.liveRobot.av, ca: sim.liveRobot.ca, dir: sim.liveRobot.dir, moving: false, stepT: 0 };
    if (sim.followRobot) centerOn(robot.av, robot.ca);
    drawCity(sim.running ? sim.liveCity : sim.city, robot);
    refreshReadout(sim.liveRobot);
  }

  // ---- city editing ----
  function handleCanvasClick(e, mode) {
    if (sim.running) return;
    var rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left), y = (e.clientY - rect.top);
    var c = sim.viewMode === '3d' ? screenToCellIso(x, y) : screenToCell(x, y);
    if (c.av < 1 || c.av > 100 || c.ca < 1 || c.ca > 100) return;
    var cur = getCell(sim.city, c.av, c.ca);
    if (mode === 'clear') { setCell(sim.city, c.av, c.ca, { flor: 0, papel: 0 }); }
    else if (mode === 'papel') { setCell(sim.city, c.av, c.ca, { flor: cur.flor, papel: (cur.papel + 1) % 6 }); }
    else { setCell(sim.city, c.av, c.ca, { flor: (cur.flor + 1) % 6, papel: cur.papel }); }
    sim.liveCity = cloneCity(sim.city);
    redraw();
  }

  function randomizeView() {
    for (var av = sim.origin.av; av <= sim.origin.av + sim.size - 1; av++) {
      for (var ca = sim.origin.ca; ca <= sim.origin.ca + sim.size - 1; ca++) {
        if (Math.random() < 0.18) setCell(sim.city, av, ca, { flor: Math.random() < 0.7 ? 1 : 0, papel: Math.random() < 0.4 ? 1 : 0 });
      }
    }
    sim.liveCity = cloneCity(sim.city);
    redraw();
  }
  function clearCity() { sim.city = new Map(); sim.liveCity = new Map(); redraw(); }

  function panBy(dAv, dCa) {
    if (sim.followRobot) { sim.followRobot = false; $('#followToggleWrap').classList.remove('is-on'); $('#followToggle').checked = false; }
    var maxOrigin = 100 - sim.size + 1;
    sim.origin.av = Math.min(maxOrigin, Math.max(1, sim.origin.av + dAv));
    sim.origin.ca = Math.min(maxOrigin, Math.max(1, sim.origin.ca + dCa));
    redraw();
  }
  function centerOn(av, ca) {
    var maxOrigin = 100 - sim.size + 1;
    sim.origin.av = Math.min(maxOrigin, Math.max(1, av - sim.size / 2));
    sim.origin.ca = Math.min(maxOrigin, Math.max(1, ca - sim.size / 2));
  }
  function centerOnRobot() {
    centerOn(sim.liveRobot.av, sim.liveRobot.ca);
    redraw();
  }

  // ---- run / animate ----
  // Un paso logico = un evento de la traza. El robot desliza suavemente entre
  // celdas via requestAnimationFrame; la velocidad controla cuanto dura cada paso,
  // nunca cuantos eventos se amontonan en un mismo frame (eso era lo que hacia
  // que la animacion se viera "trabada"/instantanea antes).
  function stopAnimation() {
    if (sim.stepTimer) { clearTimeout(sim.stepTimer); sim.stepTimer = null; }
    if (sim.rafId) { cancelAnimationFrame(sim.rafId); sim.rafId = null; }
    sim.city = cloneCity(sim.liveCity);
    sim.running = false;
    $('#runBtn').disabled = false; $('#stopBtn').disabled = true; $('#skipBtn').disabled = true;
    redraw();
  }

  function applyTraceEvent(ev) {
    if (ev.type === 'mover' || ev.type === 'pos' || ev.type === 'iniciar') { sim.liveRobot.av = ev.av; sim.liveRobot.ca = ev.ca; if (ev.dir) sim.liveRobot.dir = ev.dir; pushTrail(ev.av, ev.ca, ev.type !== 'mover'); }
    else if (ev.type === 'derecha') { sim.liveRobot.dir = ev.dir; }
    else if (ev.type === 'tomarFlor') { var c1 = getCell(sim.liveCity, ev.av, ev.ca); setCell(sim.liveCity, ev.av, ev.ca, { flor: Math.max(0, c1.flor - 1), papel: c1.papel }); sim.liveRobot.bagFlor++; }
    else if (ev.type === 'tomarPapel') { var c2 = getCell(sim.liveCity, ev.av, ev.ca); setCell(sim.liveCity, ev.av, ev.ca, { flor: c2.flor, papel: Math.max(0, c2.papel - 1) }); sim.liveRobot.bagPapel++; }
    else if (ev.type === 'depositarFlor') { var c3 = getCell(sim.liveCity, ev.av, ev.ca); setCell(sim.liveCity, ev.av, ev.ca, { flor: c3.flor + 1, papel: c3.papel }); sim.liveRobot.bagFlor--; }
    else if (ev.type === 'depositarPapel') { var c4 = getCell(sim.liveCity, ev.av, ev.ca); setCell(sim.liveCity, ev.av, ev.ca, { flor: c4.flor, papel: c4.papel + 1 }); sim.liveRobot.bagPapel--; }
    else if (ev.type === 'informar') { logConsole('Informar → ' + ev.text, 'ok'); }
  }

  function stepDelayMs() {
    var speed = parseInt($('#speed').value, 10) || 90;
    return Math.max(15, Math.round(420 - speed * 2));
  }

  function renderLoop() {
    if (!sim.running) return;
    redraw();
    sim.rafId = requestAnimationFrame(renderLoop);
  }

  function playTrace(trace, onDone) {
    sim.traceIdx = 0;
    sim.anim.fromAv = sim.anim.toAv = sim.liveRobot.av;
    sim.anim.fromCa = sim.anim.toCa = sim.liveRobot.ca;
    sim.anim.startedAt = performance.now();

    function tick() {
      if (!sim.running) return;
      if (sim.traceIdx >= trace.length) { onDone(); return; }
      var delay = stepDelayMs();
      sim.anim.fromAv = sim.liveRobot.av; sim.anim.fromCa = sim.liveRobot.ca;
      applyTraceEvent(trace[sim.traceIdx]);
      sim.traceIdx++;
      sim.anim.toAv = sim.liveRobot.av; sim.anim.toCa = sim.liveRobot.ca;
      sim.anim.duration = delay;
      sim.anim.startedAt = performance.now();
      sim.stepTimer = setTimeout(tick, delay);
    }
    sim.rafId = requestAnimationFrame(renderLoop);
    tick();
  }

  function finishRun(result) {
    stopAnimation();
    if (result.error && result.error.phase === 'run') {
      logConsole('El programa se aborto' + (result.error.lineNo ? ' (linea ' + result.error.lineNo + ')' : '') + ': ' + result.error.message, 'err');
    } else {
      logConsole('Ejecucion terminada sin errores (' + result.steps + ' pasos interpretados).', 'ok');
    }
  }

  function runProgram() {
    stopAnimation();
    clearConsole();
    var code = $('#editor').value;
    var opts = {
      cityInit: (function () { var o = {}; sim.city.forEach(function (v, k) { o[k] = v; }); return o; })(),
      initialBagFlor: parseInt($('#bagFlor').value, 10) || 0,
      initialBagPapel: parseInt($('#bagPapel').value, 10) || 0
    };
    var result;
    try { result = RInfo.run(code, opts); }
    catch (e) { logConsole('Error inesperado del simulador: ' + e.message, 'err'); return; }

    if (result.error && result.error.phase === 'parse') {
      logConsole('Error de sintaxis' + (result.error.lineNo ? ' (linea ' + result.error.lineNo + ')' : '') + ': ' + result.error.message, 'err');
      return;
    }

    sim.liveRobot = { av: 1, ca: 1, dir: 'N', bagFlor: opts.initialBagFlor, bagPapel: opts.initialBagPapel };
    sim.liveCity = cloneCity(sim.city);
    sim.trail = [[{ av: 1, ca: 1 }]];
    sim.currentTrace = result.trace;
    sim.currentResult = result;
    sim.traceIdx = 0;
    sim.running = true;
    $('#runBtn').disabled = true; $('#stopBtn').disabled = false; $('#skipBtn').disabled = false;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || result.trace.length > 1500) {
      result.trace.forEach(applyTraceEvent);
      sim.traceIdx = result.trace.length;
      finishRun(result);
    } else {
      playTrace(result.trace, function () { finishRun(result); });
    }
  }

  function skipToEnd() {
    if (!sim.currentTrace) return;
    if (sim.stepTimer) { clearTimeout(sim.stepTimer); sim.stepTimer = null; }
    if (sim.rafId) { cancelAnimationFrame(sim.rafId); sim.rafId = null; }
    while (sim.traceIdx < sim.currentTrace.length) { applyTraceEvent(sim.currentTrace[sim.traceIdx]); sim.traceIdx++; }
    finishRun(sim.currentResult);
  }

  // ============ NAV ============
  function setActiveNav(id) {
    $all('.rail nav a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
  }
  function initNavObserver() {
    var sections = $all('main > section[id]');
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActiveNav(en.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { obs.observe(s); });
  }

  // ============ HERO DEMO ============
  // Un unico canvas 3D animando la patrulla en bucle.
  function heroDemo() {
    var c3d = $('#heroCanvas3D');
    if (!c3d) return;
    var dpr = window.devicePixelRatio || 1;
    function setupCanvas(c) {
      var cssW = c.clientWidth || 320;
      var cssH = c.clientHeight || cssW;
      c.width = cssW * dpr; c.height = cssH * dpr;
      var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx: ctx, cssSize: cssW, cssW: cssW, cssH: cssH };
    }
    var g3d = setupCanvas(c3d);
    var size = 10;
    var styles = getComputedStyle(document.documentElement);
    var cLine = styles.getPropertyValue('--line').trim();
    var cFlor = styles.getPropertyValue('--accent-flor').trim();
    var cPapel = styles.getPropertyValue('--accent-papel').trim();
    var cRobot = styles.getPropertyValue('--accent-robot').trim();
    var cBrand = styles.getPropertyValue('--brand').trim();
    var cGround = styles.getPropertyValue('--line-strong').trim();
    var cStem = styles.getPropertyValue('--success').trim();
    var cPapelFold = shade(cPapel, -0.28);
    var heroBounds = { avMin: 1, avMax: size, caMin: 1, caMax: size };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var flowers = [[2, 2], [4, 6], [7, 3], [8, 8]];
    var papers = [[3, 8], [6, 5], [9, 2]];
    var path = []; // sequence of {av,ca,dir}
    var av = 1, ca = 1, dir = 'N';
    function pushMove(nAv, nCa, nDir) { path.push({ av: nAv, ca: nCa, dir: nDir }); av = nAv; ca = nCa; dir = nDir; }
    // small scripted loop patrol
    for (var i = 0; i < 3; i++) { pushMove(av, ca + 1, 'N'); }
    pushMove(av, ca, 'E');
    for (i = 0; i < 5; i++) { pushMove(av + 1, ca, 'E'); }
    pushMove(av, ca, 'S');
    for (i = 0; i < 3; i++) { pushMove(av, ca - 1, 'S'); }
    pushMove(av, ca, 'O');
    for (i = 0; i < 5; i++) { pushMove(av - 1, ca, 'O'); }
    pushMove(av, ca, 'N');

    // Interpolacion suave entre waypoints (en vez de saltar de golpe cada tick)
    // para que la patrulla se vea fluida, igual que el robot del simulador real.
    var idx = 0, stepDuration = 480, stepStartedAt = performance.now();
    function currentPos() {
      var from = path[idx % path.length], to = path[(idx + 1) % path.length];
      var t = Math.min(1, (performance.now() - stepStartedAt) / stepDuration);
      return {
        av: from.av + (to.av - from.av) * t, ca: from.ca + (to.ca - from.ca) * t, dir: to.dir,
        moving: from.av !== to.av || from.ca !== to.ca, stepT: t
      };
    }
    var cStreet3D = '#33383f';
    var cLine3D = 'rgba(255,214,102,.55)';
    function frame3D(ctx, cssW, cssH, cur) {
      ctx.clearRect(0, 0, cssW, cssH);
      var iso = isoLayout(cssW, cssH, heroBounds);
      drawIsoGround(ctx, iso, size, size, cGround, cLine, cStreet3D, cLine3D);
      var drawables = flowers.map(function (f) {
        return {
          depth: (f[0] - 1) + (f[1] - 1), draw: function () {
            var base = isoPoint(iso, f[0] - .5, f[1] - .5);
            drawFlorIso(ctx, base.x, base.y - iso.blockH, iso.tw, cFlor, cStem);
          }
        };
      }).concat(papers.map(function (p) {
        return {
          depth: (p[0] - 1) + (p[1] - 1), draw: function () {
            var base = isoPoint(iso, p[0] - .5, p[1] - .5);
            drawPapelIso(ctx, base.x, base.y - iso.blockH, iso.tw, iso.th, cPapel, cPapelFold);
          }
        };
      }));
      drawables.push({
        depth: (cur.av - 1) + (cur.ca - 1) + 0.5, draw: function () {
          var base = isoPoint(iso, cur.av - .5, cur.ca - .5);
          drawRobotIso(ctx, base.x, base.y - iso.blockH, iso.tw, cur.dir, cRobot, cBrand, cur.moving ? cur.stepT : 0);
        }
      });
      drawables.sort(function (a, b) { return a.depth - b.depth; });
      drawables.forEach(function (d) { d.draw(); });
    }
    function frame() {
      if (performance.now() - stepStartedAt >= stepDuration) {
        idx++;
        stepStartedAt += stepDuration;
      }
      var cur = currentPos();
      frame3D(g3d.ctx, g3d.cssW, g3d.cssH, cur);
      if (!reduceMotion) requestAnimationFrame(frame);
    }
    frame();
  }

  // ============ EDITOR WIRING ============
  function wireEditor() {
    var ed = $('#editor');
    ed.addEventListener('input', syncGutter);
    ed.addEventListener('scroll', function () {
      $('#gutter').scrollTop = ed.scrollTop;
      var hl = $('#highlightLayer');
      hl.scrollTop = ed.scrollTop;
      hl.scrollLeft = ed.scrollLeft;
    });
    ed.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); var s = ed.selectionStart, en = ed.selectionEnd; ed.value = ed.value.slice(0, s) + '  ' + ed.value.slice(en); ed.selectionStart = ed.selectionEnd = s + 2; syncGutter(); }
    });
  }

  function wireControls() {
    $('#runBtn').addEventListener('click', runProgram);
    $('#stopBtn').addEventListener('click', function () { stopAnimation(); logConsole('Animacion detenida (el estado de la ciudad puede quedar a mitad de camino).', 'muted'); });
    $('#skipBtn').addEventListener('click', skipToEnd);
    $('#loadBlank').addEventListener('click', function () {
      $('#editor').value = 'programa MiPrograma\nareas\n  ciudad: AreaC(1,1,100,100)\nrobots\n  robot robot1\n    comenzar\n      Pos(1,1)\n      { tu codigo aca }\n    fin\nvariables\n  R-info: robot1\ncomenzar\n  AsignarArea(R-info,ciudad)\n  Iniciar(R-info,1,1)\nfin';
      syncGutter();
      sim.trail = [[{ av: sim.liveRobot.av, ca: sim.liveRobot.ca }]];
      redraw();
    });
    $('#copyCodeBtn').addEventListener('click', function () {
      var btn = $('#copyCodeBtn');
      var original = btn.textContent;
      function flash(ok) {
        btn.textContent = ok ? '✓ Copiado' : 'No se pudo copiar';
        setTimeout(function () { btn.textContent = original; }, 1500);
      }
      var text = $('#editor').value;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { flash(true); }, function () { flash(false); });
      } else {
        var ed = $('#editor');
        var start = ed.selectionStart, end = ed.selectionEnd;
        ed.focus(); ed.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ed.setSelectionRange(start, end);
        flash(ok);
      }
    });
    $('#downloadCodeBtn').addEventListener('click', function () {
      var id = $('#projectSelect').value;
      var filename = (id ? id + '-' : '') + 'programa-rinfo.txt';
      var blob = new Blob([$('#editor').value], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    $('#randomizeBtn').addEventListener('click', randomizeView);
    $('#clearCityBtn').addEventListener('click', clearCity);
    $('#viewSize').addEventListener('change', function (e) {
      sim.size = parseInt(e.target.value, 10);
      if (sim.followRobot && sim.size !== 10) { sim.followRobot = false; $('#followToggleWrap').classList.remove('is-on'); $('#followToggle').checked = false; }
      initCanvas(); redraw();
    });
    $('#followToggle').addEventListener('change', function (e) {
      sim.followRobot = e.target.checked;
      $('#followToggleWrap').classList.toggle('is-on', sim.followRobot);
      if (sim.followRobot) {
        sim.sizeBeforeFollow = sim.size;
        sim.size = 10;
      } else {
        sim.size = sim.sizeBeforeFollow || 25;
      }
      $('#viewSize').value = String(sim.size);
      initCanvas();
      redraw();
    });

    $all('#viewModeSeg .seg-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sim.viewMode = btn.getAttribute('data-mode');
        $all('#viewModeSeg .seg-btn').forEach(function (b) { b.classList.toggle('is-on', b === btn); });
        initCanvas();
        redraw();
      });
    });

    $('#cityCanvas').addEventListener('click', function (e) { handleCanvasClick(e, e.shiftKey ? 'papel' : 'flor'); });
    $('#cityCanvas').addEventListener('contextmenu', function (e) { e.preventDefault(); handleCanvasClick(e, 'clear'); });

    $('#padUp').addEventListener('click', function () { panBy(0, Math.ceil(sim.size / 2)); });
    $('#padDown').addEventListener('click', function () { panBy(0, -Math.ceil(sim.size / 2)); });
    $('#padLeft').addEventListener('click', function () { panBy(-Math.ceil(sim.size / 2), 0); });
    $('#padRight').addEventListener('click', function () { panBy(Math.ceil(sim.size / 2), 0); });
    $('#padCenter').addEventListener('click', centerOnRobot);

    var catSearch = $('#catalogSearch');
    catSearch.addEventListener('input', function () { filterState.text = catSearch.value; filterState.expanded = false; renderCatalog(); });
    $('#tierFilter').addEventListener('change', function (e) { filterState.tier = e.target.value; filterState.expanded = false; renderCatalog(); });
    $('#flaggedToggle').addEventListener('change', function (e) { filterState.onlyFlagged = e.target.checked; filterState.expanded = false; $('#flaggedToggleWrap').classList.toggle('is-on', filterState.onlyFlagged); renderCatalog(); });
    $('#catalogMoreBtn').addEventListener('click', function () { filterState.expanded = true; renderCatalog(); });

    window.addEventListener('resize', function () { initCanvas(); redraw(); });
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', function () {
    renderVocab();
    renderCatalog();
    populateProjectSelect();
    wireEditor();
    initCanvas();
    loadProjectIntoEditor('P01');
    redraw();
    wireControls();
    initNavObserver();
    heroDemo();
  });
})();

