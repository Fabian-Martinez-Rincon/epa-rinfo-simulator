// Carga un proyecto del catalogo (codigo + ciudad de ejemplo) en el editor y
// el simulador.
import { $, el } from './dom.js';
import { sim, cloneCity } from './state.js';
import { syncGutter } from './editor.js';
import { redraw } from './render.js';
import { stopAnimation } from './run-engine.js';
import { setActiveNav } from './nav.js';
import { logConsole } from './editor.js';

var DATA = window.EPA_DATA;
var PROJECTS = DATA.PROJECTS, SOLUTIONS = DATA.SOLUTIONS;

export function populateProjectSelect() {
  var sel = $('#projectSelect');
  PROJECTS.forEach(function (p) {
    sel.appendChild(el('option', { value: p.id }, [p.id + ' — ' + p.nombre]));
  });
  sel.addEventListener('change', function () { loadProjectIntoEditor(sel.value); });
}

export function loadProjectIntoEditor(id) {
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
  sim.finished = false;
  $('#bagFlor').value = sol.demoBagFlor || 0;
  $('#bagPapel').value = sol.demoBagPapel || 0;
  sim.liveRobot = { av: 1, ca: 1, dir: 'N', bagFlor: sol.demoBagFlor || 0, bagPapel: sol.demoBagPapel || 0 };
  sim.trail = [[{ av: 1, ca: 1 }]];
  redraw();

  logConsole('Cargado ' + p.id + ' — ' + p.nombre + ' con una solucion de referencia ya funcional y una ciudad de ejemplo. Dale a Ejecutar.', 'muted');
}

export function openInSimulator(id) {
  loadProjectIntoEditor(id);
  var simSection = document.getElementById('simulador');
  if (typeof simSection.scrollIntoView === 'function') simSection.scrollIntoView({ behavior: 'smooth' });
  setActiveNav('simulador');
}
