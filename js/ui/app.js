/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Registro de pantallas y navegación (ESPECIFICACION.md §6).

import { generadores } from '../tableros/index.js';
import * as jugar from '../pantallas/jugar.js';
import * as reto from '../pantallas/reto.js';
import * as analisis from '../pantallas/analisis.js';
import * as editor from '../pantallas/editor.js';

export const pantallas = [jugar, reto, analisis, editor];

let idActual = null;

// Pantalla que nombra el hash (`#jugar`, `#jugar&p=…`); null si no nombra ninguna conocida.
export function idDelHash(hash = location.hash) {
  const id = hash.replace(/^#/, '').split('&')[0];
  return pantallas.some((p) => p.id === id) ? id : null;
}

export function pantallaActual() {
  return idActual;
}

export function irA(id, datos = {}) {
  const pantalla = pantallas.find((p) => p.id === id) ?? pantallas[0];
  const contenedor = document.getElementById('pantalla');
  // Si el hash ya es `#<id>` (el enlace del menú lo acaba de poner) no se añade otra entrada al historial.
  if (location.hash !== `#${pantalla.id}`) {
    // Cambia el hash sin disparar «hashchange» (main.js solo reacciona a los cambios ajenos).
    const cambio = idActual === null ? 'replaceState' : 'pushState';
    history[cambio](null, '', `#${pantalla.id}`);
  }
  idActual = pantalla.id;
  for (const enlace of document.querySelectorAll('nav a[data-pantalla]')) {
    enlace.setAttribute('aria-current', enlace.dataset.pantalla === pantalla.id ? 'page' : 'false');
  }
  contenedor.replaceChildren();
  pantalla.montar(contenedor, { irA, generadores, datos });
}
