/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearTablero, validarTablero } from '../js/tableros/tipos.js';
import { conSentidoUnico } from '../js/tableros/sentido.js';
import { conObstaculos } from '../js/tableros/obstaculos.js';
import { generador } from '../js/tableros/index.js';
import { crearAzar } from '../js/util/azar.js';

const casillas = (n) => Array.from({ length: n }, (_, i) => ({ x: i, y: 0 }));
const dibujo = (n) => ({ ancho: n, alto: 1 });
const cuadrado = (lado) => generador('cuadrado4').crear({ lado });

// Aristas de doble sentido, arcos y casillas sin salida o sin entrada de un tablero dirigido.
function pares(t) {
  let dobles = 0;
  let unico = 0;
  t.vecinos.forEach((lista, i) => {
    for (const j of lista) {
      if (t.vecinos[j].includes(i)) { if (i < j) dobles++; } else unico++;
    }
  });
  return { dobles, unico };
}
const libres = (t, lista) => lista.filter((j) => !t.casillas[j].bloqueada);
const sinSalida = (t) => t.casillas.flatMap((c, i) => (!c.bloqueada && libres(t, t.vecinos[i]).length === 0 ? [i] : []));
const sinEntrada = (t) => {
  const pred = t.predecesores ?? t.vecinos;
  return t.casillas.flatMap((c, i) => (!c.bloqueada && libres(t, pred[i]).length === 0 ? [i] : []));
};

test('crearTablero con aristas y arcos: vecinos son las salidas y predecesores las entradas', () => {
  const t = crearTablero({
    id: 'a', nombre: 'a', casillas: casillas(4), dibujo: dibujo(4),
    aristas: [[0, 1]], arcos: [[1, 2], [3, 2], [2, 0]],
  });
  assert.equal(t.dirigido, true);
  assert.deepEqual(t.vecinos, [[1], [0, 2], [0], [2]]);
  assert.deepEqual(t.predecesores, [[1, 2], [0], [1, 3], []]);
});

test('crearTablero sin arcos no añade dirigido ni predecesores', () => {
  const t = crearTablero({ id: 'a', nombre: 'a', casillas: casillas(3), dibujo: dibujo(3), aristas: [[0, 1], [1, 2]], arcos: [] });
  assert.equal('dirigido' in t, false);
  assert.equal('predecesores' in t, false);
  assert.deepEqual(t.vecinos, [[1], [0, 2], [1]]);
});

test('crearTablero sin arcos da el mismo tablero de la tanda 1 (cuadrado4 lado 4)', () => {
  const t = cuadrado(4);
  const aristas = t.vecinos.flatMap((l, i) => l.filter((j) => i < j).map((j) => [i, j]));
  const otro = crearTablero({
    id: t.id, nombre: t.nombre, descripcion: t.descripcion, generador: t.generador,
    casillas: t.casillas, aristas, dibujo: t.dibujo,
  });
  assert.deepEqual(otro, t);
  assert.deepEqual(validarTablero(otro), { ok: true });
});

test('crearTablero rechaza un par que es arista y arco, un bucle y un arco fuera de rango', () => {
  const base = { id: 'a', nombre: 'a', casillas: casillas(3), dibujo: dibujo(3) };
  assert.throws(() => crearTablero({ ...base, aristas: [[0, 1]], arcos: [[1, 0]] }), /arista y arco/);
  assert.throws(() => crearTablero({ ...base, aristas: [[0, 1]], arcos: [[0, 1]] }), /arista y arco/);
  assert.throws(() => crearTablero({ ...base, arcos: [[2, 2]] }), /consigo misma/);
  assert.throws(() => crearTablero({ ...base, arcos: [[0, 3]] }), /fuera de rango/);
});

