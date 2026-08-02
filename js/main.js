// Punto de entrada: conecta los modulos entre si con los elementos del DOM y
// arranca la app. window.EPA_DATA y window.RInfo ya estan disponibles porque
// rinfo-data.js y rinfo-interpreter.js se cargan como scripts clasicos antes
// que este modulo (ver index.html).
import { $, $all } from './modules/dom.js';
import { sim, initCanvas } from './modules/state.js';
import { syncGutter } from './modules/editor.js';
import { redraw } from './modules/render.js';
import { handleCanvasClick, randomizeView, clearCity, panBy, centerOnRobot } from './modules/city-editor.js';
import { runProgram, stopAnimation, skipToEnd } from './modules/run-engine.js';
import { logConsole } from './modules/editor.js';
import { renderVocab, renderCatalog, wireCatalogControls } from './modules/catalog.js';
import { populateProjectSelect, loadProjectIntoEditor } from './modules/project.js';
import { initNavObserver } from './modules/nav.js';
import { heroDemo } from './modules/hero-demo.js';

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

  wireCatalogControls();

  window.addEventListener('resize', function () { initCanvas(); redraw(); });
}

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
