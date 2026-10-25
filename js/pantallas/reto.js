/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Pantalla «Reto del día» (ESPECIFICACION.md §7.2): un tablero al día, igual para todos,
// el jugador hace de gusano contra el pájaro perfecto y se compara con el «par».

import { generador } from '../tableros/index.js';
import { crearAzar, semillaDesdeTexto } from '../util/azar.js';
import { nuevaRonda, jugar, jugadasLegales, rondaTerminada, puntuacion, turno } from '../motor/ronda.js';
import { elegirJugada } from '../ia/jugadores.js';
import { par as parExacto } from '../ia/minimax.js';
import { crearVista } from '../ui/vista-tablero.js';

export const id = 'reto';
export const titulo = 'Reto del día';

const PRIMER_RETO = Date.UTC(2026, 9, 20);
const MS_POR_DIA = 86_400_000;
const RETARDO_MS = 60;
const TIEMPO_PAJARO_MS = 3000;

// Reto 1 = 2026-10-20. Se cuentan días del calendario local con Date.UTC para que el
// cambio de hora no desplace el resultado.
export function numeroDeReto(fecha = new Date()) {
  const dia = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return Math.round((dia - PRIMER_RETO) / MS_POR_DIA) + 1;
}

const SUPERFICIES = ['cilindro', 'toro', 'mobius', 'klein'];

// Candidatos de §7.2 (todos de ≤ 25 casillas).
function candidatos(azar) {
  const lista = [
    { id: 'cuadrado4', parametros: { lado: 4 } },
    { id: 'cuadrado4', parametros: { lado: 5 } },
    { id: 'cuadrado8', parametros: { lado: 4 } },
    { id: 'caballo', parametros: { lado: 4 } },
    { id: 'caballo', parametros: { lado: 5 } },
    { id: 'hexagonal', parametros: { radio: 2 } },
    { id: 'superficie', parametros: { lado: 4, superficie: azar.elegir(SUPERFICIES) } },
  ];
  if (generador('poliedro')) {
    lista.push({ id: 'poliedro', parametros: { solido: 'dodecaedro' } });
    lista.push({ id: 'poliedro', parametros: { solido: 'icosaedro' } });
  }
  return lista;
}

// Determinista: el mismo número da siempre el mismo tablero y la misma casilla inicial.
export function tableroDelReto(numero) {
  const azar = crearAzar(semillaDesdeTexto('gusano-' + numero));
  const elegido = azar.elegir(candidatos(azar));
  const tablero = generador(elegido.id).crear(elegido.parametros);
  const libres = tablero.casillas.map((c, i) => (c.bloqueada ? -1 : i)).filter((i) => i >= 0);
  return { tablero, inicio: azar.elegir(libres) };
}

export function textoResultado(numero, puntos, casillas, par) {
  return `Gusano #${numero} · ${puntos}/${casillas} · par ${par ?? 'no calculable'}`;
}

// ---------- mejor resultado del día ----------

const claveMejor = (numero) => `gusano-reto-${numero}`;

