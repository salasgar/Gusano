/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import test from 'node:test';
import assert from 'node:assert/strict';

import { codificar, decodificar, enlaceDe, partidaDesdeURL } from '../js/compartir/url.js';
import { nuevaPartida, jugarEnPartida, rondaActual, marcador } from '../js/motor/partida.js';
import { jugadasLegales, jugadasCompletas } from '../js/motor/ronda.js';
import { generador } from '../js/tableros/index.js';
import { crearTablero } from '../js/tableros/tipos.js';
import { conObstaculos } from '../js/tableros/obstaculos.js';
import { conSentidoUnico } from '../js/tableros/sentido.js';
import { crearAzar } from '../js/util/azar.js';

const cuadrado = (lado) => generador('cuadrado4').crear({ lado });

// Juega `n` jugadas (la primera legal) o hasta el final si n es Infinity.
function jugar(partida, n = Infinity) {
  for (let k = 0; k < n && !partida.terminada; k++) {
    partida = jugarEnPartida(partida, jugadasLegales(rondaActual(partida))[0]);
  }
  return partida;
}

function igual(a, b) {
  assert.deepEqual(b.pares.map((p) => p.rondas.map((r) => r.camino)), a.pares.map((p) => p.rondas.map((r) => r.camino)));
  assert.deepEqual(b.pares.map((p) => p.inicioFijo), a.pares.map((p) => p.inicioFijo));
  assert.deepEqual([b.par, b.ronda, b.terminada], [a.par, a.ronda, a.terminada]);
  assert.deepEqual(marcador(b), marcador(a));
  assert.deepEqual(b.nombres, a.nombres);
  assert.equal(b.inicio, a.inicio);
  assert.equal(b.semilla, a.semilla);
}

const base = { nombres: ['Ana', 'Beto'], inicio: 'azar', semilla: 7 };

test('ida y vuelta: 2 pares en cuadrado4 lado 4 con 7 jugadas', () => {
  const t = cuadrado(4);
  const partida = jugar(nuevaPartida({ ...base, tableros: [t, t] }), 7);
  const vuelta = decodificar(codificar(partida));
  igual(partida, vuelta);
  assert.equal(vuelta.pares[0].tablero.id, t.id);
});

test('ida y vuelta de una partida terminada', () => {
  const t = cuadrado(4);
  const partida = jugar(nuevaPartida({ ...base, tableros: [t, t] }));
  assert.equal(partida.terminada, true);
  const vuelta = decodificar(codificar(partida));
  igual(partida, vuelta);
  assert.equal(vuelta.terminada, true);
});

test('ida y vuelta con inicio libre, a medias en cada ronda', () => {
  const t = cuadrado(4);
  for (const n of [0, 1, 3, 20, 31, 40]) {
    const partida = jugar(nuevaPartida({ ...base, inicio: 'libre', tableros: [t, t] }), n);
    igual(partida, decodificar(codificar(partida)));
  }
});

test('ida y vuelta con inicio al azar en cualquier momento de la partida', () => {
  const t = cuadrado(4);
  for (let n = 0; n <= 40; n += 3) {
    const partida = jugar(nuevaPartida({ ...base, tableros: [t, t] }), n);
    igual(partida, decodificar(codificar(partida)));
  }
});

test('un tablero del editor (sin generador) viaja literal y vuelve igual', () => {
  const t = crearTablero({
    id: 'editor-1', nombre: 'Mío',
    casillas: [0, 1, 2, 3, 4].map((x) => ({ x: x + 0.5, y: 0.5 })),
    aristas: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 4]],
    dibujo: { ancho: 5, alto: 1, aristas: true, radio: 0.35 },
  });
  const partida = jugar(nuevaPartida({ ...base, tableros: [t] }), 3);
  const vuelta = decodificar(codificar(partida));
  igual(partida, vuelta);
  assert.deepEqual(vuelta.pares[0].tablero, t);
});

test('pares con tableros distintos viajan cada uno con el suyo', () => {
  const partida = jugar(nuevaPartida({ ...base, tableros: [cuadrado(4), cuadrado(5)] }), 30);
  const vuelta = decodificar(codificar(partida));
  igual(partida, vuelta);
  assert.deepEqual(vuelta.pares.map((p) => p.tablero.casillas.length), [16, 25]);
});

test('un tablero con obstáculos vuelve con las mismas casillas bloqueadas', () => {
  const t = conObstaculos(cuadrado(5), 0.2, crearAzar(3));
  const partida = jugar(nuevaPartida({ ...base, tableros: [t] }), 5);
  const vuelta = decodificar(codificar(partida));
  igual(partida, vuelta);
  assert.deepEqual(vuelta.pares[0].tablero, t);
});

test('los nombres con tildes y emojis sobreviven', () => {
  const t = cuadrado(4);
  const partida = jugar(nuevaPartida({ ...base, nombres: ['Ñandú 🐦', 'Gusano 🪱 ñ'], tableros: [t] }), 2);
  assert.deepEqual(decodificar(codificar(partida)).nombres, ['Ñandú 🐦', 'Gusano 🪱 ñ']);
});

