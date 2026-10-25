/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Esbozo de la pantalla «Reto del día». La tarea 10 la llena sin tocar nada más.

export const id = 'reto';
export const titulo = 'Reto del día';

export function montar(contenedor, contexto) {
  const parrafo = document.createElement('p');
  parrafo.textContent = 'Próximamente';
  contenedor.replaceChildren(parrafo);
}

export default { id, titulo, montar };
