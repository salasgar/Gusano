import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAzar } from '../js/util/azar.js';
import { generador } from '../js/tableros/index.js';
import {
  nuevaRonda, jugar, jugadasLegales, rondaTerminada, puntuacion, turno,
} from '../js/motor/ronda.js';
import { niveles, elegirJugada } from '../js/ia/jugadores.js';
import { valorExacto, par } from '../js/ia/minimax.js';

const crear = (id, parametros) => generador(id).crear(parametros);
const desde = (tablero, ...camino) => camino.reduce(jugar, nuevaRonda(tablero));
// La casilla del centro del dibujo hexagonal (la única de grado 6 en el centro de la caja).
const centroHexagonal = (t) => t.vecinos.findIndex((v, i) => (
  v.length === 6 && t.casillas[i].x === t.dibujo.ancho / 2 && t.casillas[i].y === t.dibujo.alto / 2));
const valoresPorInicio = (tablero) => tablero.casillas.map((_, i) => par(tablero, i, { maxEstados: 5_000_000 }));

// ---------- resolutor exacto: oráculo de reparto/datos/analisis-2026-10-20/valores-minimax.md ----------

test('cuadrado4 lado 3: 9 desde (0,0) y desde el centro, 6 desde (0,1)', () => {
  const t = crear('cuadrado4', { lado: 3 });
  assert.equal(par(t, 0), 9);
  assert.equal(par(t, 4), 9);
  assert.equal(par(t, 1), 6);
});

test('cuadrado4 lado 4: 12 desde cualquier casilla', () => {
  const t = crear('cuadrado4', { lado: 4 });
  for (const i of [0, 5, 6, 1, 15]) assert.equal(par(t, i), 12);
});

test('cuadrado8 lado 4: 15 desde (0,0) y (1,1), 14 desde (0,1)', () => {
  const t = crear('cuadrado8', { lado: 4 });
  assert.equal(par(t, 0), 15);
  assert.equal(par(t, 5), 15);
  assert.equal(par(t, 1), 14);
});

test('caballo lado 4: máximo 12 y mínimo 4 sobre los inicios', () => {
  const v = valoresPorInicio(crear('caballo', { lado: 4 }));
  assert.equal(Math.max(...v), 12);
  assert.equal(Math.min(...v), 4);
});

test('toro lado 4: 14 desde (0,0)', () => {
  assert.equal(par(crear('superficie', { lado: 4, superficie: 'toro' }), 0), 14);
});

test('hexagonal radio 2: 19 en el centro, 17 en una esquina, 15 en el centro de un lado', () => {
  const t = crear('hexagonal', { radio: 2 });
  const conGrado = (g) => t.vecinos.findIndex((v) => v.length === g);
  assert.equal(par(t, centroHexagonal(t)), 19);
  assert.equal(par(t, conGrado(3)), 17);
  assert.equal(par(t, conGrado(4)), 15);
});

test('hexagonal radio 2: mínimo 15 y máximo 19 sobre los inicios', () => {
  const v = valoresPorInicio(crear('hexagonal', { radio: 2 }));
  assert.equal(Math.min(...v), 15);
  assert.equal(Math.max(...v), 19);
});

test('par coincide con valorExacto de la ronda con la casilla inicial puesta', () => {
  const t = crear('cuadrado4', { lado: 3 });
  for (const i of [0, 1, 4]) assert.equal(par(t, i), valorExacto(desde(t, i)).valor);
});

test('valorExacto devuelve estados, una jugada legal y completo', () => {
  const t = crear('cuadrado4', { lado: 3 });
  const r = valorExacto(desde(t, 0));
  assert.equal(r.completo, true);
  assert.ok(r.estados > 0);
  assert.ok(jugadasLegales(desde(t, 0)).includes(r.jugada));
});

test('valorExacto con maxEstados pequeño devuelve completo: false', () => {
  const t = crear('cuadrado4', { lado: 4 });
  const r = valorExacto(desde(t, 0), { maxEstados: 100 });
  assert.equal(r.completo, false);
  assert.equal(par(t, 0, { maxEstados: 100 }), null);
});

test('valorExacto sin camino: el gusano elige la mejor casilla inicial', () => {
  const t = crear('cuadrado4', { lado: 3 });
  const r = valorExacto(nuevaRonda(t));
  assert.equal(r.valor, 9);
  assert.ok([0, 2, 4, 6, 8].includes(r.jugada));
});

test('valorExacto con más de 30 casillas no busca y no es completo', () => {
  const t = crear('cuadrado4', { lado: 6 });
  const r = valorExacto(desde(t, 0));
  assert.equal(r.completo, false);
  assert.equal(r.estados, 0);
});

