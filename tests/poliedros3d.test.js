import test from 'node:test';
import assert from 'node:assert/strict';
import { validarTablero } from '../js/tableros/tipos.js';
import { generador } from '../js/tableros/index.js';
import {
  proyectar, normalDeCara, centroDeCara, carasVisibles, rotacionInicial, rotacionHacia,
} from '../js/ui/vista-3d.js';

const poliedro = generador('poliedro');

// solido → [casillas, vértices por cara (histograma)]
const ESPERADO = {
  tetraedro: [4, { 3: 4 }],
  cubo: [6, { 4: 6 }],
  octaedro: [8, { 3: 8 }],
  dodecaedro: [12, { 5: 12 }],
  icosaedro: [20, { 3: 20 }],
  balon: [32, { 5: 12, 6: 20 }],
};

const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clave = (p) => p.map((v) => Math.round(v * 1e6)).join(',');

for (const [solido, [n, formas]] of Object.entries(ESPERADO)) {
  const tablero = poliedro.crear({ solido });
  const caras = tablero.dibujo3d.caras;

  test(`${solido}: dibujo3d tiene una cara por casilla, con los vértices esperados`, () => {
    assert.equal(caras.length, n);
    assert.equal(tablero.casillas.length, n);
    const h = {};
    for (const c of caras) h[c.length] = (h[c.length] ?? 0) + 1;
    assert.deepEqual(h, formas);
  });

  test(`${solido}: el sólido está centrado y a radio 1; cada cara es plana`, () => {
    const todos = caras.flat();
    assert.ok(Math.abs(Math.max(...todos.map((p) => Math.hypot(...p))) - 1) < 1e-9);
    const centro = [0, 1, 2].map((k) => {
      const vistos = new Map(todos.map((p) => [clave(p), p]));
      return [...vistos.values()].reduce((s, p) => s + p[k], 0) / vistos.size;
    });
    for (const v of centro) assert.ok(Math.abs(v) < 1e-9);
    for (const cara of caras) {
      const normal = normalDeCara(cara);
      for (const p of cara) assert.ok(Math.abs(punto(normal, resta(p, cara[0]))) < 1e-9);
    }
  });

  test(`${solido}: las normales (mano derecha) apuntan hacia fuera`, () => {
    for (const cara of caras) {
      assert.ok(punto(normalDeCara(cara), centroDeCara(cara)) > 0.1);
      // Y el ciclo no se cruza: cada vértice está a la misma distancia del centro de la cara.
      const c = centroDeCara(cara);
      const radios = cara.map((p) => Math.hypot(...resta(p, c)));
      for (const r of radios) assert.ok(Math.abs(r - radios[0]) < 1e-9);
    }
  });

  test(`${solido}: dos casillas vecinas comparten exactamente dos vértices 3D`, () => {
    tablero.vecinos.forEach((lista, i) => {
      const propios = new Set(caras[i].map(clave));
      for (const j of lista) {
        assert.equal(caras[j].filter((p) => propios.has(clave(p))).length, 2, `${i}-${j}`);
      }
    });
    // Y las no vecinas, como mucho uno (un vértice).
    for (let i = 0; i < n; i++) {
      const propios = new Set(caras[i].map(clave));
      for (let j = i + 1; j < n; j++) {
        if (tablero.vecinos[i].includes(j)) continue;
        assert.ok(caras[j].filter((p) => propios.has(clave(p))).length <= 1, `${i}-${j}`);
      }
    }
  });

  test(`${solido}: en la rotación inicial se ven entre 1 y n−1 caras y ninguna de canto`, () => {
    const rotacion = rotacionInicial(caras);
    const visibles = carasVisibles(caras, rotacion);
    assert.ok(visibles.length >= 1 && visibles.length <= n - 1, `visibles ${visibles.length} de ${n}`);
    for (const cara of caras) assert.ok(Math.abs(proyectar(normalDeCara(cara), rotacion)[2]) > 0.05);
  });
}

test('dibujo3d no cambia id, casillas, vecinos ni dibujo, y el tablero sigue siendo válido', () => {
  for (const solido of Object.keys(ESPERADO)) {
    const tablero = poliedro.crear({ solido });
    assert.equal(tablero.id, `poliedro-${solido}`);
    assert.deepEqual(validarTablero(tablero), { ok: true });
    assert.equal(tablero.dibujo.aristas, true);
    // Serializable: sobrevive a un viaje por JSON (URL, reto).
    const copia = JSON.parse(JSON.stringify(tablero));
    assert.deepEqual(copia.dibujo3d, tablero.dibujo3d);
    assert.deepEqual(validarTablero(copia), { ok: true });
  }
});

test('dibujo3d es una copia: modificarlo no afecta al siguiente tablero', () => {
  const a = poliedro.crear({ solido: 'cubo' });
  a.dibujo3d.caras[0][0][0] = 99;
  const b = poliedro.crear({ solido: 'cubo' });
  assert.ok(Math.abs(b.dibujo3d.caras[0][0][0]) <= 1);
});

test('proyectar: la identidad conserva el punto y un giro conserva la longitud', () => {
  assert.deepEqual(proyectar([1, 2, 3]), [1, 2, 3]);
  const c = Math.cos(0.7);
  const s = Math.sin(0.7);
  const giro = [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  const q = proyectar([1, 2, 3], giro);
  assert.ok(Math.abs(Math.hypot(...q) - Math.hypot(1, 2, 3)) < 1e-12);
  assert.ok(proyectar([0, 0, 1], giro)[0] > 0, 'lo cercano va a la derecha');
});

for (const solido of Object.keys(ESPERADO)) {
  test(`${solido}: rotacionHacia deja cada cara visible y de frente`, () => {
    const caras = poliedro.crear({ solido }).dibujo3d.caras;
    const inicial = rotacionInicial(caras);
    caras.forEach((cara, i) => {
      const r = rotacionHacia(cara, inicial);
      assert.ok(carasVisibles(caras, r).includes(i), `cara ${i} visible`);
      const zs = caras.map((c) => proyectar(normalDeCara(c), r)[2]);
      assert.ok(zs[i] >= Math.max(...zs) - 1e-9, `cara ${i} con la z máxima`);
      const [x, y, z] = proyectar(centroDeCara(cara), r);
      assert.ok(Math.hypot(x, y) < 1e-9 * Math.max(1, z), `cara ${i} centrada`);
      // sigue siendo una rotación
      assert.ok(Math.abs(proyectar([1, 2, 3], r).reduce((s, v) => s + v * v, 0) - 14) < 1e-9);
    });
  });
}

test('rotacionHacia: en un tetraedro, una cara de detrás pasa a verse; una ya de frente no se mueve', () => {
  const caras = poliedro.crear({ solido: 'tetraedro' }).dibujo3d.caras;
  const inicial = rotacionInicial(caras);
  const visibles = carasVisibles(caras, inicial);
  const detras = caras.findIndex((_, i) => !visibles.includes(i));
  assert.ok(detras >= 0, 'la rotación inicial deja alguna cara detrás');
  assert.ok(carasVisibles(caras, rotacionHacia(caras[detras], inicial)).includes(detras));
  const delante = rotacionHacia(caras[detras], inicial);
  const otra = rotacionHacia(caras[detras], delante);
  otra.forEach((fila, f) => fila.forEach((v, c) => assert.ok(Math.abs(v - delante[f][c]) < 1e-9)));
});
