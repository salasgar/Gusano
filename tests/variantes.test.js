import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nuevaRonda, cabeza, extremos, turno, maximiza, duenoDe, jugadasLegales, jugadasCompletas, jugadasEn,
  jugar, rondaTerminada, puntuacion, alcanzables, cotaSuperior,
} from '../js/motor/ronda.js';
import {
  nuevaPartida, rondaActual, rolDe, jugadorEnTurno, jugarEnPartida, marcador, anadirPar,
} from '../js/motor/partida.js';

// Tableros escritos a mano (ESPECIFICACION.md §10.3). Un tablero dirigido es un objeto con
// vecinos (adónde se puede ir), predecesores (desde dónde se llega) y dirigido: true.
const tablero = (vecinos, casillas = vecinos.map(() => ({}))) => ({ id: 't', nombre: 't', casillas, vecinos });
const dirigido = (vecinos) => {
  const predecesores = vecinos.map(() => []);
  vecinos.forEach((salidas, i) => salidas.forEach((j) => predecesores[j].push(i)));
  return { ...tablero(vecinos), predecesores: predecesores.map((l) => l.sort((a, b) => a - b)), dirigido: true };
};
const camino = (n, casillas) => tablero(Array.from({ length: n }, (_, i) => [i - 1, i + 1].filter((j) => j >= 0 && j < n)), casillas);

const camino5 = camino(5);
const camino7 = camino(7);
const ciclo4 = tablero([[1, 3], [0, 2], [1, 3], [0, 2]]);
const triangulo = tablero([[1, 2], [0, 2], [0, 1]]);
const estrella = tablero([[1, 2, 3], [0, 4], [0], [0], [1]]);
// 0 → 1 → 2 → 3, en un solo sentido: la 3 no tiene salida y a la 0 no se llega.
const flecha4 = dirigido([[1], [2], [3], []]);
// Ciclo de 4 en un solo sentido: 0 → 1 → 2 → 3 → 0.
const giro4 = dirigido([[1], [2], [3], [0]]);

const DOS_CABEZAS = { gusanos: 1, cabezas: 2 };
const DOS_GUSANOS = { gusanos: 2, cabezas: 1 };
const jugarVarias = (ronda, ...jugadas) => jugadas.reduce((r, j) => jugar(r, j), ronda);
const terminarRonda = (partida) => {
  const empezada = `${partida.par}.${partida.ronda}`;
  while (!partida.terminada && `${partida.par}.${partida.ronda}` === empezada) {
    partida = jugarEnPartida(partida, jugadasCompletas(rondaActual(partida))[0]);
  }
  return partida;
};
// Distancia sin sentido, por BFS (solo para comprobar el sorteo de salidas).
const distancia = (t, a, b) => {
  const d = new Map([[a, 0]]);
  const cola = [a];
  while (cola.length) {
    const x = cola.shift();
    for (const y of [...t.vecinos[x], ...(t.predecesores ?? t.vecinos)[x]]) if (!d.has(y)) { d.set(y, d.get(x) + 1); cola.push(y); }
  }
  return d.get(b);
};

// ---------- clásico ----------

test('clásico: nuevaRonda sin modo es { gusanos: 1, cabezas: 1 } con los campos nuevos', () => {
  const r = nuevaRonda(ciclo4);
  assert.deepEqual(r.modo, { gusanos: 1, cabezas: 1 });
  assert.deepEqual(r.camino, []);
  assert.deepEqual(r.jugadas, []);
  assert.deepEqual(r.cuerpos, [[]]);
  assert.equal(r.mueve, 0);
  assert.deepEqual(nuevaRonda(ciclo4, { gusanos: 1, cabezas: 1 }), r);
  assert.throws(() => nuevaRonda(ciclo4, { gusanos: 3 }), /modo no válido/);
});

