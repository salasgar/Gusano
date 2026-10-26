/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generador, generadores } from '../js/tableros/index.js';
import { validarTablero } from '../js/tableros/tipos.js';

const cuadrado4 = generador('cuadrado4');
const cuadrado8 = generador('cuadrado8');
const caballo = generador('caballo');
const hexagonal = generador('hexagonal');
const superficie = generador('superficie');

const grados = (t) => t.vecinos.map((v) => v.length);
const salidas = (t) => t.casillas.flatMap((_, i) => (t.vecinos[i].length === 0 ? [i] : []));
// Aristas de doble sentido y arcos de un tablero (dirigido o no).
function conexiones(t) {
  let dobles = 0;
  let arcos = 0;
  t.vecinos.forEach((lista, i) => {
    for (const j of lista) {
      if (t.vecinos[j].includes(i)) { if (i < j) dobles++; } else arcos++;
    }
  });
  return { dobles, arcos };
}

// Valor de la ronda clásica con el gusano en `inicio` (mueve el pájaro, que minimiza), como
// en reparto/datos/analisis-2026-10-26/comprobar.py; solo para tableros pequeños.
function valorClasico(vecinos, inicio) {
  const memo = new Map();
  const v = (mascara, cabeza, mueveGusano) => {
    const clave = `${mascara},${cabeza},${mueveGusano}`;
    if (memo.has(clave)) return memo.get(clave);
    const legales = vecinos[cabeza].filter((j) => !((mascara >> j) & 1));
    let resultado;
    if (legales.length === 0) {
      resultado = mascara.toString(2).replaceAll('0', '').length;
    } else {
      const valores = legales.map((j) => v(mascara | (1 << j), j, !mueveGusano));
      resultado = mueveGusano ? Math.max(...valores) : Math.min(...valores);
    }
    memo.set(clave, resultado);
    return resultado;
  };
  return v(1 << inicio, inicio, false);
}

test('con los valores por defecto, los tres generadores dan el tablero de la tanda 1', () => {
  const t = cuadrado4.crear({ lado: 4 });
  assert.equal(t.id, 'cuadrado4-4');
  assert.equal(t.nombre, 'Cuadrado 4×4, 4 vecinas');
  assert.deepEqual(t.dibujo, { ancho: 4, alto: 4, aristas: false, radio: 0.35 });
  assert.equal('descripcion' in t, false);
  assert.equal('dirigido' in t, false);
  assert.deepEqual(t.generador, { id: 'cuadrado4', parametros: { lado: 4, alto: 4, bordes: 'normales', flechas: 'ninguna' } });
  assert.deepEqual(t.vecinos[0], [1, 4]);
  assert.deepEqual(t.vecinos[5], [1, 4, 6, 9]);
  assert.deepEqual(t.casillas[5], { x: 1.5, y: 1.5, vertices: [[1, 1], [2, 1], [2, 2], [1, 2]] });
  assert.equal(cuadrado8.crear({ lado: 4 }).id, 'cuadrado8-4');
  assert.deepEqual(cuadrado8.crear({ lado: 4 }).vecinos[5], [0, 1, 2, 4, 6, 8, 9, 10]);
  assert.equal(caballo.crear({ lado: 5 }).id, 'caballo-5');
  assert.deepEqual(caballo.crear({ lado: 5 }).dibujo, { ancho: 5, alto: 5, aristas: false, radio: 0.35 });
  assert.equal(hexagonal.crear({ radio: 2 }).id, 'hexagonal-2');
  assert.equal(hexagonal.crear({ radio: 2 }).casillas.length, 19);
  // Las URL antiguas piden solo `lado` y `superficie`.
  assert.deepEqual(cuadrado4.crear({ lado: 4 }), cuadrado4.crear({ lado: 4, alto: 4, bordes: 'normales', flechas: 'ninguna' }));
});

