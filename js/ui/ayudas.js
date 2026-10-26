/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Modo ayuda (ESPECIFICACION.md §7.1): atenúa lo que ya no cuenta y numera los tramos.

import { alcanzables, ocupada } from '../motor/ronda.js';

// Map<índice, { clase?, texto? }> para pasar a vista.actualizar({ decoraciones }).
export function decoraciones(ronda) {
  const mapa = new Map();
  if (!ronda?.tablero || !ronda.camino) return mapa;
  const { tablero, camino } = ronda;
  const cuerpos = ronda.cuerpos ?? [camino];
  // Mientras algún gusano no ha salido, todo lo libre sigue siendo alcanzable para él.
  if (camino.length > 0 && cuerpos.every((cuerpo) => cuerpo.length > 0)) {
    const alcance = new Set(alcanzables(ronda));
    tablero.casillas.forEach((_, i) => {
      if (!ocupada(ronda, i) && !alcance.has(i)) mapa.set(i, { clase: 'inalcanzable' });
    });
  }
  // Número de tramo: por gusano y en el orden de su cuerpo (de la cola a la cabeza).
  cuerpos.forEach((cuerpo) => cuerpo.forEach((casilla, k) => mapa.set(casilla, { texto: String(k + 1) })));
  return mapa;
}