test('clásico: la ronda gana jugadas, cuerpos y mueve sin cambiar camino ni turno', () => {
  const r = jugarVarias(nuevaRonda(ciclo4), 0, 1, 2);
  assert.deepEqual(r.camino, [0, 1, 2]);
  assert.deepEqual(r.cuerpos, [[0, 1, 2]]);
  assert.deepEqual(r.jugadas, [0, 1, 2].map((casilla) => ({ casilla, gusano: 0, extremo: 0 })));
  assert.equal(r.mueve, 1);
  assert.equal(turno(r), 'pajaro');
  assert.equal(maximiza(r), false);
  assert.deepEqual([0, 1, 2].map((k) => duenoDe(r, k)), [0, 1, 0]);
  assert.deepEqual(extremos(r), [2]);
  assert.equal(cabeza(r), 2);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 3, gusano: 0, extremo: 0 }]);
  assert.deepEqual(jugadasEn(r, 3), [{ casilla: 3, gusano: 0, extremo: 0 }]);
  assert.deepEqual(jugadasLegales(r), [3]);
  // jugar acepta también el objeto
  assert.deepEqual(jugar(r, { casilla: 3, gusano: 0, extremo: 0 }).camino, [0, 1, 2, 3]);
  assert.throws(() => jugar(r, { casilla: 3, extremo: 1 }), /jugada ilegal/);
});

test('clásico: una partida de la tanda 1 jugada otra vez da lo mismo', () => {
  // La de tests/motor.test.js «inicio libre con ganador».
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [estrella], inicio: 'libre', semilla: 1 });
  assert.deepEqual(p.modo, { gusanos: 1, cabezas: 1 });
  const turnos = [];
  for (const c of [0, 2, 1, 4]) {
    turnos.push(`${jugadorEnTurno(p)}${turno(rondaActual(p))[0]}`);
    p = jugarEnPartida(p, c);
  }
  assert.deepEqual(turnos, ['0g', '1p', '0p', '1g']);
  assert.deepEqual(p.pares[0].inicioFijo, 0);
  assert.deepEqual(p.pares[0].rondas.map((r) => r.camino), [[0, 2], [0, 1, 4]]);
  assert.deepEqual(p.pares[0].rondas.map(puntuacion), [2, 3]);
  assert.deepEqual(marcador(p), { puntos: [2, 3], pares: [{ puntosA: 2, puntosB: 3 }], ganador: 1 });
});

test('clásico: una ronda de la tanda 1 escrita a mano se sigue leyendo', () => {
  const r = { tablero: camino5, camino: [2, 3] };
  assert.equal(turno(r), 'gusano');
  assert.deepEqual(jugadasLegales(r), [4]);
  assert.deepEqual(alcanzables(r), [4]);
  assert.deepEqual(jugar(r, 4).camino, [2, 3, 4]);
});

// ---------- dos cabezas ----------

test('dos cabezas: en un camino de 5 desde el centro el gusano llega a las 5', () => {
  let r = jugar(nuevaRonda(camino5, DOS_CABEZAS), 2);
  // Una sola casilla y sin flechas: solo extremo 0 (las dos darían el mismo gusano).
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 1, gusano: 0, extremo: 0 }, { casilla: 3, gusano: 0, extremo: 0 }]);
  assert.deepEqual(extremos(r), [2]);
  r = jugar(r, 3); // la cabeza va a la 3; la cola se queda en la 2
  assert.deepEqual(r.cuerpos, [[2, 3]]);
  assert.deepEqual(extremos(r), [3, 2]);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 4, gusano: 0, extremo: 0 }, { casilla: 1, gusano: 0, extremo: 1 }]);
  assert.deepEqual(alcanzables(r), [0, 1, 4]);
  assert.equal(cotaSuperior(r), 5);
  r = jugarVarias(r, 1, 0, 4);
  assert.deepEqual(r.camino, [2, 3, 1, 0, 4]);
  assert.deepEqual(r.cuerpos, [[0, 1, 2, 3, 4]]);
  assert.deepEqual(r.jugadas.map((j) => j.extremo), [0, 0, 1, 1, 0]);
  assert.equal(rondaTerminada(r), true);
  assert.equal(puntuacion(r), 5);
  // Con una cabeza, el mismo inicio se queda en 3 como mucho.
  const clasico = jugarVarias(nuevaRonda(camino5), 2, 3, 4);
  assert.equal(rondaTerminada(clasico), true);
  assert.equal(puntuacion(clasico), 3);
});