test('alto distinto de lado: rectángulo y su id', () => {
  const t = cuadrado8.crear({ lado: 6, alto: 4, bordes: 'toro' });
  assert.equal(t.id, 'cuadrado8-6x4-toro');
  assert.equal(t.casillas.length, 24);
  assert.deepEqual(validarTablero(t), { ok: true });
  const plano = cuadrado4.crear({ lado: 5, alto: 3 });
  assert.equal(plano.id, 'cuadrado4-5x3');
  assert.equal(plano.casillas.length, 15);
  assert.deepEqual(plano.dibujo, { ancho: 5, alto: 3, aristas: false, radio: 0.35 });
});

test('cuadrado4 toro de lado 4 tiene los mismos vecinos que superficie toro lado 4', () => {
  const a = cuadrado4.crear({ lado: 4, bordes: 'toro' });
  const b = superficie.crear({ lado: 4, superficie: 'toro' });
  assert.deepEqual(a.vecinos, b.vecinos);
  assert.ok(a.vecinos.every((v) => v.length === 4));
  for (const tipo of ['cilindro', 'mobius', 'klein']) {
    assert.deepEqual(cuadrado4.crear({ lado: 6, bordes: tipo }).vecinos, superficie.crear({ lado: 6, superficie: tipo }).vecinos, tipo);
  }
});

test('rectángulo 6×4 toro: 24 casillas de grado 4', () => {
  const t = cuadrado4.crear({ lado: 6, alto: 4, bordes: 'toro' });
  assert.equal(t.casillas.length, 24);
  assert.ok(grados(t).every((g) => g === 4));
  assert.deepEqual(t.vecinos[0], [1, 5, 6, 18]);
});

test('cuadrado8 toro 5×5 y caballo toro 6×6: todas las casillas de grado 8', () => {
  assert.ok(grados(cuadrado8.crear({ lado: 5, bordes: 'toro' })).every((g) => g === 8));
  assert.ok(grados(caballo.crear({ lado: 6, bordes: 'toro' })).every((g) => g === 8));
});

test('caballo toro 4×4 descarta las vecinas repetidas sin error', () => {
  const t = caballo.crear({ lado: 4, bordes: 'toro' });
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.ok(grados(t).every((g) => g > 0 && g < 8));
});

test('Möbius 5×4: filas de arriba y abajo de grado 3, el resto 4, y la vecina de la derecha va invertida', () => {
  const t = cuadrado4.crear({ lado: 5, alto: 4, bordes: 'mobius' });
  const g = grados(t);
  for (let f = 0; f < 4; f++) {
    for (let c = 0; c < 5; c++) assert.equal(g[f * 5 + c], f === 0 || f === 3 ? 3 : 4, `(${f}, ${c})`);
  }
  // (0, 4) → derecha → (3, 0); (1, 4) → (2, 0).
  assert.ok(t.vecinos[4].includes(15));
  assert.ok(t.vecinos[9].includes(10));
  assert.ok(!t.vecinos[4].includes(0 * 5 + 0));
  assert.ok(grados(cuadrado4.crear({ lado: 5, alto: 4, bordes: 'klein' })).every((x) => x === 4));
  assert.ok(cuadrado4.crear({ lado: 5, alto: 4, bordes: 'klein' }).vecinos[4].includes(15));
});

test('cilindro: izquierda y derecha pegadas, arriba y abajo no', () => {
  const t = cuadrado4.crear({ lado: 4, alto: 3, bordes: 'cilindro' });
  assert.deepEqual(t.vecinos[0], [1, 3, 4]);
  assert.deepEqual(t.vecinos[4], [0, 5, 7, 8]);
});

