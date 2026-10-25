/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ajustesPorDefecto, tablerosDesdeAjustes } from '../js/ui/ajustes.js';
import { generador } from '../js/tableros/index.js';
import { decoraciones } from '../js/ui/ayudas.js';
import { partidaDesdeURL, enlaceDe } from '../js/compartir/url.js';

test('ajustesPorDefecto tiene las claves del contrato', () => {
  const a = ajustesPorDefecto({ semilla: 7 });
  assert.deepEqual(Object.keys(a).sort(), ['generadorId', 'inicio', 'jugadores', 'nombres', 'obstaculos', 'pares', 'parametros', 'semilla', 'valores'].sort());
  assert.equal(a.generadorId, 'cuadrado4');
  assert.equal(a.pares, 1);
  assert.equal(a.inicio, 'azar');
  assert.equal(a.semilla, 7);
  assert.deepEqual(a.jugadores, [{ tipo: 'humano', nivel: null }, { tipo: 'maquina', nivel: 'fuerte' }]);
  assert.equal(a.nombres.length, 2);
  assert.ok(generador(a.generadorId));
});

test('tablerosDesdeAjustes: un tablero por par y del generador pedido', () => {
  for (const [generadorId, parametros, casillas] of [
    ['cuadrado4', { lado: 4 }, 16],
    ['hexagonal', { radio: 2 }, 19],
    ['caballo', {}, 36],
  ]) {
    const tableros = tablerosDesdeAjustes({ ...ajustesPorDefecto(), generadorId, parametros, pares: 3 });
    assert.equal(tableros.length, 3);
    for (const t of tableros) {
      assert.equal(t.generador.id, generadorId);
      assert.equal(t.casillas.length, casillas);
    }
  }
});

test('tablerosDesdeAjustes repite el tablero fijo del editor', () => {
  const fijo = generador('cuadrado4').crear({ lado: 3 });
  const tableros = tablerosDesdeAjustes({ ...ajustesPorDefecto(), tableroFijo: fijo, pares: 2 });
  assert.equal(tableros.length, 2);
  assert.equal(tableros[0], fijo);
});

test('los módulos de pantallas y los esbozos se importan en Node', async () => {
  for (const nombre of ['jugar', 'reto', 'analisis', 'editor']) {
    const m = await import(`../js/pantallas/${nombre}.js`);
    assert.equal(m.id, nombre);
    assert.equal(typeof m.titulo, 'string');
    assert.equal(typeof m.montar, 'function');
  }
  const app = await import('../js/ui/app.js');
  assert.deepEqual(app.pantallas.map((p) => p.id), ['jugar', 'reto', 'analisis', 'editor']);
  assert.equal(typeof app.irA, 'function');
});

test('esbozos de ayudas.js y url.js', () => {
  assert.ok(decoraciones({}) instanceof Map);
  assert.equal(decoraciones({}).size, 0);
  assert.equal(partidaDesdeURL(), null);
  assert.equal(enlaceDe({}), null);
});
