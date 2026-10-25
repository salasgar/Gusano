// Registro de generadores de tableros (ESPECIFICACION.md §2.2).
// La tarea 03 añade `poliedro` al final.

import { cuadrado4, cuadrado8, caballo, superficie } from './rejillas.js';
import { hexagonal } from './hexagonal.js';
import { poliedro } from './poliedros.js';

export const generadores = [cuadrado4, cuadrado8, caballo, hexagonal, superficie, poliedro];

export function generador(id) {
  return generadores.find((g) => g.id === id);
}