test('hexagonal toro (radios 1, 2 y 3): 6 vecinas, simétrico, sin bucles y circulante de saltos 1, 3r+1, 3r+2', () => {
  for (const radio of [1, 2, 3]) {
    const t = hexagonal.crear({ radio, bordes: 'toro' });
    const n = 3 * radio * radio + 3 * radio + 1;
    assert.equal(t.casillas.length, n);
    assert.deepEqual(validarTablero(t), { ok: true });
    assert.ok(grados(t).every((g) => g === 6), `radio ${radio}`);
    t.vecinos.forEach((lista, i) => lista.forEach((j) => {
      assert.notEqual(i, j);
      assert.ok(t.vecinos[j].includes(i));
    }));
    if (radio === 1) t.vecinos.forEach((lista, i) => assert.deepEqual(lista, [...Array(7).keys()].filter((k) => k !== i)));

    // Etiqueta de cada casilla en Z_n: φ(q, s) = x·q + y·s, nula en las dos traslaciones. Se
    // busca (x, y) con los saltos ±{1, 3r+1, 3r+2} y se comprueba que φ es una biyección que
    // lleva las vecinas de cada casilla a φ + salto.
    const saltos = new Set([1, 3 * radio + 1, 3 * radio + 2].flatMap((s) => [s % n, (n - s) % n]));
    const coordenadas = [];
    for (let r = -radio; r <= radio; r++) {
      for (let q = Math.max(-radio, -radio - r); q <= Math.min(radio, radio - r); q++) coordenadas.push([q, r]);
    }
    const mod = (k) => ((k % n) + n) % n;
    let encontrado = false;
    for (let x = 1; x < n && !encontrado; x++) {
      for (let y = 1; y < n && !encontrado; y++) {
        if (mod((2 * radio + 1) * x - radio * y) !== 0 || mod(radio * x + (radio + 1) * y) !== 0) continue;
        const dirs = new Set([x, y, x - y].flatMap((s) => [mod(s), mod(-s)]));
        if (dirs.size !== saltos.size || ![...dirs].every((s) => saltos.has(s))) continue;
        const etiqueta = coordenadas.map(([q, r]) => mod(x * q + y * r));
        if (new Set(etiqueta).size !== n) continue;
        const casilla = new Map(etiqueta.map((e, i) => [e, i]));
        const coincide = t.vecinos.every((lista, i) => {
          const esperado = [...saltos].map((s) => casilla.get(mod(etiqueta[i] + s))).sort((a, b) => a - b);
          return JSON.stringify(esperado) === JSON.stringify(lista);
        });
        if (coincide) encontrado = true;
      }
    }
    assert.ok(encontrado, `radio ${radio}: no es el circulante esperado`);
  }
});

test('manhattan 4×4 plano: calles alternas, dos esquinas sin salida y valores de 1 a 11', () => {
  const t = cuadrado4.crear({ lado: 4, flechas: 'manhattan' });
  assert.equal(t.dirigido, true);
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.equal(t.id, 'cuadrado4-4-manhattan');
  // Fila 0 hacia la derecha, fila 1 hacia la izquierda; columna 0 hacia abajo, columna 1 hacia arriba.
  assert.deepEqual(t.vecinos[0], [1, 4]);
  assert.deepEqual(t.vecinos[1], [2]);
  assert.deepEqual(t.vecinos[5], [1, 4]);
  assert.deepEqual(t.vecinos[4], [8]);
  assert.deepEqual(conexiones(t), { dobles: 0, arcos: 24 });
  assert.deepEqual(salidas(t), [3, 12]);
  const valores = t.casillas.map((_, i) => valorClasico(t.vecinos, i));
  assert.equal(Math.min(...valores), 1);
  assert.equal(Math.max(...valores), 11);
});

test('manhattan y corriente en el toro 4×4: valores comprobados', () => {
  const manhattan = cuadrado4.crear({ lado: 4, bordes: 'toro', flechas: 'manhattan' });
  assert.deepEqual(validarTablero(manhattan), { ok: true });
  assert.equal(Math.max(...manhattan.casillas.map((_, i) => valorClasico(manhattan.vecinos, i))), 8);
  const corriente = cuadrado4.crear({ lado: 4, bordes: 'toro', flechas: 'corriente' });
  assert.deepEqual(validarTablero(corriente), { ok: true });
  assert.ok(corriente.vecinos.every((v) => v.length === 2));
  assert.equal(Math.max(...corriente.casillas.map((_, i) => valorClasico(corriente.vecinos, i))), 13);
});

