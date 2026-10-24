import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAzar, semillaDesdeTexto } from '../js/util/azar.js';

test('la misma semilla da la misma secuencia', () => {
  const a = crearAzar(42);
  const b = crearAzar(42);
  for (let i = 0; i < 100; i++) assert.equal(a.siguiente(), b.siguiente());
});

test('siguiente está en [0, 1) y entero en el rango pedido', () => {
  const azar = crearAzar(7);
  for (let i = 0; i < 1000; i++) {
    const x = azar.siguiente();
    assert.ok(x >= 0 && x < 1);
    const n = azar.entero(3, 5);
    assert.ok(n >= 3 && n <= 5);
  }
});

test('semillaDesdeTexto es estable y distinta para textos distintos', () => {
  assert.equal(semillaDesdeTexto('gusano-1'), semillaDesdeTexto('gusano-1'));
  assert.notEqual(semillaDesdeTexto('gusano-1'), semillaDesdeTexto('gusano-2'));
});

test('barajar conserva los elementos y elegir devuelve uno de la lista', () => {
  const azar = crearAzar(3);
  assert.deepEqual([...azar.barajar([1, 2, 3, 4, 5])].sort(), [1, 2, 3, 4, 5]);
  assert.ok(['a', 'b'].includes(azar.elegir(['a', 'b'])));
});
