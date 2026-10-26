import test from 'node:test';
import assert from 'node:assert/strict';
import { generador } from '../js/tableros/index.js';
import { conValores } from '../js/tableros/valores.js';
import { crearAzar } from '../js/util/azar.js';
import { nuevaPartida, jugarEnPartida, marcador, rondaActual } from '../js/motor/partida.js';
import { jugadasLegales } from '../js/motor/ronda.js';
import {
  saldos, conSigno, marcadorAlCierre, sinEmpezar, papeles, finDeRonda, resultado,
  dosGusanos, etiquetaDePapel, brutos, AVISO_EXTREMO,
} from '../js/ui/textos-partida.js';

const tablero = () => generador('cuadrado4').crear({ lado: 3 });
const NOMBRES = ['Jugador A', 'Jugador B'];

// Juega la primera jugada legal hasta que cambie la ronda o termine la partida.
// Devuelve la partida antes de la última jugada, la de después y la ronda que se cerró.
function jugarHastaCerrar(partida, azar = null) {
  for (;;) {
    const antes = partida;
    const legales = jugadasLegales(rondaActual(partida));
    const casilla = azar ? azar.elegir(legales) : legales[0];
    partida = jugarEnPartida(partida, casilla);
    if (partida.par !== antes.par || partida.ronda !== antes.ronda || partida.terminada) {
      return { partida, cierre: { par: antes.par, ronda: antes.ronda } };
    }
  }
}

function jugarTodo(partida, azar = null) {
  const cierres = [];
  while (!partida.terminada) {
    const r = jugarHastaCerrar(partida, azar);
    partida = r.partida;
    cierres.push(r.cierre);
  }
  return { partida, cierres };
}

test('saldos son opuestos y suman cero', () => {
  assert.deepEqual(saldos([9, 5]), [4, -4]);
  assert.deepEqual(saldos([3, 8]), [-5, 5]);
  const [a, b] = saldos([7, 7]);
  assert.equal(a + b, 0);
  assert.equal(a, 0);
});

test('conSigno: positivo, negativo (U+2212) y cero', () => {
  assert.equal(conSigno(9), '+9');
  assert.equal(conSigno(-9), '−9');
  assert.equal(conSigno(0), '0');
});

test('papeles con inicio al azar: la casilla ya está puesta y mueve el pájaro', () => {
  const partida = nuevaPartida({ nombres: NOMBRES, tableros: [tablero()], inicio: 'azar', semilla: 1 });
  const t = papeles(partida);
  assert.equal(t.titulo, 'Par 1 · Ronda 1');
  assert.match(t.parrafos[0], /\*\*Jugador A es el gusano\*\*.*lo más largo posible/);
  assert.match(t.parrafos[0], /\*\*Jugador B es el pájaro\*\*.*lo más corto posible/);
  assert.equal(t.parrafos[1], 'La casilla inicial ya está puesta: mueve primero Jugador B (pájaro).');
  assert.equal(t.boton, 'Empezar');
  assert.equal(sinEmpezar(partida), true);
});

test('papeles con inicio libre: empieza el gusano eligiendo; en la ronda 2 la casilla ya está puesta', () => {
  const partida = nuevaPartida({ nombres: NOMBRES, tableros: [tablero()], inicio: 'libre', semilla: 1 });
  assert.equal(papeles(partida).parrafos[1], 'Empieza Jugador A eligiendo la casilla inicial.');
  assert.equal(sinEmpezar(partida), true);
  const { partida: siguiente } = jugarHastaCerrar(partida);
  assert.equal(siguiente.ronda, 1);
  const t = papeles(siguiente);
  assert.match(t.parrafos[0], /\*\*Jugador B es el gusano\*\*/);
  assert.equal(t.parrafos[1], 'La casilla inicial ya está puesta: mueve primero Jugador A (pájaro).');
  assert.equal(sinEmpezar(siguiente), true);
});

test('sinEmpezar es falso a mitad de ronda y con la partida terminada', () => {
  let partida = nuevaPartida({ nombres: NOMBRES, tableros: [tablero()], inicio: 'azar', semilla: 2 });
  partida = jugarEnPartida(partida, jugadasLegales(rondaActual(partida))[0]);
  assert.equal(sinEmpezar(partida), false);
  assert.equal(sinEmpezar(jugarTodo(partida).partida), false);
});

test('papeles con casillas con valor hablan de sumar', () => {
  const t0 = conValores(tablero(), 'uniforme', crearAzar(3));
  const partida = nuevaPartida({ nombres: NOMBRES, tableros: [t0], inicio: 'azar', semilla: 1 });
  const t = papeles(partida);
  assert.match(t.parrafos[0], /que las casillas del gusano sumen lo más posible/);
  assert.match(t.parrafos[0], /que las casillas del gusano sumen lo menos posible/);
});

