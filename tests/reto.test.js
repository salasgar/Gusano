/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import test from 'node:test';
import assert from 'node:assert/strict';

import { numeroDeReto, tableroDelReto, textoResultado } from '../js/pantallas/reto.js';
import { validarTablero } from '../js/tableros/tipos.js';
import { par } from '../js/ia/minimax.js';

test('numeroDeReto: el 20 de octubre de 2026 es el reto 1 y el 25 el 6', () => {
  assert.equal(numeroDeReto(new Date(2026, 9, 20)), 1);
  assert.equal(numeroDeReto(new Date(2026, 9, 25)), 6);
});

test('numeroDeReto: no depende de la hora del día ni del cambio de hora', () => {
  assert.equal(numeroDeReto(new Date(2026, 9, 20, 0, 0, 1)), 1);
  assert.equal(numeroDeReto(new Date(2026, 9, 20, 23, 59, 59)), 1);
  // Del 20 de octubre al 1 de noviembre (cambio de hora el 25 de octubre): 12 días.
  assert.equal(numeroDeReto(new Date(2026, 10, 1)), 13);
});

test('tableroDelReto: determinista', () => {
  assert.deepEqual(tableroDelReto(1), tableroDelReto(1));
  assert.deepEqual(tableroDelReto(17), tableroDelReto(17));
});

test('tableroDelReto: hay variedad de tableros en 30 días', () => {
  const ids = new Set();
  for (let n = 1; n <= 30; n++) ids.add(tableroDelReto(n).tablero.id);
  assert.ok(ids.size >= 4, `solo ${ids.size} tableros distintos: ${[...ids].join(', ')}`);
});

test('tableroDelReto 1..30: ≤ 25 casillas, válido, inicio libre y par calculable', () => {
  for (let n = 1; n <= 30; n++) {
    const { tablero, inicio } = tableroDelReto(n);
    const nombre = `reto ${n} (${tablero.id})`;
    assert.ok(tablero.casillas.length <= 25, `${nombre}: ${tablero.casillas.length} casillas`);
    assert.equal(validarTablero(tablero).ok, true, nombre);
    assert.ok(Number.isInteger(inicio) && inicio >= 0 && inicio < tablero.casillas.length, nombre);
    assert.notEqual(tablero.casillas[inicio].bloqueada, true, nombre);
    const inicioMs = Date.now();
    const p = par(tablero, inicio, { maxEstados: 2_000_000 });
    const ms = Date.now() - inicioMs;
    assert.notEqual(p, null, `${nombre}: par no calculable`);
    assert.ok(ms < 3000, `${nombre}: el par tardó ${ms} ms`);
  }
});

test('textoResultado: formato exacto', () => {
  assert.equal(textoResultado(12, 14, 16, 15), 'Gusano #12 · 14/16 · par 15');
  assert.equal(textoResultado(3, 9, 16, null), 'Gusano #3 · 9/16 · par no calculable');
});
