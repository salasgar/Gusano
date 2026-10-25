/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { conObstaculos } from '../js/tableros/obstaculos.js';
import { crearTablero, validarTablero } from '../js/tableros/tipos.js';
import { generador } from '../js/tableros/index.js';
import { crearAzar } from '../js/util/azar.js';
import { ajustesPorDefecto, tablerosDesdeAjustes } from '../js/ui/ajustes.js';

const bloqueadas = (t) => t.casillas.flatMap((c, i) => (c.bloqueada ? [i] : []));

function libresConexas(t) {
  const libres = t.casillas.flatMap((c, i) => (c.bloqueada ? [] : [i]));
  const visto = new Set([libres[0]]);
  const cola = [libres[0]];
  for (let k = 0; k < cola.length; k++) {
    for (const v of t.vecinos[cola[k]]) {
      if (!t.casillas[v].bloqueada && !visto.has(v)) { visto.add(v); cola.push(v); }
    }
  }
  return visto.size === libres.length;
}

const cuadrado = () => generador('cuadrado4').crear({ lado: 6 });

test('cuadrado4 lado 6 con 0,2: 7 bloqueadas, tablero válido y libres conexas', () => {
  const t = conObstaculos(cuadrado(), 0.2, crearAzar(1));
  assert.equal(bloqueadas(t).length, 7);
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.ok(libresConexas(t));
});

test('las bloqueadas conservan sus vecinos y no se muta el original', () => {
  const original = cuadrado();
  const antes = JSON.stringify(original);
  const t = conObstaculos(original, 0.2, crearAzar(2));
  assert.equal(JSON.stringify(original), antes);
  assert.deepEqual(t.vecinos, original.vecinos);
  for (const i of bloqueadas(t)) assert.ok(t.vecinos[i].length > 0);
});

test('id y descripción reflejan el porcentaje y el número real de bloqueadas', () => {
  const t = conObstaculos(cuadrado(), 0.2, crearAzar(3));
  assert.equal(t.id, 'cuadrado4-6-obs20');
  assert.match(t.descripcion, /7 casillas bloqueadas/);
});

test('reproducible con la misma semilla y distinto con otra', () => {
  const a = bloqueadas(conObstaculos(cuadrado(), 0.2, crearAzar(5)));
  const b = bloqueadas(conObstaculos(cuadrado(), 0.2, crearAzar(5)));
  const c = bloqueadas(conObstaculos(cuadrado(), 0.2, crearAzar(6)));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('proporción 0: copia sin ninguna bloqueada', () => {
  const t = conObstaculos(cuadrado(), 0, crearAzar(1));
  assert.equal(bloqueadas(t).length, 0);
  assert.deepEqual(t.casillas, cuadrado().casillas);
});

test('camino de 3 con 0,5: como mucho una bloqueada y libres conexas', () => {
  const camino = crearTablero({
    id: 'camino3', nombre: 'Camino de 3',
    casillas: [0, 1, 2].map((i) => ({ x: i + 0.5, y: 0.5 })),
    aristas: [[0, 1], [1, 2]],
    dibujo: { ancho: 3, alto: 1, aristas: true, radio: 0.35 },
  });
  for (let semilla = 1; semilla <= 20; semilla++) {
    const t = conObstaculos(camino, 0.5, crearAzar(semilla));
    assert.ok(bloqueadas(t).length <= 1);
    assert.ok(libresConexas(t));
  }
});

test('hexagonal radio 3 con 0,2 sigue conexo en muchas semillas', () => {
  const base = generador('hexagonal').crear({ radio: 3 });
  for (let semilla = 1; semilla <= 20; semilla++) {
    const t = conObstaculos(base, 0.2, crearAzar(semilla));
    assert.equal(bloqueadas(t).length, Math.round(0.2 * 37));
    assert.ok(libresConexas(t));
  }
});

test('tablerosDesdeAjustes con obstáculos devuelve tableros con bloqueadas', () => {
  const tableros = tablerosDesdeAjustes({ ...ajustesPorDefecto({ semilla: 9 }), obstaculos: 0.1, pares: 2 });
  assert.equal(tableros.length, 2);
  for (const t of tableros) assert.ok(bloqueadas(t).length > 0);
  assert.equal(ajustesPorDefecto().obstaculos, 0);
});
