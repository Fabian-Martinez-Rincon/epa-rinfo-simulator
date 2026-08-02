// Estado compartido del simulador: la ciudad, el robot, la camara y el
// canvas activo. El resto de los modulos de simulacion leen/escriben este
// objeto en vez de tener cada uno su propia copia.
import { $ } from './dom.js';

export var sim = {
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
  // true entre el fin de una corrida y la proxima edicion/carga: la vista
  // idle muestra liveCity (el resultado, con flores/papeles ya tomados) en
  // vez de city, que se mantiene intacta para que "Ejecutar" de nuevo repita
  // el mismo escenario en vez de seguir vaciando la ciudad a cada click.
  finished: false,
  anim: { fromAv: 1, fromCa: 1, toAv: 1, toCa: 1, startedAt: 0, duration: 220 }
};

export function cellKey(av, ca) { return av + ',' + ca; }
export function getCell(map, av, ca) { return map.get(cellKey(av, ca)) || { flor: 0, papel: 0 }; }
export function setCell(map, av, ca, val) {
  if (val.flor === 0 && val.papel === 0) map.delete(cellKey(av, ca));
  else map.set(cellKey(av, ca), val);
}
export function cloneCity(map) {
  var m = new Map();
  map.forEach(function (v, k) { m.set(k, { flor: v.flor, papel: v.papel }); });
  return m;
}

// Mueve la ventana visible (sim.origin) para que (av,ca) quede centrada,
// sin salirse del mapa de 100x100. La usan tanto "seguir al robot" (render.js)
// como el centrado manual del panel de control (city-editor.js).
export function centerOn(av, ca) {
  var maxOrigin = 100 - sim.size + 1;
  sim.origin.av = Math.min(maxOrigin, Math.max(1, av - sim.size / 2));
  sim.origin.ca = Math.min(maxOrigin, Math.max(1, ca - sim.size / 2));
}

export function pushTrail(av, ca, teleport) {
  var seg = sim.trail[sim.trail.length - 1];
  var last = seg[seg.length - 1];
  if (last && last.av === av && last.ca === ca) return;
  if (teleport) sim.trail.push([{ av: av, ca: ca }]);
  else seg.push({ av: av, ca: ca });
}

// ---- canvas activo ----
// canvas/cctx son bindings mutables: initCanvas() los reasigna cada vez que
// cambia el modo de vista o el tamano de ventana; los demas modulos los
// importan de solo lectura y siempre ven el valor vigente (bindings vivos de
// ES modules), sin necesidad de pasarlos como parametro por todos lados.
export var canvas = null, cctx = null;

export function initCanvas() {
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