test('dos cabezas: turno y dueño siguen la paridad del camino', () => {
  const r = jugarVarias(nuevaRonda(camino5, DOS_CABEZAS), 2, 3, 1);
  assert.equal(turno(r), 'pajaro');
  assert.deepEqual([0, 1, 2].map((k) => duenoDe(r, k)), [0, 1, 0]);
});

test('dos cabezas: una casilla vecina de los dos extremos da dos jugadas y el índice es ambiguo', () => {
  const r = jugarVarias(nuevaRonda(ciclo4, DOS_CABEZAS), 0, 1, 2);
  assert.deepEqual(extremos(r), [2, 0]);
  assert.deepEqual(jugadasEn(r, 3), [{ casilla: 3, gusano: 0, extremo: 0 }, { casilla: 3, gusano: 0, extremo: 1 }]);
  assert.deepEqual(jugadasLegales(r), [3]);
  assert.throws(() => jugar(r, 3), /jugada ambigua/);
  assert.throws(() => jugar(r, 1), /jugada ilegal/);
  assert.deepEqual(jugar(r, { casilla: 3, extremo: 1 }).cuerpos, [[3, 0, 1, 2]]);
  assert.deepEqual(jugar(r, { casilla: 3, extremo: 0 }).cuerpos, [[0, 1, 2, 3]]);
});

test('dos cabezas: el pájaro ya no cierra la ronda metiéndose en un callejón si queda la cola', () => {
  // Estrella: en la tanda 1, 0 y después 2 acaba con 2; con dos cabezas la cola (0) sigue.
  const r = jugarVarias(nuevaRonda(estrella, DOS_CABEZAS), 0, 2);
  assert.equal(rondaTerminada(r), false);
  assert.deepEqual(jugadasLegales(r), [1, 3]);
});

// ---------- flechas ----------

test('flechas: la cabeza sigue vecinos y la cola predecesores', () => {
  // Clásico: desde la 1 solo se va a la 2.
  assert.deepEqual(jugadasLegales(jugar(nuevaRonda(flecha4), 1)), [2]);
  assert.deepEqual(alcanzables(jugar(nuevaRonda(flecha4), 1)), [2, 3]);
  // Dos cabezas: desde [1, 2] la cabeza va a la 3 y la cola a la 0.
  const r = jugarVarias(nuevaRonda(flecha4, DOS_CABEZAS), 1, 2);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 3, gusano: 0, extremo: 0 }, { casilla: 0, gusano: 0, extremo: 1 }]);
  assert.deepEqual(alcanzables(r), [0, 3]);
  const fin = jugarVarias(r, 3, 0);
  assert.equal(rondaTerminada(fin), true);
  assert.equal(puntuacion(fin), 4);
});

test('flechas: con una sola casilla se ofrecen los dos extremos', () => {
  const r = jugar(nuevaRonda(giro4, DOS_CABEZAS), 0);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 1, gusano: 0, extremo: 0 }, { casilla: 3, gusano: 0, extremo: 1 }]);
  assert.deepEqual(alcanzables(r), [1, 2, 3]);
  const porCola = jugar(r, 3);
  assert.deepEqual(porCola.cuerpos, [[3, 0]]);
  assert.equal(cabeza(porCola), 0);
  assert.deepEqual(extremos(porCola), [0, 3]);
  assert.deepEqual(jugadasCompletas(porCola), [{ casilla: 1, gusano: 0, extremo: 0 }, { casilla: 2, gusano: 0, extremo: 1 }]);
  // Sin dos cabezas, una sola salida.
  assert.deepEqual(jugadasCompletas(jugar(nuevaRonda(giro4), 0)), [{ casilla: 1, gusano: 0, extremo: 0 }]);
});

// ---------- dos gusanos ----------

