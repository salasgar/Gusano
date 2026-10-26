import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAzar } from '../js/util/azar.js';
import { generador } from '../js/tableros/index.js';
import {
  nuevaRonda, jugar, jugadasCompletas, jugadasEn, maximiza, rondaTerminada, puntuacion,
} from '../js/motor/ronda.js';
import { niveles, elegirJugada } from '../js/ia/jugadores.js';
import { valorExacto, par } from '../js/ia/minimax.js';

// Tableros pequeños escritos a mano (≤ 9 casillas) y los modos de §10.3.
const tablero = (vecinos, casillas = vecinos.map(() => ({}))) => ({ id: 't', nombre: 't', casillas, vecinos });
const dirigido = (vecinos, casillas) => {
  const predecesores = vecinos.map(() => []);
  vecinos.forEach((salidas, i) => salidas.forEach((j) => predecesores[j].push(i)));
  return { ...tablero(vecinos, casillas), predecesores: predecesores.map((l) => l.sort((a, b) => a - b)), dirigido: true };
};
const camino5 = tablero([[1], [0, 2], [1, 3], [2, 4], [3]]);
const ciclo6 = tablero([[1, 5], [0, 2], [1, 3], [2, 4], [3, 5], [4, 0]]);
const ciclo6Valores = tablero([[1, 5], [0, 2], [1, 3], [2, 4], [3, 5], [4, 0]],
  [{ valor: 2 }, {}, { valor: -2 }, {}, { valor: 3 }, {}]);
const cuadrado3 = generador('cuadrado4').crear({ lado: 3 });
const flechas6 = dirigido([[1, 2], [3], [3, 4], [5], [5], [0]]);
const pequenos = [camino5, ciclo6, ciclo6Valores, cuadrado3, flechas6];

const CLASICO = { gusanos: 1, cabezas: 1 };
const DOS_CABEZAS = { gusanos: 1, cabezas: 2 };
const DOS_GUSANOS = { gusanos: 2, cabezas: 1 };
const AMBOS = { gusanos: 2, cabezas: 2 };
const modosNuevos = [DOS_CABEZAS, DOS_GUSANOS, AMBOS];

// Oráculo: minimax ingenuo (sin memoria) sobre las jugadas del motor.
const ingenuo = (ronda) => {
  if (rondaTerminada(ronda)) return puntuacion(ronda);
  const valores = jugadasCompletas(ronda).map((j) => ingenuo(jugar(ronda, j)));
  return maximiza(ronda) ? Math.max(...valores) : Math.min(...valores);
};

// Ronda con `pasos` jugadas al azar (se detiene si acaba).
const alAzar = (t, modo, azar, pasos) => {
  let ronda = nuevaRonda(t, modo);
  for (let i = 0; i < pasos && !rondaTerminada(ronda); i++) ronda = jugar(ronda, azar.elegir(jugadasCompletas(ronda)));
  return ronda;
};

// Posiciones de prueba de cada tablero pequeño en un modo: con las salidas puestas (así el árbol del
// ingenuo cabe en la prueba) y algunas más avanzadas.
function posiciones(t, modo, semilla) {
  const azar = crearAzar(semilla);
  const salidas = modo.gusanos === 2 ? 2 : 1;
  const lista = [];
  for (let k = 0; k < 4; k++) {
    const ronda = alAzar(t, modo, azar, salidas + k);
    if (!rondaTerminada(ronda) && ronda.camino.length >= salidas) lista.push(ronda);
  }
  return lista;
}

test('valorExacto coincide con el minimax ingenuo con dos cabezas, dos gusanos y los dos', () => {
  let comprobadas = 0;
  for (const t of pequenos) {
    for (const modo of modosNuevos) {
      for (const ronda of posiciones(t, modo, 7)) {
        const r = valorExacto(ronda);
        assert.equal(r.completo, true);
        assert.equal(r.valor, ingenuo(ronda), `${JSON.stringify(modo)} ${JSON.stringify(ronda.camino)}`);
        comprobadas += 1;
      }
    }
  }
  assert.ok(comprobadas >= 40);
});

test('valorExacto desde el tablero vacío coincide con el ingenuo en el camino de 5 y el ciclo de 6', () => {
  for (const t of [camino5, ciclo6]) {
    for (const modo of [CLASICO, ...modosNuevos]) {
      const ronda = nuevaRonda(t, modo);
      assert.equal(valorExacto(ronda).valor, ingenuo(ronda), JSON.stringify(modo));
    }
  }
});

test('en modo clásico valorExacto también coincide con el ingenuo', () => {
  for (const t of pequenos) {
    for (const ronda of posiciones(t, CLASICO, 3)) assert.equal(valorExacto(ronda).valor, ingenuo(ronda));
  }
});

test('la jugada de valorExacto alcanza el valor exacto y jugar la acepta', () => {
  for (const t of pequenos) {
    for (const modo of modosNuevos) {
      for (const ronda of posiciones(t, modo, 11)) {
        const { valor, jugada } = valorExacto(ronda);
        assert.equal(ingenuo(jugar(ronda, jugada)), valor);
      }
    }
  }
});

test('perfecto alcanza el valor exacto en los modos nuevos', () => {
  for (const t of pequenos) {
    for (const modo of modosNuevos) {
      for (const ronda of posiciones(t, modo, 5)) {
        const jugada = elegirJugada('perfecto', ronda, { azar: crearAzar(1) });
        assert.equal(ingenuo(jugar(ronda, jugada)), ingenuo(ronda), `${JSON.stringify(modo)} ${JSON.stringify(ronda.camino)}`);
      }
    }
  }
});

