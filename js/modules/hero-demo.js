// Animacion del hero: un canvas 3D chico con una patrulla en bucle, para
// mostrar el simulador en accion antes de que el visitante llegue a probarlo.
import { $ } from './dom.js';
import { shade } from './color.js';
import { isoLayout, isoPoint, drawIsoGround, drawFlorIso, drawPapelIso, drawRobotIso } from './render3d.js';

export function heroDemo() {
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