test('dos gusanos: salidas en camino[0] y camino[1], después mueve el papel 0', () => {
  let r = nuevaRonda(camino7, DOS_GUSANOS);
  assert.deepEqual(r.cuerpos, [[], []]);
  assert.equal(r.mueve, 0);
  r = jugar(r, 0);
  assert.equal(r.mueve, 1);
  assert.equal(rondaTerminada(r), false);
  // El papel 1 elige su salida entre las libres.
  assert.deepEqual(jugadasLegales(r), [1, 2, 3, 4, 5, 6]);
  assert.ok(jugadasCompletas(r).every((j) => j.gusano === 1));
  r = jugar(r, 6);
  assert.deepEqual(r.cuerpos, [[0], [6]]);
  assert.equal(r.mueve, 0);
  assert.equal(maximiza(r), true);
  assert.equal(turno(r), 'gusano');
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 1, gusano: 0, extremo: 0 }]);
  assert.deepEqual(alcanzables(r), [1, 2, 3, 4, 5]);
  assert.equal(puntuacion(r), 0);
  assert.equal(cotaSuperior(r), 5);
  r = jugar(r, 1);
  assert.equal(r.mueve, 1);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 5, gusano: 1, extremo: 0 }]);
  assert.deepEqual([cabeza(r, 0), cabeza(r, 1)], [1, 6]);
  assert.deepEqual([0, 1, 2].map((k) => duenoDe(r, k)), [0, 1, 0]);
});

test('dos gusanos: las casillas del otro bloquean, el bloqueado pasa y el otro sigue solo', () => {
  // Camino 0-1-2-3-4; gusano 0 en la 0, gusano 1 en la 2.
  let r = jugarVarias(nuevaRonda(camino5, DOS_GUSANOS), 0, 2, 1);
  // El gusano 0 (cabeza 1) ya no puede crecer: la 2 es del otro.
  assert.equal(r.mueve, 1);
  r = jugar(r, 3);
  assert.equal(r.mueve, 1); // el papel 0 pasa: repite el 1
  assert.equal(turno(r), 'pajaro');
  assert.equal(rondaTerminada(r), false);
  assert.throws(() => jugar(r, { casilla: 4, gusano: 0 }), /jugada ilegal/);
  r = jugar(r, 4);
  assert.equal(rondaTerminada(r), true);
  assert.deepEqual(r.cuerpos, [[0, 1], [2, 3, 4]]);
  assert.deepEqual(r.camino.map((_, k) => duenoDe(r, k)), [0, 1, 0, 1, 1]);
  assert.equal(puntuacion(r), -1);
});

test('dos gusanos: puntuación = gusano 0 − gusano 1, también con valores', () => {
  const t = camino(5, [{ valor: 3 }, { valor: -2 }, { valor: 1 }, { valor: 2 }, { valor: 5 }]);
  const r = jugarVarias(nuevaRonda(t, DOS_GUSANOS), 0, 4, 1, 3);
  // gusano 0: 3 − 2 = 1; gusano 1: 5 + 2 = 7.
  assert.equal(puntuacion(r), -6);
  assert.deepEqual(alcanzables(r), [2]);
  assert.equal(cotaSuperior(r), 1 + 1 - 7);
});

test('dos gusanos: cotaSuperior es cota aunque el gusano 1 pueda comerse una casilla negativa', () => {
  // Ciclo de 6 con una casilla de −5 al alcance del gusano 1 (sale de la 3): comérsela sube la puntuación.
  const t = tablero([[1, 5], [0, 2], [1, 3], [2, 4], [3, 5], [4, 0]],
    [{}, {}, { valor: -5 }, {}, {}, {}]);
  const r = jugarVarias(nuevaRonda(t, DOS_GUSANOS), 0, 3);
  assert.equal(cotaSuperior(r), 1 + 3 - 1 + 5);
  // En todas las posiciones de la ronda, ninguna continuación supera la cota de esa posición.
  const comprobar = (ronda) => {
    if (rondaTerminada(ronda)) return puntuacion(ronda);
    const mejor = Math.max(...jugadasCompletas(ronda).map((j) => comprobar(jugar(ronda, j))));
    assert.ok(mejor <= cotaSuperior(ronda), `cota ${cotaSuperior(ronda)} < ${mejor}`);
    return mejor;
  };
  // Sin el término de los negativos la cota era 3 y la mejor continuación llega a 6.
  assert.equal(comprobar(r), 6);
});

