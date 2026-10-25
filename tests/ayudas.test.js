/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearTablero } from '../js/tableros/tipos.js';
import { generador } from '../js/tableros/index.js';
import { nuevaRonda, jugar } from '../js/motor/ronda.js';
import { decoraciones } from '../js/ui/ayudas.js';

// Camino 0-1-2-3-4 con una rama 2-5-6 y 7 suelta: jugando 0,1,2,3 la rama 5-6 se alcanza por 2?
// No: 2 ya está ocupada, así que desde la cabeza (3) solo se llega a 4. Las casillas 5, 6 y 7 quedan cortadas.
function tableroDeCinco() {
  const casillas = Array.from({ length: 8 }, (_, i) => ({ x: i + 0.5, y: 0.5 }));
  return crearTablero({
    id: 'prueba-ayudas',
    nombre: 'Camino con rama',
    casillas,
    aristas: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]],
    dibujo: { ancho: 8, alto: 1, aristas: true, radio: 0.35 },
  });
}

const rondaCon = (tablero, camino) => camino.reduce((r, c) => jugar(r, c), nuevaRonda(tablero));

test('decoraciones: con el camino vacío no hay nada marcado', () => {
  const mapa = decoraciones(nuevaRonda(tableroDeCinco()));
  assert.ok(mapa instanceof Map);
  assert.equal(mapa.size, 0);
});

test('decoraciones: el camino queda numerado de 1 a k', () => {
  const t = tableroDeCinco();
  const mapa = decoraciones(rondaCon(t, [0, 1, 2]));
  assert.deepEqual(mapa.get(0), { texto: '1' });
  assert.deepEqual(mapa.get(1), { texto: '2' });
  assert.deepEqual(mapa.get(2), { texto: '3' });
});

test('decoraciones: las casillas libres cortadas salen como inalcanzables', () => {
  const t = tableroDeCinco();
  const mapa = decoraciones(rondaCon(t, [0, 1, 2, 3]));
  assert.deepEqual(mapa.get(5), { clase: 'inalcanzable' });
  assert.deepEqual(mapa.get(6), { clase: 'inalcanzable' });
  assert.deepEqual(mapa.get(7), { clase: 'inalcanzable' });
  assert.equal(mapa.get(4), undefined); // alcanzable desde la cabeza
  assert.equal(mapa.get(3).texto, '4');
});

test('decoraciones: las bloqueadas no se marcan como inalcanzables', () => {
  const t = generador('cuadrado4').crear({ lado: 3 });
  const bloqueado = { ...t, casillas: t.casillas.map((c, i) => (i === 8 ? { ...c, bloqueada: true } : c)) };
  const mapa = decoraciones(rondaCon(bloqueado, [0]));
  assert.equal(mapa.get(8), undefined);
});

test('analisis.js se importa en Node sin error y exporta la pantalla', async () => {
  const analisis = await import('../js/pantallas/analisis.js');
  assert.equal(analisis.id, 'analisis');
  assert.equal(typeof analisis.montar, 'function');
});
