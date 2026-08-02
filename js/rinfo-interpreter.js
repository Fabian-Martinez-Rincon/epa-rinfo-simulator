window.RInfo = (function(){ // R-info mini interpreter (subset confirmed against EPA capitulos 1-8).
// Pure functions/classes, no Node-specific APIs, safe to inline in a browser <script>.

function stripComments(src) {
  // Replaces { ... } spans with spaces, preserving newlines and column positions.
  let out = '';
  let inComment = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (!inComment && c === '{') { inComment = true; out += ' '; continue; }
    if (inComment && c === '}') { inComment = false; out += ' '; continue; }
    if (inComment) { out += (c === '\n') ? '\n' : ' '; continue; }
    out += c;
  }
  return out;
}

function buildLines(src) {
  const stripped = stripComments(src);
  const rawLines = stripped.split('\n');
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.replace(/\s+$/, '');
    if (trimmed.trim().length === 0) continue;
    const indent = trimmed.match(/^ */)[0].length;
    if (/^\t/.test(trimmed)) {
      throw new RInfoError(`Linea ${i + 1}: se encontro un tabulador. Usa solo espacios para indentar (2 por nivel).`, i + 1);
    }
    lines.push({ indent, text: trimmed.trim(), lineNo: i + 1 });
  }
  return lines;
}

const OPS3 = [];
const OPS2 = [':=', '<=', '>=', '<>'];
const OPS1 = ['<', '>', '=', '+', '-', '*', '/', '&', '|', '~', '(', ')', ',', ':', ';'];

function tokenizeLine(text, lineNo) {
  const toks = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === ' ') { i++; continue; }
    const two = text.slice(i, i + 2);
    if (OPS2.includes(two)) { toks.push({ t: two, k: 'op', lineNo }); i += 2; continue; }
    if (OPS1.includes(c)) { toks.push({ t: c, k: 'op', lineNo }); i++; continue; }
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < text.length && /[0-9]/.test(text[j])) j++;
      toks.push({ t: text.slice(i, j), k: 'num', lineNo });
      i = j;
      continue;
    }
    if (/[A-Za-zÀ-ÿ]/.test(c)) {
      let j = i;
      while (j < text.length && /[A-Za-zÀ-ÿ0-9_-]/.test(text[j])) j++;
      toks.push({ t: text.slice(i, j), k: 'id', lineNo });
      i = j;
      continue;
    }
    throw new RInfoError(`Linea ${lineNo}: caracter inesperado '${c}'.`, lineNo);
  }
  return toks;
}

class RInfoError extends Error {
  constructor(msg, lineNo) { super(msg); this.lineNo = lineNo || null; this.isRInfo = true; }
}

// ---------- Parser ----------
// Fixed pedagogical template: programa / [procesos] / areas / robots / variables / comenzar..fin

class Cursor {
  constructor(lines) { this.lines = lines; this.i = 0; }
  peek() { return this.lines[this.i]; }
  next() { return this.lines[this.i++]; }
  eof() { return this.i >= this.lines.length; }
}

function expectKeyword(cur, indent, kw) {
  const l = cur.peek();
  if (!l || l.indent !== indent || firstWord(l.text) !== kw) {
    throw new RInfoError(`Se esperaba '${kw}' en la linea ${l ? l.lineNo : 'final'} (columna ${indent}).`, l ? l.lineNo : null);
  }
  return cur.next();
}

function firstWord(text) {
  const m = text.match(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_-]*/);
  return m ? m[0] : '';
}

