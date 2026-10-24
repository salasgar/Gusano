/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Resolutor exacto (minimax con memoria) de una ronda. ESPECIFICACION.md §4.
// Las casillas ocupadas (bloqueadas incluidas) se guardan en una máscara de bits; con ≤ 30
// casillas cabe en un entero positivo de 32 bits, y la clave `mascara * 64 + cabeza + 1` es exacta.

import { nuevaRonda, jugar, puntuacion, cabeza } from '../motor/ronda.js';

export const MAX_CASILLAS_EXACTO = 30;

export function valorExacto(ronda, { maxEstados = 2_000_000 } = {}) {
  const { tablero, camino } = ronda;
  const n = tablero.casillas.length;
  if (n > MAX_CASILLAS_EXACTO) {
    return { valor: puntuacion(ronda), jugada: null, estados: 0, completo: false };
  }

  const valores = tablero.casillas.map((c) => c.valor ?? 1);
  const vecinos = tablero.vecinos;
  let inicial = 0;
  tablero.casillas.forEach((c, i) => { if (c.bloqueada) inicial |= 1 << i; });
  for (const c of camino) inicial |= 1 << c;

  const memoria = new Map();
  let estados = 0;
  let agotado = false;

  const libres = (mascara, desde) => {
    const salida = [];
    if (desde < 0) {
      for (let i = 0; i < n; i++) if (!(mascara & (1 << i))) salida.push(i);
    } else {
      for (const j of vecinos[desde]) if (!(mascara & (1 << j))) salida.push(j);
    }
    return salida;
  };

  // Puntos que quedan por sumar desde aquí con juego perfecto; `gusano` dice a quién le toca.
  const resolver = (mascara, desde, gusano) => {
    const clave = mascara * 64 + desde + 1;
    const guardado = memoria.get(clave);
    if (guardado !== undefined) return guardado;
    if (++estados > maxEstados) { agotado = true; return 0; }
    let mejor = null;
    for (const j of libres(mascara, desde)) {
      const v = valores[j] + resolver(mascara | (1 << j), j, !gusano);
      if (agotado) return 0;
      if (mejor === null || (gusano ? v > mejor : v < mejor)) mejor = v;
    }
    if (mejor === null) mejor = 0;
    memoria.set(clave, mejor);
    return mejor;
  };

  const desde = camino.length === 0 ? -1 : cabeza(ronda);
  const gusano = camino.length % 2 === 0;
  let mejor = null;
  let jugada = null;
  for (const j of libres(inicial, desde)) {
    const v = valores[j] + resolver(inicial | (1 << j), j, !gusano);
    if (agotado) break;
    if (mejor === null || (gusano ? v > mejor : v < mejor)) { mejor = v; jugada = j; }
  }
  if (agotado) {
    return { valor: puntuacion(ronda) + (mejor ?? 0), jugada, estados, completo: false };
  }
  return { valor: puntuacion(ronda) + (mejor ?? 0), jugada, estados, completo: true };
}

// Valor exacto de la ronda con la casilla inicial ya puesta; null si no cabe en el presupuesto.
export function par(tablero, inicio, opciones) {
  const resultado = valorExacto(jugar(nuevaRonda(tablero), inicio), opciones);
  return resultado.completo ? resultado.valor : null;
}
