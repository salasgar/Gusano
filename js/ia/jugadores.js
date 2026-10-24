/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Niveles de máquina (ESPECIFICACION.md §4). `elegirJugada` es síncrona.

import { crearAzar } from '../util/azar.js';
import { jugadasLegales, jugar, turno, alcanzables, rondaTerminada, puntuacion } from '../motor/ronda.js';
import { valorExacto, MAX_CASILLAS_EXACTO } from './minimax.js';

export const niveles = [
  { id: 'aleatorio', nombre: 'Aleatorio' },
  { id: 'voraz', nombre: 'Voraz' },
  { id: 'fuerte', nombre: 'Fuerte' },
  { id: 'perfecto', nombre: 'Perfecto' },
];

export function elegirJugada(nivelId, ronda, { azar = crearAzar(), tiempoMaximoMs = 1500 } = {}) {
  if (!niveles.some((n) => n.id === nivelId)) throw new Error(`nivel desconocido: ${nivelId}`);
  const legales = jugadasLegales(ronda);
  if (legales.length === 0) throw new Error('no hay jugadas legales');
  if (legales.length === 1) return legales[0];
  switch (nivelId) {
    case 'aleatorio': return azar.elegir(legales);
    case 'voraz': return jugadaVoraz(ronda, legales, azar);
    case 'fuerte': return jugadaFuerte(ronda, legales, azar, tiempoMaximoMs);
    default: return jugadaPerfecta(ronda, legales, azar);
  }
}

// ---------- voraz ----------

// Casillas que quedan alcanzables tras la jugada; -1 si la jugada cierra la ronda.
// El gusano maximiza (así evita cerrarla si hay otra) y el pájaro minimiza (así prefiere cerrarla).
function jugadaVoraz(ronda, legales, azar) {
  const gusano = turno(ronda) === 'gusano';
  const puntos = legales.map((j) => {
    const siguiente = jugar(ronda, j);
    return rondaTerminada(siguiente) ? -1 : alcanzables(siguiente).length;
  });
  const objetivo = gusano ? Math.max(...puntos) : Math.min(...puntos);
  return azar.elegir(legales.filter((_, k) => puntos[k] === objetivo));
}

// ---------- fuerte ----------

