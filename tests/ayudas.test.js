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

// ---------- variantes: dos cabezas, dos gusanos y flechas (§10.3, T27) ----------

test('decoraciones: con dos cabezas los números siguen el cuerpo y se cuenta lo alcanzable desde la cola', () => {
  const t = tableroDeCinco();
  let ronda = nuevaRonda(t, { gusanos: 1, cabezas: 2 });
  ronda = jugar(ronda, 2);
  ronda = jugar(ronda, { casilla: 3, extremo: 0 }); // cuerpo [2, 3]
  ronda = jugar(ronda, { casilla: 1, extremo: 1 }); // crece por la cola: cuerpo [1, 2, 3]
  const mapa = decoraciones(ronda);
  assert.deepEqual([1, 2, 3].map((c) => mapa.get(c).texto), ['1', '2', '3']); // no el orden en que se jugaron
  assert.equal(mapa.get(0), undefined); // alcanzable desde la cola
  assert.equal(mapa.get(4), undefined); // alcanzable desde la cabeza
  for (const c of [5, 6, 7]) assert.deepEqual(mapa.get(c), { clase: 'inalcanzable' });
});

test('decoraciones: con dos gusanos cada uno se numera por separado y el alcance es el de ambos', () => {
  const t = tableroDeCinco();
  const ronda = [0, 7, 1, 2, 3].reduce((r, c) => jugar(r, c), nuevaRonda(t, { gusanos: 2, cabezas: 1 }));
  assert.deepEqual(ronda.cuerpos, [[0, 1, 2, 3], [7]]);
  const mapa = decoraciones(ronda);
  assert.deepEqual([0, 1, 2, 3].map((c) => mapa.get(c).texto), ['1', '2', '3', '4']);
  assert.deepEqual(mapa.get(7), { texto: '1' });
  assert.deepEqual(mapa.get(5), { clase: 'inalcanzable' });
  assert.deepEqual(mapa.get(6), { clase: 'inalcanzable' });
  assert.equal(mapa.get(4), undefined);
});

test('decoraciones: con dos gusanos, mientras el segundo no ha salido nada es inalcanzable', () => {
  const ronda = jugar(nuevaRonda(tableroDeCinco(), { gusanos: 2, cabezas: 1 }), 0);
  const mapa = decoraciones(ronda);
  assert.deepEqual([...mapa.keys()], [0]);
});

test('decoraciones: con flechas la cabeza no llega contra la flecha, y con dos cabezas la cola sí', () => {
  const casillas = Array.from({ length: 5 }, (_, i) => ({ x: i + 0.5, y: 0.5 }));
  const t = crearTablero({
    id: 'prueba-flechas', nombre: 'Flechas', casillas, aristas: [], arcos: [[0, 1], [1, 2], [2, 3]],
    dibujo: { ancho: 5, alto: 1, aristas: true, radio: 0.35 },
  });
  const clasico = decoraciones(jugar(nuevaRonda(t), 1));
  assert.deepEqual(clasico.get(0), { clase: 'inalcanzable' }); // está detrás de la cabeza
  assert.deepEqual(clasico.get(4), { clase: 'inalcanzable' }); // aislada
  assert.equal(clasico.get(2), undefined);
  const doble = decoraciones(jugar(nuevaRonda(t, { gusanos: 1, cabezas: 2 }), 1));
  assert.equal(doble.get(0), undefined); // la cola crece por los predecesores
  assert.deepEqual(doble.get(4), { clase: 'inalcanzable' });
});
