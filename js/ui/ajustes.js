/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Ajustes de partida (ESPECIFICACION.md §6): datos por defecto, tableros que salen de ellos
// y el formulario. Las funciones puras no tocan `document`; solo `montarAjustes` lo hace.

import { generadores, generador } from '../tableros/index.js';
import { niveles } from '../ia/jugadores.js';
import { conObstaculos } from '../tableros/obstaculos.js';
import { conValores } from '../tableros/valores.js';
import { crearAzar } from '../util/azar.js';

export function ajustesPorDefecto({ semilla = Date.now() } = {}) {
  return {
    generadorId: 'cuadrado4',
    parametros: {},
    pares: 1,
    inicio: 'azar',
    jugadores: [{ tipo: 'humano', nivel: null }, { tipo: 'maquina', nivel: 'fuerte' }],
    nombres: ['Jugador A', 'Jugador B'],
    obstaculos: 0,
    valores: 'sin',
    semilla,
  };
}

// Punto único donde se aplican transformaciones al tablero recién generado.
function transformarTablero(tablero, ajustes, indicePar) {
  const azar = crearAzar(ajustes.semilla + indicePar);
  if (ajustes.obstaculos > 0) tablero = conObstaculos(tablero, ajustes.obstaculos, azar);
  if (ajustes.valores && ajustes.valores !== 'sin') tablero = conValores(tablero, ajustes.valores, azar);
  return tablero;
}

// Un tablero por par, todos del mismo generador y con los mismos parámetros.
// Si `ajustes.tableroFijo` existe (viene del editor), es el que se repite en cada par.
export function tablerosDesdeAjustes(ajustes) {
  const tableros = [];
  for (let k = 0; k < ajustes.pares; k++) {
    const base = ajustes.tableroFijo ?? generador(ajustes.generadorId).crear(ajustes.parametros);
    tableros.push(transformarTablero(base, ajustes, k));
  }
  return tableros;
}

function el(nombre, atributos = {}, ...hijos) {
  const nodo = document.createElement(nombre);
  for (const [k, v] of Object.entries(atributos)) {
    if (k === 'class') nodo.className = v;
    else nodo[k] = v;
  }
  nodo.append(...hijos);
  return nodo;
}

function campoParametro(p, valor) {
  if (p.tipo === 'opcion') {
    const campo = el('select');
    for (const o of p.opciones) campo.append(new Option(o.nombre, o.valor));
    campo.value = valor ?? p.defecto;
    return campo;
  }
  return el('input', { type: 'number', min: p.min, max: p.max, step: 1, value: valor ?? p.defecto, inputMode: 'numeric' });
}

function leeParametro(p, campo) {
  if (p.tipo === 'opcion') return campo.value;
  const n = Math.round(Number(campo.value));
  if (!Number.isFinite(n)) return p.defecto;
  return Math.min(p.max, Math.max(p.min, n));
}

