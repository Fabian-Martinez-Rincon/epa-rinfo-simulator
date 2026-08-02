// Vista 3D (isometrica) del simulador: proyeccion, piso con calles, iconos
// isometricos de flor/papel/robot y el dibujo completo de la ciudad.
import { canvas, sim } from './state.js';
import { shade } from './color.js';

// ---- proyeccion isometrica ----
// Reusa el mismo sim.origin/sim.size que la vista 2D: son "que esquinas
// estan a la vista", nada mas cambia como se proyectan a pantalla.
// Layout isometrico generico: no asume canvas ni bounds cuadrados, asi lo
// puede reusar tanto el simulador principal como la animacion del hero.
export function isoLayout(cssW, cssH, bounds) {
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
export function isoPoint(iso, rav, rca) {
  return { x: iso.originX + (rav - rca) * (iso.tw / 2), y: iso.originY + (iso.effN - rav - rca) * (iso.th / 2) };
}

// Banda de ancho fijo en pantalla entre dos puntos (para las calles); calcula
// el vector perpendicular a la linea y arma un cuadrilatero angosto.
export function isoBand(ctx, p1, p2, halfW, color) {
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
export function drawIsoGround(ctx, iso, avCount, caCount, cGround, cLine, cStreet, cStreetLine) {
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
export function isoBounds() {
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

export function screenToCellIso(x, y) {
  var bounds = isoBounds();
  var iso = isoLayout(canvas.__cssW, canvas.__cssH, bounds);
  var relX = x - iso.originX, relY = y - iso.originY;
  var a = relX / (iso.tw / 2);
  var sum = iso.effN - relY / (iso.th / 2); // rav + rca, invertido igual que en isoPoint
  var rav = Math.floor((sum + a) / 2), rca = Math.floor((sum - a) / 2);
  return { av: bounds.avMin + rav, ca: bounds.caMin + rca };
}

// Flor: tallo + 5 petalos alrededor de un centro, en vez de una esfera lisa.
export function drawFlorIso(ctx, cx, cy, tw, cFlor, cStem) {
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
export function drawPapelIso(ctx, cx, cy, tw, th, cPapel, cFold) {
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
export function drawRobotIso(ctx, cx, cy, tw, dir, cBody, cEye, walkT) {
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

export function drawCity3D(cctx, cityMap, robot) {
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
