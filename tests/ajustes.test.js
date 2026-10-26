/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ajustesPorDefecto, tablerosDesdeAjustes, modoDeAjustes, opcionDisponible } from '../js/ui/ajustes.js';
import { generador } from '../js/tableros/index.js';
import { decoraciones } from '../js/ui/ayudas.js';
import { partidaDesdeURL, enlaceDe } from '../js/compartir/url.js';

test('ajustesPorDefecto tiene las claves del contrato', () => {
  const a = ajustesPorDefecto({ semilla: 7 });
  assert.deepEqual(Object.keys(a).sort(), ['cabezas', 'generadorId', 'gusanos', 'inicio', 'jugadores', 'nombres', 'obstaculos', 'pares', 'parametros', 'semilla', 'sentido', 'valores'].sort());
  assert.deepEqual([a.gusanos, a.cabezas, a.sentido], [1, 1, 0]);
  assert.deepEqual(modoDeAjustes(a), { gusanos: 1, cabezas: 1 });
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

test('sin `alto` en los parámetros el tablero sale cuadrado (alto sigue a lado)', () => {
  const [t] = tablerosDesdeAjustes({ ...ajustesPorDefecto(), parametros: { lado: 4 } });
  assert.equal(t.casillas.length, 16);
  const [r] = tablerosDesdeAjustes({ ...ajustesPorDefecto(), parametros: { lado: 4, alto: 3 } });
  assert.equal(r.casillas.length, 12);
});

test('modoDeAjustes y opcionDisponible (soloSi)', () => {
  assert.deepEqual(modoDeAjustes({ ...ajustesPorDefecto(), gusanos: 2, cabezas: 2 }), { gusanos: 2, cabezas: 2 });
  assert.deepEqual(modoDeAjustes({}), { gusanos: 1, cabezas: 1 });
  const corriente = generador('cuadrado4').parametros.find((p) => p.id === 'flechas').opciones.find((o) => o.valor === 'corriente');
  assert.equal(opcionDisponible(corriente, { bordes: 'toro' }), true);
  assert.equal(opcionDisponible(corriente, { bordes: 'normales' }), false);
  assert.equal(opcionDisponible({ valor: 'x' }, {}), true);
});

test('el sentido único se aplica y se combina con obstáculos y valores', () => {
  const base = { ...ajustesPorDefecto({ semilla: 5 }), parametros: { lado: 5 } };
  const [sin] = tablerosDesdeAjustes(base);
  assert.equal(sin.dirigido, undefined);
  const [uno] = tablerosDesdeAjustes({ ...base, sentido: 0.5 });
  assert.equal(uno.dirigido, true);
  assert.match(uno.id, /-sen50$/);
  const [todo] = tablerosDesdeAjustes({ ...base, sentido: 1, obstaculos: 0.1, valores: 'uniforme' });
  assert.equal(todo.dirigido, true);
  assert.ok(todo.casillas.some((c) => c.bloqueada));
  assert.ok(todo.casillas.some((c) => c.valor !== undefined && c.valor !== 1));
});

test('esbozos de ayudas.js y url.js', () => {
  assert.ok(decoraciones({}) instanceof Map);
  assert.equal(decoraciones({}).size, 0);
  assert.equal(partidaDesdeURL(), null);
  assert.equal(enlaceDe({}), null);
});