test('dos gusanos: la ronda acaba cuando ninguno puede crecer', () => {
  // Salidas sin vecinas libres desde el principio: el triángulo con la tercera casilla bloqueada.
  const t = tablero([[1, 2], [0, 2], [0, 1]], [{}, {}, { bloqueada: true }]);
  assert.equal(rondaTerminada(jugarVarias(nuevaRonda(t, DOS_GUSANOS), 0, 1)), true);
  // En el triángulo, el que sale primero se come la última libre y se acaba.
  const r = jugarVarias(nuevaRonda(triangulo, DOS_GUSANOS), 0, 1);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 2, gusano: 0, extremo: 0 }]);
  const fin = jugar(r, 2);
  assert.equal(rondaTerminada(fin), true);
  assert.equal(puntuacion(fin), 1);
});

test('dos gusanos de dos cabezas a la vez', () => {
  const modo = { gusanos: 2, cabezas: 2 };
  let r = jugarVarias(nuevaRonda(camino7, modo), 1, 5);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 0, gusano: 0, extremo: 0 }, { casilla: 2, gusano: 0, extremo: 0 }]);
  r = jugarVarias(r, 2, 4);
  assert.deepEqual(r.cuerpos, [[1, 2], [5, 4]]);
  assert.deepEqual(extremos(r, 1), [4, 5]);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 3, gusano: 0, extremo: 0 }, { casilla: 0, gusano: 0, extremo: 1 }]);
  assert.deepEqual(alcanzables(r), [0, 3, 6]);
  r = jugar(r, 3);
  // El gusano 1 no puede crecer por la cabeza (la 3 es del otro), pero sí por la cola.
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 6, gusano: 1, extremo: 1 }]);
  r = jugar(r, 6);
  assert.deepEqual(r.cuerpos, [[1, 2, 3], [6, 5, 4]]);
  assert.equal(r.mueve, 0);
  r = jugar(r, 0);
  assert.equal(rondaTerminada(r), true);
  assert.deepEqual(r.cuerpos, [[0, 1, 2, 3], [6, 5, 4]]);
  assert.equal(puntuacion(r), 1);
});

test('dos gusanos con flechas: cada uno crece a favor de las flechas', () => {
  // Ciclo en un solo sentido: el gusano 1 en la 2 no puede ir a la 1.
  const r = jugarVarias(nuevaRonda(giro4, DOS_GUSANOS), 0, 2);
  assert.deepEqual(jugadasCompletas(r), [{ casilla: 1, gusano: 0, extremo: 0 }]);
  const r2 = jugar(r, 1);
  assert.deepEqual(jugadasCompletas(r2), [{ casilla: 3, gusano: 1, extremo: 0 }]);
  assert.equal(rondaTerminada(jugar(r2, 3)), true);
});

// ---------- partida ----------

test('partida de dos gusanos al azar: salidas lejanas, las mismas en las dos rondas del par', () => {
  const vistas = new Set();
  for (let semilla = 1; semilla <= 30; semilla++) {
    const p = nuevaPartida({ nombres: ['A', 'B'], tableros: [camino7], inicio: 'azar', semilla, modo: DOS_GUSANOS });
    assert.deepEqual(p.modo, DOS_GUSANOS);
    const [s0, s1] = p.pares[0].inicioFijo;
    vistas.add(`${s0}-${s1}`);
    assert.notEqual(s0, s1);
    // Diámetro 6: distancia de al menos max(2, 3) = 3.
    assert.ok(Math.abs(s0 - s1) >= 3, `${s0}-${s1}`);
    assert.deepEqual(p.pares[0].rondas[0].camino, [s0, s1]);
    assert.deepEqual(p.pares[0].rondas[1].camino, [s0, s1]);
    assert.equal(jugadorEnTurno(p), 0);
  }
  assert.ok(vistas.size > 3);
});

