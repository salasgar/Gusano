/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Partida por pares de rondas en formato duplicado (ESPECIFICACION.md §3.2).
// Funciones puras: cada una devuelve una partida nueva y no muta la que recibe.

import { crearAzar } from '../util/azar.js';
import { nuevaRonda, jugar, rondaTerminada, puntuacion } from './ronda.js';

function sortearInicio(tablero, azar) {
  const libres = tablero.casillas.map((_, i) => i).filter((i) => !tablero.casillas[i].bloqueada);
  return azar.elegir(libres);
}

function crearPar(tablero, inicio) {
  if (inicio === null) return { tablero, inicioFijo: null, rondas: [nuevaRonda(tablero), nuevaRonda(tablero)] };
  const ronda = jugar(nuevaRonda(tablero), inicio);
  return { tablero, inicioFijo: inicio, rondas: [ronda, ronda] };
}

// Salta las rondas que ya están terminadas al empezar (p. ej. una casilla inicial sin vecinas libres)
// y marca la partida como terminada tras la última ronda del último par.
function avanzar(partida) {
  let { par, ronda } = partida;
  let terminada = false;
  while (rondaTerminada(partida.pares[par].rondas[ronda])) {
    if (ronda === 0) {
      ronda = 1;
    } else if (par + 1 < partida.pares.length) {
      par += 1;
      ronda = 0;
    } else {
      terminada = true;
      break;
    }
  }
  return { ...partida, par, ronda, terminada };
}

export function nuevaPartida({ nombres = ['A', 'B'], tableros, inicio = 'azar', semilla }) {
  const azar = crearAzar(semilla);
  const pares = tableros.map((tablero) => crearPar(tablero, inicio === 'azar' ? sortearInicio(tablero, azar) : null));
  return avanzar({ nombres: [...nombres], inicio, semilla: azar.semilla, pares, par: 0, ronda: 0, terminada: false });
}

export function rondaActual(partida) {
  return partida.pares[partida.par].rondas[partida.ronda];
}

// Ronda 0 del par: A (0) es gusano; ronda 1: lo es B (1).
export function rolDe(partida, jugador) {
  return jugador === partida.ronda ? 'gusano' : 'pajaro';
}

export function jugadorEnTurno(partida) {
  const gusano = partida.ronda;
  return rondaActual(partida).camino.length % 2 === 0 ? gusano : 1 - gusano;
}

export function jugarEnPartida(partida, casilla) {
  if (partida.terminada) throw new Error('partida terminada');
  const { par, ronda } = partida;
  const actual = partida.pares[par];
  const nueva = jugar(actual.rondas[ronda], casilla);
  const rondas = [...actual.rondas];
  rondas[ronda] = nueva;
  let nuevoPar = { ...actual, rondas };
  // Inicio libre: la casilla que pone el gusano en la ronda 0 pasa a ser el inicio de la ronda 1.
  if (actual.inicioFijo === null && ronda === 0 && nueva.camino.length === 1) {
    nuevoPar = { ...nuevoPar, inicioFijo: casilla, rondas: [nueva, jugar(nuevaRonda(actual.tablero), casilla)] };
  }
  const pares = [...partida.pares];
  pares[par] = nuevoPar;
  return avanzar({ ...partida, pares });
}

// Puntos de cada jugador: los de las rondas en que fue gusano, incluidas las que están a medias.
// Las rondas que aún no se han empezado (la ronda 1 del par en curso, los pares siguientes) no cuentan.
export function marcador(partida) {
  const puntos = [0, 0];
  const pares = [];
  partida.pares.forEach((par, k) => {
    const alcanzada = (r) => partida.terminada || k < partida.par || (k === partida.par && r <= partida.ronda);
    const puntosA = alcanzada(0) ? puntuacion(par.rondas[0]) : 0;
    const puntosB = alcanzada(1) ? puntuacion(par.rondas[1]) : 0;
    puntos[0] += puntosA;
    puntos[1] += puntosB;
    pares.push({ puntosA, puntosB });
  });
  const ganador = !partida.terminada || puntos[0] === puntos[1] ? null : puntos[0] > puntos[1] ? 0 : 1;
  return { puntos, pares, ganador };
}

// Desempate: un par más con el mismo formato. El sorteo continúa la secuencia de la semilla.
export function anadirPar(partida, tablero) {
  if (!partida.terminada) throw new Error('la partida no ha terminado');
  let inicio = null;
  if (partida.inicio === 'azar') {
    const azar = crearAzar(partida.semilla);
    partida.pares.forEach(() => azar.siguiente());
    inicio = sortearInicio(tablero, azar);
  }
  const pares = [...partida.pares, crearPar(tablero, inicio)];
  return avanzar({ ...partida, pares, par: partida.pares.length, ronda: 0, terminada: false });
}