// Alfa-beta con profundización iterativa sobre un estado mutable. Hoja heurística:
// puntuación + 0,5 × (cota superior − puntuación); hoja terminal: puntuación.
function jugadaFuerte(ronda, legales, azar, tiempoMaximoMs) {
  const { tablero } = ronda;
  const n = tablero.casillas.length;
  const valores = tablero.casillas.map((c) => c.valor ?? 1);
  const vecinos = tablero.vecinos;
  const grande = n > MAX_CASILLAS_EXACTO;
  // Máscara de ocupadas: entero para ≤ 30 casillas, BigInt si hay más.
  const bit = (i) => (grande ? 1n << BigInt(i) : 1 << i);
  const ocupadas = new Uint8Array(n);
  let mascara = grande ? 0n : 0;
  tablero.casillas.forEach((c, i) => { if (c.bloqueada) { ocupadas[i] = 1; mascara |= bit(i); } });
  for (const c of ronda.camino) { ocupadas[c] = 1; mascara |= bit(c); }
  let longitud = ronda.camino.length;
  let puntos = puntuacion(ronda);
  const clave = grande
    ? (m, cab) => `${m.toString(36)},${cab}`
    : (m, cab) => m * 64 + cab + 1;

  // Búsqueda en anchura por libres desde `desde` (−1: todas las libres). Devuelve cuántas son
  // y deja en `positivos` la suma de sus valores positivos.
  const visto = new Int32Array(n);
  const pila = new Int32Array(n);
  let marca = 0;
  let positivos = 0;
  const alcance = (desde) => {
    marca += 1;
    let cuenta = 0;
    positivos = 0;
    let altura = 0;
    if (desde < 0) {
      for (let i = 0; i < n; i++) if (!ocupadas[i]) { cuenta += 1; if (valores[i] > 0) positivos += valores[i]; }
      return cuenta;
    }
    pila[altura++] = desde;
    visto[desde] = marca;
    while (altura > 0) {
      const actual = pila[--altura];
      for (const j of vecinos[actual]) {
        if (ocupadas[j] || visto[j] === marca) continue;
        visto[j] = marca;
        cuenta += 1;
        if (valores[j] > 0) positivos += valores[j];
        pila[altura++] = j;
      }
    }
    return cuenta;
  };

  const movimientos = (desde) => {
    if (desde < 0) {
      const todas = [];
      for (let i = 0; i < n; i++) if (!ocupadas[i]) todas.push(i);
      return todas;
    }
    return vecinos[desde].filter((j) => !ocupadas[j]);
  };

  const ocupar = (j) => { ocupadas[j] = 1; mascara |= bit(j); longitud += 1; puntos += valores[j]; };
  const liberar = (j) => { ocupadas[j] = 0; mascara ^= bit(j); longitud -= 1; puntos -= valores[j]; };

  // Orden voraz: el gusano prueba antes las jugadas que dejan más alcanzables; el pájaro, las que dejan menos.
  const ordenar = (lista, gusano, primera) => {
    const clasificada = lista.map((j) => {
      ocupar(j);
      const cuenta = alcance(j);
      const s = cuenta === 0 ? -1 : cuenta;
      liberar(j);
      return { j, s: j === primera ? (gusano ? Infinity : -Infinity) : s };
    });
    clasificada.sort((a, b) => (gusano ? b.s - a.s : a.s - b.s));
    return clasificada.map((x) => x.j);
  };

  const limite = performance.now() + tiempoMaximoMs;
  let nodos = 0;
  let agotado = false;
  let hojasHeuristicas = 0; // cuántas hojas se han valorado por heurística (0 en una iteración = resuelto)
  const tabla = new Map();

  const buscar = (desde, prof, alfa, beta) => {
    if (++nodos % 256 === 0 && performance.now() > limite) agotado = true;
    if (agotado) return 0;
    const lista = movimientos(desde);
    if (lista.length === 0) return puntos;
    if (prof === 0) {
      hojasHeuristicas += 1;
      alcance(desde);
      return puntos + 0.5 * positivos;
    }
    const gusano = longitud % 2 === 0;
    const k = clave(mascara, desde);
    const guardado = tabla.get(k);
    let primera = -1;
    if (guardado) {
      primera = guardado.mejor;
      if (guardado.prof >= prof) {
        if (guardado.heuristico) hojasHeuristicas += 1;
        if (guardado.tipo === 'exacto') return guardado.valor;
        if (guardado.tipo === 'inferior') alfa = Math.max(alfa, guardado.valor);
        else beta = Math.min(beta, guardado.valor);
        if (alfa >= beta) return guardado.valor;
      }
    }
    const alfaInicial = alfa;
    const betaInicial = beta;
    const hojasAntes = hojasHeuristicas;
    let mejor = gusano ? -Infinity : Infinity;
    let mejorJugada = -1;
    for (const j of ordenar(lista, gusano, primera)) {
      ocupar(j);
      const v = buscar(j, prof - 1, alfa, beta);
      liberar(j);
      if (agotado) return 0;
      if (gusano ? v > mejor : v < mejor) { mejor = v; mejorJugada = j; }
      if (gusano) alfa = Math.max(alfa, mejor); else beta = Math.min(beta, mejor);
      if (alfa >= beta) break;
    }
    const tipo = mejor <= alfaInicial ? 'superior' : mejor >= betaInicial ? 'inferior' : 'exacto';
    tabla.set(k, { prof, valor: mejor, tipo, mejor: mejorJugada, heuristico: hojasHeuristicas > hojasAntes });
    return mejor;
  };

  const gusano = turno(ronda) === 'gusano';
  let ordenRaiz = azar.barajar(legales);
  let elegida = ordenRaiz[0];
  const libresTotales = n - ocupadas.reduce((s, x) => s + x, 0);
  for (let prof = 1; prof <= libresTotales; prof++) {
    ordenRaiz = ordenar(ordenRaiz, gusano, elegida);
    hojasHeuristicas = 0;
    let mejor = gusano ? -Infinity : Infinity;
    let mejorJugada = ordenRaiz[0];
    let alfa = -Infinity;
    let beta = Infinity;
    for (const j of ordenRaiz) {
      ocupar(j);
      const v = buscar(j, prof - 1, alfa, beta);
      liberar(j);
      if (agotado) break;
      if (gusano ? v > mejor : v < mejor) { mejor = v; mejorJugada = j; }
      if (gusano) alfa = Math.max(alfa, mejor); else beta = Math.min(beta, mejor);
    }
    if (agotado) break;
    elegida = mejorJugada;
    if (hojasHeuristicas === 0) break; // resuelto hasta el final: no hay nada más que profundizar
  }
  return elegida;
}

// ---------- perfecto ----------

function jugadaPerfecta(ronda, legales, azar) {
  if (ronda.tablero.casillas.length <= MAX_CASILLAS_EXACTO) {
    const resultado = valorExacto(ronda);
    if (resultado.completo && resultado.jugada !== null) return resultado.jugada;
  }
  return jugadaFuerte(ronda, legales, azar, 3000);
}
