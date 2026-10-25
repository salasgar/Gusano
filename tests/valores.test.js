/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { conValores } from '../js/tableros/valores.js';
import { conObstaculos } from '../js/tableros/obstaculos.js';
import { validarTablero } from '../js/tableros/tipos.js';
import { generador } from '../js/tableros/index.js';
import { crearAzar } from '../js/util/azar.js';
import { nuevaRonda, jugar, puntuacion } from '../js/motor/ronda.js';
import { valorExacto } from '../js/ia/minimax.js';
import { ajustesPorDefecto, tablerosDesdeAjustes } from '../js/ui/ajustes.js';

const cuadrado = (lado = 6) => generador('cuadrado4').crear({ lado });
const valores = (t) => t.casillas.map((c) => c.valor);

test('cada modo da un tablero válido con valores en su rango', () => {
  for (const [modo, rango] of [['uniforme', [1, 3]], ['centro', [1, 3]], ['trampas', [-2, 3]]]) {
    const t = conValores(cuadrado(), modo, crearAzar(1));
    assert.deepEqual(validarTablero(t), { ok: true });
    for (const v of valores(t)) {
      assert.ok(Number.isInteger(v) && v >= rango[0] && v <= rango[1], `${modo}: ${v}`);
    }
  }
});

test('centro en cuadrado4 lado 6: las cuatro centrales valen 3 y las esquinas 1', () => {
  const v = valores(conValores(cuadrado(), 'centro', crearAzar(1)));
  for (const i of [14, 15, 20, 21]) assert.equal(v[i], 3);
  for (const i of [0, 5, 30, 35]) assert.equal(v[i], 1);
});

test('trampas en lado 6: 4 casillas con −2 y el resto entre 1 y 3', () => {
  const v = valores(conValores(cuadrado(), 'trampas', crearAzar(4)));
  assert.equal(v.filter((x) => x === -2).length, 4);
  assert.ok(v.filter((x) => x !== -2).every((x) => x >= 1 && x <= 3));
});

test('reproducible con la misma semilla; id y descripción', () => {
  const a = conValores(cuadrado(), 'uniforme', crearAzar(8));
  const b = conValores(cuadrado(), 'uniforme', crearAzar(8));
  const c = conValores(cuadrado(), 'uniforme', crearAzar(9));
  assert.deepEqual(valores(a), valores(b));
  assert.notDeepEqual(valores(a), valores(c));
  assert.equal(a.id, 'cuadrado4-6-val-uniforme');
  assert.match(a.descripcion, /Casillas con valor: uniforme/);
});

test('modo desconocido lanza Error y el original no se muta', () => {
  const t = cuadrado();
  assert.throws(() => conValores(t, 'raro', crearAzar(1)), Error);
  conValores(t, 'uniforme', crearAzar(1));
  assert.ok(t.casillas.every((c) => c.valor === undefined || c.valor === 1));
});

test('las bloqueadas no cambian de valor', () => {
  const t = conObstaculos(cuadrado(), 0.2, crearAzar(3));
  const v = conValores(t, 'trampas', crearAzar(3));
  v.casillas.forEach((c, i) => {
    if (c.bloqueada) assert.equal(c.valor, t.casillas[i].valor);
  });
});

test('valorExacto en cuadrado4 lado 3 con todos los valores a 2 es el doble (18)', () => {
  const t = cuadrado(3);
  const doble = { ...t, casillas: t.casillas.map((c) => ({ ...c, valor: 2 })) };
  const exacto = (tablero) => valorExacto(jugar(nuevaRonda(tablero), 0)).valor;
  assert.equal(exacto(doble), 2 * exacto(t));
  assert.equal(exacto(doble), 18);
});

test('puntuacion de un camino con un −2 resta', () => {
  const t = cuadrado(3);
  t.casillas[1].valor = -2;
  let r = nuevaRonda(t);
  r = jugar(jugar(r, 0), 1);
  assert.equal(puntuacion(r), 1 + -2);
});

test('tablerosDesdeAjustes aplica valores tras obstáculos', () => {
  const [t] = tablerosDesdeAjustes({ ...ajustesPorDefecto({ semilla: 3 }), obstaculos: 0.1, valores: 'centro' });
  assert.ok(t.casillas.some((c) => c.bloqueada));
  assert.ok(t.casillas.some((c) => c.valor === 3));
  assert.equal(ajustesPorDefecto().valores, 'sin');
});