function parsePrograma(src) {
  const lines = buildLines(src);
  const cur = new Cursor(lines);
  if (cur.eof()) throw new RInfoError('El programa esta vacio.');

  const head = cur.next();
  if (firstWord(head.text) !== 'programa') {
    throw new RInfoError(`Linea ${head.lineNo}: todo programa debe comenzar con 'programa <nombre>'.`, head.lineNo);
  }
  const programName = head.text.slice('programa'.length).trim();

  const ast = { programName, procesos: [], area: null, robotTypeName: null, robotVars: [], robotBody: [], binding: null, mainBody: [] };

  if (!cur.eof() && cur.peek().indent === 0 && firstWord(cur.peek().text) === 'procesos') {
    cur.next();
    while (!cur.eof() && cur.peek().indent === 2 && firstWord(cur.peek().text) === 'proceso') {
      ast.procesos.push(parseProceso(cur));
    }
  }

  expectKeyword(cur, 0, 'areas');
  {
    const l = cur.next();
    if (l.indent !== 2) throw new RInfoError(`Linea ${l.lineNo}: se esperaba la declaracion de un area indentada 2 columnas bajo 'areas'.`, l.lineNo);
    const m = l.text.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_-]*)\s*:\s*AreaC\(([^)]*)\)$/);
    if (!m) throw new RInfoError(`Linea ${l.lineNo}: se esperaba '<nombre>: AreaC(x1,y1,x2,y2)'.`, l.lineNo);
    const parts = m[2].split(',').map((s) => parseInt(s.trim(), 10));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      throw new RInfoError(`Linea ${l.lineNo}: AreaC necesita 4 numeros: x1,y1,x2,y2.`, l.lineNo);
    }
    ast.area = { name: m[1], x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3] };
    if (!cur.eof() && cur.peek().indent === 2 && /AreaC/.test(cur.peek().text)) {
      throw new RInfoError(`Linea ${cur.peek().lineNo}: este curso permite declarar una unica area.`, cur.peek().lineNo);
    }
  }

  expectKeyword(cur, 0, 'robots');
  {
    const l = cur.next();
    if (l.indent !== 2 || firstWord(l.text) !== 'robot') {
      throw new RInfoError(`Linea ${l.lineNo}: se esperaba 'robot <nombre>'.`, l.lineNo);
    }
    ast.robotTypeName = l.text.slice('robot'.length).trim();
    if (!cur.eof() && cur.peek().indent === 4 && firstWord(cur.peek().text) === 'variables') {
      cur.next();
      ast.robotVars = parseVarDecls(cur, 6);
    }
    expectKeyword(cur, 4, 'comenzar');
    ast.robotBody = parseStatementBlock(cur, 6);
    expectKeyword(cur, 4, 'fin');
    if (!cur.eof() && cur.peek().indent === 2 && firstWord(cur.peek().text) === 'robot') {
      throw new RInfoError(`Linea ${cur.peek().lineNo}: este curso permite declarar un unico robot.`, cur.peek().lineNo);
    }
  }

  expectKeyword(cur, 0, 'variables');
  {
    const l = cur.next();
    const m = l.text.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_-]*)\s*:\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_-]*)$/);
    if (!m) throw new RInfoError(`Linea ${l.lineNo}: se esperaba '<variable>: ${ast.robotTypeName}'.`, l.lineNo);
    ast.binding = { instanceName: m[1], typeName: m[2] };
  }

  expectKeyword(cur, 0, 'comenzar');
  ast.mainBody = parseStatementBlock(cur, 2);
  expectKeyword(cur, 0, 'fin');

  if (!cur.eof()) {
    throw new RInfoError(`Linea ${cur.peek().lineNo}: contenido inesperado despues de 'fin' del programa.`, cur.peek().lineNo);
  }

  return ast;
}

function parseProceso(cur) {
  const head = cur.next(); // indent 2, 'proceso Nombre (...)?'
  const m = head.text.match(/^proceso\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_-]*)\s*(\((.*)\))?$/);
  if (!m) throw new RInfoError(`Linea ${head.lineNo}: encabezado de proceso invalido.`, head.lineNo);
  const name = m[1];
  const params = [];
  if (m[3] !== undefined) {
    const parts = m[3].split(';').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const pm = p.match(/^(E|ES)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_-]*)\s*:\s*(numero|boolean)$/);
      if (!pm) throw new RInfoError(`Linea ${head.lineNo}: parametro invalido '${p}'. Formato: E nombre:numero o ES nombre:boolean.`, head.lineNo);
      params.push({ cls: pm[1], name: pm[2], type: pm[3] });
    }
  }
  let locals = [];
  if (!cur.eof() && cur.peek().indent === 4 && firstWord(cur.peek().text) === 'variables') {
    cur.next();
    locals = parseVarDecls(cur, 6);
  }
  expectKeyword(cur, 4, 'comenzar');
  const body = parseStatementBlock(cur, 6);
  expectKeyword(cur, 4, 'fin');
  return { name, params, locals, body, lineNo: head.lineNo };
}

