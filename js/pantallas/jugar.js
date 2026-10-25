/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Pantalla «Jugar» (ESPECIFICACION.md §6): ajustes → partida → fin.

import { generador } from '../tableros/index.js';
import { crearAzar } from '../util/azar.js';
import { jugadasLegales, cotaSuperior } from '../motor/ronda.js';
import {
  nuevaPartida, rondaActual, jugadorEnTurno, jugarEnPartida, marcador, anadirPar,
} from '../motor/partida.js';
import { elegirJugada } from '../ia/jugadores.js';
import { crearVista } from '../ui/vista-tablero.js';
import { ajustesPorDefecto, tablerosDesdeAjustes, montarAjustes } from '../ui/ajustes.js';
import { decoraciones } from '../ui/ayudas.js';
import { enlaceDe } from '../compartir/url.js';
import {
  saldos, conSigno, marcadorAlCierre, sinEmpezar, papeles, finDeRonda, resultado,
} from '../ui/textos-partida.js';

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

// «**Jugador A es el gusano**: …» → nodos de texto y <strong>.
function conNegrita(texto) {
  return texto.split(/\*\*(.+?)\*\*/).map((trozo, i) => (i % 2 ? el('strong', {}, trozo) : trozo));
}

export function montar(contenedor, contexto) {
  const { irA, datos = {} } = contexto;
  clearTimeout(temporizador);

  let ajustes = ajustesPorDefecto();
  let partida = null;
  let vista = null;
  let parDeLaVista = -1;
  let ayuda = false;
  let pensando = false;
  // Ventana abierta (o null) y ronda terminada que se está mirando sin haber pulsado «Continuar»:
  // { par, ronda, continuar }. En cualquiera de los dos casos nadie juega.
  let dialogo = null;
  let cierre = null;

  const activo = () => contenedor.isConnected;
  const azarMaquina = crearAzar();
  const enPausa = () => dialogo !== null || cierre !== null;

  // ---------- fase 1: ajustes ----------

  function mostrarAjustes() {
    clearTimeout(temporizador);
    vista?.destruir();
    vista = null;
    parDeLaVista = -1;
    dialogo = null;
    cierre = null;
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
    ayuda = false;
    construirPartida();
  }

  // ---------- fase 2: la partida ----------

  const zonas = {};

  function construirPartida() {
    vista?.destruir();
    vista = null;
    parDeLaVista = -1;
    dialogo = null;
    cierre = null;
    zonas.marcador = el('section', { class: 'marcador', 'aria-live': 'polite' });
    zonas.estado = el('p', { class: 'estado', role: 'status' });
    zonas.tablero = el('div', { class: 'zona-tablero' });
    zonas.botones = el('div', { class: 'botones' });
    zonas.enlace = el('div', { class: 'enlace' });
    zonas.ventanas = el('div', { class: 'ventanas' });
    const lateral = el('div', { class: 'lateral' }, zonas.marcador, zonas.estado, zonas.botones, zonas.enlace);
    contenedor.replaceChildren(el('div', { class: 'partida' }, zonas.tablero, lateral, zonas.ventanas));
    // La ventana de papeles se abre antes del primer pintado para que la máquina no se adelante.
    if (sinEmpezar(partida)) abrirPapeles();
    pintar();
  }

  function nombreDe(i) { return partida.nombres[i]; }

  // Los papeles y el marcador que se ven: los de la ronda cerrada mientras se la mira, los de la actual si no.
  const rondaVista = () => (cierre ? cierre.ronda : partida.ronda);
  const parVisto = () => (cierre ? cierre.par : partida.par);

  function pintaMarcador(ronda) {
    const m = cierre ? marcadorAlCierre(partida, cierre) : marcador(partida);
    const [saldoA, saldoB] = saldos(m.puntos);
    const gusano = rondaVista();
    const enTurno = partida.terminada || cierre ? null : jugadorEnTurno(partida);
    const columnas = [0, 1].map((i) => {
      const esGusano = i === gusano;
      const saldo = i === 0 ? saldoA : saldoB;
      const caja = el('div', { class: `jugador-marcador${i === enTurno ? ' turno' : ''}` });
      caja.append(
        el('span', { class: 'nombre' }, nombreDe(i)),
        el('span', { class: `saldo ${saldo > 0 ? 'positivo' : saldo < 0 ? 'negativo' : 'cero'}` }, conSigno(saldo)),
        el('span', { class: 'brutos' }, `${m.puntos[i]} como gusano`),
      );
      if (!partida.terminada) {
        caja.append(el('span', { class: `rol ${esGusano ? 'gusano' : 'pajaro'}` }, esGusano ? 'gusano' : 'pájaro'));
        if (ayuda && esGusano && !cierre) caja.append(el('span', { class: 'techo' }, `techo ${cotaSuperior(ronda)}`));
      }
      return caja;
    });
    const total = partida.pares.length;
    const cabecera = partida.terminada
      ? 'Partida terminada'
      : `Par ${parVisto() + 1} de ${total} · Ronda ${rondaVista() + 1}${cierre ? ' (terminada)' : ''}`;
    zonas.marcador.replaceChildren(el('div', { class: 'ronda-actual' }, cabecera), ...columnas);
  }

  function pintaEstado(humanoEnTurno) {
    let texto = '';
    if (partida.terminada || cierre) {
      texto = '';
    } else if (pensando) {
      texto = `${nombreDe(jugadorEnTurno(partida))} está pensando…`;
    } else if (humanoEnTurno) {
      texto = `Turno de ${nombreDe(jugadorEnTurno(partida))}.`;
    }
    zonas.estado.replaceChildren(texto);
  }

  function pintaBotones() {
    const botones = [];
    if (partida.terminada) {
      botones.push(el('p', { class: 'resultado' }, resultado(partida)));
      botones.push(boton('Un par más', unParMas));
      botones.push(boton('Analizar', () => irA('analisis', { partida })));
    } else if (cierre) {
      botones.push(boton(cierre.continuar, continuar, 'principal'));
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
    // Con una ronda cerrada a la vista se dibuja ella, sobre su tablero, aunque el motor ya esté en otra.
    const ronda = cierre ? partida.pares[cierre.par].rondas[cierre.ronda] : rondaActual(partida);
    const par = partida.pares[parVisto()];

    if (parDeLaVista !== parVisto()) {
      vista?.destruir();
      zonas.tablero.replaceChildren();
      vista = crearVista(zonas.tablero, par.tablero, { alClicar });
      parDeLaVista = parVisto();
    }

    const humanoEnTurno = !partida.terminada && !enPausa()
      && ajustes.jugadores[jugadorEnTurno(partida)].tipo === 'humano';
    vista.actualizar({
      ronda,
      legales: humanoEnTurno ? jugadasLegales(ronda) : [],
      decoraciones: ayuda ? decoraciones(ronda) : new Map(),
      mostrarValores: true,
    });
    pintaMarcador(ronda);
    pintaEstado(humanoEnTurno);
    pintaBotones();

    if (!partida.terminada && !humanoEnTurno && !pensando && !enPausa()) programaMaquina();
  }

  // ---------- ventanas ----------

  // botones: [{ texto, principal?, alPulsar }]; `alCancelar` es lo que hace Esc.
  function abrirVentana({ titulo: encabezado, parrafos, botones, alCancelar }) {
    const d = el('dialog', { class: 'ventana' });
    const cuerpo = parrafos.map((p) => el('p', {}, ...conNegrita(p)));
    const fila = el('div', { class: 'botones-ventana' });
    let atendida = false;
    // Cualquier salida (botón, Esc, close) se atiende una sola vez: Esc dispara «cancel» y luego «close».
    const atender = (accion) => {
      if (atendida) return;
      atendida = true;
      if (dialogo === d) dialogo = null;
      if (d.open) d.close();
      d.remove();
      accion();
      // Al cerrar, el foco va a «Continuar con …» (o al primer botón de la zona), salvo que la acción abra otra ventana.
      if (dialogo === null) (zonas.botones.querySelector('button.principal') ?? zonas.botones.querySelector('button'))?.focus();
    };
    for (const b of botones) fila.append(boton(b.texto, () => atender(b.alPulsar), b.principal ? 'principal' : ''));
    d.append(el('h2', {}, encabezado), ...cuerpo, fila);
    d.addEventListener('cancel', (e) => { e.preventDefault(); atender(alCancelar); });
    d.addEventListener('close', () => atender(alCancelar));
    zonas.ventanas.append(d);
    dialogo = d;
    d.showModal();
    fila.querySelector('button.principal')?.focus();
  }

  function abrirPapeles() {
    const t = papeles(partida);
    const empezarRonda = () => pintar();
    abrirVentana({
      titulo: t.titulo,
      parrafos: t.parrafos,
      botones: [{ texto: t.boton, principal: true, alPulsar: empezarRonda }],
      alCancelar: empezarRonda,
    });
  }

  // `cierre` ya está puesto (null si la partida ha terminado): «Ver tablero» solo tiene que pintar.
  function abrirFinDeRonda(t) {
    const verTablero = () => pintar();
    const botones = [];
    if (t.continuar) {
      botones.push({ texto: t.continuar, principal: true, alPulsar: continuar });
      botones.push({ texto: 'Ver tablero', alPulsar: verTablero });
    } else {
      botones.push({ texto: 'Ver tablero', principal: true, alPulsar: verTablero });
      botones.push({ texto: 'Un par más', alPulsar: unParMas });
      botones.push({ texto: 'Analizar', alPulsar: () => irA('analisis', { partida }) });
      botones.push({ texto: 'Nueva partida', alPulsar: nuevaPartidaNueva });
    }
    abrirVentana({ titulo: t.titulo, parrafos: t.parrafos, botones, alCancelar: verTablero });
  }

  function continuar() {
    cierre = null;
    pintar();
  }

  // ---------- jugadas ----------

  function jugarCasilla(casilla) {
    const antes = partida;
    partida = jugarEnPartida(partida, casilla);
    zonas.enlace.replaceChildren();
    if (partida.par !== antes.par || partida.ronda !== antes.ronda || partida.terminada) {
      // La ronda cerrada se guarda ahora: el motor ya ha pasado a la siguiente.
      const cerrada = { par: antes.par, ronda: antes.ronda };
      const t = finDeRonda(partida, cerrada);
      cierre = partida.terminada ? null : { ...cerrada, continuar: t.continuar };
      abrirFinDeRonda(t);
    }
  }

  function alClicar(casilla) {
    if (!partida || partida.terminada || pensando || enPausa()) return;
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
    cierre = null;
    if (sinEmpezar(partida)) abrirPapeles();
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