test('corriente sin toro lanza Error; con toro vale en cuadrado4 y cuadrado8', () => {
  assert.throws(() => cuadrado4.crear({ lado: 4, flechas: 'corriente' }), Error);
  assert.throws(() => cuadrado8.crear({ lado: 4, bordes: 'klein', flechas: 'corriente' }), Error);
  assert.doesNotThrow(() => cuadrado8.crear({ lado: 4, bordes: 'toro', flechas: 'corriente' }));
  const opcion = cuadrado4.parametros.find((p) => p.id === 'flechas').opciones.find((o) => o.valor === 'corriente');
  assert.deepEqual(opcion.soloSi, { bordes: ['toro'] });
});

test('en cuadrado8 con flechas las diagonales siguen de doble sentido', () => {
  const t = cuadrado8.crear({ lado: 4, flechas: 'manhattan' });
  assert.deepEqual(validarTablero(t), { ok: true });
  const { dobles, arcos } = conexiones(t);
  assert.equal(dobles, 18); // 9 rombos de 2 diagonales
  assert.equal(arcos, 24);
});

test('Möbius y Klein con manhattan: la conexión que el pegado contradice se queda de doble sentido', () => {
  // Con 5 filas, la fila f y la 4 − f tienen la misma paridad: nada contradice.
  assert.equal(conexiones(cuadrado4.crear({ lado: 4, alto: 5, bordes: 'mobius', flechas: 'manhattan' })).dobles, 0);
  // Con 4 filas, (0, 3) → (3, 0): fila 0 hacia la derecha y fila 3 hacia la izquierda.
  const t = cuadrado4.crear({ lado: 4, alto: 4, bordes: 'mobius', flechas: 'manhattan' });
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.ok(t.vecinos[3].includes(12) && t.vecinos[12].includes(3));
  assert.equal(conexiones(t).dobles, 4); // las cuatro del pegado: f y 3 − f tienen paridad distinta
});

test('hexagonal corrientes radio 2: cada casilla interior con 3 salidas y 3 entradas', () => {
  const t = hexagonal.crear({ radio: 2, flechas: 'corrientes' });
  assert.equal(t.dirigido, true);
  assert.deepEqual(validarTablero(t), { ok: true });
  const interiores = t.casillas.flatMap((_, i) => (generador('hexagonal').crear({ radio: 2 }).vecinos[i].length === 6 ? [i] : []));
  assert.equal(interiores.length, 7);
  for (const i of interiores) {
    assert.equal(t.vecinos[i].length, 3);
    assert.equal(t.predecesores[i].length, 3);
  }
  assert.equal(conexiones(t).dobles, 0);
});

test('hexagonal toro con corrientes es dirigido y válido', () => {
  const t = hexagonal.crear({ radio: 2, bordes: 'toro', flechas: 'corrientes' });
  assert.deepEqual(validarTablero(t), { ok: true });
  assert.equal(t.id, 'hexagonal-2-toro-corrientes');
});

