/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Partida por pares de rondas en formato duplicado (ESPECIFICACION.md §3.2 y §10.3).
// Funciones puras: cada una devuelve una partida nueva y no muta la que recibe.

import { crearAzar } from '../util/azar.js';
import { nuevaRonda, jugar, rondaTerminada, puntuacion } from './ronda.js';

const CLASICO = { gusanos: 1, cabezas: 1 };

const libresDe = (tablero) => tablero.casillas.map((_, i) => i).filter((i) => !tablero.casillas[i].bloqueada);

// Un gusano: una casilla no bloqueada; con flechas, una que tenga al menos una salida.
// Gasta un solo número del azar, como en la tanda 1 (anadirPar cuenta con ello).
function sortearInicio(tablero, azar) {
  const libres = libresDe(tablero);
  if (tablero.dirigido === true) {
    const conSalida = libres.filter((i) => tablero.vecinos[i].some((j) => !tablero.casillas[j].bloqueada));
    if (conSalida.length > 0) return azar.elegir(conSalida);
  }
  return azar.elegir(libres);
}

// Distancias entre casillas libres contando las conexiones sin sentido y sin pasar por bloqueadas.
function distanciasDesde(tablero, origen) {
  const predecesores = tablero.predecesores ?? tablero.vecinos;
  const distancia = new Map([[origen, 0]]);
  const cola = [origen];
  while (cola.length > 0) {
    const actual = cola.shift();
    for (const vecina of [...tablero.vecinos[actual], ...predecesores[actual]]) {
      if (distancia.has(vecina) || tablero.casillas[vecina].bloqueada) continue;
      distancia.set(vecina, distancia.get(actual) + 1);
      cola.push(vecina);
    }
  }
  return distancia;
}

// Dos gusanos: dos salidas distintas y libres a distancia de al menos max(2, ⌈diámetro / 2⌉); si no
// hay ningún par así, uno de los pares más alejados. Un solo número del azar: elige el par ordenado.
function sortearSalidas(tablero, azar) {
  const libres = libresDe(tablero);
  if (libres.length < 2) throw new Error('hacen falta dos casillas libres');
  const pares = [];
  let diametro = 0;
  for (const a of libres) {
    for (const [b, d] of distanciasDesde(tablero, a)) {
      if (b === a) continue;
      pares.push([a, b, d]);
      diametro = Math.max(diametro, d);
    }
  }
  if (pares.length === 0) return azar.elegir(libres.flatMap((a) => libres.filter((b) => b !== a).map((b) => [a, b])));
  const umbral = Math.min(Math.max(2, Math.ceil(diametro / 2)), diametro);
  const [s0, s1] = azar.elegir(pares.filter(([, , d]) => d >= umbral));
  return [s0, s1];
}

// inicio: null (inicio libre), la casilla inicial (un gusano) o las dos salidas [s0, s1] (dos gusanos).
function crearPar(tablero, inicio, modo) {
  if (inicio === null) return { tablero, inicioFijo: null, rondas: [nuevaRonda(tablero, modo), nuevaRonda(tablero, modo)] };
  const puestas = Array.isArray(inicio) ? inicio : [inicio];
  const ronda = puestas.reduce((r, c) => jugar(r, c), nuevaRonda(tablero, modo));
  return { tablero, inicioFijo: inicio, rondas: [ronda, ronda] };
}

const sortear = (tablero, azar, modo) => (modo.gusanos === 2 ? sortearSalidas(tablero, azar) : sortearInicio(tablero, azar));

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

export function nuevaPartida({ nombres = ['A', 'B'], tableros, inicio = 'azar', semilla, modo = CLASICO }) {
  const azar = crearAzar(semilla);
  const m = nuevaRonda(tableros[0], modo).modo;
  const pares = tableros.map((tablero) => crearPar(tablero, inicio === 'azar' ? sortear(tablero, azar, m) : null, m));
  return avanzar({ nombres: [...nombres], inicio, semilla: azar.semilla, modo: m, pares, par: 0, ronda: 0, terminada: false });
}

export function rondaActual(partida) {
  return partida.pares[partida.par].rondas[partida.ronda];
}

// Ronda 0 del par: A (0) tiene el papel 0 (gusano, o el gusano 0); ronda 1: lo tiene B (1).
export function rolDe(partida, jugador) {
  return jugador === partida.ronda ? 'gusano' : 'pajaro';
}

export function jugadorEnTurno(partida) {
  const papel0 = partida.ronda;
  const ronda = rondaActual(partida);
  const mueve = ronda.mueve ?? ronda.camino.length % 2;
  return mueve === 0 ? papel0 : 1 - papel0;
}

// jugada: lo mismo que acepta jugar (índice de casilla u objeto { casilla, gusano, extremo }).
export function jugarEnPartida(partida, jugada) {
  if (partida.terminada) throw new Error('partida terminada');
  const { par, ronda } = partida;
  const actual = partida.pares[par];
  const nueva = jugar(actual.rondas[ronda], jugada);
  const rondas = [...actual.rondas];
  rondas[ronda] = nueva;
  let nuevoPar = { ...actual, rondas };
  // Inicio libre: lo que se pone en la ronda 0 antes del primer turno (la casilla inicial, o las dos
  // salidas con dos gusanos) pasa a ser el inicio de la ronda 1.
  const puestas = nueva.modo.gusanos === 2 ? 2 : 1;
  if (actual.inicioFijo === null && ronda === 0 && nueva.camino.length === puestas) {
    const inicioFijo = puestas === 2 ? [...nueva.camino] : nueva.camino[0];
    nuevoPar = crearPar(actual.tablero, inicioFijo, nueva.modo);
    nuevoPar.rondas = [nueva, nuevoPar.rondas[1]];
  }
  const pares = [...partida.pares];
  pares[par] = nuevoPar;
  return avanzar({ ...partida, pares });
}

// Puntos de cada jugador: los de las rondas en que tuvo el papel 0, incluidas las que están a medias.
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

// Desempate: un par más con el mismo formato y el mismo modo. El sorteo continúa la secuencia de la
// semilla (cada par gastó un número).
export function anadirPar(partida, tablero) {
  if (!partida.terminada) throw new Error('la partida no ha terminado');
  const modo = partida.modo ?? CLASICO;
  let inicio = null;
  if (partida.inicio === 'azar') {
    const azar = crearAzar(partida.semilla);
    partida.pares.forEach(() => azar.siguiente());
    inicio = sortear(tablero, azar, modo);
  }
  const pares = [...partida.pares, crearPar(tablero, inicio, modo)];
  return avanzar({ ...partida, pares, par: partida.pares.length, ronda: 0, terminada: false });
}
