// Corre el programa R-info (via window.RInfo, cargado como script clasico
// antes de los modulos) y reproduce la traza resultante animada, paso a paso.
import { $ } from './dom.js';
import { sim, getCell, setCell, cloneCity, pushTrail } from './state.js';
import { redraw } from './render.js';
import { logConsole, clearConsole } from './editor.js';

// Un paso logico = un evento de la traza. El robot desliza suavemente entre
// celdas via requestAnimationFrame; la velocidad controla cuanto dura cada paso,
// nunca cuantos eventos se amontonan en un mismo frame (eso era lo que hacia
// que la animacion se viera "trabada"/instantanea antes).
export function stopAnimation() {
  if (sim.stepTimer) { clearTimeout(sim.stepTimer); sim.stepTimer = null; }
  if (sim.rafId) { cancelAnimationFrame(sim.rafId); sim.rafId = null; }
  if (sim.running) sim.finished = true;
  sim.running = false;
  $('#runBtn').disabled = false; $('#stopBtn').disabled = true; $('#skipBtn').disabled = true;
  redraw();
}

export function applyTraceEvent(ev) {
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

export function runProgram() {
  stopAnimation();
  clearConsole();
  var code = $('#editor').value;
  var opts = {
    cityInit: (function () { var o = {}; sim.city.forEach(function (v, k) { o[k] = v; }); return o; })(),
    initialBagFlor: parseInt($('#bagFlor').value, 10) || 0,
    initialBagPapel: parseInt($('#bagPapel').value, 10) || 0
  };
  var result;
  try { result = window.RInfo.run(code, opts); }
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

export function skipToEnd() {
  if (!sim.currentTrace) return;
  if (sim.stepTimer) { clearTimeout(sim.stepTimer); sim.stepTimer = null; }
  if (sim.rafId) { cancelAnimationFrame(sim.rafId); sim.rafId = null; }
  while (sim.traceIdx < sim.currentTrace.length) { applyTraceEvent(sim.currentTrace[sim.traceIdx]); sim.traceIdx++; }
  finishRun(sim.currentResult);
}
