/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Ajustes de partida (ESPECIFICACION.md §6): datos por defecto, tableros que salen de ellos
// y el formulario. Las funciones puras no tocan `document`; solo `montarAjustes` lo hace.

import { generadores, generador } from '../tableros/index.js';
import { niveles } from '../ia/jugadores.js';
import { conObstaculos } from '../tableros/obstaculos.js';
import { conValores } from '../tableros/valores.js';
import { conSentidoUnico } from '../tableros/sentido.js';
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
    gusanos: 1,
    cabezas: 1,
    sentido: 0,
    semilla,
  };
}

// Modo de la ronda que piden los ajustes (§10.3); con los defectos, el clásico.
export function modoDeAjustes(ajustes) {
  return { gusanos: ajustes.gusanos ?? 1, cabezas: ajustes.cabezas ?? 1 };
}

// ¿Se ofrece esta opción con los valores actuales de los demás parámetros? (`soloSi`, §10.2)
export function opcionDisponible(opcion, valores) {
  return Object.entries(opcion.soloSi ?? {}).every(([clave, validos]) => validos.includes(valores[clave]));
}

// Punto único donde se aplican transformaciones al tablero recién generado, en este orden:
// obstáculos → sentido único → valores (§10.6).
function transformarTablero(tablero, ajustes, indicePar) {
  const azar = crearAzar(ajustes.semilla + indicePar);
  if (ajustes.obstaculos > 0) tablero = conObstaculos(tablero, ajustes.obstaculos, azar);
  if (ajustes.sentido > 0) tablero = conSentidoUnico(tablero, ajustes.sentido, azar);
  if (ajustes.valores && ajustes.valores !== 'sin') tablero = conValores(tablero, ajustes.valores, azar);
  return tablero;
}

// Un tablero por par, todos del mismo generador y con los mismos parámetros.
// Si `ajustes.tableroFijo` existe (viene del editor), es el que se repite en cada par.
export function tablerosDesdeAjustes(ajustes) {
  const tableros = [];
  for (let k = 0; k < ajustes.pares; k++) tableros.push(tableroDelPar(ajustes, k));
  return tableros;
}

// El tablero que corresponde al par k (con sus transformaciones y el azar `semilla + k`, §10.7).
// Vale también con un `origen` de partida, que lleva los mismos campos.
export function tableroDelPar(ajustes, k) {
  const base = ajustes.tableroFijo ?? generador(ajustes.generadorId).crear(ajustes.parametros);
  return transformarTablero(base, ajustes, k);
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
  // `alto` sigue a `lado` mientras el jugador no lo toque (§10.6): sin tocar, no se envía.
  let altoTocado = false;

  const valoresActuales = () => Object.fromEntries(campos.map(({ p, campo }) => [p.id, campo.value]));

  // Oculta las opciones cuyo `soloSi` no se cumple; si la elegida deja de valer, vuelve al defecto.
  function aplicaSoloSi() {
    const valores = valoresActuales();
    for (const { p, campo } of campos) {
      if (p.tipo !== 'opcion') continue;
      for (const o of campo.options) {
        const def = p.opciones.find((x) => String(x.valor) === o.value);
        const ok = opcionDisponible(def, valores);
        o.hidden = !ok;
        o.disabled = !ok;
      }
      const elegida = p.opciones.find((x) => String(x.valor) === campo.value);
      if (elegida && !opcionDisponible(elegida, valores)) {
        campo.value = p.defecto;
        valores[p.id] = campo.value;
      }
    }
  }

  function pintaParametros(valores) {
    const g = generador(selGenerador.value);
    descripcion.textContent = g.descripcion ?? '';
    zonaParametros.replaceChildren();
    altoTocado = valores?.alto !== undefined;
    campos = g.parametros.map((p) => {
      const campo = campoParametro(p, valores?.[p.id]);
      campo.addEventListener('input', () => {
        if (p.id === 'alto') altoTocado = true;
        if (p.id === 'lado' && !altoTocado) {
          const alto = campos.find((c) => c.p.id === 'alto');
          if (alto) alto.campo.value = campo.value;
        }
        aplicaSoloSi();
      });
      campo.addEventListener('change', aplicaSoloSi);
      zonaParametros.append(el('label', { class: 'campo' }, p.nombre, campo));
      return { p, campo };
    });
    const lado = campos.find((c) => c.p.id === 'lado');
    const alto = campos.find((c) => c.p.id === 'alto');
    if (lado && alto && !altoTocado) alto.campo.value = lado.campo.value;
    aplicaSoloSi();
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
  const selSentido = el('select', { id: 'ajuste-sentido' });
  for (const [v, nombre] of [[0, 'No'], [0.25, '25 %'], [0.5, '50 %'], [1, 'Todas']]) selSentido.append(new Option(nombre, v));
  selSentido.value = String(actuales.sentido ?? 0);
  const selGusanos = el('select', { id: 'ajuste-gusanos' });
  selGusanos.append(new Option('Uno (gusano y pájaro)', 1), new Option('Dos (gana el más largo)', 2));
  selGusanos.value = String(actuales.gusanos ?? 1);
  const selCabezas = el('select', { id: 'ajuste-cabezas' });
  selCabezas.append(new Option('Una', 1), new Option('Dos (crece por los dos extremos)', 2));
  selCabezas.value = String(actuales.cabezas ?? 1);

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
      el('label', { class: 'campo' }, 'Tipo', selGenerador),
      descripcion,
      zonaParametros,
      el('label', { class: 'campo' }, 'Obstáculos', selObstaculos),
      el('label', { class: 'campo' }, 'Sentido único', selSentido),
      el('label', { class: 'campo' }, 'Valores', selValores)),
    el('fieldset', {},
      el('legend', {}, 'Partida'),
      el('label', { class: 'campo' }, 'Pares de rondas (1-5)', campoPares),
      el('label', { class: 'campo' }, 'Casilla inicial', selInicio),
      el('label', { class: 'campo' }, 'Gusanos', selGusanos),
      el('label', { class: 'campo' }, 'Cabezas', selCabezas)),
    bloqueJugador(0),
    bloqueJugador(1),
    empezar,
  );

  formulario.addEventListener('submit', () => {
    const parametros = {};
    for (const { p, campo } of campos) {
      if (p.id === 'alto' && !altoTocado) continue;
      parametros[p.id] = leeParametro(p, campo);
    }
    const pares = Math.min(5, Math.max(1, Math.round(Number(campoPares.value)) || 1));
    alAceptar({
      ...actuales,
      generadorId: selGenerador.value,
      parametros,
      pares,
      obstaculos: Number(selObstaculos.value),
      valores: selValores.value,
      sentido: Number(selSentido.value),
      gusanos: Number(selGusanos.value),
      cabezas: Number(selCabezas.value),
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
