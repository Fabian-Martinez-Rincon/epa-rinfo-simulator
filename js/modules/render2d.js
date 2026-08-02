// Vista 2D (planta) del simulador: grilla de calles, iconos de flor/papel/
// robot vistos desde arriba, y el dibujo completo de la ciudad.
import { canvas, sim } from './state.js';
import { shade } from './color.js';

export function cellToScreen(av, ca) {
  var cellPx = canvas.__cssSize / sim.size;
  var x = (av - sim.origin.av) * cellPx;
  var y = (sim.origin.ca + sim.size - 1 - ca) * cellPx;
  return { x: x, y: y, s: cellPx };
}

export function screenToCell(x, y) {
  var cellPx = canvas.__cssSize / sim.size;
  var av = Math.floor(x / cellPx) + sim.origin.av;
  var ca = sim.origin.ca + sim.size - 1 - Math.floor(y / cellPx);
  return { av: av, ca: ca };
}

// Robotito estilo droide: cuerpo redondeado + "ojo" de color de marca
// corrido hacia el frente para marcar la orientacion (reemplaza la flechita).
export function drawRobotIcon(ctx, rr, cBody, cEye) {
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
export function drawFlor2D(ctx, cx, cy, r, cFlor, cStem) {
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

export function drawPapel2D(ctx, cx, cy, r, cPapel, cFold) {
  var w = r * 1.5, h = r * 1.7;
  ctx.fillStyle = cPapel;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = cFold;
  ctx.beginPath();
  ctx.moveTo(cx + w / 2, cy - h / 2); ctx.lineTo(cx + w / 2 - w * 0.4, cy - h / 2); ctx.lineTo(cx + w / 2, cy - h / 2 + w * 0.4);
  ctx.closePath(); ctx.fill();
}

export function drawCity2D(cctx, cityMap, robot) {
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
