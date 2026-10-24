import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nuevaRonda, cabeza, turno, ocupada, jugadasLegales, jugar, rondaTerminada,
  puntuacion, alcanzables, cotaSuperior,
} from '../js/motor/ronda.js';
import {
  nuevaPartida, rondaActual, rolDe, jugadorEnTurno, jugarEnPartida, marcador, anadirPar,
} from '../js/motor/partida.js';

// Tableros escritos a mano (solo lo que usa el motor: casillas y vecinos).
const tablero = (vecinos, casillas = vecinos.map(() => ({}))) => ({ id: 't', nombre: 't', casillas, vecinos });

const camino3 = tablero([[1], [0, 2], [1]]);
const triangulo = tablero([[1, 2], [0, 2], [0, 1]]);
const ciclo4 = tablero([[1, 3], [0, 2], [1, 3], [0, 2]]);
// T: 0-1-2 en horizontal y 3 colgando de 1, que está bloqueada.
const tConBloqueada = tablero([[1], [0, 2, 3], [1], [1]], [{}, {}, {}, { bloqueada: true }]);
// Camino de 4 casillas con valores, uno de ellos −2.
const conValores = tablero([[1], [0, 2], [1, 3], [2]], [{ valor: 1 }, { valor: -2 }, { valor: 3 }, { valor: 2 }]);
// Estrella: el centro 0 con hojas 1, 2, 3, y 4 colgando de 1.
const estrella = tablero([[1, 2, 3], [0, 4], [0], [0], [1]]);
const aisladas = tablero([[], []]);

const jugarVarias = (ronda, ...casillas) => casillas.reduce(jugar, ronda);
const terminar = (partida) => {
  while (!partida.terminada) partida = jugarEnPartida(partida, jugadasLegales(rondaActual(partida))[0]);
  return partida;
};

// ---------- ronda ----------

test('nuevaRonda: camino vacío, sin cabeza, turno del gusano', () => {
  const r = nuevaRonda(camino3);
  assert.deepEqual(r.camino, []);
  assert.equal(r.tablero, camino3);
  assert.equal(cabeza(r), null);
  assert.equal(turno(r), 'gusano');
  assert.equal(rondaTerminada(r), false);
  assert.equal(puntuacion(r), 0);
});

test('turno alterna gusano y pájaro desde el camino vacío', () => {
  let r = nuevaRonda(ciclo4);
  const turnos = [];
  for (const c of [0, 1, 2, 3]) {
    turnos.push(turno(r));
    r = jugar(r, c);
  }
  assert.deepEqual(turnos, ['gusano', 'pajaro', 'gusano', 'pajaro']);
  assert.equal(turno(r), 'gusano');
});

test('jugadasLegales con el camino vacío excluye las bloqueadas', () => {
  assert.deepEqual(jugadasLegales(nuevaRonda(tConBloqueada)), [0, 1, 2]);
  assert.deepEqual(jugadasLegales(nuevaRonda(camino3)), [0, 1, 2]);
});

test('jugadasLegales con camino: vecinas libres de la cabeza', () => {
  const r = jugar(nuevaRonda(ciclo4), 0);
  assert.deepEqual(jugadasLegales(r), [1, 3]);
  assert.deepEqual(jugadasLegales(jugar(r, 1)), [2]);
  assert.deepEqual(jugadasLegales(jugar(nuevaRonda(tConBloqueada), 1)), [0, 2]);
});

test('ocupada: casillas del camino y bloqueadas', () => {
  const r = jugar(nuevaRonda(tConBloqueada), 0);
  assert.equal(ocupada(r, 0), true);
  assert.equal(ocupada(r, 3), true);
  assert.equal(ocupada(r, 1), false);
  assert.equal(ocupada(r, 2), false);
});

test('jugar con una jugada ilegal lanza Error', () => {
  const r = nuevaRonda(tConBloqueada);
  assert.throws(() => jugar(r, 3), /jugada ilegal/);
  const r0 = jugar(r, 0);
  assert.throws(() => jugar(r0, 0), /jugada ilegal/);
  assert.throws(() => jugar(r0, 2), /jugada ilegal/);
  assert.throws(() => jugar(r0, 9), /jugada ilegal/);
});

