// Tableros poliédricos (ESPECIFICACION.md §2.2): las casillas son las caras de un sólido y
// dos caras son vecinas si comparten una arista. Se dibujan en plano con el mismo esquema
// que un diagrama de Schlegel del poliedro dual: un polígono exterior (la cara del dual
// que corresponde a un vértice V del sólido) y todos los demás nodos dentro, sin que
// ninguna arista cruce otra. Las posiciones interiores salen de la incrustación
// baricéntrica de Tutte (cada nodo en el centro de sus vecinos), no de una proyección
// en perspectiva: en el balón la perspectiva deja los nodos del fondo casi encima.

import { crearTablero, resolverParametros } from './tipos.js';

const FI = (1 + Math.sqrt(5)) / 2;
const EPS = 1e-6;
const LADO_CAJA = 10;
const MARGEN = 0.7;
const RADIO_MAXIMO = 0.35;
const PASADAS = 5000;
const VUELTAS_SEPARACION = 300;
const PASO_MAXIMO = 0.05;
const SEPARACION_MINIMA = 0.02;

// --- Coordenadas de los sólidos ------------------------------------------------------

function conSignos(base) {
  const salida = [];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
    salida.push([base[0] * sx, base[1] * sy, base[2] * sz]);
  }
  return salida;
}

function permutacionesCiclicas([a, b, c]) {
  return [[a, b, c], [b, c, a], [c, a, b]];
}

function sinRepetidos(puntos) {
  const vistos = new Set();
  return puntos.filter((p) => {
    const clave = p.map((v) => Math.round(v * 1e6)).join(',');
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

const desdeBases = (bases) => sinRepetidos(bases.flatMap((b) => permutacionesCiclicas(b).flatMap(conSignos)));

const SOLIDOS = {
  tetraedro: {
    nombre: 'Tetraedro',
    vertices: () => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  },
  cubo: {
    nombre: 'Cubo',
    vertices: () => conSignos([1, 1, 1]),
  },
  octaedro: {
    nombre: 'Octaedro',
    vertices: () => desdeBases([[1, 0, 0]]),
  },
  dodecaedro: {
    nombre: 'Dodecaedro',
    vertices: () => desdeBases([[1, 1, 1], [0, 1 / FI, FI]]),
  },
  icosaedro: {
    nombre: 'Icosaedro',
    vertices: () => desdeBases([[0, 1, FI]]),
  },
  balon: {
    nombre: 'Balón (icosaedro truncado)',
    // Permutaciones cíclicas (pares) de las tres bases, con todos los signos: 12 + 24 + 24.
    vertices: () => desdeBases([[0, 1, 3 * FI], [1, 2 + FI, 2 * FI], [FI, 2, 2 * FI + 1]]),
  },
};

// --- Álgebra mínima ------------------------------------------------------------------

const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const suma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const escala = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norma = (a) => Math.hypot(a[0], a[1], a[2]);
const unitario = (a) => escala(a, 1 / norma(a));

// --- Caras y adyacencia --------------------------------------------------------------

// Planos de soporte: los que pasan por tres vértices y dejan a todos los demás a un lado.
// Devuelve [{ vertices: [índices], normal: unitaria hacia fuera }] (el centro del sólido es el origen).
function encontrarCaras(vertices) {
  const n = vertices.length;
  const caras = [];
  const vistas = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        let normal = cruz(resta(vertices[j], vertices[i]), resta(vertices[k], vertices[i]));
        if (norma(normal) < EPS) continue;
        normal = unitario(normal);
        const altura = punto(normal, vertices[i]);
        let arriba = false;
        let abajo = false;
        for (let m = 0; m < n && !(arriba && abajo); m++) {
          const s = punto(normal, vertices[m]) - altura;
          if (s > EPS) arriba = true;
          else if (s < -EPS) abajo = true;
        }
        if (arriba && abajo) continue;
        const enPlano = [];
        for (let m = 0; m < n; m++) {
          if (Math.abs(punto(normal, vertices[m]) - altura) <= EPS) enPlano.push(m);
        }
        const clave = enPlano.join(',');
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        caras.push({ vertices: enPlano, normal: altura >= 0 ? normal : escala(normal, -1) });
      }
    }
  }
  return caras;
}

