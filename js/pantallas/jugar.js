/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Pantalla «Jugar» (ESPECIFICACION.md §6): ajustes → partida → fin.

import { generador } from '../tableros/index.js';
import { crearAzar } from '../util/azar.js';
import { jugadasLegales, cotaSuperior, puntuacion } from '../motor/ronda.js';
import {
  nuevaPartida, rondaActual, jugadorEnTurno, jugarEnPartida, marcador, anadirPar,
} from '../motor/partida.js';
import { elegirJugada } from '../ia/jugadores.js';
import { crearVista } from '../ui/vista-tablero.js';
import { ajustesPorDefecto, tablerosDesdeAjustes, montarAjustes } from '../ui/ajustes.js';
import { decoraciones } from '../ui/ayudas.js';
import { enlaceDe } from '../compartir/url.js';

export const id = 'jugar';
export const titulo = 'Jugar';

const RETARDO_MAQUINA_MS = 60;

// Un solo temporizador en toda la aplicación: al montar de nuevo se cancela el anterior.
let temporizador = null;

function el(nombre, atributos = {}, ...hijos) {
  const nodo = document.createElement(nombre);
  for (const [k, v] of Object.entries(atributos)) {
    if (k === 'class') nodo.className = v;
    else nodo[k] = v;
  }
  nodo.append(...hijos);
  return nodo;
}

function boton(texto, alPulsar, clase = '') {
  const b = el('button', { type: 'button', class: clase }, texto);
  b.addEventListener('click', alPulsar);
  return b;
}

const parasPuntos = (n) => `${n} ${Math.abs(n) === 1 ? 'punto' : 'puntos'}`;

