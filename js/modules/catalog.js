// Tabla de vocabulario (Resumen) y grilla de proyectos filtrable (Catalogo).
import { $, el } from './dom.js';
import { openInSimulator } from './project.js';

var DATA = window.EPA_DATA;
var PROJECTS = DATA.PROJECTS, VOCAB = DATA.VOCAB;

export function renderVocab() {
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

export function renderCatalog() {
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

export function wireCatalogControls() {
  var catSearch = $('#catalogSearch');
  catSearch.addEventListener('input', function () { filterState.text = catSearch.value; filterState.expanded = false; renderCatalog(); });
  $('#tierFilter').addEventListener('change', function (e) { filterState.tier = e.target.value; filterState.expanded = false; renderCatalog(); });
  $('#flaggedToggle').addEventListener('change', function (e) { filterState.onlyFlagged = e.target.checked; filterState.expanded = false; $('#flaggedToggleWrap').classList.toggle('is-on', filterState.onlyFlagged); renderCatalog(); });
  $('#catalogMoreBtn').addEventListener('click', function () { filterState.expanded = true; renderCatalog(); });
}
