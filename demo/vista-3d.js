/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Demo de la vista 3D: los seis sólidos, con un gusano de ejemplo escrito a mano.

import { generador } from '../js/tableros/index.js';
import { nuevaRonda, jugar, jugadasLegales, rondaTerminada, puntuacion, turno } from '../js/motor/ronda.js';
import { crearVista3D } from '../js/ui/vista-3d.js';

const $ = (id) => document.getElementById(id);
const poliedro = generador('poliedro');

let tablero;
let ronda;
let vista;

for (const o of poliedro.parametros[0].opciones) $('solido').append(new Option(o.nombre, o.valor));
$('solido').value = poliedro.parametros[0].defecto;

// Gusano de ejemplo: unos pasos por la primera cara, siempre a una vecina libre.
function ejemplo() {
  let r = nuevaRonda(tablero);
  r = jugar(r, 0);
  for (let paso = 0; paso < 4; paso++) {
    const legales = jugadasLegales(r);
    if (legales.length === 0) break;
    r = jugar(r, legales[0]);
  }
  return r;
}

function repinta() {
  const decoraciones = new Map();
  if ($('numerar').checked) ronda.camino.forEach((c, k) => decoraciones.set(c, { texto: k + 1 }));
  vista.actualizar({
    ronda,
    legales: $('resaltar').checked && !rondaTerminada(ronda) ? jugadasLegales(ronda) : [],
    decoraciones,
  });
  const puntos = puntuacion(ronda);
  $('estado').textContent = rondaTerminada(ronda)
    ? `Ronda terminada · ${puntos} puntos`
    : `Turno: ${turno(ronda)} · puntos: ${puntos}`;
}

function alClicar(indice) {
  if (rondaTerminada(ronda) || !jugadasLegales(ronda).includes(indice)) return;
  ronda = jugar(ronda, indice);
  repinta();
}

function usaSolido() {
  tablero = poliedro.crear({ solido: $('solido').value });
  ronda = ejemplo();
  vista?.destruir();
  vista = crearVista3D($('tablero'), tablero, { alClicar });
  repinta();
}

$('solido').addEventListener('change', usaSolido);
$('reiniciar').addEventListener('click', () => { ronda = ejemplo(); repinta(); });
for (const id of ['resaltar', 'numerar']) $(id).addEventListener('change', repinta);

usaSolido();