export function montar(contenedor, contexto) {
  const { irA, datos = {} } = contexto;
  clearTimeout(temporizador);

  let ajustes = ajustesPorDefecto();
  let partida = null;
  let vista = null;
  let parDeLaVista = -1;
  let ayuda = false;
  let aviso = '';
  let pensando = false;

  const activo = () => contenedor.isConnected;
  const azarMaquina = crearAzar();

  // ---------- fase 1: ajustes ----------

  function mostrarAjustes() {
    clearTimeout(temporizador);
    vista?.destruir();
    vista = null;
    parDeLaVista = -1;
    montarAjustes(contenedor, ajustes, (aceptados) => {
      // Elegir un tablero en el formulario sustituye al que venía del editor.
      const { tableroFijo, ...resto } = aceptados;
      ajustes = { ...resto, semilla: Date.now() };
      empezar();
    });
  }

  function empezar() {
    const tableros = tablerosDesdeAjustes(ajustes);
    partida = nuevaPartida({
      nombres: ajustes.nombres,
      tableros,
      inicio: ajustes.inicio,
      semilla: ajustes.semilla,
    });
    aviso = '';
    ayuda = false;
    construirPartida();
  }

  // ---------- fase 2: la partida ----------

  const zonas = {};

  function construirPartida() {
    vista?.destruir();
    vista = null;
    parDeLaVista = -1;
    zonas.marcador = el('section', { class: 'marcador', 'aria-live': 'polite' });
    zonas.estado = el('p', { class: 'estado', role: 'status' });
    zonas.tablero = el('div', { class: 'zona-tablero' });
    zonas.botones = el('div', { class: 'botones' });
    zonas.enlace = el('div', { class: 'enlace' });
    const lateral = el('div', { class: 'lateral' }, zonas.marcador, zonas.estado, zonas.botones, zonas.enlace);
    contenedor.replaceChildren(el('div', { class: 'partida' }, zonas.tablero, lateral));
    pintar();
  }

  function nombreDe(i) { return partida.nombres[i]; }

  function pintaMarcador(m, ronda) {
    const gusano = partida.ronda;
    const enTurno = partida.terminada ? null : jugadorEnTurno(partida);
    const columnas = [0, 1].map((i) => {
      const esGusano = i === gusano;
      const caja = el('div', { class: `jugador-marcador${i === enTurno ? ' turno' : ''}` });
      caja.append(
        el('span', { class: 'nombre' }, nombreDe(i)),
        el('span', { class: 'puntos' }, String(m.puntos[i])),
      );
      if (!partida.terminada) {
        caja.append(el('span', { class: `rol ${esGusano ? 'gusano' : 'pajaro'}` }, esGusano ? 'gusano' : 'pájaro'));
        if (ayuda && esGusano) caja.append(el('span', { class: 'techo' }, `techo ${cotaSuperior(ronda)}`));
      }
      return caja;
    });
    const total = partida.pares.length;
    const cabecera = partida.terminada
      ? 'Partida terminada'
      : `Par ${partida.par + 1} de ${total} · Ronda ${partida.ronda + 1}`;
    zonas.marcador.replaceChildren(el('div', { class: 'ronda-actual' }, cabecera), ...columnas);
  }

  function pintaEstado(humanoEnTurno) {
    let texto;
    if (partida.terminada) {
      texto = '';
    } else if (pensando) {
      texto = `${nombreDe(jugadorEnTurno(partida))} está pensando…`;
    } else if (humanoEnTurno) {
      texto = `Turno de ${nombreDe(jugadorEnTurno(partida))}.`;
    } else {
      texto = '';
    }
    zonas.estado.replaceChildren(
      ...(aviso ? [el('span', { class: 'aviso' }, aviso), ' '] : []),
      texto,
    );
  }

  function pintaBotones() {
    const botones = [];
    if (partida.terminada) {
      const m = marcador(partida);
      const [a, b] = m.puntos;
      const resultado = m.ganador === null
        ? `Empate a ${a} puntos.`
        : `Gana ${nombreDe(m.ganador)} por ${m.puntos[m.ganador]} a ${m.puntos[1 - m.ganador]}.`;
      botones.push(el('p', { class: 'resultado' }, resultado));
      botones.push(boton('Un par más', unParMas));
      botones.push(boton('Analizar', () => irA('analisis', { partida })));
    } else {
      const interruptor = boton(`Modo ayuda: ${ayuda ? 'sí' : 'no'}`, () => { ayuda = !ayuda; pintar(); });
      interruptor.setAttribute('aria-pressed', String(ayuda));
      botones.push(interruptor);
    }
    if (enlaceDe(partida) !== null) botones.push(boton('Compartir', compartir));
    botones.push(boton('Nueva partida', nuevaPartidaNueva));
    zonas.botones.replaceChildren(...botones);
  }

  function pintar() {
    if (!activo()) return;
    const ronda = rondaActual(partida);
    const par = partida.pares[partida.par];

    if (parDeLaVista !== partida.par) {
      vista?.destruir();
      zonas.tablero.replaceChildren();
      vista = crearVista(zonas.tablero, par.tablero, { alClicar });
      parDeLaVista = partida.par;
    }

    const humanoEnTurno = !partida.terminada && ajustes.jugadores[jugadorEnTurno(partida)].tipo === 'humano';
    vista.actualizar({
      ronda,
      legales: humanoEnTurno ? jugadasLegales(ronda) : [],
      decoraciones: ayuda ? decoraciones(ronda) : new Map(),
      mostrarValores: true,
    });
    pintaMarcador(marcador(partida), ronda);
    pintaEstado(humanoEnTurno);
    pintaBotones();

    if (!partida.terminada && !humanoEnTurno && !pensando) programaMaquina();
  }

  // ---------- jugadas ----------

  function jugarCasilla(casilla) {
    const antes = partida;
    partida = jugarEnPartida(partida, casilla);
    aviso = '';
    if (partida.par !== antes.par || partida.ronda !== antes.ronda || partida.terminada) {
      const cerrada = partida.pares[antes.par].rondas[antes.ronda];
      aviso = `Fin de la ronda: ${nombreDe(antes.ronda)} (gusano) suma ${parasPuntos(puntuacion(cerrada))}.`;
    }
    zonas.enlace.replaceChildren();
  }

  function alClicar(casilla) {
    if (!partida || partida.terminada || pensando) return;
    if (ajustes.jugadores[jugadorEnTurno(partida)].tipo !== 'humano') return;
    if (!jugadasLegales(rondaActual(partida)).includes(casilla)) return;
    jugarCasilla(casilla);
    pintar();
  }

  function programaMaquina() {
    pensando = true;
    pintaEstado(false);
    vista.actualizar({
      ronda: rondaActual(partida), legales: [], decoraciones: ayuda ? decoraciones(rondaActual(partida)) : new Map(), mostrarValores: true,
    });
    const referencia = partida;
    // El aviso «pensando…» se pinta antes: elegirJugada puede tardar más de un segundo.
    temporizador = setTimeout(() => {
      pensando = false;
      if (!activo() || partida !== referencia) return;
      const nivel = ajustes.jugadores[jugadorEnTurno(partida)].nivel;
      const casilla = elegirJugada(nivel, rondaActual(partida), { azar: azarMaquina });
      jugarCasilla(casilla);
      pintar();
    }, RETARDO_MAQUINA_MS);
  }

  // ---------- fase 3: fin y botones ----------

  function tableroNuevo() {
    const fijo = ajustes.tableroFijo;
    if (fijo) return fijo;
    const g = partida.pares[0].tablero.generador;
    return g && generador(g.id) ? generador(g.id).crear(g.parametros) : partida.pares[0].tablero;
  }

  function unParMas() {
    partida = anadirPar(partida, tableroNuevo());
    aviso = '';
    pintar();
  }

  function nuevaPartidaNueva() {
    clearTimeout(temporizador);
    pensando = false;
    mostrarAjustes();
  }

  async function compartir() {
    const enlace = enlaceDe(partida);
    if (enlace === null) return;
    const campo = el('input', { type: 'text', readOnly: true, value: enlace, class: 'enlace-campo', ariaLabel: 'Enlace de la partida' });
    const nota = el('span', { class: 'nota' }, '');
    zonas.enlace.replaceChildren(campo, nota);
    campo.select();
    try {
      await navigator.clipboard.writeText(enlace);
      nota.textContent = 'Enlace copiado.';
    } catch {
      nota.textContent = 'Cópialo a mano.';
    }
  }

  // ---------- arranque ----------

  if (datos.partida) {
    partida = datos.partida;
    // Una partida que llega de un enlace se juega entre personas; nombres y semilla son los suyos.
    ajustes = {
      ...ajustesPorDefecto(),
      jugadores: [{ tipo: 'humano', nivel: null }, { tipo: 'humano', nivel: null }],
      nombres: partida.nombres,
      inicio: partida.inicio,
      semilla: partida.semilla,
      pares: partida.pares.length,
    };
    const g = partida.pares[0].tablero.generador;
    if (g) ajustes = { ...ajustes, generadorId: g.id, parametros: g.parametros ?? {} };
    construirPartida();
  } else if (datos.tablero) {
    // Del editor: un solo par con ese tablero y los jugadores por defecto.
    ajustes = { ...ajustes, tableroFijo: datos.tablero, pares: 1 };
    empezar();
  } else {
    mostrarAjustes();
  }
}
