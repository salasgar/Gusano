/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Compartir por URL (ESPECIFICACION.md §7.4): la partida viaja en el hash como base64url de un JSON
//   { v: 1, g, pa, t, n, i, s, j }
// y se reconstruye reproduciendo las jugadas con jugarEnPartida.
// j lleva una lista por ronda (par 1 ronda 1, par 1 ronda 2, par 2 ronda 1, …) con las jugadas que
// hay que reproducir: sin la casilla inicial cuando la puso la app (inicio al azar, o la segunda
// ronda de un par con inicio libre).
// Si los pares no comparten tablero, `ts` (lista de { g, pa } o { t }, uno por par) sustituye a g/pa/t.

import { nuevaPartida, jugarEnPartida } from '../motor/partida.js';
import { generador } from '../tableros/index.js';
import { validarTablero } from '../tableros/tipos.js';

const VERSION = 1;
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

function jugadasPorRonda(partida) {
  const rondas = [];
  for (const par of partida.pares) {
    par.rondas.forEach((ronda, r) => {
      const puesta = par.inicioFijo !== null && (partida.inicio === 'azar' || r === 1) ? 1 : 0;
      rondas.push(ronda.camino.slice(puesta));
    });
  }
  return rondas;
}

export function codificar(partida) {
  const descriptores = partida.pares.map((par) => descriptorDe(par.tablero));
  const carga = { v: VERSION };
  const primero = JSON.stringify(descriptores[0]);
  if (descriptores.every((d) => JSON.stringify(d) === primero)) Object.assign(carga, descriptores[0]);
  else carga.ts = descriptores;
  carga.n = partida.nombres;
  carga.i = partida.inicio;
  carga.s = partida.semilla;
  carga.j = jugadasPorRonda(partida);
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

const esJugada = (x) => Number.isInteger(x) && x >= 0;

function reconstruir(texto) {
  const c = JSON.parse(desdeBase64url(texto));
  if (c === null || typeof c !== 'object' || c.v !== VERSION) return null;
  const { n, i, s, j } = c;
  if (!Array.isArray(n) || n.length !== 2 || !n.every((x) => typeof x === 'string' && x.length <= MAX_NOMBRE)) return null;
  if (i !== 'azar' && i !== 'libre') return null;
  if (!Number.isInteger(s)) return null;
  if (!Array.isArray(j) || j.length === 0 || j.length % 2 !== 0 || j.length > 2 * MAX_PARES) return null;
  if (!j.every((r) => Array.isArray(r) && r.length <= MAX_CASILLAS && r.every(esJugada))) return null;

  const pares = j.length / 2;
  let tableros;
  if (c.ts !== undefined) {
    if (!Array.isArray(c.ts) || c.ts.length !== pares) return null;
    tableros = c.ts.map(tableroDe);
  } else {
    const uno = tableroDe(c);
    tableros = Array.from({ length: pares }, () => uno);
  }

  let partida = nuevaPartida({ nombres: n, tableros, inicio: i, semilla: s });
  for (let k = 0; k < j.length; k++) {
    if (j[k].length === 0) continue;
    if (partida.terminada || partida.par * 2 + partida.ronda !== k) return null;
    for (const casilla of j[k]) partida = jugarEnPartida(partida, casilla); // lanza si es ilegal
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