test('fin de ronda con siguiente ronda en el mismo par: cifras contra el motor', () => {
  const { partida, cierre } = jugarHastaCerrar(nuevaPartida({ nombres: NOMBRES, tableros: [tablero()], inicio: 'azar', semilla: 1 }));
  assert.deepEqual(cierre, { par: 0, ronda: 0 });
  const n = partida.pares[0].rondas[0].camino.length;
  const t = finDeRonda(partida, cierre);
  assert.match(t.parrafos[0], new RegExp(`^Fin de la ronda 1 del par 1\\. El gusano de Jugador A mide ${n} casillas: Jugador A \\+${n}, Jugador B \\u2212${n}\\.$`));
  assert.equal(t.parrafos[1], `Saldo: Jugador A +${n} · Jugador B −${n}.`);
  assert.equal(t.parrafos[2], 'En la ronda 2, Jugador B es el gusano y Jugador A el pájaro.');
  assert.equal(t.continuar, 'Continuar con la ronda 2');
});

test('el saldo del fin de ronda no cuenta la casilla inicial de la ronda siguiente', () => {
  const { partida, cierre } = jugarHastaCerrar(nuevaPartida({ nombres: NOMBRES, tableros: [tablero()], inicio: 'azar', semilla: 1 }));
  const n = partida.pares[0].rondas[0].camino.length;
  assert.deepEqual(marcadorAlCierre(partida, cierre).puntos, [n, 0]);
  assert.deepEqual(marcador(partida).puntos, [n, 1]);
});

test('fin de ronda con siguiente par', () => {
  const dos = nuevaPartida({ nombres: NOMBRES, tableros: [tablero(), tablero()], inicio: 'azar', semilla: 1 });
  const r1 = jugarHastaCerrar(dos);
  const r2 = jugarHastaCerrar(r1.partida);
  assert.deepEqual(r2.cierre, { par: 0, ronda: 1 });
  const t = finDeRonda(r2.partida, r2.cierre);
  assert.equal(t.continuar, 'Continuar con el par 2');
  assert.equal(t.parrafos[2], 'En el par 2, ronda 1, Jugador A es el gusano y Jugador B el pájaro.');
  // Tras las dos rondas de un par el saldo vuelve a ser cero o refleja la diferencia: siempre suma cero.
  const [sa, sb] = saldos(marcadorAlCierre(r2.partida, r2.cierre).puntos);
  assert.equal(sa + sb, 0);
});

test('fin de ronda en la última ronda y resultado de la partida, contra el marcador', () => {
  const { partida, cierres } = jugarTodo(nuevaPartida({ nombres: NOMBRES, tableros: [tablero()], inicio: 'azar', semilla: 5 }));
  const m = marcador(partida);
  const t = finDeRonda(partida, cierres[cierres.length - 1]);
  assert.equal(t.continuar, null);
  const [sa, sb] = saldos(m.puntos);
  assert.equal(t.parrafos[1], `Saldo: Jugador A ${conSigno(sa)} · Jugador B ${conSigno(sb)}.`);
  assert.equal(t.parrafos[2], resultado(partida));
});

test('resultado con ganador', () => {
  let partida;
  let m;
  for (let semilla = 1; semilla <= 40; semilla++) {
    ({ partida } = jugarTodo(nuevaPartida({ nombres: NOMBRES, tableros: [conValores(tablero(), 'uniforme', crearAzar(semilla))], inicio: 'azar', semilla }), crearAzar(semilla)));
    m = marcador(partida);
    if (m.ganador !== null) break;
  }
  assert.notEqual(m.ganador, null, 'ninguna de las 40 partidas de prueba tiene ganador');
  const g = m.ganador;
  const texto = resultado(partida);
  assert.equal(texto, `Gana ${NOMBRES[g]} con ${conSigno(saldos(m.puntos)[g])} (${m.puntos[g]} como gusano frente a ${m.puntos[1 - g]}).`);
  assert.ok(saldos(m.puntos)[g] > 0);
});

test('resultado con empate', () => {
  // Un solo par en un tablero de dos casillas: cada gusano suma 2, empate.
  const dos = generador('cuadrado4').crear({ lado: 3 });
  const pequeno = { ...dos, casillas: dos.casillas.slice(0, 2), vecinos: [[1], [0]], id: 'dos' };
  const { partida } = jugarTodo(nuevaPartida({ nombres: NOMBRES, tableros: [pequeno], inicio: 'azar', semilla: 1 }));
  assert.equal(marcador(partida).ganador, null);
  assert.equal(resultado(partida), 'Empate (2 y 2 como gusano).');
});

const dos = (modo, extra = {}) => nuevaPartida({
  nombres: NOMBRES, tableros: [tablero()], inicio: 'azar', semilla: 3, modo, ...extra,
});

test('modo clásico: sin líneas de modo ni cambios en etiquetas y brutos', () => {
  const partida = dos({ gusanos: 1, cabezas: 1 });
  assert.equal(dosGusanos(partida), false);
  assert.equal(papeles(partida).parrafos.length, 2);
  assert.deepEqual(etiquetaDePapel(partida, 0), { texto: 'gusano', clase: 'gusano' });
  assert.deepEqual(etiquetaDePapel(partida, 1), { texto: 'pájaro', clase: 'pajaro' });
  assert.equal(brutos(partida, [9, 5], 0), '9 como gusano');
  assert.equal(AVISO_EXTREMO, '¿Por qué extremo? Pulsa uno');
});

