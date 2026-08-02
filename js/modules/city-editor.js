// Edicion manual de la ciudad (click para poner flor/papel) y control de
// camara (paneo, centrado en el robot).
import { $ } from './dom.js';
import { sim, canvas, getCell, setCell, cloneCity, centerOn } from './state.js';
import { screenToCell } from './render2d.js';
import { screenToCellIso } from './render3d.js';
import { redraw } from './render.js';

export function handleCanvasClick(e, mode) {
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
  sim.finished = false;
  redraw();
}

export function randomizeView() {
  for (var av = sim.origin.av; av <= sim.origin.av + sim.size - 1; av++) {
    for (var ca = sim.origin.ca; ca <= sim.origin.ca + sim.size - 1; ca++) {
      if (Math.random() < 0.18) setCell(sim.city, av, ca, { flor: Math.random() < 0.7 ? 1 : 0, papel: Math.random() < 0.4 ? 1 : 0 });
    }
  }
  sim.liveCity = cloneCity(sim.city);
  sim.finished = false;
  redraw();
}

export function clearCity() {
  sim.city = new Map(); sim.liveCity = new Map(); sim.finished = false; redraw();
}

export function panBy(dAv, dCa) {
  if (sim.followRobot) { sim.followRobot = false; $('#followToggleWrap').classList.remove('is-on'); $('#followToggle').checked = false; }
  var maxOrigin = 100 - sim.size + 1;
  sim.origin.av = Math.min(maxOrigin, Math.max(1, sim.origin.av + dAv));
  sim.origin.ca = Math.min(maxOrigin, Math.max(1, sim.origin.ca + dCa));
  redraw();
}

export function centerOnRobot() {
  centerOn(sim.liveRobot.av, sim.liveRobot.ca);
  redraw();
}