function parseVarDecls(cur, indent) {
  const decls = [];
  while (!cur.eof() && cur.peek().indent === indent && /:/.test(cur.peek().text) && firstWord(cur.peek().text) !== 'comenzar') {
    const l = cur.next();
    const m = l.text.match(/^(.+?)\s*:\s*(numero|boolean)$/);
    if (!m) throw new RInfoError(`Linea ${l.lineNo}: declaracion de variable invalida.`, l.lineNo);
    const names = m[1].split(',').map((s) => s.trim());
    for (const n of names) decls.push({ name: n, type: m[2] });
  }
  return decls;
}

function parseStatementBlock(cur, indent) {
  const stmts = [];
  while (!cur.eof() && cur.peek().indent === indent) {
    stmts.push(parseStatement(cur, indent));
  }
  if (stmts.length === 0) {
    const l = cur.peek();
    throw new RInfoError(`Se esperaba al menos una instruccion indentada ${indent} columnas${l ? ` (linea ${l.lineNo})` : ''}.`, l ? l.lineNo : null);
  }
  return stmts;
}

const ZERO_ARG = ['mover', 'derecha', 'tomarFlor', 'tomarPapel', 'depositarFlor', 'depositarPapel'];
const CALL_BUILTIN = ['Pos', 'Informar', 'AsignarArea', 'Iniciar'];

function parseStatement(cur, indent) {
  const l = cur.next();
  const toks = tokenizeLine(l.text, l.lineNo);
  const w0 = toks[0];

  if (w0.k === 'id' && w0.t === 'si') {
    const condToks = toks.slice(1);
    const cond = parseExpr(condToks, l.lineNo);
    const thenBlock = parseStatementBlock(cur, indent + 2);
    let elseBlock = null;
    if (!cur.eof() && cur.peek().indent === indent && firstWord(cur.peek().text) === 'sino') {
      cur.next();
      elseBlock = parseStatementBlock(cur, indent + 2);
    }
    return { type: 'si', cond, then: thenBlock, else: elseBlock, lineNo: l.lineNo };
  }

  if (w0.k === 'id' && w0.t === 'repetir') {
    const cnt = parseExpr(toks.slice(1), l.lineNo);
    const body = parseStatementBlock(cur, indent + 2);
    return { type: 'repetir', count: cnt, body, lineNo: l.lineNo };
  }

  if (w0.k === 'id' && w0.t === 'mientras') {
    const cond = parseExpr(toks.slice(1), l.lineNo);
    const body = parseStatementBlock(cur, indent + 2);
    return { type: 'mientras', cond, body, lineNo: l.lineNo };
  }

  if (w0.k === 'id' && ZERO_ARG.includes(w0.t)) {
    if (toks.length !== 1) throw new RInfoError(`Linea ${l.lineNo}: '${w0.t}' no recibe argumentos.`, l.lineNo);
    return { type: 'call', name: w0.t, args: [], lineNo: l.lineNo };
  }

  if (w0.k === 'id' && CALL_BUILTIN.includes(w0.t)) {
    const args = parseArgList(toks, 1, l.lineNo);
    return { type: 'call', name: w0.t, args, lineNo: l.lineNo };
  }

  if (w0.k === 'id' && toks[1] && toks[1].t === ':=') {
    const expr = parseExpr(toks.slice(2), l.lineNo);
    return { type: 'assign', target: w0.t, expr, lineNo: l.lineNo };
  }

  if (w0.k === 'id') {
    // process invocation, with or without args
    const args = toks.length > 1 ? parseArgList(toks, 1, l.lineNo) : [];
    return { type: 'proccall', name: w0.t, args, lineNo: l.lineNo };
  }

  throw new RInfoError(`Linea ${l.lineNo}: instruccion no reconocida.`, l.lineNo);
}

function parseArgList(toks, startIdx, lineNo) {
  if (toks.length === startIdx) return [];
  if (toks[startIdx].t !== '(' || toks[toks.length - 1].t !== ')') {
    throw new RInfoError(`Linea ${lineNo}: se esperaban argumentos entre parentesis.`, lineNo);
  }
  const inner = toks.slice(startIdx + 1, toks.length - 1);
  if (inner.length === 0) return [];
  const groups = [];
  let depth = 0, cur = [];
  for (const t of inner) {
    if (t.t === '(') depth++;
    if (t.t === ')') depth--;
    if (t.t === ',' && depth === 0) { groups.push(cur); cur = []; continue; }
    cur.push(t);
  }
  groups.push(cur);
  return groups.map((g) => parseExpr(g, lineNo));
}

// ---- Expression parser (precedence climbing) ----
// unary ~  >  * /  >  + -  >  relational  >  &  >  |