function leerMejor(numero) {
  try {
    const bruto = localStorage.getItem(claveMejor(numero));
    const v = Number(bruto);
    return bruto !== null && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function guardarMejor(numero, puntos) {
  const antes = leerMejor(numero);
  const mejor = antes === null ? puntos : Math.max(antes, puntos);
  try { localStorage.setItem(claveMejor(numero), String(mejor)); } catch { /* sin almacenamiento */ }
  return mejor;
}

// ---------- pantalla ----------

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

export function montar(contenedor, contexto) {
  clearTimeout(temporizador);
  const numero = numeroDeReto();
  const { tablero, inicio } = tableroDelReto(numero);
  const casillas = tablero.casillas.filter((c) => !c.bloqueada).length;

  const zonaTablero = el('div', { class: 'zona-tablero' });
  const marcador = el('div', { class: 'reto-puntos' });
  const estado = el('p', { class: 'estado', role: 'status' });
  const resultado = el('div', { class: 'reto-resultado', 'aria-live': 'polite' });
  const botones = el('div', { class: 'botones' });
  const lateral = el('div', { class: 'lateral' },
    el('h2', { class: 'reto-titulo' }, `Reto #${numero}`),
    el('p', { class: 'reto-ayuda' }, 'Eres el gusano: alarga el camino todo lo que puedas. El pájaro es perfecto.'),
    marcador, estado, resultado, botones);
  contenedor.replaceChildren(el('div', { class: 'partida reto' }, zonaTablero, lateral));

  let ronda;
  let pensando = false;
  let terminado = false;
  const activo = () => contenedor.isConnected;

  const vista = crearVista(zonaTablero, tablero, { alClicar });

  function pintar() {
    const humano = !terminado && !pensando && turno(ronda) === 'gusano';
    vista.actualizar({ ronda, legales: humano ? jugadasLegales(ronda) : [], mostrarValores: true });
    marcador.textContent = `Puntos: ${puntuacion(ronda)} de ${casillas} casillas`;
    estado.textContent = terminado ? '' : pensando ? 'El pájaro está pensando…' : 'Tu turno.';
  }

  function alClicar(casilla) {
    if (terminado || pensando || turno(ronda) !== 'gusano') return;
    if (!jugadasLegales(ronda).includes(casilla)) return;
    ronda = jugar(ronda, casilla);
    avanzar();
  }

  function avanzar() {
    if (rondaTerminada(ronda)) { acabar(); return; }
    pensando = turno(ronda) === 'pajaro';
    pintar();
    if (!pensando) return;
    const referencia = ronda;
    // El aviso «pensando…» se pinta antes: elegirJugada puede tardar hasta 3 s.
    temporizador = setTimeout(() => {
      pensando = false;
      if (!activo() || ronda !== referencia) return;
      ronda = jugar(ronda, elegirJugada('perfecto', ronda, { tiempoMaximoMs: TIEMPO_PAJARO_MS }));
      avanzar();
    }, RETARDO_MS);
  }

  function acabar() {
    terminado = true;
    pensando = false;
    const puntos = puntuacion(ronda);
    const mejor = guardarMejor(numero, puntos);
    pintar();
    const lineaPar = el('p', { class: 'reto-par' }, 'Calculando el par…');
    resultado.replaceChildren(
      el('p', { class: 'reto-final' }, `Has conseguido ${puntos} de ${casillas}.`),
      lineaPar,
      el('p', { class: 'reto-mejor' }, `Tu mejor resultado de hoy: ${mejor}.`),
    );
    botones.replaceChildren(boton('Otra vez', otraVez));
    // El par se calcula al terminar, no antes, para no retrasar el inicio.
    temporizador = setTimeout(() => {
      if (!activo()) return;
      const par = parExacto(tablero, inicio);
      lineaPar.textContent = par === null ? 'par: no calculable' : `Par: ${par}`;
      const texto = textoResultado(numero, puntos, casillas, par);
      const caja = el('input', { type: 'text', readOnly: true, value: texto, class: 'reto-texto', ariaLabel: 'Resultado para copiar' });
      const nota = el('span', { class: 'nota' });
      const copiar = boton('Copiar', async () => {
        caja.select();
        try {
          await navigator.clipboard.writeText(texto);
          nota.textContent = 'Copiado.';
        } catch {
          nota.textContent = 'Cópialo a mano.';
        }
      });
      resultado.append(el('div', { class: 'reto-copiar' }, caja, copiar, nota));
    }, RETARDO_MS);
  }

  function otraVez() {
    clearTimeout(temporizador);
    resultado.replaceChildren();
    botones.replaceChildren();
    terminado = false;
    ronda = jugar(nuevaRonda(tablero), inicio);
    avanzar();
  }

  otraVez();
}

export default { id, titulo, montar };
