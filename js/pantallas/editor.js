/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Esbozo de la pantalla «Editor». La tarea 11 la llena sin tocar nada más.

export const id = 'editor';
export const titulo = 'Editor';

export function montar(contenedor, contexto) {
  const parrafo = document.createElement('p');
  parrafo.textContent = 'Próximamente';
  contenedor.replaceChildren(parrafo);
}

export default { id, titulo, montar };