test('valorExacto: con valor 2 en todas las casillas el valor se duplica', () => {
  const t = crear('cuadrado4', { lado: 3 });
  const doble = { ...t, casillas: t.casillas.map((c) => ({ ...c, valor: 2 })) };
  assert.equal(par(doble, 0), 18);
  assert.equal(par(doble, 1), 12);
});

test('valorExacto respeta valores negativos y casillas bloqueadas', () => {
  // Camino 0-1-2-3 con un −2 en la 1: desde 0 el pájaro no puede evitar nada y suma 1 − 2 + 3 + 2.
  const camino = {
    id: 'c', nombre: 'c', dibujo: { ancho: 4, alto: 1, aristas: true, radio: 0.3 },
    casillas: [{ valor: 1 }, { valor: -2 }, { valor: 3 }, { valor: 2 }].map((c, i) => ({ x: i + 0.5, y: 0.5, ...c })),
    vecinos: [[1], [0, 2], [1, 3], [2]],
  };
  assert.equal(par(camino, 0), 4);
  // Con la casilla 3 bloqueada el camino acaba en la 2.
  const bloqueado = { ...camino, casillas: camino.casillas.map((c, i) => (i === 3 ? { ...c, bloqueada: true } : c)) };
  assert.equal(par(bloqueado, 0), 2);
  assert.equal(valorExacto(nuevaRonda(bloqueado)).jugada !== 3, true);
});

test('hexagonal radio 2: estados y tiempo del resolutor (para fijar maxEstados del reto)', () => {
  const t = crear('hexagonal', { radio: 2 });
  const inicio = performance.now();
  const r = valorExacto(desde(t, centroHexagonal(t)));
  const ms = Math.round(performance.now() - inicio);
  console.log(`# hexagonal radio 2 desde el centro: ${r.estados} estados, ${ms} ms`);
  assert.equal(r.completo, true);
  assert.ok(r.estados < 2_000_000);
});

// ---------- niveles ----------

test('niveles: los cuatro ids de la especificación, en orden', () => {
  assert.deepEqual(niveles.map((n) => n.id), ['aleatorio', 'voraz', 'fuerte', 'perfecto']);
  assert.ok(niveles.every((n) => typeof n.nombre === 'string' && n.nombre.length > 0));
});

test('elegirJugada con un nivel desconocido lanza Error', () => {
  assert.throws(() => elegirJugada('genial', desde(crear('cuadrado4', { lado: 3 }), 0)), Error);
});

test('cada nivel devuelve una jugada legal en 10 posiciones al azar', () => {
  const tableros = [crear('cuadrado4', { lado: 4 }), crear('cuadrado8', { lado: 3 }), crear('hexagonal', { radio: 2 })];
  const azar = crearAzar(11);
  let comprobadas = 0;
  for (const tablero of tableros) {
    for (let k = 0; k < 4 && comprobadas < 12; k++) {
      let ronda = nuevaRonda(tablero);
      const pasos = azar.entero(0, 6);
      for (let i = 0; i < pasos && !rondaTerminada(ronda); i++) ronda = jugar(ronda, azar.elegir(jugadasLegales(ronda)));
      if (rondaTerminada(ronda)) continue;
      for (const { id } of niveles) {
        const jugada = elegirJugada(id, ronda, { azar, tiempoMaximoMs: 100 });
        assert.ok(jugadasLegales(ronda).includes(jugada), `${id} dio una jugada ilegal`);
      }
      comprobadas += 1;
    }
  }
  assert.ok(comprobadas >= 10);
});

test('aleatorio es reproducible con la misma semilla', () => {
  const ronda = desde(crear('cuadrado8', { lado: 4 }), 5);
  const a = [1, 2, 3, 4, 5].map((s) => elegirJugada('aleatorio', ronda, { azar: crearAzar(s) }));
  const b = [1, 2, 3, 4, 5].map((s) => elegirJugada('aleatorio', ronda, { azar: crearAzar(s) }));
  assert.deepEqual(a, b);
  assert.ok(new Set(a).size > 1);
});

