/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Compartir por URL (ESPECIFICACION.md §7.4): la partida viaja en el hash como base64url de un JSON
//   { v: 1, g, pa, t, n, i, s, j }
// y se reconstruye reproduciendo las jugadas con jugarEnPartida. Con un modo distinto del clásico la
// versión es 2: añade `m: [gusanos, cabezas]` y cada jugada de `j` es la casilla (extremo 0) o
// [casilla, 1] (extremo 1). El clásico sigue siendo v: 1 exacta.
// j lleva una lista por ronda (par 1 ronda 1, par 1 ronda 2, par 2 ronda 1, …) con las jugadas que
// hay que reproducir: sin la casilla inicial cuando la puso la app (inicio al azar, o la segunda
// ronda de un par con inicio libre).
// Si los pares no comparten tablero, `ts` (lista de { g, pa } o { t }, uno por par) sustituye a g/pa/t.
// Con obstáculos, sentido único o valores, `o: { g, pa, ob, se, va }` (v: 2) sustituye a los tableros
// literales: cada par rehace el suyo con esos ajustes y la semilla `s` (§10.7).

import { nuevaPartida, jugarEnPartida } from '../motor/partida.js';
import { generador } from '../tableros/index.js';
import { validarTablero } from '../tableros/tipos.js';
import { modosValores } from '../tableros/valores.js';
import { tableroDelPar } from '../ui/ajustes.js';

const VERSION = 1;
const VERSION_MODOS = 2; // §10.6: lleva `m: [gusanos, cabezas]` y los extremos
const MAX_PARES = 20;
const MAX_CASILLAS = 500;
const MAX_NOMBRE = 40;

// ---------- base64url ----------