test('texto corrupto o de otra versión → null', () => {
  const t = cuadrado(4);
  const carga = codificar(jugar(nuevaPartida({ ...base, tableros: [t] }), 3));
  const aBase64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const valida = JSON.parse(Buffer.from(carga, 'base64url').toString());
  for (const malo of ['', 'no es base64!', carga.slice(0, carga.length - 7), 'e30', aBase64url({ ...valida, v: 2 }),
    aBase64url({ ...valida, g: 'inventado' }), aBase64url({ ...valida, i: 'otro' }), aBase64url({ ...valida, n: ['solo uno'] }),
    aBase64url({ ...valida, j: [[], [], []] })]) {
    assert.equal(decodificar(malo), null, malo);
  }
});

test('una jugada ilegal inyectada → null', () => {
  const t = cuadrado(4);
  const valida = JSON.parse(Buffer.from(codificar(jugar(nuevaPartida({ ...base, tableros: [t] }), 3)), 'base64url').toString());
  const con = (j) => Buffer.from(JSON.stringify({ ...valida, j })).toString('base64url');
  assert.equal(decodificar(con([[99], []])), null); // casilla que no existe
  assert.equal(decodificar(con([[valida.j[0][0], valida.j[0][0]], []])), null); // repetir una casilla
  assert.equal(decodificar(con([[], [0]])), null); // jugada en una ronda que no ha empezado
});

test('el enlace de 2 pares en cuadrado4 lado 6 mide menos de 2000 caracteres', () => {
  const t = cuadrado(6);
  const enlace = enlaceDe(jugar(nuevaPartida({ ...base, tableros: [t, t] })));
  assert.ok(enlace.length < 2000, `mide ${enlace.length}`);
  assert.ok(enlace.startsWith('#jugar&p='));
});

// ---------- variantes (§10.6, T27) ----------

// Juega n jugadas completas rotando entre las legales, para que salgan jugadas por los dos extremos.
function jugarCompleto(partida, n = Infinity) {
  for (let k = 0; k < n && !partida.terminada; k++) {
    const jugadas = jugadasCompletas(rondaActual(partida));
    partida = jugarEnPartida(partida, jugadas[k % jugadas.length]);
  }
  return partida;
}

const cargaDe = (partida) => JSON.parse(Buffer.from(codificar(partida), 'base64url').toString());
const jugadasDe = (p) => p.pares.map((par) => par.rondas.map((r) => r.jugadas));

const modos = [
  { nombre: 'dos cabezas', modo: { gusanos: 1, cabezas: 2 } },
  { nombre: 'dos gusanos', modo: { gusanos: 2, cabezas: 1 } },
  { nombre: 'dos gusanos de dos cabezas', modo: { gusanos: 2, cabezas: 2 } },
];

for (const { nombre, modo } of modos) {
  for (const inicio of ['azar', 'libre']) {
    test(`v: 2, ida y vuelta con ${nombre} e inicio ${inicio}, en cualquier momento`, () => {
      const t = cuadrado(4);
      for (const n of [0, 1, 3, 12, 25, Infinity]) {
        const partida = jugarCompleto(nuevaPartida({ ...base, inicio, modo, tableros: [t, t] }), n);
        const vuelta = decodificar(codificar(partida));
        igual(partida, vuelta);
        assert.deepEqual(vuelta.modo, partida.modo);
        assert.deepEqual(jugadasDe(vuelta), jugadasDe(partida)); // también el gusano y el extremo de cada una
      }
    });
  }
}

test('v: 2 lleva el modo y las jugadas por la cola como [casilla, 1]', () => {
  const partida = jugarCompleto(nuevaPartida({ ...base, modo: { gusanos: 1, cabezas: 2 }, tableros: [cuadrado(4)] }), 12);
  const carga = cargaDe(partida);
  assert.equal(carga.v, 2);
  assert.deepEqual(carga.m, [1, 2]);
  assert.ok(carga.j.flat().some((x) => Array.isArray(x) && x[1] === 1), 'ninguna jugada por la cola');
  assert.ok(carga.j.flat().some((x) => typeof x === 'number'));
});

test('el modo clásico sigue siendo v: 1 exacta, sin m ni extremos', () => {
  const t = cuadrado(4);
  const partida = jugar(nuevaPartida({ ...base, modo: { gusanos: 1, cabezas: 1 }, tableros: [t, t] }), 9);
  const carga = cargaDe(partida);
  assert.equal(carga.v, 1);
  assert.equal('m' in carga, false);
  assert.ok(carga.j.every((r) => r.every(Number.isInteger)));
  assert.deepEqual(carga.j.flat(), partida.pares.flatMap((p) => p.rondas.map((r) => r.camino.slice(1))).flat());
});