// Los vértices de una cara ordenados alrededor de ella, de modo que la normal por la regla
// de la mano derecha apunte hacia fuera (sentido contrario a las agujas del reloj mirándola
// desde fuera).
function ordenarAlrededor(cara, vertices) {
  const puntos = cara.vertices.map((i) => vertices[i]);
  const centro = escala(puntos.reduce(suma), 1 / puntos.length);
  const e1 = unitario(resta(puntos[0], centro));
  const e2 = cruz(cara.normal, e1);
  const angulo = (p) => Math.atan2(punto(resta(p, centro), e2), punto(resta(p, centro), e1));
  return puntos.sort((a, b) => angulo(a) - angulo(b));
}

// Polígonos 3D de las caras (mismo orden que las casillas), con el sólido centrado en el
// origen y escalado a radio 1 (§10.5).
function caras3d(caras, vertices) {
  const radio = Math.max(...vertices.map(norma));
  return caras.map((cara) => ordenarAlrededor(cara, vertices).map((p) => escala(p, 1 / radio)));
}

// Dos caras de un poliedro convexo son vecinas si comparten dos vértices (una arista).
function adyacenciaDeCaras(caras) {
  const aristas = [];
  for (let a = 0; a < caras.length; a++) {
    for (let b = a + 1; b < caras.length; b++) {
      const comunes = caras[a].vertices.filter((v) => caras[b].vertices.includes(v));
      if (comunes.length >= 2) aristas.push([a, b]);
    }
  }
  return aristas;
}

// --- Dibujo plano ----------------------------------------------------------------------

