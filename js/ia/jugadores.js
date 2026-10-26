/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Niveles de máquina (ESPECIFICACION.md §4 y §10.4). `elegirJugada` es síncrona y devuelve una
// jugada que `jugar` acepta: el índice de la casilla si solo hay una jugada para ella, y si no el
// objeto { casilla, gusano, extremo }.

import { crearAzar } from '../util/azar.js';
import { jugadasCompletas } from '../motor/ronda.js';
import { valorExacto, crearEstado, codigoAJugada, MAX_CASILLAS_EXACTO } from './minimax.js';

export const niveles = [
  { id: 'aleatorio', nombre: 'Aleatorio' },
  { id: 'voraz', nombre: 'Voraz' },
  { id: 'fuerte', nombre: 'Fuerte' },
  { id: 'perfecto', nombre: 'Perfecto' },
];

// Tiempo que `perfecto` da al resolutor exacto antes de caer en `fuerte`.
const TIEMPO_EXACTO_MS = 1500;
const SIN_ALCANCE = 0x7fffffff; // cabe en un Int32Array

export function elegirJugada(nivelId, ronda, { azar = crearAzar(), tiempoMaximoMs = 1500 } = {}) {
  if (!niveles.some((n) => n.id === nivelId)) throw new Error(`nivel desconocido: ${nivelId}`);
  // Cada jugada se maneja como `casilla * 2 + extremo`, el código de minimax.js.
  const codigos = jugadasCompletas(ronda).map((j) => j.casilla * 2 + j.extremo);
  if (codigos.length === 0) throw new Error('no hay jugadas legales');
  if (codigos.length === 1) return codigoAJugada(ronda, codigos[0]);
  switch (nivelId) {
    case 'aleatorio': return codigoAJugada(ronda, azar.elegir(codigos));
    case 'voraz': return codigoAJugada(ronda, codigoVoraz(ronda, codigos, azar));
    case 'fuerte': return codigoAJugada(ronda, codigoFuerte(ronda, codigos, azar, tiempoMaximoMs));
    default: return codigoAJugada(ronda, codigoPerfecto(ronda, codigos, azar));
  }
}

// ---------- heurísticas ----------

// Evaluaciones sobre un estado de minimax.js, con búferes reutilizables.
function crearHeuristicas(e) {
  const { n, ocupadas, vecinos, predecesores, valores, cabezas } = e;
  const distancia = [new Int32Array(n), new Int32Array(n)];
  const profundidad = new Int32Array(n);
  const visto = new Int32Array(n);
  const cola = new Int32Array(n);
  let sello = 0;

  // Anchura por libres desde `desde` (que puede estar ocupada) siguiendo `conexiones`;
  // deja en `salida` la menor distancia a cada casilla libre alcanzada.
  const recorrer = (desde, conexiones, salida) => {
    sello += 1;
    let inicio = 0;
    let fin = 0;
    cola[fin++] = desde;
    visto[desde] = sello;
    profundidad[desde] = 0;
    while (inicio < fin) {
      const actual = cola[inicio++];
      for (const j of conexiones[actual]) {
        if (ocupadas[j] || visto[j] === sello) continue;
        visto[j] = sello;
        profundidad[j] = profundidad[actual] + 1;
        if (profundidad[j] < salida[j]) salida[j] = profundidad[j];
        cola[fin++] = j;
      }
    }
  };

  // Distancia desde los extremos del gusano g a cada libre (SIN_ALCANCE si no llega). Un gusano
  // que aún no ha salido llega a todas las libres.
  const distancias = (g) => {
    const salida = distancia[g];
    salida.fill(SIN_ALCANCE);
    if (e.largo[g] === 0) {
      for (let i = 0; i < n; i++) if (!ocupadas[i]) salida[i] = 1;
      return salida;
    }
    recorrer(e.cabeza[g], vecinos, salida);
    if (cabezas === 2 && e.ofreceCola(g)) recorrer(e.cola[g], predecesores, salida);
    return salida;
  };

  const positivo = (i) => Math.max(0, valores[i]);

  // Un gusano: puntuación + la mitad de los valores positivos que aún se alcanzan (§4).
  const evaluarUno = () => {
    const d = distancias(0);
    let suma = 0;
    for (let i = 0; i < n; i++) if (d[i] < SIN_ALCANCE) suma += positivo(i);
    return e.puntos + 0.5 * suma;
  };

  // Dos gusanos (§10.4): puntuación + diferencia de lo que cada gusano alcanza antes que el otro
  // (regiones de Voronoi por distancia desde sus extremos), cada casilla con su valor positivo.
  const evaluarDos = () => {
    if (e.largo[0] === 0 || e.largo[1] === 0) return e.puntos;
    const d0 = distancias(0);
    const d1 = distancias(1);
    let diferencia = 0;
    for (let i = 0; i < n; i++) {
      if (d0[i] < d1[i]) diferencia += positivo(i);
      else if (d1[i] < d0[i]) diferencia -= positivo(i);
    }
    return e.puntos + diferencia;
  };

  const evaluar = e.gusanos === 2 ? evaluarDos : evaluarUno;

  // Valor «voraz» de la posición que acaba de dejar una jugada: un gusano, las casillas que quedan
  // alcanzables (−1 si cierra la ronda); dos, la evaluación de Voronoi.
  const valorVoraz = () => {
    if (e.gusanos === 2) return evaluarDos();
    const d = distancias(0);
    let cuenta = 0;
    for (let i = 0; i < n; i++) if (d[i] < SIN_ALCANCE) cuenta += 1;
    return cuenta === 0 ? -1 : cuenta;
  };

  return { evaluar, valorVoraz };
}

// ---------- voraz ----------