test('un enlace v: 1 de antes de la tanda 2 sigue abriendo igual', () => {
  // Escrito a mano, como lo generaba la tanda 1: serpiente 0,1,2,3,7,6,5,4 en cuadrado4 lado 4, inicio libre.
  const antiguo = { v: 1, g: 'cuadrado4', pa: { lado: 4 }, n: ['Ana', 'Beto'], i: 'libre', s: 7, j: [[0, 1, 2, 3, 7, 6, 5, 4], []] };
  const partida = decodificar(Buffer.from(JSON.stringify(antiguo)).toString('base64url'));
  assert.deepEqual(partida.pares[0].rondas[0].camino, [0, 1, 2, 3, 7, 6, 5, 4]);
  assert.deepEqual(partida.pares[0].rondas[1].camino, [0]);
  assert.deepEqual(partida.modo, { gusanos: 1, cabezas: 1 });
  assert.deepEqual([partida.par, partida.ronda], [0, 0]); // la serpiente aún puede seguir hacia 8
  // Al volver a codificar sigue siendo v: 1 con las mismas jugadas (`pa` sale completo: lo escribe el generador).
  const otra = cargaDe(partida);
  assert.equal(otra.v, 1);
  assert.equal('m' in otra, false);
  assert.deepEqual(otra.j, antiguo.j);
  igual(partida, decodificar(codificar(partida)));
});

test('una partida con flechas al azar viaja con el tablero literal y vuelve igual, en clásico y con dos cabezas', () => {
  const t = conSentidoUnico(cuadrado(4), 0.5, crearAzar(3));
  assert.equal(t.dirigido, true);
  for (const modo of [{ gusanos: 1, cabezas: 1 }, { gusanos: 1, cabezas: 2 }, { gusanos: 2, cabezas: 1 }]) {
    const partida = jugarCompleto(nuevaPartida({ ...base, modo, tableros: [t, t] }), 14);
    const carga = cargaDe(partida);
    assert.deepEqual(carga.t, t);
    const vuelta = decodificar(codificar(partida));
    igual(partida, vuelta);
    assert.deepEqual(vuelta.pares[0].tablero, t);
  }
});

test('un tablero con flechas con patrón viaja como { g, pa } y no literal', () => {
  const t = generador('cuadrado4').crear({ lado: 4, flechas: 'manhattan' });
  assert.equal(t.dirigido, true);
  const partida = jugarCompleto(nuevaPartida({ ...base, tableros: [t] }), 6);
  const carga = cargaDe(partida);
  assert.equal(carga.g, 'cuadrado4');
  assert.equal('t' in carga, false);
  igual(partida, decodificar(codificar(partida)));
});

test('v: 2 rechaza un modo o una jugada mal formados', () => {
  const partida = jugarCompleto(nuevaPartida({ ...base, modo: { gusanos: 1, cabezas: 2 }, tableros: [cuadrado(4)] }), 12);
  const valida = cargaDe(partida);
  const aBase64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  assert.notEqual(decodificar(aBase64url(valida)), null);
  for (const malo of [{ ...valida, m: undefined }, { ...valida, m: [3, 1] }, { ...valida, m: [1] }, { ...valida, m: 'xx' },
    { ...valida, j: [[[1, 2]], []] }, { ...valida, j: [[[1]], []] }, { ...valida, j: [[[1, 1]], []] }]) {
    assert.equal(decodificar(aBase64url(malo)), null, JSON.stringify(malo));
  }
  // en v: 1 una jugada con extremo no existe
  assert.equal(decodificar(aBase64url({ ...valida, v: 1, j: [[[1, 1]], []] })), null);
});

test('el enlace de cuadrado4 lado 12 con flechas al azar cabe en un enlace (anota la longitud)', () => {
  const t = conSentidoUnico(cuadrado(12), 0.5, crearAzar(3));
  const partida = jugarCompleto(nuevaPartida({ ...base, modo: { gusanos: 1, cabezas: 2 }, tableros: [t] }), 20);
  const enlace = enlaceDe(partida);
  console.log(`  (enlace con flechas al azar, lado 12: ${enlace.length} caracteres)`);
  assert.ok(enlace.length < 20000, `mide ${enlace.length}`);
  igual(partida, decodificar(codificar(partida)));
});

test('partidaDesdeURL lee location.hash, con otros parámetros delante o detrás', () => {
  const t = cuadrado(4);
  const partida = jugar(nuevaPartida({ ...base, tableros: [t] }), 4);
  const carga = codificar(partida);
  assert.equal(partidaDesdeURL(), null); // sin location
  globalThis.location = { hash: '' };
  try {
    assert.equal(partidaDesdeURL(), null);
    globalThis.location.hash = `#jugar&p=${carga}`;
    igual(partida, partidaDesdeURL());
    globalThis.location.hash = `#jugar&x=1&p=${carga}&y=2`;
    igual(partida, partidaDesdeURL());
    globalThis.location.hash = '#jugar&p=basura';
    assert.equal(partidaDesdeURL(), null);
    globalThis.location = { hash: '', origin: 'http://localhost:8000', pathname: '/' };
    assert.equal(enlaceDe(partida), `http://localhost:8000/#jugar&p=${carga}`);
  } finally {
    delete globalThis.location;
  }
});
