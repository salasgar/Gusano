/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Resolutor exacto (minimax con memoria) de una ronda. ESPECIFICACION.md §4 y §10.4.
// Trabaja sobre un estado mutable (`crearEstado`) con las casillas ocupadas en una máscara de bits;
// con ≤ 30 casillas cabe en un entero positivo y la clave de memoria es un número exacto
// (máscara, extremos de cada gusano y, con dos gusanos, quién mueve: ≤ 51 bits).

import { nuevaRonda, jugar, jugadasEn, puntuacion, maximiza } from '../motor/ronda.js';

export const MAX_CASILLAS_EXACTO = 30;

// Una jugada se codifica como `casilla * 2 + extremo` (el gusano es el que mueve).
// Los índices que devuelve la máquina siguen la regla de §10.4: índice si la casilla admite una sola
// jugada, objeto si no.
export function codigoAJugada(ronda, codigo) {
  const casilla = codigo >> 1;
  const posibles = jugadasEn(ronda, casilla);
  if (posibles.length === 1) return casilla;
  const extremo = codigo & 1;
  return posibles.find((j) => j.extremo === extremo);
}

// Copia mutable de la ronda para buscar sin construir objetos nuevos en cada jugada. `aplicar` y
// `deshacer` se apilan; `movimientos` reproduce `jugadasCompletas` del motor (mismo orden).
export function crearEstado(ronda) {
  const { tablero } = ronda;
  const modo = ronda.modo ?? { gusanos: 1, cabezas: 1 };
  const { gusanos, cabezas } = modo;
  const cuerpos = ronda.cuerpos ?? [ronda.camino];
  const n = tablero.casillas.length;
  const grande = n > MAX_CASILLAS_EXACTO;
  const valores = tablero.casillas.map((c) => c.valor ?? 1);
  const vecinos = tablero.vecinos;
  const predecesores = tablero.predecesores ?? vecinos;
  const dirigido = tablero.dirigido === true;
  const bit = (i) => (grande ? 1n << BigInt(i) : 1 << i);

  const ocupadas = new Uint8Array(n);
  const e = {
    n, grande, valores, vecinos, predecesores, gusanos, cabezas, ocupadas,
    mascara: grande ? 0n : 0,
    cabeza: [-1, -1], cola: [-1, -1], largo: [0, 0],
    mueve: maximiza(ronda) ? 0 : 1,
    colocadas: ronda.camino.length,
    puntos: puntuacion(ronda),
  };
  tablero.casillas.forEach((c, i) => { if (c.bloqueada) { ocupadas[i] = 1; e.mascara |= bit(i); } });
  for (const c of ronda.camino) { ocupadas[c] = 1; e.mascara |= bit(c); }
  cuerpos.forEach((cuerpo, g) => {
    if (cuerpo.length === 0) return;
    e.cabeza[g] = cuerpo[cuerpo.length - 1];
    e.cola[g] = cuerpo[0];
    e.largo[g] = cuerpo.length;
  });

  // Gusano que mueve ahora (con un gusano, siempre el 0).
  e.gusanoQueMueve = () => (gusanos === 2 ? e.mueve : 0);

  const hayLibre = (lista) => { for (const j of lista) if (!ocupadas[j]) return true; return false; };
  // Con una sola casilla y sin flechas, crecer por la cola daría el mismo gusano: no se ofrece.
  const ofreceCola = (g) => cabezas === 2 && (e.largo[g] >= 2 || dirigido);
  e.ofreceCola = ofreceCola;

  e.puedeCrecer = (g) => {
    if (e.largo[g] === 0) { for (let i = 0; i < n; i++) if (!ocupadas[i]) return true; return false; }
    return hayLibre(vecinos[e.cabeza[g]]) || (ofreceCola(g) && hayLibre(predecesores[e.cola[g]]));
  };

  e.movimientos = () => {
    const g = e.gusanoQueMueve();
    const lista = [];
    if (e.largo[g] === 0) {
      for (let i = 0; i < n; i++) if (!ocupadas[i]) lista.push(i * 2);
      return lista;
    }
    for (const j of vecinos[e.cabeza[g]]) if (!ocupadas[j]) lista.push(j * 2);
    if (ofreceCola(g)) for (const j of predecesores[e.cola[g]]) if (!ocupadas[j]) lista.push(j * 2 + 1);
    return lista;
  };

  // Tras la jugada de g mueve el otro; si el otro no puede crecer y g sí, repite g (§10.3).
  const siguiente = (g) => {
    if (gusanos === 1) return e.colocadas % 2;
    if (e.colocadas < 2) return e.colocadas;
    const otro = 1 - g;
    return !e.puedeCrecer(otro) && e.puedeCrecer(g) ? g : otro;
  };

  const pila = new Int32Array(6 * (n + 2));
  let altura = 0;
  e.aplicar = (codigo) => {
    const casilla = codigo >> 1;
    const g = e.gusanoQueMueve();
    pila.set([g, e.cabeza[g], e.cola[g], e.largo[g], e.mueve, casilla], altura);
    altura += 6;
    ocupadas[casilla] = 1;
    e.mascara |= bit(casilla);
    if ((codigo & 1) === 0) {
      e.cabeza[g] = casilla;
      if (e.largo[g] === 0) e.cola[g] = casilla;
    } else {
      e.cola[g] = casilla;
    }
    e.largo[g] += 1;
    e.colocadas += 1;
    e.puntos += g === 0 ? valores[casilla] : -valores[casilla];
    e.mueve = siguiente(g);
  };
  e.deshacer = () => {
    altura -= 6;
    const [g, cabeza, cola, largo, mueve, casilla] = pila.subarray(altura, altura + 6);
    ocupadas[casilla] = 0;
    e.mascara ^= bit(casilla);
    e.cabeza[g] = cabeza;
    e.cola[g] = cola;
    e.largo[g] = largo;
    e.mueve = mueve;
    e.colocadas -= 1;
    e.puntos -= g === 0 ? valores[casilla] : -valores[casilla];
  };

  // Clave de memoria: todo lo que determina lo que queda por jugar.
  e.clave = grande
    ? () => `${e.mascara.toString(36)},${e.cabeza[0]},${cabezas === 2 ? e.cola[0] : ''},${
      gusanos === 2 ? `${e.cabeza[1]},${cabezas === 2 ? e.cola[1] : ''},${e.mueve}` : ''}`
    : () => {
      let k = e.mascara * 32 + e.cabeza[0] + 1;
      if (cabezas === 2) k = k * 32 + e.cola[0] + 1;
      if (gusanos === 2) {
        k = k * 32 + e.cabeza[1] + 1;
        if (cabezas === 2) k = k * 32 + e.cola[1] + 1;
        k = k * 2 + e.mueve;
      }
      return k;
    };
  return e;
}

