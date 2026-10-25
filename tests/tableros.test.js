import test from 'node:test';
import assert from 'node:assert/strict';
import { crearTablero, validarTablero } from '../js/tableros/tipos.js';
import { generadores, generador } from '../js/tableros/index.js';

const grado = (t, i) => t.vecinos[i].length;
const grados = (t) => t.vecinos.map((v) => v.length);
const casilla = (lado, f, c) => f * lado + c;

test('crearTablero construye vecinos simétricos, ordenados y sin repetidos', () => {
  const casillas = [0, 1, 2].map((i) => ({ x: i + 0.5, y: 0.5 }));
  const t = crearTablero({
    id: 'x', nombre: 'X', casillas,
    aristas: [[2, 1], [0, 1], [1, 0], [1, 2]],
    dibujo: { ancho: 3, alto: 1, aristas: true, radio: 0.35 },
  });
  assert.deepEqual(t.vecinos, [[1], [0, 2], [1]]);
  assert.deepEqual(validarTablero(t), { ok: true });
});

test('crearTablero lanza Error con índices fuera de rango, bucles o pocas casillas', () => {
  const dos = [{ x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 }];
  const dibujo = { ancho: 2, alto: 1, aristas: true, radio: 0.3 };
  assert.throws(() => crearTablero({ id: 'x', nombre: 'X', casillas: dos, aristas: [[0, 2]], dibujo }), Error);
  assert.throws(() => crearTablero({ id: 'x', nombre: 'X', casillas: dos, aristas: [[-1, 0]], dibujo }), Error);
  assert.throws(() => crearTablero({ id: 'x', nombre: 'X', casillas: dos, aristas: [[1, 1]], dibujo }), Error);
  assert.throws(() => crearTablero({ id: 'x', nombre: 'X', casillas: [dos[0]], aristas: [], dibujo }), Error);
});

test('validarTablero detecta asimetría, bucles, repetidos y datos mal formados', () => {
  const base = () => ({
    id: 'x', nombre: 'X',
    casillas: [{ x: 0.5, y: 0.5 }, { x: 1.5, y: 0.5 }],
    vecinos: [[1], [0]],
    dibujo: { ancho: 2, alto: 1, aristas: true, radio: 0.3 },
  });
  assert.equal(validarTablero(base()).ok, true);

  let t = base(); t.vecinos = [[1], []];
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.vecinos = [[0, 1], [0]];
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.vecinos = [[1, 1], [0]];
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.vecinos = [[1]];
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.casillas[0].x = 'a';
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.casillas[0].x = 5;
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.casillas[1].valor = 1.5;
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.casillas[1].valor = -2;
  assert.equal(validarTablero(t).ok, true);
  t = base(); t.casillas[1].bloqueada = 'si';
  assert.equal(validarTablero(t).ok, false);
  t = base(); t.casillas[1].bloqueada = true;
  assert.equal(validarTablero(t).ok, true);
  const { errores } = validarTablero(null);
  assert.ok(errores.length > 0);
});

test('el registro lista los generadores en orden y generador(id) los encuentra', () => {
  // La tarea 03 añade `poliedro` al final.
  assert.deepEqual(generadores.slice(0, 5).map((g) => g.id), ['cuadrado4', 'cuadrado8', 'caballo', 'hexagonal', 'superficie']);
  assert.equal(generador('hexagonal'), generadores[3]);
  assert.equal(generador('x'), undefined);
});