export function montarAjustes(contenedor, ajustes, alAceptar) {
  const actuales = { ...ajustesPorDefecto(), ...ajustes };
  const formulario = el('form', { class: 'ajustes' });
  formulario.addEventListener('submit', (e) => e.preventDefault());

  // --- tablero ---
  const selGenerador = el('select', { id: 'ajuste-generador' });
  for (const g of generadores) selGenerador.append(new Option(g.nombre, g.id));
  selGenerador.value = actuales.generadorId;
  const descripcion = el('p', { class: 'ayuda-campo' });
  const zonaParametros = el('div', { class: 'parametros' });
  let campos = [];

  function pintaParametros(valores) {
    const g = generador(selGenerador.value);
    descripcion.textContent = g.descripcion ?? '';
    zonaParametros.replaceChildren();
    campos = g.parametros.map((p) => {
      const campo = campoParametro(p, valores?.[p.id]);
      zonaParametros.append(el('label', { class: 'campo' }, p.nombre, campo));
      return { p, campo };
    });
  }
  selGenerador.addEventListener('change', () => pintaParametros());
  pintaParametros(actuales.parametros);

  const selObstaculos = el('select', { id: 'ajuste-obstaculos' });
  for (const p of [0, 0.1, 0.2]) selObstaculos.append(new Option(`${Math.round(p * 100)} %`, p));
  selObstaculos.value = String(actuales.obstaculos ?? 0);
  const selValores = el('select', { id: 'ajuste-valores' });
  for (const [v, nombre] of [['sin', 'Sin valores'], ['uniforme', 'Uniforme'], ['centro', 'Más en el centro'], ['trampas', 'Con trampas']]) {
    selValores.append(new Option(nombre, v));
  }
  selValores.value = actuales.valores ?? 'sin';

  // --- partida ---
  const campoPares = el('input', { type: 'number', min: 1, max: 5, step: 1, value: actuales.pares, inputMode: 'numeric' });
  const selInicio = el('select');
  selInicio.append(new Option('Al azar', 'azar'), new Option('Libre (la elige el gusano)', 'libre'));
  selInicio.value = actuales.inicio;

  // --- jugadores ---
  const jugadores = [0, 1].map((i) => {
    const nombre = el('input', { type: 'text', value: actuales.nombres[i], maxLength: 20 });
    const tipo = el('select');
    tipo.append(new Option('Persona', 'humano'), new Option('Máquina', 'maquina'));
    tipo.value = actuales.jugadores[i].tipo;
    const nivel = el('select');
    for (const n of niveles) nivel.append(new Option(n.nombre, n.id));
    nivel.value = actuales.jugadores[i].nivel ?? 'fuerte';
    const ajustaNivel = () => { nivel.hidden = tipo.value !== 'maquina'; };
    tipo.addEventListener('change', ajustaNivel);
    ajustaNivel();
    return { nombre, tipo, nivel };
  });

  const bloqueJugador = (i) => el('fieldset', { class: 'jugador' },
    el('legend', {}, `Jugador ${i === 0 ? 'A' : 'B'}`),
    el('label', { class: 'campo' }, 'Nombre', jugadores[i].nombre),
    el('div', { class: 'fila' }, jugadores[i].tipo, jugadores[i].nivel));

  const empezar = el('button', { type: 'submit', class: 'principal' }, 'Empezar');

  formulario.append(
    el('h2', {}, 'Ajustes'),
    el('fieldset', {},
      el('legend', {}, 'Tablero'),
      el('label', { class: 'campo' }, 'Tablero', selGenerador),
      descripcion,
      zonaParametros,
      el('label', { class: 'campo' }, 'Obstáculos', selObstaculos),
      el('label', { class: 'campo' }, 'Valores', selValores)),
    el('fieldset', {},
      el('legend', {}, 'Partida'),
      el('label', { class: 'campo' }, 'Pares de rondas (1-5)', campoPares),
      el('label', { class: 'campo' }, 'Casilla inicial', selInicio)),
    bloqueJugador(0),
    bloqueJugador(1),
    empezar,
  );

  formulario.addEventListener('submit', () => {
    const parametros = {};
    for (const { p, campo } of campos) parametros[p.id] = leeParametro(p, campo);
    const pares = Math.min(5, Math.max(1, Math.round(Number(campoPares.value)) || 1));
    alAceptar({
      ...actuales,
      generadorId: selGenerador.value,
      parametros,
      pares,
      obstaculos: Number(selObstaculos.value),
      valores: selValores.value,
      inicio: selInicio.value,
      jugadores: jugadores.map((j) => ({
        tipo: j.tipo.value,
        nivel: j.tipo.value === 'maquina' ? j.nivel.value : null,
      })),
      nombres: jugadores.map((j, i) => j.nombre.value.trim() || `Jugador ${i === 0 ? 'A' : 'B'}`),
    });
  });

  contenedor.replaceChildren(formulario);
}