function aBase64url(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function desdeBase64url(carga) {
  if (!/^[A-Za-z0-9_-]*$/.test(carga)) throw new Error('base64url no válido');
  const base64 = carga.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

// ---------- codificar ----------

// Cómo se reconstruye un tablero: por su generador si regenerarlo da el mismo tablero; si no, literal.
function descriptorDe(tablero) {
  const g = tablero.generador && generador(tablero.generador.id);
  if (g) {
    try {
      const pa = tablero.generador.parametros ?? {};
      if (JSON.stringify(g.crear(pa)) === JSON.stringify(tablero)) return { g: tablero.generador.id, pa };
    } catch {
      // cae al tablero literal
    }
  }
  return { t: tablero };
}

const esClasico = (modo) => (modo?.gusanos ?? 1) === 1 && (modo?.cabezas ?? 1) === 1;

// v: 1 lleva casillas; v: 2, una casilla (extremo 0) o [casilla, 1] (extremo 1). El gusano sale del turno.
function jugadasPorRonda(partida, v2) {
  const rondas = [];
  for (const par of partida.pares) {
    par.rondas.forEach((ronda, r) => {
      const hechas = par.inicioFijo !== null && (partida.inicio === 'azar' || r === 1) ? [par.inicioFijo].flat().length : 0;
      if (!v2) rondas.push(ronda.camino.slice(hechas));
      else rondas.push(ronda.jugadas.slice(hechas).map((j) => (j.extremo === 1 ? [j.casilla, 1] : j.casilla)));
    });
  }
  return rondas;
}

// §10.7: `o` = { g, pa, ob, se, va } (los tres últimos solo si no son 0 / 'sin'). Solo vale si cada
// tablero de la partida es exactamente el que `tableroDelPar` rehace con esos ajustes; si no, null.
function origenCorto(partida) {
  const origen = partida.origen;
  if (!origen || origen.tableroFijo || !generador(origen.generadorId)) return null;
  const ob = origen.obstaculos ?? 0;
  const se = origen.sentido ?? 0;
  const va = origen.valores ?? 'sin';
  if (ob === 0 && se === 0 && va === 'sin') return null;
  const completo = { ...origen, obstaculos: ob, sentido: se, valores: va, semilla: partida.semilla };
  try {
    const reproduce = partida.pares.every((par, k) => JSON.stringify(tableroDelPar(completo, k)) === JSON.stringify(par.tablero));
    if (!reproduce) return null;
  } catch {
    return null;
  }
  const o = { g: origen.generadorId, pa: origen.parametros ?? {} };
  if (ob !== 0) o.ob = ob;
  if (se !== 0) o.se = se;
  if (va !== 'sin') o.va = va;
  return o;
}

export function codificar(partida) {
  const corto = origenCorto(partida);
  const v2 = !esClasico(partida.modo) || corto !== null;
  const carga = { v: v2 ? VERSION_MODOS : VERSION };
  if (v2) carga.m = [partida.modo?.gusanos ?? 1, partida.modo?.cabezas ?? 1];
  if (corto) carga.o = corto;
  else {
    const descriptores = partida.pares.map((par) => descriptorDe(par.tablero));
    const primero = JSON.stringify(descriptores[0]);
    if (descriptores.every((d) => JSON.stringify(d) === primero)) Object.assign(carga, descriptores[0]);
    else carga.ts = descriptores;
  }
  carga.n = partida.nombres;
  carga.i = partida.inicio;
  carga.s = partida.semilla;
  carga.j = jugadasPorRonda(partida, v2);
  return aBase64url(JSON.stringify(carga));
}

// ---------- decodificar ----------

function tableroDe({ g, pa, t }) {
  let tablero;
  if (t !== undefined) {
    if (!validarTablero(t).ok) throw new Error('tablero no válido');
    tablero = t;
  } else {
    const gen = generador(g);
    if (!gen) throw new Error('generador desconocido');
    if (pa === null || typeof pa !== 'object' || Array.isArray(pa)) throw new Error('parámetros no válidos');
    tablero = gen.crear(pa);
  }
  if (tablero.casillas.length > MAX_CASILLAS) throw new Error('tablero demasiado grande');
  return tablero;
}

const esCasilla = (x) => Number.isInteger(x) && x >= 0;
const esJugada = (x) => esCasilla(x) || (Array.isArray(x) && x.length === 2 && esCasilla(x[0]) && (x[1] === 0 || x[1] === 1));
const aJugada = (x) => (Array.isArray(x) ? { casilla: x[0], extremo: x[1] } : { casilla: x, extremo: 0 });

function reconstruir(texto) {
  const c = JSON.parse(desdeBase64url(texto));
  if (c === null || typeof c !== 'object' || (c.v !== VERSION && c.v !== VERSION_MODOS)) return null;
  const v2 = c.v === VERSION_MODOS;
  let modo;
  if (v2) {
    const { m } = c;
    if (!Array.isArray(m) || m.length !== 2 || !m.every((x) => x === 1 || x === 2)) return null;
    modo = { gusanos: m[0], cabezas: m[1] };
  }
  const { n, i, s, j } = c;
  if (!Array.isArray(n) || n.length !== 2 || !n.every((x) => typeof x === 'string' && x.length <= MAX_NOMBRE)) return null;
  if (i !== 'azar' && i !== 'libre') return null;
  if (!Number.isInteger(s)) return null;
  if (!Array.isArray(j) || j.length === 0 || j.length % 2 !== 0 || j.length > 2 * MAX_PARES) return null;
  if (!j.every((r) => Array.isArray(r) && r.length <= MAX_CASILLAS && r.every(v2 ? esJugada : esCasilla))) return null;

  const pares = j.length / 2;
  let tableros;
  let origen;
  if (c.o !== undefined) {
    // Solo en v: 2. Cada tablero se rehace con los ajustes y el índice de su par (§10.7).
    const { o } = c;
    if (!v2 || o === null || typeof o !== 'object' || Array.isArray(o)) return null;
    const { g, pa, ob = 0, se = 0, va = 'sin' } = o;
    if (typeof g !== 'string' || !generador(g)) return null;
    if (pa === null || typeof pa !== 'object' || Array.isArray(pa)) return null;
    if (![ob, se].every((x) => typeof x === 'number' && x >= 0 && x <= 1)) return null;
    if (va !== 'sin' && !modosValores.includes(va)) return null;
    origen = { generadorId: g, parametros: pa, obstaculos: ob, sentido: se, valores: va, semilla: s };
    tableros = Array.from({ length: pares }, (_, k) => tableroDelPar(origen, k));
    if (tableros.some((t) => t.casillas.length > MAX_CASILLAS)) throw new Error('tablero demasiado grande');
  } else if (c.ts !== undefined) {
    if (!Array.isArray(c.ts) || c.ts.length !== pares) return null;
    tableros = c.ts.map(tableroDe);
  } else {
    const uno = tableroDe(c);
    tableros = Array.from({ length: pares }, () => uno);
  }

  let partida = nuevaPartida({ nombres: n, tableros, inicio: i, semilla: s, ...(v2 && { modo }) });
  if (origen) partida.origen = origen;
  for (let k = 0; k < j.length; k++) {
    if (j[k].length === 0) continue;
    if (partida.terminada || partida.par * 2 + partida.ronda !== k) return null;
    // lanza si es ilegal; en v: 2 siempre como objeto, porque un índice puede ser ambiguo con dos cabezas
    for (const jugada of j[k]) partida = jugarEnPartida(partida, v2 ? aJugada(jugada) : jugada);
  }
  return partida;
}

// Partida reconstruida, o null si el texto no es una carga válida.
export function decodificar(texto) {
  try {
    return reconstruir(texto);
  } catch {
    return null;
  }
}

// ---------- enlaces ----------

// URL absoluta que reproduce la partida (en Node, sin `location`, solo la parte desde `#`).
export function enlaceDe(partida) {
  let carga;
  try {
    carga = codificar(partida);
  } catch {
    return null;
  }
  const fragmento = `#jugar&p=${carga}`;
  if (typeof location === 'undefined') return fragmento;
  return location.origin + location.pathname + fragmento;
}

// Partida reconstruida desde location.hash, o null si el enlace no trae ninguna.
export function partidaDesdeURL() {
  if (typeof location === 'undefined') return null;
  const parte = location.hash.replace(/^#/, '').split('&').find((p) => p.startsWith('p='));
  return parte ? decodificar(parte.slice(2)) : null;
}