for (const g of generadores) {
  test(`${g.id}: con los valores por defecto el tablero es válido y trae su generador`, () => {
    const t = g.crear();
    assert.deepEqual(validarTablero(t), { ok: true });
    assert.equal(t.generador.id, g.id);
    const defectos = Object.fromEntries(g.parametros.map((p) => [p.id, p.defecto]));
    assert.deepEqual(t.generador.parametros, defectos);
    assert.deepEqual(g.crear({}), t);
    assert.deepEqual(g.crear(defectos), t);
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(t)));
    t.vecinos.forEach((v, i) => assert.ok(!v.includes(i), 'casilla vecina de sí misma'));
  });

  test(`${g.id}: todo el rango de parámetros da tableros válidos`, () => {
    const entero = g.parametros.find((p) => p.tipo === 'entero');
    const opcion = g.parametros.find((p) => p.tipo === 'opcion');
    const enteros = entero ? Array.from({ length: entero.max - entero.min + 1 }, (_, k) => entero.min + k) : [undefined];
    for (const n of enteros) {
      for (const o of opcion ? opcion.opciones : [{ valor: undefined }]) {
        const params = {};
        if (entero) params[entero.id] = n;
        if (opcion) params[opcion.id] = o.valor;
        const t = g.crear(params);
        assert.deepEqual(validarTablero(t), { ok: true }, `${t.id}`);
        t.vecinos.forEach((v, i) => assert.ok(!v.includes(i)));
      }
    }
  });

  test(`${g.id}: rechaza parámetros fuera de rango`, () => {
    const entero = g.parametros.find((p) => p.tipo === 'entero');
    if (!entero) {
      assert.throws(() => g.crear({ [g.parametros[0].id]: 'no-existe' }), Error);
      return;
    }
    assert.throws(() => g.crear({ [entero.id]: entero.max + 1 }), Error);
    assert.throws(() => g.crear({ [entero.id]: entero.min - 1 }), Error);
    assert.throws(() => g.crear({ [entero.id]: 3.5 }), Error);
  });
}

test('identificadores de los tableros', () => {
  assert.equal(generador('cuadrado4').crear({ lado: 6 }).id, 'cuadrado4-6');
  assert.equal(generador('cuadrado8').crear({ lado: 4 }).id, 'cuadrado8-4');
  assert.equal(generador('caballo').crear({ lado: 5 }).id, 'caballo-5');
  assert.equal(generador('hexagonal').crear({ radio: 2 }).id, 'hexagonal-2');
  assert.equal(generador('superficie').crear({ lado: 6 }).id, 'superficie-toro-6');
  assert.equal(generador('superficie').crear({ lado: 5, superficie: 'klein' }).id, 'superficie-klein-5');
});

test('cuadrado4 lado 6: 36 casillas, grados 2/3/4 y bipartito', () => {
  const lado = 6;
  const t = generador('cuadrado4').crear({ lado });
  assert.equal(t.casillas.length, 36);
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      const bordes = (f === 0 || f === lado - 1) + (c === 0 || c === lado - 1);
      assert.equal(grado(t, casilla(lado, f, c)), 4 - bordes, `(${f}, ${c})`);
      for (const v of t.vecinos[casilla(lado, f, c)]) {
        const g = Math.floor(v / lado);
        const d = v % lado;
        assert.notEqual((g + d) % 2, (f + c) % 2);
      }
    }
  }
  assert.deepEqual(t.dibujo, { ancho: 6, alto: 6, aristas: false, radio: 0.35 });
  assert.deepEqual(t.casillas[7], { x: 1.5, y: 1.5, vertices: [[1, 1], [2, 1], [2, 2], [1, 2]] });
});

test('cuadrado8 lado 4: esquinas 3, centro 8 en lado 5', () => {
  const t = generador('cuadrado8').crear({ lado: 4 });
  for (const i of [0, 3, 12, 15]) assert.equal(grado(t, i), 3);
  assert.equal(grado(t, casilla(4, 1, 1)), 8);
  assert.equal(grado(t, casilla(4, 0, 1)), 5);
  assert.equal(grado(generador('cuadrado8').crear({ lado: 5 }), 12), 8);
});

test('caballo: lado 4 esquinas 2, lado 5 casilla central 8', () => {
  const t4 = generador('caballo').crear({ lado: 4 });
  for (const i of [0, 3, 12, 15]) assert.equal(grado(t4, i), 2);
  const t5 = generador('caballo').crear({ lado: 5 });
  assert.equal(grado(t5, 12), 8);
  assert.deepEqual(t5.vecinos[0], [casilla(5, 1, 2), casilla(5, 2, 1)]);
  assert.equal(t5.dibujo.aristas, false);
});

