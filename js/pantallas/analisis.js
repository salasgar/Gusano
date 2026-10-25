/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Esbozo de la pantalla «Análisis». La tarea 09 la llena sin tocar nada más.

export const id = 'analisis';
export const titulo = 'Análisis';

export function montar(contenedor, contexto) {
  const parrafo = document.createElement('p');
  parrafo.textContent = 'Próximamente';
  contenedor.replaceChildren(parrafo);
}

export default { id, titulo, montar };