test('jugar no muta la ronda ni el tablero', () => {
  const r = nuevaRonda(ciclo4);
  const r1 = jugar(r, 2);
  assert.deepEqual(r.camino, []);
  assert.deepEqual(r1.camino, [2]);
  assert.equal(r1.tablero, r.tablero);
  assert.equal(cabeza(r1), 2);
  const r2 = jugar(r1, 3);
  assert.deepEqual(r1.camino, [2]);
  assert.deepEqual(r2.camino, [2, 3]);
});

test('en el ciclo de 4 la ronda acaba con 4 casillas', () => {
  const r = jugarVarias(nuevaRonda(ciclo4), 0, 1, 2);
  assert.equal(rondaTerminada(r), false);
  const fin = jugar(r, 3);
  assert.equal(rondaTerminada(fin), true);
  assert.equal(puntuacion(fin), 4);
  assert.deepEqual(jugadasLegales(fin), []);
});

test('en el camino de 3 empezando por el centro acaba con 2', () => {
  const r = jugarVarias(nuevaRonda(camino3), 1, 0);
  assert.equal(rondaTerminada(r), true);
  assert.equal(puntuacion(r), 2);
});

test('en el camino de 3 empezando por un extremo acaba con 3', () => {
  const r = jugarVarias(nuevaRonda(camino3), 0, 1, 2);
  assert.equal(rondaTerminada(r), true);
  assert.equal(puntuacion(r), 3);
});

test('en el triángulo la ronda acaba con 3 casillas', () => {
  const r = jugarVarias(nuevaRonda(triangulo), 0, 2);
  assert.deepEqual(jugadasLegales(r), [1]);
  assert.equal(rondaTerminada(jugar(r, 1)), true);
});

test('el pájaro puede cerrar la ronda en un callejón', () => {
  const r = jugarVarias(nuevaRonda(estrella), 0, 2);
  assert.equal(rondaTerminada(r), true);
  assert.equal(puntuacion(r), 2);
});

test('puntuacion suma los valores y el −2 resta', () => {
  assert.equal(puntuacion(jugarVarias(nuevaRonda(conValores), 0)), 1);
  assert.equal(puntuacion(jugarVarias(nuevaRonda(conValores), 0, 1)), -1);
  assert.equal(puntuacion(jugarVarias(nuevaRonda(conValores), 0, 1, 2, 3)), 4);
});

test('alcanzables con el camino vacío: todas las libres', () => {
  assert.deepEqual(alcanzables(nuevaRonda(tConBloqueada)), [0, 1, 2]);
  assert.deepEqual(alcanzables(nuevaRonda(camino3)), [0, 1, 2]);
});

test('alcanzables no incluye la cabeza y no cruza bloqueadas ni ocupadas', () => {
  assert.deepEqual(alcanzables(jugar(nuevaRonda(tConBloqueada), 0)), [1, 2]);
  assert.deepEqual(alcanzables(jugar(nuevaRonda(conValores), 1)), [0, 2, 3]);
  // Con 1 ocupada, desde 2 solo se llega a 3: la 0 queda aislada.
  assert.deepEqual(alcanzables(jugarVarias(nuevaRonda(conValores), 1, 2)), [3]);
  // Con el centro ocupado, desde el extremo no se llega a la otra punta.
  assert.deepEqual(alcanzables(jugarVarias(nuevaRonda(camino3), 1, 0)), []);
  assert.deepEqual(alcanzables(jugarVarias(nuevaRonda(camino3), 0, 1, 2)), []);
});

test('alcanzables llega a casillas lejanas por casillas libres', () => {
  assert.deepEqual(alcanzables(jugar(nuevaRonda(estrella), 4)), [0, 1, 2, 3]);
});

test('cotaSuperior ignora los valores negativos', () => {
  // Puntuación 1; alcanzables 1 (−2, no suma), 2 (3) y 3 (2).
  assert.equal(cotaSuperior(jugar(nuevaRonda(conValores), 0)), 6);
  assert.equal(cotaSuperior(nuevaRonda(conValores)), 6);
});

test('cotaSuperior con valores 1 es puntuación más alcanzables', () => {
  const r = jugar(nuevaRonda(camino3), 1);
  assert.equal(cotaSuperior(r), 3);
  const fin = jugarVarias(nuevaRonda(ciclo4), 0, 1, 2, 3);
  assert.equal(cotaSuperior(fin), 4);
});

// ---------- partida ----------