test('hexagonal: 7, 19 y 37 casillas, centro de grado 6, borde ≤ 4', () => {
  for (const [radio, n] of [[1, 7], [2, 19], [3, 37], [4, 61], [5, 91]]) {
    const t = generador('hexagonal').crear({ radio });
    assert.equal(t.casillas.length, n);
    assert.equal(n, 3 * radio * radio + 3 * radio + 1);
    const g = grados(t);
    assert.equal(Math.max(...g), 6);
    const interiores = 3 * (radio - 1) * (radio - 1) + 3 * (radio - 1) + 1;
    assert.equal(g.filter((x) => x === 6).length, interiores);
    // el centro es la casilla de en medio de la lista
    assert.equal(grado(t, (n - 1) / 2), 6);
    const exteriores = g.filter((x) => x < 6);
    assert.equal(exteriores.length, 6 * radio);
    for (const x of exteriores) assert.ok(x <= 4);
    assert.equal(t.vecinos.reduce((s, v) => s + v.length, 0) % 2, 0);
  }
});

test('hexagonal: geometría de los hexágonos y caja del dibujo', () => {
  const t = generador('hexagonal').crear({ radio: 2 });
  const { casillas, dibujo } = t;
  // vecinas a distancia 1 entre centros
  t.vecinos.forEach((vs, i) => {
    for (const j of vs) {
      const d = Math.hypot(casillas[i].x - casillas[j].x, casillas[i].y - casillas[j].y);
      assert.ok(Math.abs(d - 1) < 1e-9);
    }
  });
  for (const c of casillas) {
    assert.equal(c.vertices.length, 6);
    const [vx, vy] = c.vertices[0];
    assert.ok(Math.abs(vx - c.x) < 1e-9, 'vértice arriba');
    assert.ok(Math.abs(c.y - vy - 1 / Math.sqrt(3)) < 1e-9, 'circunradio 1/√3');
    for (const [x, y] of c.vertices) {
      assert.ok(x >= 0 && x <= dibujo.ancho && y >= 0 && y <= dibujo.alto);
    }
  }
  assert.ok(Math.abs(Math.min(...casillas.map((c) => c.x)) - 0.6) < 1e-9);
  assert.ok(Math.abs(Math.min(...casillas.map((c) => c.y)) - 0.6) < 1e-9);
  assert.equal(dibujo.aristas, false);
});

test('superficie: toro lado 4, todas de grado 4', () => {
  const t = generador('superficie').crear({ lado: 4, superficie: 'toro' });
  assert.deepEqual(grados(t), Array(16).fill(4));
  assert.ok(t.vecinos[casilla(4, 0, 0)].includes(casilla(4, 3, 0)));
  assert.ok(t.vecinos[casilla(4, 0, 0)].includes(casilla(4, 0, 3)));
  assert.match(t.descripcion, /pegados/);
});

test('superficie: cilindro, filas 0 y 3 de grado 3', () => {
  const lado = 4;
  const t = generador('superficie').crear({ lado, superficie: 'cilindro' });
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      assert.equal(grado(t, casilla(lado, f, c)), f === 0 || f === lado - 1 ? 3 : 4);
    }
  }
  assert.ok(t.vecinos[casilla(lado, 1, 0)].includes(casilla(lado, 1, 3)));
});

test('superficie: Klein, todas de grado 4 y el borde izquierdo-derecho invierte la fila', () => {
  const lado = 4;
  const t = generador('superficie').crear({ lado, superficie: 'klein' });
  assert.deepEqual(grados(t), Array(16).fill(4));
  assert.ok(t.vecinos[casilla(lado, 1, 3)].includes(casilla(lado, 2, 0)));
  assert.ok(t.vecinos[casilla(lado, 0, 1)].includes(casilla(lado, 3, 1)));
});

test('superficie: Möbius, filas 0 y 3 de grado 3 y (1, 3) vecina de (2, 0)', () => {
  const lado = 4;
  const t = generador('superficie').crear({ lado, superficie: 'mobius' });
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      assert.equal(grado(t, casilla(lado, f, c)), f === 0 || f === lado - 1 ? 3 : 4);
    }
  }
  assert.ok(t.vecinos[casilla(lado, 1, 3)].includes(casilla(lado, 2, 0)));
  assert.ok(!t.vecinos[casilla(lado, 1, 3)].includes(casilla(lado, 1, 0)));
  assert.match(t.descripcion, /se invierte/);
});

test('superficie: las cuatro descripciones son distintas', () => {
  const g = generador('superficie');
  const d = ['cilindro', 'toro', 'mobius', 'klein'].map((s) => g.crear({ superficie: s }).descripcion);
  assert.equal(new Set(d).size, 4);
});
