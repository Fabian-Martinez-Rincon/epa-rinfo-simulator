// Editor de codigo: numero de linea, resaltado de sintaxis (capa superpuesta
// sobre el textarea invisible) y la consola de salida de la corrida.
import { $ } from './dom.js';

var RINFO_STRUCT = ['programa', 'procesos', 'proceso', 'areas', 'robots', 'robot', 'variables', 'comenzar', 'fin'];
var RINFO_CTRL = ['si', 'sino', 'repetir', 'mientras'];
var RINFO_TYPE = ['numero', 'boolean', 'E', 'ES'];
var RINFO_BUILTIN = ['mover', 'derecha', 'tomarFlor', 'tomarPapel', 'depositarFlor', 'depositarPapel',
  'Pos', 'Informar', 'AsignarArea', 'Iniciar', 'AreaC',
  'PosAv', 'PosCa', 'HayFlorEnLaEsquina', 'HayPapelEnLaEsquina', 'HayFlorEnLaBolsa', 'HayPapelEnLaBolsa'];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var TOKEN_RE = new RegExp(
  '(\\{[^}]*\\})' +                                   // 1 comment
  '|(\\b(?:' + RINFO_STRUCT.join('|') + ')\\b)' +      // 2 structure keyword
  '|(\\b(?:' + RINFO_CTRL.join('|') + ')\\b)' +        // 3 control flow
  '|(\\b(?:' + RINFO_TYPE.join('|') + ')\\b)' +        // 4 type / parameter class
  '|(\\b(?:' + RINFO_BUILTIN.join('|') + ')\\b)' +     // 5 builtin/primitive
  '|(\\b[VF]\\b)' +                                    // 6 boolean literal
  '|(\\b\\d+\\b)' +                                    // 7 number
  '|(:=|&lt;=|&gt;=|&lt;&gt;|&lt;|&gt;|&amp;|[+\\-*/|~=(),:;])', // 8 operator (matched post-escape)
  'g'
);

export function highlightRInfo(code) {
  var escaped = escapeHtml(code);
  return escaped.replace(TOKEN_RE, function (m, com, kw, ctrl, type, prim, bool, num, op) {
    if (com) return '<span class="tok-com">' + com + '</span>';
    if (kw) return '<span class="tok-kw">' + kw + '</span>';
    if (ctrl) return '<span class="tok-ctrl">' + ctrl + '</span>';
    if (type) return '<span class="tok-type">' + type + '</span>';
    if (prim) return '<span class="tok-prim">' + prim + '</span>';
    if (bool) return '<span class="tok-bool">' + bool + '</span>';
    if (num) return '<span class="tok-num">' + num + '</span>';
    if (op) return '<span class="tok-op">' + op + '</span>';
    return m;
  });
}

export function syncHighlight() {
  var code = $('#editor').value;
  $('#highlightLayer code').innerHTML = highlightRInfo(code) + '\n';
}

export function syncGutter() {
  var lines = $('#editor').value.split('\n').length;
  var g = $('#gutter');
  var out = '';
  for (var i = 1; i <= lines; i++) out += i + '\n';
  g.textContent = out;
  syncHighlight();
}

export function logConsole(msg, cls) {
  var c = $('#consoleOut');
  var line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = msg;
  c.appendChild(line);
  c.scrollTop = c.scrollHeight;
}

export function clearConsole() { $('#consoleOut').innerHTML = ''; }