function parseExpr(toks, lineNo) {
  const p = { toks, i: 0, lineNo };
  const e = parseOr(p);
  if (p.i !== p.toks.length) {
    throw new RInfoError(`Linea ${lineNo}: expresion invalida cerca de '${p.toks[p.i] ? p.toks[p.i].t : '?'}'.`, lineNo);
  }
  return e;
}
function peekT(p) { return p.toks[p.i]; }
function eatT(p) { return p.toks[p.i++]; }

function parseOr(p) {
  let left = parseAnd(p);
  while (peekT(p) && peekT(p).t === '|') { eatT(p); left = { k: 'bin', op: '|', l: left, r: parseAnd(p) }; }
  return left;
}
function parseAnd(p) {
  let left = parseRel(p);
  while (peekT(p) && peekT(p).t === '&') { eatT(p); left = { k: 'bin', op: '&', l: left, r: parseRel(p) }; }
  return left;
}
const RELOPS = ['<', '>', '<=', '>=', '=', '<>'];
function parseRel(p) {
  let left = parseAdd(p);
  while (peekT(p) && RELOPS.includes(peekT(p).t)) { const op = eatT(p).t; left = { k: 'bin', op, l: left, r: parseAdd(p) }; }
  return left;
}
function parseAdd(p) {
  let left = parseMul(p);
  while (peekT(p) && (peekT(p).t === '+' || peekT(p).t === '-')) { const op = eatT(p).t; left = { k: 'bin', op, l: left, r: parseMul(p) }; }
  return left;
}
function parseMul(p) {
  let left = parseUnary(p);
  while (peekT(p) && (peekT(p).t === '*' || peekT(p).t === '/')) { const op = eatT(p).t; left = { k: 'bin', op, l: left, r: parseUnary(p) }; }
  return left;
}
function parseUnary(p) {
  if (peekT(p) && peekT(p).t === '~') { eatT(p); return { k: 'not', e: parseUnary(p) }; }
  if (peekT(p) && peekT(p).t === '-') { eatT(p); return { k: 'neg', e: parseUnary(p) }; }
  return parsePrimary(p);
}
function parsePrimary(p) {
  const t = peekT(p);
  if (!t) throw new RInfoError(`Linea ${p.lineNo}: se esperaba una expresion.`, p.lineNo);
  if (t.t === '(') {
    eatT(p);
    const e = parseOr(p);
    if (!peekT(p) || peekT(p).t !== ')') throw new RInfoError(`Linea ${p.lineNo}: falta ')'.`, p.lineNo);
    eatT(p);
    return e;
  }
  if (t.k === 'num') { eatT(p); return { k: 'num', v: parseInt(t.t, 10) }; }
  if (t.k === 'id') {
    eatT(p);
    if (t.t === 'V') return { k: 'bool', v: true };
    if (t.t === 'F') return { k: 'bool', v: false };
    return { k: 'id', name: t.t };
  }
  throw new RInfoError(`Linea ${p.lineNo}: token inesperado '${t.t}'.`, p.lineNo);
}



const DIRS = ['N', 'E', 'S', 'O'];
const DELTA = { N: [0, 1], E: [1, 0], S: [0, -1], O: [-1, 0] };
const STEP_LIMIT = 60000;

function cellKey(av, ca) { return av + ',' + ca; }

class Ctx {
  constructor(ast, opts) {
    this.ast = ast;
    this.area = ast.area;
    this.city = new Map();
    if (opts.cityInit) {
      for (const [k, v] of Object.entries(opts.cityInit)) this.city.set(k, { flor: v.flor || 0, papel: v.papel || 0 });
    }
    this.robot = { av: 1, ca: 1, dir: 'N', bagFlor: opts.initialBagFlor || 0, bagPapel: opts.initialBagPapel || 0 };
    this.trace = [];
    this.informe = [];
    this.steps = 0;
    this.procesoIndex = new Map(ast.procesos.map((p, i) => [p.name, i]));
    this.procesos = new Map(ast.procesos.map((p) => [p.name, p]));
  }
  cell(av, ca) {
    const k = cellKey(av, ca);
    if (!this.city.has(k)) this.city.set(k, { flor: 0, papel: 0 });
    return this.city.get(k);
  }
  tick(lineNo) {
    this.steps++;
    if (this.steps > STEP_LIMIT) {
      throw new RInfoError(`Se alcanzo el limite de ${STEP_LIMIT} pasos (posible bucle infinito). Revisa las condiciones de 'mientras' o 'repetir'.`, lineNo);
    }
  }
}

