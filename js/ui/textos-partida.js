/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Textos y cuentas de la pantalla de juego: saldo de suma cero, ventana de papeles, fin de ronda y
// resultado (ESPECIFICACION.md §6, «Marcador de suma cero…»). Funciones puras, sin DOM.
// Los textos marcan con **…** lo que la ventana pone en negrita.

import { puntuacion } from '../motor/ronda.js';
import { marcador } from '../motor/partida.js';

const MENOS = '−';

// Saldo de cada jugador: lo que gana como gusano menos lo que pierde como pájaro. Uno es el opuesto del otro.
export function saldos(puntos) {
  return [puntos[0] - puntos[1], puntos[1] - puntos[0]];
}

// '+9', '−9' (signo menos U+2212) o '0'.
export function conSigno(n) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${MENOS}${-n}`;
  return '0';
}

const entero = (n) => (n < 0 ? `${MENOS}${-n}` : String(n));

// Marcador tal como estaba al cerrarse la ronda `cierre` ({ par, ronda }): no cuenta la ronda siguiente,
// que `marcador()` ya incluye en cuanto el motor pasa a ella (su casilla inicial vale puntos).
export function marcadorAlCierre(partida, cierre) {
  return marcador({ ...partida, par: cierre.par, ronda: cierre.ronda });
}

export const hayValores = (tablero) => tablero.casillas.some((c) => !c.bloqueada && (c.valor ?? 1) !== 1);

// ¿La ronda en curso aún no ha tenido ninguna jugada? (la casilla inicial puesta por la app no cuenta)
export function sinEmpezar(partida) {
  if (partida.terminada) return false;
  const par = partida.pares[partida.par];
  return par.rondas[partida.ronda].camino.length <= (par.inicioFijo !== null ? 1 : 0);
}

// Ventana que explica los papeles de la ronda en curso.
export function papeles(partida, nombres = partida.nombres) {
  const par = partida.pares[partida.par];
  const valores = hayValores(par.tablero);
  const gusano = nombres[partida.ronda];
  const pajaro = nombres[1 - partida.ronda];
  const largo = valores ? 'que las casillas del gusano sumen lo más posible' : 'que el gusano sea lo más largo posible';
  const corto = valores ? 'que las casillas del gusano sumen lo menos posible' : 'que el gusano sea lo más corto posible';
  const empieza = par.rondas[partida.ronda].camino.length === 0
    ? `Empieza ${gusano} eligiendo la casilla inicial.`
    : `La casilla inicial ya está puesta: mueve primero ${pajaro} (pájaro).`;
  return {
    titulo: `Par ${partida.par + 1} · Ronda ${partida.ronda + 1}`,
    parrafos: [
      `**${gusano} es el gusano**: tiene que conseguir ${largo}. **${pajaro} es el pájaro**: tiene que conseguir ${corto}.`,
      empieza,
    ],
    boton: 'Empezar',
  };
}

// «Gana Jugador B con +4 (8 como gusano frente a 4).» / «Empate (8 y 8 como gusano).»
export function resultado(partida, nombres = partida.nombres) {
  const m = marcador(partida);
  if (m.ganador === null) return `Empate (${m.puntos[0]} y ${m.puntos[1]} como gusano).`;
  const g = m.ganador;
  return `Gana ${nombres[g]} con ${conSigno(saldos(m.puntos)[g])} (${m.puntos[g]} como gusano frente a ${m.puntos[1 - g]}).`;
}

// Ventana de fin de ronda. `partida` es la que devuelve el motor tras la última jugada; `cierre` = { par, ronda }
// de la ronda que se acaba de cerrar. `continuar` es null si la partida ha terminado.
export function finDeRonda(partida, cierre, nombres = partida.nombres) {
  const cerrada = partida.pares[cierre.par].rondas[cierre.ronda];
  const n = puntuacion(cerrada);
  const valores = hayValores(partida.pares[cierre.par].tablero);
  const gusano = nombres[cierre.ronda];
  const medida = valores ? `sus casillas suman ${entero(n)}` : `mide ${n} ${n === 1 ? 'casilla' : 'casillas'}`;
  const ganancia = [0, 1].map((i) => `${nombres[i]} ${conSigno(i === cierre.ronda ? n : -n)}`);
  const [sa, sb] = saldos(marcadorAlCierre(partida, cierre).puntos);
  const parrafos = [
    `Fin de la ronda ${cierre.ronda + 1} del par ${cierre.par + 1}. El gusano de ${gusano} ${medida}: ${ganancia[0]}, ${ganancia[1]}.`,
    `Saldo: ${nombres[0]} ${conSigno(sa)} · ${nombres[1]} ${conSigno(sb)}.`,
  ];
  let continuar = null;
  if (partida.terminada) {
    parrafos.push(resultado(partida, nombres));
  } else {
    const mismoPar = partida.par === cierre.par;
    const g = nombres[partida.ronda];
    const p = nombres[1 - partida.ronda];
    parrafos.push(mismoPar
      ? `En la ronda ${partida.ronda + 1}, ${g} es el gusano y ${p} el pájaro.`
      : `En el par ${partida.par + 1}, ronda ${partida.ronda + 1}, ${g} es el gusano y ${p} el pájaro.`);
    continuar = mismoPar ? `Continuar con la ronda ${partida.ronda + 1}` : `Continuar con el par ${partida.par + 1}`;
  }
  return { titulo: `Fin de la ronda ${cierre.ronda + 1}`, parrafos, continuar };
}
