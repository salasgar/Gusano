/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Arranque: abre la partida de un enlace compartido o la pantalla que diga el hash.

import { irA, idDelHash, pantallaActual } from './ui/app.js';
import { partidaDesdeURL } from './compartir/url.js';

function abreSegunURL() {
  const partida = partidaDesdeURL();
  if (partida) irA('jugar', { partida });
  else irA(idDelHash() ?? 'jugar');
}

abreSegunURL();

// Cambios de hash ajenos a `irA`: enlaces del menú, botón «atrás», enlace pegado en la barra.
window.addEventListener('hashchange', () => {
  const partida = partidaDesdeURL();
  if (partida) irA('jugar', { partida });
  else if (idDelHash() !== pantallaActual()) irA(idDelHash() ?? 'jugar');
});