test('nuevaPartida con azar: mismo inicio en las dos rondas de cada par, nunca bloqueado', () => {
  for (let semilla = 1; semilla <= 30; semilla++) {
    const p = nuevaPartida({ nombres: ['Ana', 'Beto'], tableros: [tConBloqueada, ciclo4], inicio: 'azar', semilla });
    assert.deepEqual(p.nombres, ['Ana', 'Beto']);
    assert.equal(p.pares.length, 2);
    for (const par of p.pares) {
      assert.notEqual(par.inicioFijo, null);
      assert.ok(!par.tablero.casillas[par.inicioFijo].bloqueada);
      assert.deepEqual(par.rondas[0].camino, [par.inicioFijo]);
      assert.deepEqual(par.rondas[1].camino, [par.inicioFijo]);
    }
  }
});

test('nuevaPartida con la misma semilla da los mismos inicios', () => {
  const crear = (semilla) => nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4, ciclo4, ciclo4], inicio: 'azar', semilla });
  assert.deepEqual(crear(5).pares.map((p) => p.inicioFijo), crear(5).pares.map((p) => p.inicioFijo));
  const distintos = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => crear(s).pares.map((p) => p.inicioFijo).join()));
  assert.ok(distintos.size > 1);
});

test('estado inicial de la partida', () => {
  const p = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4], inicio: 'azar', semilla: 3 });
  assert.equal(p.par, 0);
  assert.equal(p.ronda, 0);
  assert.equal(p.terminada, false);
  assert.equal(p.semilla, 3);
  assert.equal(p.inicio, 'azar');
  assert.equal(rondaActual(p), p.pares[0].rondas[0]);
});

test('rolDe cambia entre rondas del par y jugadorEnTurno alterna', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4], inicio: 'azar', semilla: 3 });
  assert.equal(rolDe(p, 0), 'gusano');
  assert.equal(rolDe(p, 1), 'pajaro');
  // Con la casilla inicial puesta, mueve primero el pájaro: B en la ronda 0.
  assert.equal(jugadorEnTurno(p), 1);
  p = jugarEnPartida(p, jugadasLegales(rondaActual(p))[0]);
  assert.equal(jugadorEnTurno(p), 0);
  while (p.ronda === 0) p = jugarEnPartida(p, jugadasLegales(rondaActual(p))[0]);
  assert.equal(rolDe(p, 0), 'pajaro');
  assert.equal(rolDe(p, 1), 'gusano');
  // Ronda 1, camino [inicio]: mueve el pájaro, que ahora es A.
  assert.equal(jugadorEnTurno(p), 0);
});

test('jugarEnPartida no muta y pasa de ronda y de par', () => {
  const p0 = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4, ciclo4], inicio: 'azar', semilla: 9 });
  let p = p0;
  const vistas = [];
  while (!p.terminada) {
    vistas.push(`${p.par}.${p.ronda}`);
    p = jugarEnPartida(p, jugadasLegales(rondaActual(p))[0]);
  }
  assert.deepEqual([...new Set(vistas)], ['0.0', '0.1', '1.0', '1.1']);
  assert.equal(p0.par, 0);
  assert.equal(p0.ronda, 0);
  assert.equal(p0.terminada, false);
  assert.equal(p0.pares[0].rondas[0].camino.length, 1);
});

test('jugarEnPartida lanza con una jugada ilegal y con la partida terminada', () => {
  const p = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4], inicio: 'azar', semilla: 2 });
  assert.throws(() => jugarEnPartida(p, p.pares[0].inicioFijo), /jugada ilegal/);
  const fin = terminar(p);
  assert.equal(fin.terminada, true);
  assert.throws(() => jugarEnPartida(fin, 0), Error);
});

test('marcador al final: suma lo que cada uno hizo de gusano', () => {
  const fin = terminar(nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4, ciclo4], inicio: 'azar', semilla: 4 }));
  const m = marcador(fin);
  assert.deepEqual(m.pares, [{ puntosA: 4, puntosB: 4 }, { puntosA: 4, puntosB: 4 }]);
  assert.deepEqual(m.puntos, [8, 8]);
  assert.equal(m.ganador, null);
});

