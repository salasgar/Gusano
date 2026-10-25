/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Demo de la vista del tablero: una ronda a dos manos sobre el generador elegido.

import { generadores, generador } from '../js/tableros/index.js';
import { nuevaRonda, jugar, jugadasLegales, rondaTerminada, puntuacion, turno } from '../js/motor/ronda.js';
import { crearVista } from '../js/ui/vista-tablero.js';

const $ = (id) => document.getElementById(id);
const selector = $('generador');
const zonaParametros = $('parametros');

let tablero;
let ronda;
let vista;

for (const g of generadores) selector.append(new Option(g.nombre, g.id));

function pintaParametros() {
  zonaParametros.replaceChildren();
  for (const p of generador(selector.value).parametros) {
    const etiqueta = document.createElement('label');
    etiqueta.append(`${p.nombre} `);
    let campo;
    if (p.tipo === 'opcion') {
      campo = document.createElement('select');
      for (const o of p.opciones) campo.append(new Option(o.nombre, o.valor));
      campo.value = p.defecto;
    } else {
      campo = document.createElement('input');
      campo.type = 'number';
      campo.min = p.min;
      campo.max = p.max;
      campo.value = p.defecto;
    }
    campo.dataset.parametro = p.id;
    campo.dataset.tipo = p.tipo;
    etiqueta.append(campo);
    zonaParametros.append(etiqueta);
  }
}

function leeParametros() {
  const parametros = {};
  for (const campo of zonaParametros.querySelectorAll('[data-parametro]')) {
    parametros[campo.dataset.parametro] = campo.dataset.tipo === 'opcion' ? campo.value : Number(campo.value);
  }
  return parametros;
}

function repinta() {
  const legales = jugadasLegales(ronda);
  const decoraciones = new Map();
  if ($('numerar').checked) ronda.camino.forEach((c, k) => decoraciones.set(c, { texto: k + 1 }));
  vista.actualizar({
    ronda,
    legales: $('resaltar').checked && !rondaTerminada(ronda) ? legales : [],
    decoraciones,
    mostrarValores: $('valores').checked,
  });
  const puntos = puntuacion(ronda);
  $('estado').textContent = rondaTerminada(ronda)
    ? `Ronda terminada · ${puntos} puntos`
    : `Turno: ${ronda.camino.length === 0 ? 'gusano (casilla inicial)' : turno(ronda)} · puntos: ${puntos}`;
}

function usaTablero(nuevo) {
  tablero = nuevo;
  ronda = nuevaRonda(tablero);
  vista?.destruir();
  vista = crearVista($('tablero'), tablero, { alClicar });
  repinta();
}

function alClicar(indice) {
  if (rondaTerminada(ronda) || !jugadasLegales(ronda).includes(indice)) return;
  ronda = jugar(ronda, indice);
  repinta();
}

function nuevo() {
  usaTablero(generador(selector.value).crear(leeParametros()));
}

// Los valores y los bloqueos se asignan sobre una copia: el tablero es un dato puro.
function conCasillas(cambio) {
  const copia = { ...tablero, casillas: tablero.casillas.map((c) => ({ ...c })) };
  cambio(copia.casillas);
  usaTablero(copia);
}

selector.addEventListener('change', () => { pintaParametros(); nuevo(); });
$('nuevo').addEventListener('click', nuevo);
for (const id of ['resaltar', 'numerar', 'valores']) $(id).addEventListener('change', repinta);
$('valoresPrueba').addEventListener('click', () => {
  conCasillas((casillas) => casillas.forEach((c) => { c.valor = 1 + Math.floor(Math.random() * 3); }));
  $('valores').checked = true;
  repinta();
});
$('bloquear').addEventListener('click', () => {
  conCasillas((casillas) => {
    const libres = casillas.map((_, i) => i).filter((i) => !casillas[i].bloqueada);
    for (let n = 0; n < 3 && libres.length > 2; n++) {
      const [i] = libres.splice(Math.floor(Math.random() * libres.length), 1);
      casillas[i].bloqueada = true;
    }
  });
});

pintaParametros();
nuevo();