function evalExpr(node, scope, ctx) {
  switch (node.k) {
    case 'num': return node.v;
    case 'bool': return node.v;
    case 'not': { const v = evalExpr(node.e, scope, ctx); assertType(v, 'boolean', node); return !v; }
    case 'neg': { const v = evalExpr(node.e, scope, ctx); assertType(v, 'number', node); return -v; }
    case 'bin': return evalBin(node, scope, ctx);
    case 'id': return evalId(node.name, scope, ctx);
    default: throw new RInfoError('Expresion invalida.');
  }
}

function assertType(v, type, node) {
  const ok = type === 'number' ? typeof v === 'number' : typeof v === 'boolean';
  if (!ok) throw new RInfoError(`Se esperaba un valor de tipo ${type === 'number' ? 'numero' : 'boolean'}.`);
}

function evalBin(node, scope, ctx) {
  const { op } = node;
  if (op === '&' || op === '|') {
    const l = evalExpr(node.l, scope, ctx); assertType(l, 'boolean', node);
    const r = evalExpr(node.r, scope, ctx); assertType(r, 'boolean', node);
    return op === '&' ? (l && r) : (l || r);
  }
  const l = evalExpr(node.l, scope, ctx);
  const r = evalExpr(node.r, scope, ctx);
  if (['<', '>', '<=', '>=', '=', '<>'].includes(op)) {
    assertType(l, 'number', node); assertType(r, 'number', node);
    switch (op) {
      case '<': return l < r;
      case '>': return l > r;
      case '<=': return l <= r;
      case '>=': return l >= r;
      case '=': return l === r;
      case '<>': return l !== r;
    }
  }
  assertType(l, 'number', node); assertType(r, 'number', node);
  switch (op) {
    case '+': return l + r;
    case '-': return l - r;
    case '*': return l * r;
    case '/':
      if (r === 0) throw new RInfoError('Division por cero.');
      return Math.trunc(l / r);
  }
  throw new RInfoError(`Operador desconocido '${op}'.`);
}

function evalId(name, scope, ctx) {
  if (name === 'PosAv') return ctx.robot.av;
  if (name === 'PosCa') return ctx.robot.ca;
  if (name === 'HayFlorEnLaEsquina') return ctx.cell(ctx.robot.av, ctx.robot.ca).flor > 0;
  if (name === 'HayPapelEnLaEsquina') return ctx.cell(ctx.robot.av, ctx.robot.ca).papel > 0;
  if (name === 'HayFlorEnLaBolsa') return ctx.robot.bagFlor > 0;
  if (name === 'HayPapelEnLaBolsa') return ctx.robot.bagPapel > 0;
  if (Object.prototype.hasOwnProperty.call(scope.vars, name)) return scope.vars[name];
  throw new RInfoError(`Variable o identificador no declarado: '${name}'.`);
}

function inArea(ctx, av, ca) {
  const a = ctx.area;
  return av >= a.x1 && av <= a.x2 && ca >= a.y1 && ca <= a.y2;
}

function execBlock(stmts, scope, ctx) {
  for (const s of stmts) execStmt(s, scope, ctx);
}

function execStmt(s, scope, ctx) {
  ctx.tick(s.lineNo);
  switch (s.type) {
    case 'call': return execCall(s, scope, ctx);
    case 'proccall': return execProcCall(s, scope, ctx);
    case 'assign': return execAssign(s, scope, ctx);
    case 'si': {
      const c = evalExpr(s.cond, scope, ctx);
      assertType(c, 'boolean', s);
      if (c) execBlock(s.then, scope, ctx);
      else if (s.else) execBlock(s.else, scope, ctx);
      return;
    }
    case 'repetir': {
      const n = evalExpr(s.count, scope, ctx);
      assertType(n, 'number', s);
      for (let i = 0; i < n; i++) { ctx.tick(s.lineNo); execBlock(s.body, scope, ctx); }
      return;
    }
    case 'mientras': {
      while (true) {
        ctx.tick(s.lineNo);
        const c = evalExpr(s.cond, scope, ctx);
        assertType(c, 'boolean', s);
        if (!c) break;
        execBlock(s.body, scope, ctx);
      }
      return;
    }
    default: throw new RInfoError(`Instruccion no soportada: ${s.type}`);
  }
}