test('fuerte con tiempo de sobra juega como el resolutor exacto en tableros pequeños', () => {
  for (const t of [camino5, ciclo6, flechas6]) {
    for (const modo of modosNuevos) {
      for (const ronda of posiciones(t, modo, 9)) {
        const jugada = elegirJugada('fuerte', ronda, { azar: crearAzar(2), tiempoMaximoMs: 2000 });
        assert.equal(ingenuo(jugar(ronda, jugada)), ingenuo(ronda), `${JSON.stringify(modo)} ${JSON.stringify(ronda.camino)}`);
      }
    }
  }
});

test('todos los niveles devuelven una jugada que jugar acepta, en todos los modos y con flechas', () => {
  const azar = crearAzar(21);
  let comprobadas = 0;
  for (const t of [ciclo6, cuadrado3, flechas6, ciclo6Valores]) {
    for (const modo of [CLASICO, ...modosNuevos]) {
      for (let k = 0; k < 3; k++) {
        const ronda = alAzar(t, modo, azar, azar.entero(0, 4));
        if (rondaTerminada(ronda)) continue;
        for (const { id } of niveles) {
          const jugada = elegirJugada(id, ronda, { azar, tiempoMaximoMs: 50 });
          assert.doesNotThrow(() => jugar(ronda, jugada), `${id} ${JSON.stringify(modo)}`);
          comprobadas += 1;
        }
      }
    }
  }
  assert.ok(comprobadas >= 60);
});

test('elegirJugada devuelve el índice si la casilla admite una sola jugada y el objeto si no', () => {
  // Ciclo de 4 con dos cabezas: desde 0-1-2 la casilla 3 es vecina de la cabeza (2) y de la cola (0).
  const ciclo4 = tablero([[1, 3], [0, 2], [1, 3], [0, 2]]);
  let ronda = jugar(jugar(jugar(nuevaRonda(ciclo4, DOS_CABEZAS), 0), 1), 2);
  assert.equal(jugadasEn(ronda, 3).length, 2);
  for (const { id } of niveles) {
    const jugada = elegirJugada(id, ronda, { azar: crearAzar(4) });
    assert.equal(typeof jugada, 'object', id);
    assert.equal(jugada.casilla, 3);
    assert.ok([0, 1].includes(jugada.extremo));
  }
  // Una sola jugada posible: sigue siendo un índice.
  ronda = jugar(nuevaRonda(camino5, DOS_CABEZAS), 0);
  assert.equal(elegirJugada('perfecto', ronda), 1);
  // Con dos opciones distintas, índices.
  ronda = jugar(nuevaRonda(camino5, CLASICO), 2);
  for (const { id } of niveles) assert.ok([1, 3].includes(elegirJugada(id, ronda, { azar: crearAzar(3) })), id);
});

test('con una cabeza y un gusano la máquina elige igual que antes (índices, como jugadasLegales)', () => {
  const ronda = jugar(nuevaRonda(cuadrado3), 4);
  for (const { id } of niveles) {
    const jugada = elegirJugada(id, ronda, { azar: crearAzar(8), tiempoMaximoMs: 100 });
    assert.equal(typeof jugada, 'number', id);
    assert.ok([1, 3, 5, 7].includes(jugada));
  }
});

test('par acepta opciones.modo y sin él es el clásico', () => {
  assert.equal(par(cuadrado3, 0), 9);
  assert.equal(par(cuadrado3, 0, { modo: CLASICO }), 9);
  for (const modo of modosNuevos) {
    const ronda = jugar(nuevaRonda(ciclo6, modo), 0);
    assert.equal(par(ciclo6, 0, { modo }), ingenuo(ronda));
  }
});

test('valorExacto con presupuesto agotado devuelve completo: false', () => {
  const ronda = jugar(nuevaRonda(cuadrado3, AMBOS), 0);
  const r = valorExacto(ronda, { maxEstados: 10 });
  assert.equal(r.completo, false);
  assert.equal(par(cuadrado3, 0, { modo: AMBOS, maxEstados: 10 }), null);
});

test('una partida máquina contra máquina de dos gusanos en cuadrado4 lado 5 acaba en menos de 10 s con fuerte', () => {
  const t = generador('cuadrado4').crear({ lado: 5 });
  const azar = crearAzar(31);
  const inicio = performance.now();
  let ronda = nuevaRonda(t, DOS_GUSANOS);
  while (!rondaTerminada(ronda)) {
    ronda = jugar(ronda, elegirJugada('fuerte', ronda, { azar, tiempoMaximoMs: 100 }));
  }
  assert.ok(performance.now() - inicio < 10_000);
  // Cada casilla está en un solo gusano y la puntuación es la diferencia de longitudes (valores 1).
  const [g0, g1] = ronda.cuerpos;
  assert.equal(new Set([...g0, ...g1]).size, g0.length + g1.length);
  assert.equal(puntuacion(ronda), g0.length - g1.length);
});

test('el gusano de dos cabezas rinde más que el de una: en camino de 5 desde el centro llega a las 5', () => {
  const ronda = jugar(nuevaRonda(camino5, DOS_CABEZAS), 2);
  assert.equal(valorExacto(ronda).valor, 5);
  assert.equal(valorExacto(jugar(nuevaRonda(camino5, CLASICO), 2)).valor, 3);
});
