import test from 'node:test';
import assert from 'node:assert/strict';
import { validarTablero } from '../js/tableros/tipos.js';
import { generadores, generador } from '../js/tableros/index.js';

const poliedro = generador('poliedro');

// solido → [casillas, histograma de grados]
const ESPERADO = {
  tetraedro: [4, { 3: 4 }],
  cubo: [6, { 4: 6 }],
  octaedro: [8, { 3: 8 }],
  dodecaedro: [12, { 5: 12 }],
  icosaedro: [20, { 3: 20 }],
  balon: [32, { 5: 12, 6: 20 }],
};

function histograma(tablero) {
  const h = {};
  for (const v of tablero.vecinos) h[v.length] = (h[v.length] ?? 0) + 1;
  return h;
}

function conexo(tablero) {
  const vistas = new Set([0]);
  const pila = [0];
  while (pila.length) {
    for (const j of tablero.vecinos[pila.pop()]) {
      if (!vistas.has(j)) { vistas.add(j); pila.push(j); }
    }
  }
  return vistas.size === tablero.casillas.length;
}

const orientacion = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

function aristasQueSeCruzan(tablero) {
  const aristas = [];
  tablero.vecinos.forEach((vs, i) => vs.forEach((j) => { if (i < j) aristas.push([i, j]); }));
  const c = tablero.casillas;
  const cruces = [];
  for (let p = 0; p < aristas.length; p++) {
    for (let q = p + 1; q < aristas.length; q++) {
      const [a, b] = aristas[p];
      const [d, e] = aristas[q];
      if ([a, b].some((x) => x === d || x === e)) continue;
      if (orientacion(c[a], c[b], c[d]) * orientacion(c[a], c[b], c[e]) < 0
        && orientacion(c[d], c[e], c[a]) * orientacion(c[d], c[e], c[b]) < 0) {
        cruces.push([aristas[p], aristas[q]]);
      }
    }
  }
  return cruces;
}

test('poliedro es el último generador del registro', () => {
  assert.equal(generadores.at(-1).id, 'poliedro');
  assert.equal(generadores.at(-1), poliedro);
  assert.equal(poliedro.parametros[0].defecto, 'dodecaedro');
  assert.deepEqual(
    poliedro.parametros[0].opciones.map((o) => o.valor),
    ['tetraedro', 'cubo', 'octaedro', 'dodecaedro', 'icosaedro', 'balon'],
  );
});

test('poliedro sin parámetros es el dodecaedro', () => {
  const t = poliedro.crear();
  assert.equal(t.id, 'poliedro-dodecaedro');
  assert.equal(t.nombre, 'Caras del dodecaedro');
  assert.deepEqual(t.generador, { id: 'poliedro', parametros: { solido: 'dodecaedro' } });
  assert.equal(t.descripcion, 'Las casillas son las caras; dos caras son vecinas si comparten una arista.');
  assert.deepEqual(poliedro.crear({}), t);
});

test('poliedro rechaza un sólido desconocido', () => {
  assert.throws(() => poliedro.crear({ solido: 'piramide' }), Error);
});

for (const [solido, [casillas, grados]] of Object.entries(ESPERADO)) {
  test(`${solido}: ${casillas} casillas, grados correctos, válido y conexo`, () => {
    const t = poliedro.crear({ solido });
    assert.equal(t.casillas.length, casillas);
    assert.deepEqual(histograma(t), grados);
    assert.deepEqual(validarTablero(t), { ok: true });
    assert.ok(conexo(t));
    assert.equal(t.id, `poliedro-${solido}`);
    assert.equal(t.dibujo.aristas, true);
    assert.equal(t.dibujo.ancho, 10);
    assert.equal(t.dibujo.alto, 10);
    assert.ok(t.casillas.every((c) => c.valor === undefined && c.bloqueada === undefined));
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(t)));
  });

  test(`${solido}: nodos dentro de la caja, sin solaparse y ninguna arista cruza otra`, () => {
    const t = poliedro.crear({ solido });
    const { radio, ancho, alto } = t.dibujo;
    assert.ok(radio > 0.2 && radio <= 0.35, `radio ${radio}`);
    for (const c of t.casillas) {
      assert.ok(c.x - radio >= 0 && c.x + radio <= ancho && c.y - radio >= 0 && c.y + radio <= alto);
    }
    let minima = Infinity;
    for (let i = 0; i < t.casillas.length; i++) {
      for (let j = i + 1; j < t.casillas.length; j++) {
        minima = Math.min(minima, Math.hypot(t.casillas[i].x - t.casillas[j].x, t.casillas[i].y - t.casillas[j].y));
      }
    }
    assert.ok(minima > 2 * radio * 0.9, `distancia mínima ${minima}`);
    assert.deepEqual(aristasQueSeCruzan(t), []);
  });
}

test('el balón tiene 12 pentágonos (grado 5) y 20 hexágonos (grado 6)', () => {
  const t = poliedro.crear({ solido: 'balon' });
  assert.equal(t.casillas.length, 32);
  assert.equal(t.vecinos.filter((v) => v.length === 5).length, 12);
  assert.equal(t.vecinos.filter((v) => v.length === 6).length, 20);
  assert.equal(t.vecinos.reduce((s, v) => s + v.length, 0) / 2, 90);
});

test('el mismo sólido da siempre el mismo tablero', () => {
  assert.deepEqual(poliedro.crear({ solido: 'cubo' }), poliedro.crear({ solido: 'cubo' }));
});
