/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Pantalla «Análisis» (ESPECIFICACION.md §7.1): repasa una partida y señala dónde se perdieron puntos.

import { nuevaRonda, jugar, puntuacion, cotaSuperior } from '../motor/ronda.js';
import { valorExacto, MAX_CASILLAS_EXACTO } from '../ia/minimax.js';
import { crearVista } from '../ui/vista-tablero.js';

export const id = 'analisis';
export const titulo = 'Análisis';

const MAX_ESTADOS = 2_000_000;

function el(nombre, atributos = {}, ...hijos) {
  const nodo = document.createElement(nombre);
  for (const [k, v] of Object.entries(atributos)) {
    if (k === 'class') nodo.className = v;
    else nodo[k] = v;
  }
  nodo.append(...hijos);
  return nodo;
}

function boton(texto, alPulsar) {
  const b = el('button', { type: 'button' }, texto);
  b.addEventListener('click', alPulsar);
  return b;
}

const puntos = (n) => `${n} ${Math.abs(n) === 1 ? 'punto' : 'puntos'}`;

// Un solo temporizador en toda la aplicación: al montar de nuevo se cancela el anterior.
let temporizador = null;

export function montar(contenedor, contexto) {
  const { irA, datos = {} } = contexto;
  clearTimeout(temporizador);
  const partida = datos.partida;

  if (!partida) {
    const enlace = el('a', { href: '#jugar' }, 'Juega una partida y pulsa Analizar');
    enlace.addEventListener('click', (evento) => {
      evento.preventDefault();
      irA('jugar');
    });
    contenedor.replaceChildren(el('section', { class: 'analisis analisis-vacio' }, el('p', {}, enlace)));
    return;
  }

  // Rondas con alguna jugada: (par, ronda) → etiqueta del selector.
  const rondas = [];
  partida.pares.forEach((par, p) => par.rondas.forEach((ronda, r) => {
    if (ronda.camino.length === 0) return;
    rondas.push({ p, r, etiqueta: `Par ${p + 1} · ronda ${r + 1} (gusano: ${partida.nombres[r]})` });
  }));
  if (rondas.length === 0) {
    contenedor.replaceChildren(el('section', { class: 'analisis analisis-vacio' }, el('p', {}, 'La partida no tiene jugadas que analizar.')));
    return;
  }

  let actual = rondas[0];
  let k = 0;
  let vista = null;
  const cache = new Map(); // `${p}.${r}.${m}` → resultado de valorExacto en la posición tras m jugadas
  let trabajando = false;

  const activo = () => contenedor.isConnected;
  const camino = () => partida.pares[actual.p].rondas[actual.r].camino;
  const tablero = () => partida.pares[actual.p].tablero;
  const exacto = () => tablero().casillas.length <= MAX_CASILLAS_EXACTO;
  const rondaEn = (m) => camino().slice(0, m).reduce((rd, c) => jugar(rd, c), nuevaRonda(tablero()));
  const clave = (m) => `${actual.p}.${actual.r}.${m}`;

  // La jugada m (0 = casilla inicial) solo se analiza si alguien la eligió: la inicial, solo en inicio libre.
  const analizable = (m) => exacto() && (m > 0 || (partida.inicio === 'libre' && actual.r === 0));
  const necesaria = (m) => m < camino().length && (analizable(m) || (m >= 1 && analizable(m - 1)));

  // Valor exacto tras m jugadas: calculado, o trivial si la ronda ya había acabado.
  function posicion(m) {
    const guardado = cache.get(clave(m));
    if (guardado) return guardado;
    if (m === camino().length) return { valor: puntuacion(rondaEn(m)), jugada: null, completo: true };
    return null;
  }

  // → null (aún sin calcular) | { noAnalizable } | { completo: false } | { completo: true, mover, perdidos, mejor }
  function juicio(m) {
    if (!analizable(m)) return { completo: false, noAnalizable: true };
    const antes = posicion(m);
    const despues = posicion(m + 1);
    if (!antes || !despues) return null;
    if (!antes.completo || !despues.completo) return { completo: false };
    const mover = m % 2 === 0 ? 'gusano' : 'pajaro';
    const perdidos = mover === 'gusano' ? antes.valor - despues.valor : despues.valor - antes.valor;
    return { completo: true, mover, perdidos, mejor: antes.jugada };
  }

  // Primera posición por calcular: las que pide la jugada en pantalla y después el resto de la ronda.
  function pendiente() {
    const orden = [];
    if (k >= 1) orden.push(k - 1);
    orden.push(k);
    for (let m = 0; m < camino().length; m++) orden.push(m);
    return orden.find((m) => necesaria(m) && !cache.has(clave(m)));
  }

  // Calcula de una en una, con un setTimeout entre medias para que la pantalla pinte.
  function planificar() {
    if (trabajando || !activo() || !exacto() || pendiente() === undefined) return;
    trabajando = true;
    temporizador = setTimeout(() => {
      trabajando = false;
      if (!activo()) return;
      const m = pendiente();
      if (m !== undefined) cache.set(clave(m), valorExacto(rondaEn(m), { maxEstados: MAX_ESTADOS }));
      pintar();
      planificar();
    }, 0);
  }

  // ---------- esqueleto ----------

  const selector = el('select', { 'aria-label': 'Par y ronda' });
  rondas.forEach((e, i) => selector.append(el('option', { value: String(i) }, e.etiqueta)));
  const zonaTablero = el('div', { class: 'analisis-tablero' });
  const anterior = boton('‹ Anterior', () => ir(k - 1));
  const siguiente = boton('Siguiente ›', () => ir(k + 1));
  const deslizador = el('input', { type: 'range', min: 0, value: 0, step: 1 });
  deslizador.setAttribute('aria-label', 'Jugada');
  const etiquetaPos = el('span', { class: 'analisis-pos' });
  const panel = el('div', { class: 'analisis-panel' });
  panel.setAttribute('aria-live', 'polite');
  const resumen = el('div', { class: 'analisis-resumen' });

  contenedor.replaceChildren(el('section', { class: 'analisis' },
    el('div', { class: 'analisis-cabecera' }, selector, etiquetaPos),
    zonaTablero,
    el('div', { class: 'analisis-controles' }, anterior, deslizador, siguiente),
    panel, resumen));

  selector.addEventListener('change', () => {
    actual = rondas[Number(selector.value)];
    k = 0;
    nuevaVista();
    pintar();
    planificar();
  });
  deslizador.addEventListener('input', () => ir(Number(deslizador.value)));

  function ir(nuevo) {
    k = Math.max(0, Math.min(camino().length, nuevo));
    pintar();
    planificar();
  }

  function nuevaVista() {
    vista?.destruir();
    vista = crearVista(zonaTablero, tablero(), { alClicar: () => {} });
    deslizador.max = String(camino().length);
  }

  // ---------- pintado ----------

  const textoCasilla = (c) => tablero().casillas[c].etiqueta ?? String(c + 1);

  function pintar() {
    if (!activo()) return;
    const total = camino().length;
    const rd = rondaEn(k);
    deslizador.value = String(k);
    anterior.disabled = k === 0;
    siguiente.disabled = k === total;
    etiquetaPos.textContent = `Jugada ${k} de ${total}`;

    const decos = new Map();
    const lineas = [];
    if (k === 0) {
      lineas.push(el('p', {}, 'Tablero vacío. Pulsa «Siguiente» para ver la primera jugada.'));
    } else {
      const m = k - 1;
      const quien = m % 2 === 0 ? 'gusano' : 'pájaro';
      const nombre = partida.nombres[m % 2 === 0 ? actual.r : 1 - actual.r];
      lineas.push(el('p', {}, `Jugada ${k}: ${quien} (${nombre}) → casilla ${textoCasilla(camino()[m])}.`));
    }
    lineas.push(el('p', {}, `Puntos hasta aquí: ${puntuacion(rd)} · cota superior: ${cotaSuperior(rd)}.`));

    if (k >= 1) {
      if (!exacto()) {
        lineas.push(el('p', { class: 'nota' }, `El análisis exacto solo está disponible hasta ${MAX_CASILLAS_EXACTO} casillas.`));
      } else {
        const j = juicio(k - 1);
        if (j === null) lineas.push(el('p', { class: 'nota' }, 'calculando…'));
        else if (j.noAnalizable) lineas.push(el('p', { class: 'nota' }, 'Casilla inicial: no la eligió nadie, no se analiza.'));
        else if (!j.completo) lineas.push(el('p', { class: 'nota' }, 'Esta posición es demasiado grande para calcular el valor exacto.'));
        else if (j.perdidos > 0) {
          decos.set(j.mejor, { clase: 'mejor' });
          const frase = j.mover === 'gusano' ? `Aquí el gusano perdió ${puntos(j.perdidos)}` : `Aquí el pájaro regaló ${puntos(j.perdidos)}`;
          lineas.push(el('p', { class: 'veredicto malo' }, `${frase}. La mejor jugada era la casilla ${textoCasilla(j.mejor)} (marcada).`));
        } else {
          lineas.push(el('p', { class: 'veredicto bueno' }, 'Jugada óptima: no se pierde nada.'));
        }
      }
    }
    panel.replaceChildren(...lineas);
    vista.actualizar({ ronda: rd, decoraciones: decos });
    pintarResumen();
  }

  function pintarResumen() {
    if (!exacto()) { resumen.replaceChildren(); return; }
    let gusano = 0;
    let pajaro = 0;
    let pendientes = false;
    let incompleto = false;
    for (let m = 0; m < camino().length; m++) {
      if (!analizable(m)) continue;
      const j = juicio(m);
      if (j === null) { pendientes = true; continue; }
      if (!j.completo) { incompleto = true; continue; }
      if (j.mover === 'gusano') gusano += j.perdidos;
      else pajaro += j.perdidos;
    }
    const partes = [el('h3', {}, 'Resumen de la ronda')];
    if (pendientes) partes.push(el('p', { class: 'nota' }, 'calculando…'));
    partes.push(el('p', {}, `${partida.nombres[actual.r]} (gusano) perdió ${puntos(gusano)}.`));
    partes.push(el('p', {}, `${partida.nombres[1 - actual.r]} (pájaro) regaló ${puntos(pajaro)}.`));
    if (incompleto) partes.push(el('p', { class: 'nota' }, 'Alguna jugada no se pudo calcular con exactitud y no cuenta.'));
    resumen.replaceChildren(...partes);
  }

  nuevaVista();
  pintar();
  planificar();
}

export default { id, titulo, montar };
