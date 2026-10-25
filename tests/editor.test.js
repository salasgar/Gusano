/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAzar } from '../js/util/azar.js';
import { validarTablero } from '../js/tableros/tipos.js';
import { generador } from '../js/tableros/index.js';
import {
  grafoAleatorio, tableroDesdeEditor, estadoDesdeTablero, esConexo,
} from '../js/pantallas/editor.js';

const conexo = (tablero) => esConexo(estadoDesdeTablero(tablero));

test('grafoAleatorio(12, 0.3) es válido, conexo y con la forma pedida', () => {
  const t = grafoAleatorio(12, 0.3, crearAzar(5));
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.equal(t.casillas.length, 12);
  assert.ok(conexo(t));
  assert.equal(t.id, 'aleatorio-12-5');
  assert.equal(t.dibujo.aristas, true);
  assert.equal(t.dibujo.radio, 0.35);
  assert.equal(t.dibujo.ancho, 10);
});

test('grafoAleatorio es reproducible con la misma semilla y distinto con otra', () => {
  const a = grafoAleatorio(15, 0.25, crearAzar(77));
  const b = grafoAleatorio(15, 0.25, crearAzar(77));
  const c = grafoAleatorio(15, 0.25, crearAzar(78));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.casillas, c.casillas);
});

test('grafoAleatorio separa los centros al menos 1 y los deja dentro de la caja', () => {
  const t = grafoAleatorio(40, 0.2, crearAzar(9));
  for (let i = 0; i < t.casillas.length; i++) {
    const { x, y } = t.casillas[i];
    assert.ok(x >= 0 && x <= 10 && y >= 0 && y <= 10);
    for (let j = i + 1; j < t.casillas.length; j++) {
      const d = Math.hypot(x - t.casillas[j].x, y - t.casillas[j].y);
      assert.ok(d >= 1, `casillas ${i} y ${j} a distancia ${d}`);
    }
  }
});

test('con probabilidad 0,05 el grafo sigue siendo conexo', () => {
  for (const [n, semilla] of [[12, 1], [12, 2], [40, 3], [5, 4]]) {
    const t = grafoAleatorio(n, 0.05, crearAzar(semilla));
    assert.deepEqual(validarTablero(t), { ok: true });
    assert.ok(conexo(t), `n=${n}, semilla=${semilla}`);
  }
});

test('ida y vuelta: estadoDesdeTablero(tableroDesdeEditor(estado)) conserva casillas y aristas', () => {
  const estado = {
    casillas: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 2.5 }],
    aristas: [[0, 1], [0, 4], [1, 2], [2, 3], [3, 4]], // orden en que las devuelve la inversa
  };
  const t = tableroDesdeEditor(estado);
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.deepEqual(estadoDesdeTablero(t), estado);
  assert.equal(t.dibujo.aristas, true);
  assert.deepEqual([t.dibujo.ancho, t.dibujo.alto], [4, 5]);
  assert.match(t.id, /^editor-\d+$/);
});

test('tableroDesdeEditor encaja la caja a las casillas (margen 1) y es idempotente', () => {
  const estado = { casillas: [{ x: 7, y: 8 }, { x: 9, y: 8.5 }, { x: 8, y: 6 }], aristas: [[0, 1]] };
  const t = tableroDesdeEditor(estado);
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.deepEqual(t.casillas.map((c) => [c.x, c.y]), [[1, 3], [3, 3.5], [2, 1]]);
  const otra = estadoDesdeTablero(t);
  assert.deepEqual(estadoDesdeTablero(tableroDesdeEditor(otra)), otra);
});

test('tableroDesdeEditor de un estado sin aristas da un tablero válido aunque no jugable', () => {
  const estado = { casillas: [{ x: 1, y: 1 }, { x: 4, y: 4 }, { x: 2, y: 7 }, { x: 8, y: 3 }], aristas: [] };
  const t = tableroDesdeEditor(estado);
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.deepEqual(t.vecinos, [[], [], [], []]);
  assert.equal(esConexo(estado), false);
});

test('estadoDesdeTablero ignora los vértices y recupera las aristas de una rejilla', () => {
  const rejilla = generador('cuadrado4').crear({ lado: 3 });
  const estado = estadoDesdeTablero(rejilla);
  assert.equal(estado.casillas.length, 9);
  assert.equal(estado.aristas.length, 12);
  assert.deepEqual(Object.keys(estado.casillas[0]).sort(), ['x', 'y']);
  assert.ok(esConexo(estado));
});

test('esConexo distingue grafos conexos, no conexos y vacíos', () => {
  const casillas = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }];
  assert.equal(esConexo({ casillas, aristas: [[0, 1], [1, 2]] }), true);
  assert.equal(esConexo({ casillas, aristas: [[0, 1]] }), false);
  assert.equal(esConexo({ casillas: [], aristas: [] }), false);
});

test('el módulo se importa en Node y exporta la pantalla', async () => {
  const modulo = await import('../js/pantallas/editor.js');
  assert.equal(modulo.id, 'editor');
  assert.equal(modulo.titulo, 'Editor');
  assert.equal(typeof modulo.montar, 'function');
});