test('dos cabezas añade la línea de los dos extremos', () => {
  const t = papeles(dos({ gusanos: 1, cabezas: 2 }));
  assert.equal(t.parrafos.length, 3);
  assert.equal(t.parrafos[1], 'El gusano puede crecer por cualquiera de sus dos extremos.');
  assert.match(t.parrafos[0], /\*\*Jugador A es el gusano\*\*/);
});

test('flechas: la línea del sentido, con y sin dos cabezas', () => {
  const dirigido = generador('cuadrado4').crear({ lado: 4, flechas: 'manhattan' });
  const una = papeles(nuevaPartida({ nombres: NOMBRES, tableros: [dirigido], inicio: 'libre', semilla: 1 }));
  assert.ok(una.parrafos.includes('Las flechas marcan el sentido: la cabeza avanza a favor de la flecha.'));
  const dosC = papeles(nuevaPartida({ nombres: NOMBRES, tableros: [dirigido], inicio: 'libre', semilla: 1, modo: { gusanos: 1, cabezas: 2 } }));
  assert.ok(dosC.parrafos.includes('Las flechas marcan el sentido: la cabeza avanza a favor de la flecha y la cola, en contra.'));
});

test('dos gusanos: papeles sin gusano ni pájaro, con las salidas ya puestas o por elegir', () => {
  const azar = dos({ gusanos: 2, cabezas: 1 });
  assert.equal(dosGusanos(azar), true);
  const t = papeles(azar);
  assert.match(t.parrafos[0], /^\*\*Jugador A lleva el gusano verde\*\* y \*\*Jugador B el violeta\*\*\. Cada uno alarga el suyo; las casillas de los dos bloquean; si uno se queda sin salida, el otro sigue solo\. Gana el gusano más largo\.$/);
  assert.doesNotMatch(t.parrafos.join(' '), /pájaro/);
  assert.equal(t.parrafos[1], 'Las salidas ya están puestas: mueve primero Jugador A.');
  assert.equal(sinEmpezar(azar), true);

  const libre = dos({ gusanos: 2, cabezas: 1 }, { inicio: 'libre' });
  assert.equal(papeles(libre).parrafos[1], 'Empieza Jugador A eligiendo la salida de su gusano, y después Jugador B la del suyo.');
  assert.equal(sinEmpezar(libre), true);
  assert.deepEqual(etiquetaDePapel(azar, 0), { texto: 'gusano verde', clase: 'gusano' });
  assert.deepEqual(etiquetaDePapel(azar, 1), { texto: 'gusano violeta', clase: 'pajaro' });
  assert.equal(brutos(azar, [3, -3], 0), null);
});

test('dos gusanos: sinEmpezar tras las dos salidas y primera jugada', () => {
  let partida = dos({ gusanos: 2, cabezas: 1 });
  assert.equal(sinEmpezar(partida), true);
  partida = jugarEnPartida(partida, jugadasLegales(rondaActual(partida))[0]);
  assert.equal(sinEmpezar(partida), false);
});

test('dos gusanos: fin de ronda con los dos largos y resultado sin «como gusano»', () => {
  const { partida: fin, cierre } = jugarHastaCerrar(dos({ gusanos: 2, cabezas: 1 }));
  const cerrada = fin.pares[cierre.par].rondas[cierre.ronda];
  const [a, b] = cerrada.cuerpos.map((c) => c.length);
  const t = finDeRonda(fin, cierre);
  const d = a - b;
  assert.equal(t.parrafos[0], `Fin de la ronda 1 del par 1. El gusano de Jugador A mide ${a} y el de Jugador B, ${b}: Jugador A ${conSigno(d)}, Jugador B ${conSigno(-d)}.`);
  assert.match(t.parrafos[2], /^En la ronda 2, Jugador B lleva el gusano verde y Jugador A el violeta\.$/);
  assert.equal(t.continuar, 'Continuar con la ronda 2');
  const { partida: final } = jugarTodo(fin);
  const texto = resultado(final);
  assert.match(texto, /^(Empate\.|Gana Jugador [AB] con \+\d+\.)$/);
  assert.doesNotMatch(texto, /gusano/);
});

test('fin de ronda con valores dice «suman» y el signo menos es U+2212', () => {
  const base = tablero();
  const casillas = base.casillas.map((c) => ({ ...c, valor: 2 }));
  const conDos = { ...base, casillas };
  const { partida, cierre } = jugarHastaCerrar(nuevaPartida({ nombres: NOMBRES, tableros: [conDos], inicio: 'azar', semilla: 1 }));
  const t = finDeRonda(partida, cierre);
  assert.match(t.parrafos[0], /sus casillas suman \d+: Jugador A \+\d+, Jugador B −\d+\.$/);
});
