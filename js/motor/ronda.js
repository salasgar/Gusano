/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Reglas de una ronda. Funciones puras: ninguna muta su argumento (ESPECIFICACION.md §3.1).

const valorDe = (tablero, casilla) => tablero.casillas[casilla].valor ?? 1;
const bloqueada = (tablero, casilla) => tablero.casillas[casilla].bloqueada === true;

export function nuevaRonda(tablero) {
  return { tablero, camino: [] };
}

export function cabeza(ronda) {
  const { camino } = ronda;
  return camino.length === 0 ? null : camino[camino.length - 1];
}

export function turno(ronda) {
  return ronda.camino.length % 2 === 0 ? 'gusano' : 'pajaro';
}

export function ocupada(ronda, casilla) {
  return bloqueada(ronda.tablero, casilla) || ronda.camino.includes(casilla);
}

export function jugadasLegales(ronda) {
  const { tablero, camino } = ronda;
  if (camino.length === 0) {
    return tablero.casillas.map((_, i) => i).filter((i) => !bloqueada(tablero, i));
  }
  return tablero.vecinos[cabeza(ronda)].filter((i) => !ocupada(ronda, i));
}

export function jugar(ronda, casilla) {
  if (!jugadasLegales(ronda).includes(casilla)) throw new Error('jugada ilegal');
  return { tablero: ronda.tablero, camino: [...ronda.camino, casilla] };
}

export function rondaTerminada(ronda) {
  return ronda.camino.length > 0 && jugadasLegales(ronda).length === 0;
}

export function puntuacion(ronda) {
  return ronda.camino.reduce((suma, c) => suma + valorDe(ronda.tablero, c), 0);
}

// Casillas libres a las que se llega desde la cabeza pasando solo por libres (sin la cabeza).
// Con el camino vacío, todas las libres.
export function alcanzables(ronda) {
  const { tablero, camino } = ronda;
  if (camino.length === 0) {
    return tablero.casillas.map((_, i) => i).filter((i) => !ocupada(ronda, i));
  }
  const visitadas = new Set();
  const cola = [cabeza(ronda)];
  while (cola.length > 0) {
    const actual = cola.shift();
    for (const vecina of tablero.vecinos[actual]) {
      if (visitadas.has(vecina) || ocupada(ronda, vecina)) continue;
      visitadas.add(vecina);
      cola.push(vecina);
    }
  }
  return [...visitadas].sort((a, b) => a - b);
}

export function cotaSuperior(ronda) {
  let cota = puntuacion(ronda);
  for (const c of alcanzables(ronda)) {
    const valor = valorDe(ronda.tablero, c);
    if (valor > 0) cota += valor;
  }
  return cota;
}