// El que maximiza elige la jugada de mayor valor voraz (así evita cerrar la ronda si hay otra);
// el que minimiza, la de menor (así prefiere cerrarla). Empates, con `azar`.
function codigoVoraz(ronda, codigos, azar) {
  const e = crearEstado(ronda);
  const { valorVoraz } = crearHeuristicas(e);
  const maximizando = e.mueve === 0;
  const puntos = codigos.map((c) => {
    e.aplicar(c);
    const valor = valorVoraz();
    e.deshacer();
    return valor;
  });
  const objetivo = maximizando ? Math.max(...puntos) : Math.min(...puntos);
  return azar.elegir(codigos.filter((_, k) => puntos[k] === objetivo));
}

// ---------- fuerte ----------

// Alfa-beta con profundización iterativa sobre un estado mutable. Hoja heurística: con un gusano,
// puntuación + 0,5 × (cota superior − puntuación); con dos, la evaluación de Voronoi. Hoja
// terminal: puntuación. Quién maximiza lo dice el estado (con dos gusanos el mismo papel puede
// mover dos veces seguidas).
function codigoFuerte(ronda, codigos, azar, tiempoMaximoMs) {
  const e = crearEstado(ronda);
  const { evaluar, valorVoraz } = crearHeuristicas(e);

  // Orden voraz: el que maximiza prueba antes las jugadas de mayor valor voraz; el que minimiza, las de menor.
  const ordenar = (lista, maximizando, primera) => {
    const clasificada = lista.map((c) => {
      e.aplicar(c);
      const s = valorVoraz();
      e.deshacer();
      return { c, s: c === primera ? (maximizando ? Infinity : -Infinity) : s };
    });
    clasificada.sort((a, b) => (maximizando ? b.s - a.s : a.s - b.s));
    return clasificada.map((x) => x.c);
  };

  const limite = performance.now() + tiempoMaximoMs;
  let nodos = 0;
  let agotado = false;
  let hojasHeuristicas = 0; // cuántas hojas se han valorado por heurística (0 en una iteración = resuelto)
  const tabla = new Map();

  const buscar = (prof, alfa, beta) => {
    if (++nodos % 256 === 0 && performance.now() > limite) agotado = true;
    if (agotado) return 0;
    const lista = e.movimientos();
    if (lista.length === 0) return e.puntos;
    if (prof === 0) {
      hojasHeuristicas += 1;
      return evaluar();
    }
    const maximizando = e.mueve === 0;
    const k = e.clave();
    const guardado = tabla.get(k);
    let primera = -1;
    if (guardado) {
      primera = guardado.mejor;
      if (guardado.prof >= prof) {
        if (guardado.heuristico) hojasHeuristicas += 1;
        if (guardado.tipo === 'exacto') return guardado.valor;
        if (guardado.tipo === 'inferior') alfa = Math.max(alfa, guardado.valor);
        else beta = Math.min(beta, guardado.valor);
        if (alfa >= beta) return guardado.valor;
      }
    }
    const alfaInicial = alfa;
    const betaInicial = beta;
    const hojasAntes = hojasHeuristicas;
    let mejor = maximizando ? -Infinity : Infinity;
    let mejorJugada = -1;
    for (const c of ordenar(lista, maximizando, primera)) {
      e.aplicar(c);
      const v = buscar(prof - 1, alfa, beta);
      e.deshacer();
      if (agotado) return 0;
      if (maximizando ? v > mejor : v < mejor) { mejor = v; mejorJugada = c; }
      if (maximizando) alfa = Math.max(alfa, mejor); else beta = Math.min(beta, mejor);
      if (alfa >= beta) break;
    }
    const tipo = mejor <= alfaInicial ? 'superior' : mejor >= betaInicial ? 'inferior' : 'exacto';
    tabla.set(k, { prof, valor: mejor, tipo, mejor: mejorJugada, heuristico: hojasHeuristicas > hojasAntes });
    return mejor;
  };

  const maximizando = e.mueve === 0;
  let ordenRaiz = azar.barajar(codigos);
  let elegida = ordenRaiz[0];
  const libresTotales = e.ocupadas.reduce((s, x) => s + (x === 0 ? 1 : 0), 0);
  for (let prof = 1; prof <= libresTotales; prof++) {
    ordenRaiz = ordenar(ordenRaiz, maximizando, elegida);
    hojasHeuristicas = 0;
    let mejor = maximizando ? -Infinity : Infinity;
    let mejorJugada = ordenRaiz[0];
    let alfa = -Infinity;
    let beta = Infinity;
    for (const c of ordenRaiz) {
      e.aplicar(c);
      const v = buscar(prof - 1, alfa, beta);
      e.deshacer();
      if (agotado) break;
      if (maximizando ? v > mejor : v < mejor) { mejor = v; mejorJugada = c; }
      if (maximizando) alfa = Math.max(alfa, mejor); else beta = Math.min(beta, mejor);
    }
    if (agotado) break;
    elegida = mejorJugada;
    if (hojasHeuristicas === 0) break; // resuelto hasta el final: no hay nada más que profundizar
  }
  return elegida;
}

// ---------- perfecto ----------

// Exacto si el tablero tiene ≤ 30 casillas y cabe en el presupuesto; si no, `fuerte` con 3000 ms.
function codigoPerfecto(ronda, codigos, azar) {
  if (ronda.tablero.casillas.length <= MAX_CASILLAS_EXACTO) {
    const resultado = valorExacto(ronda, { tiempoMaximoMs: TIEMPO_EXACTO_MS });
    if (resultado.completo && resultado.jugada !== null) {
      const { jugada } = resultado;
      return typeof jugada === 'number' ? jugada * 2 : jugada.casilla * 2 + jugada.extremo;
    }
  }
  return codigoFuerte(ronda, codigos, azar, 3000);
}