function execAssign(s, scope, ctx) {
  if (!(s.target in scope.vars)) throw new RInfoError(`Variable no declarada: '${s.target}'.`, s.lineNo);
  if (scope.kinds[s.target] === 'E') throw new RInfoError(`No se puede asignar un valor al parametro de entrada '${s.target}' (clase E); es de solo lectura.`, s.lineNo);
  const v = evalExpr(s.expr, scope, ctx);
  const wanted = scope.types[s.target];
  assertType(v, wanted, s);
  scope.vars[s.target] = v;
}

function execCall(s, scope, ctx) {
  if (s.name === 'AsignarArea') return; // ceremonial in this single-area interpreter
  if (s.name === 'Iniciar') {
    if (s.args.length !== 3) throw new RInfoError("Iniciar espera 3 argumentos: Iniciar(robot, avenida, calle).", s.lineNo);
    const av = evalExpr(s.args[1], scope, ctx);
    const ca = evalExpr(s.args[2], scope, ctx);
    assertType(av, 'number', s); assertType(ca, 'number', s);
    if (!inArea(ctx, av, ca)) throw new RInfoError(`Iniciar(${av},${ca}) esta fuera de los limites del area.`, s.lineNo);
    ctx.robot.av = av; ctx.robot.ca = ca; ctx.robot.dir = 'N';
    ctx.trace.push({ type: 'iniciar', av, ca, lineNo: s.lineNo });
    const robotScope = makeScope(ctx.ast.robotVars);
    execBlock(ctx.ast.robotBody, robotScope, ctx);
    return;
  }
  const args = s.args.map((a) => evalExpr(a, scope, ctx));
  switch (s.name) {
    case 'mover': {
      const [dav, dca] = DELTA[ctx.robot.dir];
      const nav = ctx.robot.av + dav, nca = ctx.robot.ca + dca;
      if (!inArea(ctx, nav, nca)) throw new RInfoError(`El robot intento moverse fuera de los limites de la ciudad (Av ${nav}, Ca ${nca}). El programa se aborta.`, s.lineNo);
      ctx.robot.av = nav; ctx.robot.ca = nca;
      ctx.trace.push({ type: 'mover', av: nav, ca: nca, dir: ctx.robot.dir, lineNo: s.lineNo });
      return;
    }
    case 'derecha': {
      const idx = (DIRS.indexOf(ctx.robot.dir) + 1) % 4;
      ctx.robot.dir = DIRS[idx];
      ctx.trace.push({ type: 'derecha', dir: ctx.robot.dir, lineNo: s.lineNo });
      return;
    }
    case 'tomarFlor': {
      const c = ctx.cell(ctx.robot.av, ctx.robot.ca);
      if (c.flor <= 0) throw new RInfoError(`No hay flor en la esquina (Av ${ctx.robot.av}, Ca ${ctx.robot.ca}). El programa se aborta.`, s.lineNo);
      c.flor--; ctx.robot.bagFlor++;
      ctx.trace.push({ type: 'tomarFlor', av: ctx.robot.av, ca: ctx.robot.ca, lineNo: s.lineNo });
      return;
    }
    case 'tomarPapel': {
      const c = ctx.cell(ctx.robot.av, ctx.robot.ca);
      if (c.papel <= 0) throw new RInfoError(`No hay papel en la esquina (Av ${ctx.robot.av}, Ca ${ctx.robot.ca}). El programa se aborta.`, s.lineNo);
      c.papel--; ctx.robot.bagPapel++;
      ctx.trace.push({ type: 'tomarPapel', av: ctx.robot.av, ca: ctx.robot.ca, lineNo: s.lineNo });
      return;
    }
    case 'depositarFlor': {
      if (ctx.robot.bagFlor <= 0) throw new RInfoError('No hay flor en la bolsa. El programa se aborta.', s.lineNo);
      ctx.robot.bagFlor--; ctx.cell(ctx.robot.av, ctx.robot.ca).flor++;
      ctx.trace.push({ type: 'depositarFlor', av: ctx.robot.av, ca: ctx.robot.ca, lineNo: s.lineNo });
      return;
    }
    case 'depositarPapel': {
      if (ctx.robot.bagPapel <= 0) throw new RInfoError('No hay papel en la bolsa. El programa se aborta.', s.lineNo);
      ctx.robot.bagPapel--; ctx.cell(ctx.robot.av, ctx.robot.ca).papel++;
      ctx.trace.push({ type: 'depositarPapel', av: ctx.robot.av, ca: ctx.robot.ca, lineNo: s.lineNo });
      return;
    }
    case 'Pos': {
      const [av, ca] = args;
      assertType(av, 'number', s); assertType(ca, 'number', s);
      if (!inArea(ctx, av, ca)) throw new RInfoError(`Pos(${av},${ca}) esta fuera de los limites del area.`, s.lineNo);
      ctx.robot.av = av; ctx.robot.ca = ca;
      ctx.trace.push({ type: 'pos', av, ca, lineNo: s.lineNo });
      return;
    }
    case 'Informar': {
      const line = args.map((v) => (typeof v === 'boolean' ? (v ? 'V' : 'F') : v)).join(', ');
      ctx.informe.push(line);
      ctx.trace.push({ type: 'informar', text: line, lineNo: s.lineNo });
      return;
    }
    default:
      throw new RInfoError(`Instruccion desconocida '${s.name}'.`, s.lineNo);
  }
}

