/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import test from 'node:test';
import assert from 'node:assert/strict';

import { codificar, decodificar, enlaceDe, partidaDesdeURL } from '../js/compartir/url.js';
import { nuevaPartida, jugarEnPartida, rondaActual, marcador } from '../js/motor/partida.js';
import { jugadasLegales } from '../js/motor/ronda.js';
import { generador } from '../js/tableros/index.js';
import { crearTablero } from '../js/tableros/tipos.js';
import { conObstaculos } from '../js/tableros/obstaculos.js';
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