// opciones.tiempoMaximoMs (opcional): además del presupuesto de estados, un límite de tiempo.
export function valorExacto(ronda, { maxEstados = 2_000_000, tiempoMaximoMs = Infinity } = {}) {
  if (ronda.tablero.casillas.length > MAX_CASILLAS_EXACTO) {
    return { valor: puntuacion(ronda), jugada: null, estados: 0, completo: false };
  }
  const e = crearEstado(ronda);
  const memoria = new Map();
  const limite = performance.now() + tiempoMaximoMs;
  let estados = 0;
  let agotado = false;

  // Puntos (gusano 0 menos gusano 1) que quedan por sumar desde aquí con juego perfecto.
  const resolver = () => {
    const clave = e.clave();
    const guardado = memoria.get(clave);
    if (guardado !== undefined) return guardado;
    if (++estados > maxEstados || (estados % 1024 === 0 && performance.now() > limite)) {
      agotado = true;
      return 0;
    }
    const maximizando = e.mueve === 0;
    let mejor = null;
    for (const m of e.movimientos()) {
      const antes = e.puntos;
      e.aplicar(m);
      const v = e.puntos - antes + resolver();
      e.deshacer();
      if (agotado) return 0;
      if (mejor === null || (maximizando ? v > mejor : v < mejor)) mejor = v;
    }
    if (mejor === null) mejor = 0;
    memoria.set(clave, mejor);
    return mejor;
  };

  const maximizando = e.mueve === 0;
  let mejor = null;
  let elegida = null;
  for (const m of e.movimientos()) {
    const antes = e.puntos;
    e.aplicar(m);
    const v = e.puntos - antes + resolver();
    e.deshacer();
    if (agotado) break;
    if (mejor === null || (maximizando ? v > mejor : v < mejor)) { mejor = v; elegida = m; }
  }
  return {
    valor: puntuacion(ronda) + (mejor ?? 0),
    jugada: elegida === null ? null : codigoAJugada(ronda, elegida),
    estados,
    completo: !agotado,
  };
}

// Valor exacto de la ronda con la casilla inicial ya puesta; null si no cabe en el presupuesto.
// opciones.modo (opcional) es el modo de la ronda; sin él, el clásico.
export function par(tablero, inicio, opciones) {
  const resultado = valorExacto(jugar(nuevaRonda(tablero, opciones?.modo), inicio), opciones);
  return resultado.completo ? resultado.valor : null;
}