function makeScope(varDecls) {
  const vars = {}, types = {}, kinds = {};
  for (const d of varDecls) { vars[d.name] = d.type === 'numero' ? 0 : false; types[d.name] = d.type === 'numero' ? 'number' : 'boolean'; kinds[d.name] = 'var'; }
  return { vars, types, kinds };
}

function execProcCall(s, scope, ctx) {
  if (!ctx.procesos.has(s.name)) throw new RInfoError(`Proceso no declarado: '${s.name}'.`, s.lineNo);
  const callerAllowed = scope.__procIndex === undefined ? Infinity : scope.__procIndex;
  const targetIdx = ctx.procesoIndex.get(s.name);
  if (targetIdx >= callerAllowed) {
    throw new RInfoError(`El proceso '${s.name}' debe estar declarado antes del proceso que lo invoca (cap. 5).`, s.lineNo);
  }
  const proc = ctx.procesos.get(s.name);
  if (s.args.length !== proc.params.length) {
    throw new RInfoError(`'${s.name}' espera ${proc.params.length} parametro(s) y recibio ${s.args.length}.`, s.lineNo);
  }
  const newScope = { vars: {}, types: {}, kinds: {}, __procIndex: targetIdx };
  const esBindings = [];
  proc.params.forEach((p, i) => {
    const argNode = s.args[i];
    const wantedType = p.type === 'numero' ? 'number' : 'boolean';
    if (p.cls === 'ES') {
      if (argNode.k !== 'id') throw new RInfoError(`El parametro ES '${p.name}' de '${s.name}' requiere que se le pase una variable, no una expresion.`, s.lineNo);
      if (!(argNode.name in scope.vars)) throw new RInfoError(`Variable no declarada: '${argNode.name}'.`, s.lineNo);
      esBindings.push({ callerName: argNode.name, paramName: p.name });
    }
    const v = evalExpr(argNode, scope, ctx);
    assertType(v, wantedType, s);
    newScope.vars[p.name] = v; newScope.types[p.name] = wantedType; newScope.kinds[p.name] = p.cls;
  });
  for (const l of proc.locals) { newScope.vars[l.name] = l.type === 'numero' ? 0 : false; newScope.types[l.name] = l.type === 'numero' ? 'number' : 'boolean'; newScope.kinds[l.name] = 'var'; }
  execBlock(proc.body, newScope, ctx);
  for (const b of esBindings) scope.vars[b.callerName] = newScope.vars[b.paramName];
}

function run(source, opts) {
  opts = opts || {};
  let ast;
  try {
    ast = parsePrograma(source);
  } catch (e) {
    if (e && e.isRInfo) return { ast: null, trace: [], informe: [], error: { message: e.message, lineNo: e.lineNo, phase: 'parse' }, finalRobot: null, finalCity: new Map(), steps: 0 };
    throw e;
  }
  const ctx = new Ctx(ast, opts);
  const topScope = { vars: {}, types: {}, kinds: {} };
  let error = null;
  try {
    execBlock(ast.mainBody, topScope, ctx);
  } catch (e) {
    if (e && e.isRInfo) error = { message: e.message, lineNo: e.lineNo, phase: 'run' };
    else throw e;
  }
  return { ast, trace: ctx.trace, informe: ctx.informe, error, finalRobot: ctx.robot, finalCity: ctx.city, steps: ctx.steps };
}

 return { run: run, RInfoError: RInfoError, parsePrograma: parsePrograma }; })();