test('partida de dos gusanos: en la segunda ronda el otro jugador tiene el papel 0', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [camino7], inicio: 'azar', semilla: 3, modo: DOS_GUSANOS });
  const [s0] = p.pares[0].inicioFijo;
  assert.equal(rolDe(p, 0), 'gusano');
  p = terminarRonda(p);
  assert.equal(p.ronda, 1);
  // B sale ahora de la casilla de A (gusano 0) y mueve primero.
  assert.equal(rondaActual(p).cuerpos[0][0], s0);
  assert.equal(jugadorEnTurno(p), 1);
  assert.equal(rolDe(p, 1), 'gusano');
  const puntosRonda0 = puntuacion(p.pares[0].rondas[0]);
  p = terminarRonda(p);
  assert.equal(p.terminada, true);
  const m = marcador(p);
  assert.deepEqual(m.pares, [{ puntosA: puntosRonda0, puntosB: puntuacion(p.pares[0].rondas[1]) }]);
  // Mismo tablero, mismas salidas y la misma estrategia (la primera jugada): los dos empatan.
  assert.equal(m.ganador, null);
  // Desempate: el par nuevo hereda el modo y sortea dos salidas.
  const mas = anadirPar(p, camino7);
  assert.equal(mas.pares[1].inicioFijo.length, 2);
  assert.equal(rondaActual(mas).modo.gusanos, 2);
  assert.deepEqual(rondaActual(mas).camino, mas.pares[1].inicioFijo);
});

test('partida de dos gusanos: el sorteo usa distancias sin sentido y, si no hay par lejano, el más alejado', () => {
  for (let semilla = 1; semilla <= 20; semilla++) {
    const [a, b] = nuevaPartida({ tableros: [flecha4], inicio: 'azar', semilla, modo: DOS_GUSANOS }).pares[0].inicioFijo;
    // flecha4: diámetro sin sentido 3, umbral max(2, 2) = 2; la 0 y la 3 cuentan aunque no se llegue con flechas.
    assert.ok(distancia(flecha4, a, b) >= 2, `${a}-${b}`);
    const [c, d] = nuevaPartida({ tableros: [triangulo], inicio: 'azar', semilla, modo: DOS_GUSANOS }).pares[0].inicioFijo;
    assert.notEqual(c, d);
  }
});

test('partida de dos gusanos con inicio libre: las dos salidas se eligen en la primera ronda', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [camino7], inicio: 'libre', semilla: 1, modo: DOS_GUSANOS });
  assert.equal(p.pares[0].inicioFijo, null);
  assert.deepEqual(rondaActual(p).camino, []);
  assert.equal(jugadorEnTurno(p), 0);
  p = jugarEnPartida(p, 0); // A elige su salida
  assert.equal(p.pares[0].inicioFijo, null);
  assert.equal(jugadorEnTurno(p), 1);
  p = jugarEnPartida(p, 6); // B la suya
  assert.deepEqual(p.pares[0].inicioFijo, [0, 6]);
  assert.deepEqual(p.pares[0].rondas[1].camino, [0, 6]);
  assert.deepEqual(p.pares[0].rondas[1].cuerpos, [[0], [6]]);
  assert.equal(jugadorEnTurno(p), 0);
  p = terminarRonda(p);
  assert.equal(p.ronda, 1);
  assert.deepEqual(rondaActual(p).camino, [0, 6]);
  assert.equal(jugadorEnTurno(p), 1);
});

test('partida de dos cabezas: jugarEnPartida acepta el objeto y rechaza el índice ambiguo', () => {
  let p = nuevaPartida({ nombres: ['A', 'B'], tableros: [ciclo4], inicio: 'libre', semilla: 1, modo: DOS_CABEZAS });
  p = jugarEnPartida(p, 0);
  assert.equal(p.pares[0].inicioFijo, 0);
  assert.deepEqual(p.pares[0].rondas[1].modo, DOS_CABEZAS);
  p = jugarEnPartida(p, 1);
  p = jugarEnPartida(p, 2);
  assert.throws(() => jugarEnPartida(p, 3), /jugada ambigua/);
  p = jugarEnPartida(p, { casilla: 3, extremo: 1 });
  assert.equal(p.ronda, 1);
  assert.deepEqual(p.pares[0].rondas[0].cuerpos, [[3, 0, 1, 2]]);
  assert.equal(marcador(p).puntos[0], 4);
});

test('partida de un gusano con flechas: la casilla inicial sorteada tiene salida', () => {
  for (let semilla = 1; semilla <= 40; semilla++) {
    const p = nuevaPartida({ tableros: [flecha4], inicio: 'azar', semilla });
    assert.notEqual(p.pares[0].inicioFijo, 3);
    assert.equal(p.terminada, false);
  }
});
