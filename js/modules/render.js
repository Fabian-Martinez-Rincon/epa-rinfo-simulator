// Dispatcher de dibujo (2D/3D) y el loop de "un frame" del simulador: decide
// que ciudad/posicion mostrar segun el estado (corriendo, recien terminado,
// o en reposo) y deja todo listo para el proximo redraw().
import { $ } from './dom.js';
import { sim, cctx, centerOn } from './state.js';
import { drawCity2D } from './render2d.js';
import { drawCity3D } from './render3d.js';

export function drawCity(cityMap, robot) {
  if (sim.viewMode === '3d') drawCity3D(cctx, cityMap, robot);
  else drawCity2D(cctx, cityMap, robot);
}

export function refreshReadout(robot) {
  $('#posReadout').textContent = robot ? ('Av ' + robot.av + ', Ca ' + robot.ca + ' · ' + robot.dir) : '—';
}

// Interpola la posicion del robot dentro del paso actual de la traza (ver
// sim.anim), para que se deslice suave entre celdas en vez de saltar.
export function renderPosition() {
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

export function redraw() {
  var robot = sim.running ? renderPosition() : { av: sim.liveRobot.av, ca: sim.liveRobot.ca, dir: sim.liveRobot.dir, moving: false, stepT: 0 };
  if (sim.followRobot) centerOn(robot.av, robot.ca);
  drawCity((sim.running || sim.finished) ? sim.liveCity : sim.city, robot);
  refreshReadout(sim.liveRobot);
}