test('fantasmas del toro 4×4: 20, uno por cada casilla del borde y las cuatro esquinas', () => {
  const t = cuadrado4.crear({ lado: 4, bordes: 'toro' });
  const f = t.dibujo.fantasmas;
  assert.equal(f.length, 20);
  assert.deepEqual([t.dibujo.ancho, t.dibujo.alto], [6, 6]);
  // Los reales se desplazan una casilla; los fantasmas cubren el anillo exterior.
  assert.deepEqual([t.casillas[0].x, t.casillas[0].y], [1.5, 1.5]);
  assert.ok(f.every((g) => g.x < 1 || g.x > 5 || g.y < 1 || g.y > 5));
  const en = (x, y) => f.find((g) => g.x === x && g.y === y);
  assert.equal(en(0.5, 1.5).casilla, 3); // a la izquierda de (0, 0): la (0, 3)
  assert.equal(en(5.5, 1.5).casilla, 0); // a la derecha de (0, 3): la (0, 0)
  assert.equal(en(1.5, 0.5).casilla, 12); // encima de (0, 0): la (3, 0)
  assert.equal(en(1.5, 5.5).casilla, 0); // debajo de (3, 0): la (0, 0)
  assert.equal(en(0.5, 0.5).casilla, 15); // esquina: la opuesta en diagonal
  assert.equal(en(5.5, 5.5).casilla, 0);
  assert.equal(en(5.5, 0.5).casilla, 12);
  assert.equal(en(0.5, 5.5).casilla, 3);
  assert.ok(f.every((g) => g.vertices.length === 4));
});

test('fantasmas con inversión en Möbius y Klein; cilindro solo a los lados', () => {
  const mobius = cuadrado4.crear({ lado: 5, alto: 4, bordes: 'mobius' });
  assert.equal(mobius.dibujo.fantasmas.length, 8);
  assert.deepEqual([mobius.dibujo.ancho, mobius.dibujo.alto], [7, 4]);
  // A la derecha de (0, 4): la (3, 0), invertida; a la izquierda de (0, 0): la (3, 4).
  const der = mobius.dibujo.fantasmas.find((g) => g.x === 6.5 && g.y === 0.5);
  const izq = mobius.dibujo.fantasmas.find((g) => g.x === 0.5 && g.y === 0.5);
  assert.equal(der.casilla, 15);
  assert.equal(izq.casilla, 19);
  const klein = cuadrado4.crear({ lado: 5, alto: 4, bordes: 'klein' });
  assert.equal(klein.dibujo.fantasmas.length, 2 * 4 + 2 * 5 + 4);
  assert.equal(cuadrado4.crear({ lado: 4, bordes: 'cilindro' }).dibujo.fantasmas.length, 8);
});

test('ningún fantasma en bordes normales, y la superficie sí los lleva', () => {
  for (const g of [cuadrado4, cuadrado8, caballo]) assert.equal('fantasmas' in g.crear().dibujo, false);
  assert.equal('fantasmas' in hexagonal.crear().dibujo, false);
  const s = superficie.crear({ lado: 4, superficie: 'toro' });
  assert.equal(s.dibujo.fantasmas.length, 20);
  assert.equal(s.id, 'superficie-toro-4');
  assert.deepEqual(validarTablero(s), { ok: true });
});

test('fantasmas del toro hexagonal: un anillo de 6(r+1) casillas, cada una copia de una real', () => {
  for (const radio of [1, 2, 3]) {
    const t = hexagonal.crear({ radio, bordes: 'toro' });
    assert.equal(t.dibujo.fantasmas.length, 6 * (radio + 1));
    assert.ok(t.dibujo.fantasmas.every((g) => g.casilla >= 0 && g.casilla < t.casillas.length && g.vertices.length === 6));
    assert.ok(t.casillas.every((c) => c.x >= 0 && c.x <= t.dibujo.ancho && c.y >= 0 && c.y <= t.dibujo.alto));
    assert.ok(t.dibujo.fantasmas.every((g) => g.x >= 0 && g.x <= t.dibujo.ancho && g.y >= 0 && g.y <= t.dibujo.alto));
  }
});

test('el registro no lista superficie pero la devuelve, y los generadores no tienen parámetros repetidos', () => {
  assert.equal(generadores.some((g) => g.id === 'superficie'), false);
  assert.equal(superficie.crear().id, 'superficie-toro-6');
  for (const g of [...generadores, superficie]) {
    const ids = g.parametros.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, g.id);
    assert.deepEqual(validarTablero(g.crear()), { ok: true });
  }
});