test('voraz: el pájaro cierra la ronda si puede y el gusano la evita', () => {
  // Estrella: 0 en el centro con hojas 1, 2, 3, y la 4 colgando de la 1.
  const estrella = {
    id: 'e', nombre: 'e', dibujo: { ancho: 3, alto: 3, aristas: true, radio: 0.3 },
    casillas: [0, 1, 2, 3, 4].map((i) => ({ x: i * 0.5, y: 0.5 })),
    vecinos: [[1, 2, 3], [0, 4], [0], [0], [1]],
  };
  for (let semilla = 1; semilla <= 10; semilla++) {
    const pajaro = desde(estrella, 0); // turno del pájaro: 1 deja la 4 viva; 2 y 3 cierran
    assert.equal(turno(pajaro), 'pajaro');
    assert.ok([2, 3].includes(elegirJugada('voraz', pajaro, { azar: crearAzar(semilla) })));
    const gusano = desde(estrella, 2, 0); // turno del gusano: 3 cierra; 1 sigue
    assert.equal(turno(gusano), 'gusano');
    assert.equal(elegirJugada('voraz', gusano, { azar: crearAzar(semilla) }), 1);
  }
});

test('fuerte en un tablero pequeño juega como el resolutor exacto', () => {
  const t = crear('cuadrado4', { lado: 3 });
  for (let semilla = 1; semilla <= 3; semilla++) {
    const inicio = elegirJugada('fuerte', nuevaRonda(t), { azar: crearAzar(semilla), tiempoMaximoMs: 1000 });
    assert.ok([0, 2, 4, 6, 8].includes(inicio), `fuerte eligió ${inicio}, que vale menos de 9`);
  }
  // Desde la esquina el pájaro puede reducir a 6 si el gusano se equivoca; la jugada del pájaro es legal y óptima.
  const ronda = desde(t, 0);
  const jugada = elegirJugada('fuerte', ronda, { azar: crearAzar(1), tiempoMaximoMs: 1000 });
  const optima = valorExacto(ronda).valor;
  assert.equal(valorExacto(jugar(ronda, jugada)).valor, optima);
});

test('fuerte con 200 ms devuelve en menos de 400 ms', () => {
  for (const tablero of [crear('cuadrado4', { lado: 6 }), crear('hexagonal', { radio: 3 })]) {
    const ronda = desde(tablero, 0);
    const inicio = performance.now();
    const jugada = elegirJugada('fuerte', ronda, { azar: crearAzar(3), tiempoMaximoMs: 200 });
    assert.ok(performance.now() - inicio < 400);
    assert.ok(jugadasLegales(ronda).includes(jugada));
  }
});

// Juega una ronda de cuadrado4 lado 4 con la casilla inicial puesta; devuelve los puntos.
function rondaContraAleatorio(tablero, inicio, nivelGusano, nivelPajaro, azar) {
  let ronda = desde(tablero, inicio);
  while (!rondaTerminada(ronda)) {
    const nivel = turno(ronda) === 'gusano' ? nivelGusano : nivelPajaro;
    ronda = jugar(ronda, elegirJugada(nivel, ronda, { azar, tiempoMaximoMs: 200 }));
  }
  return puntuacion(ronda);
}

test('perfecto como pájaro contra aleatorio nunca pasa de 12 en cuadrado4 lado 4', () => {
  const t = crear('cuadrado4', { lado: 4 });
  const azar = crearAzar(2026);
  for (const inicio of [0, 5, 6, 10, 15]) {
    assert.ok(rondaContraAleatorio(t, inicio, 'aleatorio', 'perfecto', azar) <= 12);
  }
});

test('perfecto como gusano contra aleatorio nunca baja de 12 en cuadrado4 lado 4', () => {
  const t = crear('cuadrado4', { lado: 4 });
  const azar = crearAzar(2027);
  for (const inicio of [0, 5, 6, 10, 15]) {
    assert.ok(rondaContraAleatorio(t, inicio, 'perfecto', 'aleatorio', azar) >= 12);
  }
});

test('perfecto con más de 30 casillas recurre a fuerte y devuelve una jugada legal', () => {
  // Camino de 32 casillas (más de 30, pero se resuelve entero enseguida).
  const n = 32;
  const largo = {
    id: 'l', nombre: 'l', dibujo: { ancho: n, alto: 1, aristas: true, radio: 0.3 },
    casillas: Array.from({ length: n }, (_, i) => ({ x: i + 0.5, y: 0.5 })),
    vecinos: Array.from({ length: n }, (_, i) => [i - 1, i + 1].filter((j) => j >= 0 && j < n)),
  };
  const ronda = desde(largo, 10);
  // Hacia un extremo se pierden las casillas del otro: el pájaro no controla nada y el gusano elige.
  const jugada = elegirJugada('perfecto', ronda, { azar: crearAzar(1) });
  assert.ok(jugadasLegales(ronda).includes(jugada));
  assert.equal(jugada, 9); // el pájaro (turno impar) elige el lado corto: la ronda acaba antes
});