test('marcador a medias: lo que lleva hasta ahora, sin contar rondas no empezadas', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4, ciclo4], inicio: 'azar', semilla: 4 });
  assert.deepEqual(marcador(p).puntos, [1, 0]);
  assert.equal(marcador(p).ganador, null);
  p = jugarEnPartida(p, jugadasLegales(rondaActual(p))[0]);
  assert.deepEqual(marcador(p).puntos, [2, 0]);
  while (p.ronda === 0) p = jugarEnPartida(p, jugadasLegales(rondaActual(p))[0]);
  // A cerró su ronda con 4; B empieza la suya con la casilla inicial.
  assert.deepEqual(marcador(p).puntos, [4, 1]);
  assert.deepEqual(marcador(p).pares, [{ puntosA: 4, puntosB: 1 }, { puntosA: 0, puntosB: 0 }]);
});

test('inicio libre: la ronda 0 empieza vacía y la 1 con la casilla que eligió el gusano', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [camino3], inicio: 'libre', semilla: 1 });
  assert.equal(p.pares[0].inicioFijo, null);
  assert.deepEqual(rondaActual(p).camino, []);
  assert.deepEqual(p.pares[0].rondas[1].camino, []);
  assert.equal(jugadorEnTurno(p), 0);
  p = jugarEnPartida(p, 1);
  assert.equal(p.pares[0].inicioFijo, 1);
  assert.deepEqual(p.pares[0].rondas[0].camino, [1]);
  assert.deepEqual(p.pares[0].rondas[1].camino, [1]);
  assert.equal(jugadorEnTurno(p), 1);
  p = jugarEnPartida(p, 0);
  // Ronda 0 acabada (A: 2 puntos). Ronda 1 con la misma casilla, B de gusano.
  assert.equal(p.ronda, 1);
  assert.deepEqual(rondaActual(p).camino, [1]);
  assert.equal(jugadorEnTurno(p), 0);
  p = jugarEnPartida(p, 2);
  assert.equal(p.terminada, true);
  const m = marcador(p);
  assert.deepEqual(m.puntos, [2, 2]);
  assert.equal(m.ganador, null);
});

test('inicio libre con ganador: gana quien más puntos suma', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [estrella], inicio: 'libre', semilla: 1 });
  p = jugarEnPartida(p, 0); // A pone el centro
  p = jugarEnPartida(p, 2); // B se mete en un callejón: A suma 2
  assert.equal(p.ronda, 1);
  p = jugarEnPartida(p, 1); // A (pájaro) deja alargar
  p = jugarEnPartida(p, 4); // B suma 3
  assert.equal(p.terminada, true);
  const m = marcador(p);
  assert.deepEqual(m.puntos, [2, 3]);
  assert.equal(m.ganador, 1);
});

test('si la casilla inicial no tiene vecinas libres, la ronda se cierra sola', () => {
  const p = nuevaPartida({ nombres: ['A', 'B'], tableros: [aisladas], inicio: 'azar', semilla: 1 });
  assert.equal(p.terminada, true);
  assert.deepEqual(marcador(p).puntos, [1, 1]);
});

test('anadirPar solo con la partida terminada', () => {
  const p = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4], inicio: 'azar', semilla: 6 });
  assert.throws(() => anadirPar(p, ciclo4), Error);
  const fin = terminar(p);
  const mas = anadirPar(fin, tConBloqueada);
  assert.equal(mas.terminada, false);
  assert.equal(mas.pares.length, 2);
  assert.equal(mas.par, 1);
  assert.equal(mas.ronda, 0);
  assert.equal(mas.pares[1].tablero, tConBloqueada);
  assert.notEqual(mas.pares[1].inicioFijo, 3);
  assert.deepEqual(mas.pares[1].rondas[0].camino, [mas.pares[1].inicioFijo]);
  assert.equal(fin.pares.length, 1);
  assert.equal(fin.terminada, true);
  const fin2 = terminar(mas);
  assert.equal(fin2.pares.length, 2);
  assert.deepEqual(marcador(fin2).pares[0], marcador(fin).pares[0]);
});

test('anadirPar con inicio libre deja el nuevo par sin casilla inicial', () => {
  const fin = terminar(jugarEnPartida(nuevaPartida({ nombres: ['A', 'B'], tableros: [camino3], inicio: 'libre', semilla: 1 }), 0));
  const mas = anadirPar(fin, camino3);
  assert.equal(mas.pares[1].inicioFijo, null);
  assert.deepEqual(rondaActual(mas).camino, []);
});
