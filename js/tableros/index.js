// Registro de generadores de tableros (ESPECIFICACION.md §2.2, §10.2).
// `superficie` ya no figura en la lista visible, pero `generador('superficie')` la devuelve
// para las URL antiguas y el reto del día.

import { cuadrado4, cuadrado8, caballo, superficie } from './rejillas.js';
import { hexagonal } from './hexagonal.js';
import { poliedro } from './poliedros.js';

export const generadores = [cuadrado4, cuadrado8, caballo, hexagonal, poliedro];

export function generador(id) {
  return generadores.find((g) => g.id === id) ?? (id === superficie.id ? superficie : undefined);
}