test('validarTablero acepta un dirigido bueno y rechaza uno con predecesores mal', () => {
  const t = crearTablero({ id: 'a', nombre: 'a', casillas: casillas(3), dibujo: dibujo(3), arcos: [[0, 1], [1, 2]] });
  assert.deepEqual(validarTablero(t), { ok: true });
  const mal = structuredClone(t);
  mal.predecesores[2] = [0];
  const r = validarTablero(mal);
  assert.equal(r.ok, false);
  assert.match(r.errores.join(' '), /predecesores/);
  const sin = structuredClone(t);
  delete sin.predecesores;
  assert.equal(validarTablero(sin).ok, false);
});

test('validarTablero sigue exigiendo simetría a un tablero no dirigido', () => {
  const t = cuadrado(3);
  t.vecinos[0] = t.vecinos[0].filter((j) => j !== 1);
  assert.equal(validarTablero(t).ok, false);
});

test('conSentidoUnico con 0,5 en cuadrado4 lado 6: la mitad de las aristas, sin casillas sin salida ni entrada', () => {
  const original = cuadrado(6);
  const aristas = pares(original).dobles; // 60
  const t = conSentidoUnico(original, 0.5, crearAzar(7));
  assert.equal(t.dirigido, true);
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.deepEqual(pares(t), { dobles: aristas - Math.round(aristas / 2), unico: Math.round(aristas / 2) });
  assert.deepEqual(sinSalida(t), []);
  assert.deepEqual(sinEntrada(t), []);
  assert.equal(t.id, `${original.id}-sen50`);
  assert.match(t.descripcion, /30 conexiones de un solo sentido/);
});

test('conSentidoUnico no modifica el tablero original y es reproducible con la misma semilla', () => {
  const original = cuadrado(6);
  const copiaOriginal = structuredClone(original);
  const a = conSentidoUnico(original, 0.5, crearAzar(3));
  const b = conSentidoUnico(original, 0.5, crearAzar(3));
  const c = conSentidoUnico(original, 0.5, crearAzar(4));
  assert.deepEqual(original, copiaOriginal);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.vecinos, c.vecinos);
});

test('conSentidoUnico con 1 en cuadrado4 lado 4: casi todas en un sentido y ninguna casilla sin salida ni entrada', () => {
  const original = cuadrado(4);
  const total = pares(original).dobles; // 24
  for (const semilla of [1, 2, 3, 4, 5]) {
    const t = conSentidoUnico(original, 1, crearAzar(semilla));
    const { dobles, unico } = pares(t);
    assert.equal(dobles + unico, total);
    assert.ok(unico >= total / 2, `semilla ${semilla}: solo ${unico} de un solo sentido`);
    assert.deepEqual(validarTablero(t), { ok: true });
    assert.deepEqual(sinSalida(t), []);
    assert.deepEqual(sinEntrada(t), []);
    assert.equal(t.id, `${original.id}-sen100`);
  }
});

test('conSentidoUnico: una arista cuyos dos sentidos dejarían a alguien sin salida se queda doble', () => {
  // Un camino 0-1-2: los extremos tienen una sola conexión, así que no se puede orientar nada.
  const camino = crearTablero({ id: 'c', nombre: 'c', casillas: casillas(3), dibujo: dibujo(3), aristas: [[0, 1], [1, 2]] });
  const t = conSentidoUnico(camino, 1, crearAzar(1));
  assert.deepEqual(t, camino);
});

test('conSentidoUnico con 0 devuelve una copia sin cambios', () => {
  const original = cuadrado(4);
  const t = conSentidoUnico(original, 0, crearAzar(1));
  assert.deepEqual(t, original);
  assert.notEqual(t, original);
  assert.equal('dirigido' in t, false);
});

test('conSentidoUnico respeta casillas bloqueadas y se puede encadenar tras los obstáculos', () => {
  const conObs = conObstaculos(cuadrado(6), 0.2, crearAzar(2));
  const t = conSentidoUnico(conObs, 0.5, crearAzar(5));
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.deepEqual(sinSalida(t), []);
  assert.deepEqual(sinEntrada(t), []);
  assert.match(t.id, /-obs20-sen50$/);
});