// Las caras que rodean el vértice V, en orden circular alrededor de V.
function cicloAlrededorDe(caras, v) {
  const alrededor = caras.map((c, i) => (c.vertices.includes(v) ? i : -1)).filter((i) => i >= 0);
  const eje = unitario(alrededor.map((i) => caras[i].normal).reduce(suma));
  const auxiliar = Math.abs(eje[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = unitario(cruz(eje, auxiliar));
  const e2 = cruz(eje, e1);
  const angulo = (i) => Math.atan2(punto(caras[i].normal, e2), punto(caras[i].normal, e1));
  return alrededor.sort((a, b) => angulo(a) - angulo(b));
}

// Ciclo exterior en un polígono regular; el resto en el centro de sus vecinas (Tutte).
// Para un grafo plano 3-conexo con una cara como exterior no hay aristas que se crucen.
function incrustacionBaricentrica(vecinos, ciclo) {
  const n = vecinos.length;
  const radio = LADO_CAJA / 2 - MARGEN;
  const posicion = Array.from({ length: n }, () => [LADO_CAJA / 2, LADO_CAJA / 2]);
  const fijo = new Set(ciclo);
  ciclo.forEach((nodo, k) => {
    const a = (2 * Math.PI * k) / ciclo.length - Math.PI / 2;
    posicion[nodo] = [LADO_CAJA / 2 + radio * Math.cos(a), LADO_CAJA / 2 + radio * Math.sin(a)];
  });
  for (let vuelta = 0; vuelta < PASADAS; vuelta++) {
    let cambio = 0;
    for (let i = 0; i < n; i++) {
      if (fijo.has(i)) continue;
      const x = vecinos[i].reduce((s, j) => s + posicion[j][0], 0) / vecinos[i].length;
      const y = vecinos[i].reduce((s, j) => s + posicion[j][1], 0) / vecinos[i].length;
      cambio = Math.max(cambio, Math.abs(x - posicion[i][0]), Math.abs(y - posicion[i][1]));
      posicion[i] = [x, y];
    }
    if (cambio < 1e-10) break;
  }
  return posicion;
}

// --- Separar los nodos sin romper el dibujo plano ---------------------------------------

const orientacion = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function segmentosSeCortan(a, b, c, d) {
  const o1 = orientacion(a, b, c);
  const o2 = orientacion(a, b, d);
  const o3 = orientacion(c, d, a);
  const o4 = orientacion(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function distanciaAlSegmento(p, a, b) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

// ¿Sigue siendo plano el dibujo si el nodo i está en `candidato`? Solo hay que mirar sus
// aristas contra las demás, y que ningún otro nodo ni él mismo se acerque a una arista ajena.
function movimientoValido(i, candidato, posicion, vecinos, aristas) {
  const pos = (k) => (k === i ? candidato : posicion[k]);
  for (const [a, b] of aristas) {
    const toca = a === i || b === i;
    if (toca) {
      for (const [c, d] of aristas) {
        if (c === i || d === i || c === a || c === b || d === a || d === b) continue;
        if (segmentosSeCortan(pos(a), pos(b), pos(c), pos(d))) return false;
      }
    } else if (distanciaAlSegmento(candidato, posicion[a], posicion[b]) < SEPARACION_MINIMA) {
      return false;
    }
  }
  for (const j of vecinos[i]) {
    // Los vecinos de i no pueden quedar sobre una arista de i con otro vecino.
    for (const k of vecinos[i]) {
      if (k !== j && distanciaAlSegmento(posicion[k], candidato, posicion[j]) < SEPARACION_MINIMA) return false;
    }
  }
  return true;
}

// Repulsión (fuerte a corta distancia) entre todos los nodos; un movimiento solo se
// acepta si el dibujo sigue siendo plano. Los nodos fijos (el polígono exterior) no se mueven.
function separar(posicion, vecinos, aristas, fijo) {
  const n = posicion.length;
  for (let vuelta = 0; vuelta < VUELTAS_SEPARACION; vuelta++) {
    for (let i = 0; i < n; i++) {
      if (fijo.has(i)) continue;
      let fx = 0;
      let fy = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dx = posicion[i][0] - posicion[j][0];
        const dy = posicion[i][1] - posicion[j][1];
        const d2 = dx * dx + dy * dy + 1e-6;
        const d5 = d2 * d2 * Math.sqrt(d2);
        fx += dx / d5;
        fy += dy / d5;
      }
      const modulo = Math.hypot(fx, fy);
      if (modulo < 1e-12) continue;
      let paso = Math.min(PASO_MAXIMO, modulo * 0.5);
      for (let intento = 0; intento < 4; intento++, paso /= 2) {
        const candidato = [posicion[i][0] + (fx / modulo) * paso, posicion[i][1] + (fy / modulo) * paso];
        if (movimientoValido(i, candidato, posicion, vecinos, aristas)) {
          posicion[i] = candidato;
          break;
        }
      }
    }
  }
}

function distanciaMinima(puntos) {
  let minima = Infinity;
  for (let i = 0; i < puntos.length; i++) {
    for (let j = i + 1; j < puntos.length; j++) {
      minima = Math.min(minima, Math.hypot(puntos[i][0] - puntos[j][0], puntos[i][1] - puntos[j][1]));
    }
  }
  return minima;
}

// Polígono exterior = las caras que rodean un vértice V; el resto, repartido dentro.
function dibujar(caras, aristas) {
  const vecinos = caras.map(() => []);
  for (const [a, b] of aristas) {
    vecinos[a].push(b);
    vecinos[b].push(a);
  }
  // En estos sólidos todos los vértices son equivalentes por simetría: sirve el primero.
  const ciclo = cicloAlrededorDe(caras, 0);
  const posicion = incrustacionBaricentrica(vecinos, ciclo);
  separar(posicion, vecinos, aristas, new Set(ciclo));
  return { posicion, separacion: distanciaMinima(posicion) };
}

// --- Generador -----------------------------------------------------------------------

const geometrias = new Map();

function geometriaDe(solido) {
  if (!geometrias.has(solido)) {
    const vertices = SOLIDOS[solido].vertices();
    const caras = encontrarCaras(vertices);
    const aristas = adyacenciaDeCaras(caras);
    const { posicion, separacion } = dibujar(caras, aristas);
    geometrias.set(solido, {
      centros: posicion,
      aristas,
      caras3d: caras3d(caras, vertices),
      radio: Math.min(RADIO_MAXIMO, 0.4 * separacion),
    });
  }
  return geometrias.get(solido);
}

export const poliedro = {
  id: 'poliedro',
  nombre: 'Poliedro',
  descripcion: 'Las casillas son las caras; dos caras son vecinas si comparten una arista.',
  parametros: [
    {
      id: 'solido', nombre: 'Sólido', tipo: 'opcion', defecto: 'dodecaedro',
      opciones: Object.entries(SOLIDOS).map(([valor, { nombre }]) => ({ valor, nombre })),
    },
  ],
  crear(parametros) {
    const p = resolverParametros(poliedro.parametros, parametros);
    const { centros, aristas, caras3d: caras, radio } = geometriaDe(p.solido);
    const nombreSolido = SOLIDOS[p.solido].nombre.replace(/ \(.*\)$/, '').toLowerCase();
    const tablero = crearTablero({
      id: `poliedro-${p.solido}`,
      nombre: `Caras del ${nombreSolido}`,
      descripcion: 'Las casillas son las caras; dos caras son vecinas si comparten una arista.',
      generador: { id: poliedro.id, parametros: p },
      casillas: centros.map(([x, y]) => ({ x, y })),
      aristas,
      dibujo: { ancho: LADO_CAJA, alto: LADO_CAJA, aristas: true, radio },
    });
    tablero.dibujo3d = { caras: caras.map((cara) => cara.map((v) => [...v])) };
    return tablero;
  },
};
