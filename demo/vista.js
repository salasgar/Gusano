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

// ── Ejemplos de la tanda 2, con tableros y rondas escritos a mano según ESPECIFICACION.md §10
// (no dependen de los generadores ni del motor nuevos). ──

const cuadrada = (c, f, desplazo) => ({
  x: c + desplazo + 0.5,
  y: f + desplazo + 0.5,
  vertices: [[c + desplazo, f + desplazo], [c + desplazo + 1, f + desplazo], [c + desplazo + 1, f + desplazo + 1], [c + desplazo, f + desplazo + 1]],
});

// Rejilla de lado×lado de 4 vecinas. `alRevesDe(i, j)` dice si la conexión i→j existe (por
// defecto, en los dos sentidos); con `toro`, las de los bordes se pegan y se añade la franja.
function rejilla(lado, { toro = false, sentido = null } = {}) {
  const margen = toro ? 1 : 0;
  const casillas = [];
  for (let f = 0; f < lado; f++) for (let c = 0; c < lado; c++) casillas.push(cuadrada(c, f, margen));
  const vecinos = casillas.map(() => []);
  const predecesores = casillas.map(() => []);
  const unir = (i, j) => {
    if (i === j || vecinos[i].includes(j)) return;
    if (sentido && !sentido(i, j)) return;
    vecinos[i].push(j);
    predecesores[j].push(i);
  };
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      const i = f * lado + c;
      const destinos = [[f - 1, c], [f + 1, c], [f, c - 1], [f, c + 1]];
      for (const [g, d] of destinos) {
        if (toro) unir(i, ((g + lado) % lado) * lado + ((d + lado) % lado));
        else if (g >= 0 && d >= 0 && g < lado && d < lado) unir(i, g * lado + d);
      }
    }
  }
  const dibujo = { ancho: lado + 2 * margen, alto: lado + 2 * margen, aristas: true, radio: 0.35 };
  if (toro) {
    dibujo.fantasmas = [];
    for (let f = -1; f <= lado; f++) {
      for (let c = -1; c <= lado; c++) {
        if (f >= 0 && f < lado && c >= 0 && c < lado) continue;
        dibujo.fantasmas.push({ casilla: ((f + lado) % lado) * lado + ((c + lado) % lado), ...cuadrada(c, f, 1) });
      }
    }
  }
  const tablero = { id: `ejemplo-${lado}`, nombre: 'Ejemplo', casillas, vecinos: vecinos.map((l) => l.sort((a, b) => a - b)), dibujo };
  if (sentido) {
    tablero.dirigido = true;
    tablero.predecesores = predecesores.map((l) => l.sort((a, b) => a - b));
  }
  return tablero;
}

const rondaDe = (cuerpos, modo) => ({ modo, cuerpos, camino: cuerpos.flat() });

function ejemplo(id, tablero, ronda, opciones = {}) {
  const v = crearVista($(id), tablero, { alClicar: () => {} });
  v.actualizar({ ronda, ...opciones });
}

// 1. Toro 4×4: el gusano 6 → 7 → 4 (por el pegado derecha-izquierda) → 8.
ejemplo('ej-toro', rejilla(4, { toro: true }), rondaDe([[6, 7, 4, 8]], { gusanos: 1, cabezas: 1 }), { legales: [4, 9, 11, 12] });

// 2. Calles alternas: filas pares hacia la derecha, impares hacia la izquierda; columnas
// pares hacia abajo, impares hacia arriba.
const calles = (i, j) => (Math.floor(i / 4) === Math.floor(j / 4)
  ? (Math.floor(i / 4) % 2 === 0) === (j > i)
  : (i % 4 % 2 === 0) === (j > i));
ejemplo('ej-arcos', rejilla(4, { sentido: calles }), rondaDe([[0, 1, 2, 6, 5, 4, 8, 9]], { gusanos: 1, cabezas: 1 }), { legales: [10] });

// 3. Dos gusanos de dos cabezas.
ejemplo('ej-dos', rejilla(4), rondaDe([[4, 5, 6, 10], [3, 7, 11]], { gusanos: 2, cabezas: 2 }), { legales: [0, 2, 8, 9, 14, 15] });

// 4. Un gusano de dos cabezas: la casilla 8 es vecina de los dos extremos (4 y 9).
ejemplo('ej-extremo', rejilla(4), rondaDe([[4, 0, 1, 5, 9]], { gusanos: 1, cabezas: 2 }), { legales: [8, 10, 13], elegirExtremo: [4, 9] });
