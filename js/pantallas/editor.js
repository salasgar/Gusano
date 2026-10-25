/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Pantalla «Editor» (ESPECIFICACION.md §7.3): dibujar un tablero, pedir uno al azar,
// exportarlo, importarlo y jugar en él. Las funciones puras no tocan `document`.

import { crearTablero, validarTablero } from '../tableros/tipos.js';
import { generadores, generador } from '../tableros/index.js';
import { crearAzar } from '../util/azar.js';

export const id = 'editor';
export const titulo = 'Editor';

const LADO_LIENZO = 10;
const RADIO = 0.35;
const MIN_CASILLAS_JUGABLE = 4;
const INTENTOS_CONEXO = 500;

const redondea = (v) => Math.round(v * 100) / 100;

// ---------- funciones puras ----------

// ¿Es conexo el grafo del estado? (el grafo vacío no lo es)
export function esConexo(estado) {
  const n = estado.casillas.length;
  if (n === 0) return false;
  const vecinos = Array.from({ length: n }, () => []);
  for (const [i, j] of estado.aristas) {
    vecinos[i].push(j);
    vecinos[j].push(i);
  }
  const visto = new Set([0]);
  const pila = [0];
  while (pila.length) {
    for (const w of vecinos[pila.pop()]) {
      if (!visto.has(w)) { visto.add(w); pila.push(w); }
    }
  }
  return visto.size === n;
}

// Une las componentes de un grafo no conexo con una arista cada una (último recurso).
function conectar(n, aristas, azar) {
  const padre = Array.from({ length: n }, (_, i) => i);
  const raiz = (i) => { while (padre[i] !== i) i = padre[i] = padre[padre[i]]; return i; };
  for (const [i, j] of aristas) padre[raiz(i)] = raiz(j);
  for (let i = 1; i < n; i++) {
    if (raiz(i) === raiz(0)) continue;
    const dentro = [];
    for (let k = 0; k < n; k++) if (raiz(k) === raiz(0)) dentro.push(k);
    const j = azar.elegir(dentro);
    aristas.push([j, i]);
    padre[raiz(i)] = raiz(0);
  }
}

// Posiciones al azar en un cuadrado de lado 10 con separación mínima 1 entre centros.
function posicionesAlAzar(n, azar) {
  const casillas = [];
  for (let k = 0; k < n; k++) {
    let punto;
    for (let intento = 0; intento < 200; intento++) {
      punto = {
        x: redondea(0.5 + azar.siguiente() * (LADO_LIENZO - 1)),
        y: redondea(0.5 + azar.siguiente() * (LADO_LIENZO - 1)),
      };
      if (casillas.every((c) => Math.hypot(c.x - punto.x, c.y - punto.y) >= 1)) break;
    }
    casillas.push(punto);
  }
  return casillas;
}

// Tablero conexo de n casillas; cada arista aparece con la probabilidad dada. Se repite el
// sorteo hasta que sea conexo; si tras muchos intentos no lo es (probabilidades muy bajas),
// se unen sus componentes con aristas al azar para que la función termine siempre.
export function grafoAleatorio(n, probabilidad, azar) {
  const casillas = posicionesAlAzar(n, azar);
  let aristas = [];
  for (let intento = 0; intento < INTENTOS_CONEXO; intento++) {
    aristas = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (azar.siguiente() < probabilidad) aristas.push([i, j]);
      }
    }
    if (esConexo({ casillas, aristas })) break;
  }
  if (!esConexo({ casillas, aristas })) conectar(n, aristas, azar);
  return crearTablero({
    id: `aleatorio-${n}-${azar.semilla}`,
    nombre: `Grafo aleatorio de ${n} casillas`,
    descripcion: `Semilla ${azar.semilla}, probabilidad de arista ${probabilidad}.`,
    casillas,
    aristas,
    dibujo: { ancho: LADO_LIENZO, alto: LADO_LIENZO, aristas: true, radio: RADIO },
  });
}

// estado = { casillas: [{ x, y }], aristas: [[i, j]] }. La caja es la envolvente con margen 1.
export function tableroDesdeEditor(estado) {
  const xs = estado.casillas.map((c) => c.x);
  const ys = estado.casillas.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return crearTablero({
    id: `editor-${Date.now()}`,
    nombre: 'Tablero del editor',
    casillas: estado.casillas.map((c) => ({ x: redondea(c.x - minX + 1), y: redondea(c.y - minY + 1) })),
    aristas: estado.aristas,
    dibujo: {
      ancho: redondea(Math.max(...xs) - minX + 2),
      alto: redondea(Math.max(...ys) - minY + 2),
      aristas: true,
      radio: RADIO,
    },
  });
}

// Inversa de la anterior: ignora `vertices` y todo lo que no sea posición y vecindad.
export function estadoDesdeTablero(tablero) {
  const aristas = [];
  tablero.vecinos.forEach((lista, i) => {
    for (const j of lista) if (i < j) aristas.push([i, j]);
  });
  return { casillas: tablero.casillas.map((c) => ({ x: c.x, y: c.y })), aristas };
}

// ---------- DOM ----------

function el(nombre, atributos = {}, ...hijos) {
  const nodo = document.createElement(nombre);
  for (const [k, v] of Object.entries(atributos)) {
    if (k === 'class') nodo.className = v;
    else nodo[k] = v;
  }
  nodo.append(...hijos);
  return nodo;
}

function elSvg(nombre, atributos = {}) {
  const nodo = document.createElementNS('http://www.w3.org/2000/svg', nombre);
  for (const [k, v] of Object.entries(atributos)) nodo.setAttribute(k, v);
  return nodo;
}

function boton(texto, alPulsar, clase = '') {
  const b = el('button', { type: 'button', class: clase }, texto);
  b.addEventListener('click', alPulsar);
  return b;
}

function campo(etiqueta, entrada) {
  return el('label', { class: 'campo' }, el('span', {}, etiqueta), entrada);
}

export function montar(contenedor, contexto) {
  const { irA } = contexto;

  let estado = { casillas: [], aristas: [] };
  let lado = LADO_LIENZO;
  let seleccionada = null;
  let mensaje = '';
  let errores = [];
  // Tras una importación fallida el aviso habla solo del archivo, hasta que el lienzo cambie.
  let soloArchivo = false;
  let arrastre = null;

  const svg = elSvg('svg', { class: 'lienzo', role: 'img', 'aria-label': 'Lienzo del editor', tabindex: '0' });
  const contador = el('p', { class: 'contador' });
  const aviso = el('p', { class: 'aviso', role: 'status' });
  const listaErrores = el('ul', { class: 'errores' });

  const campoN = el('input', { type: 'number', min: 5, max: 40, step: 1, value: 12, inputMode: 'numeric' });
  const campoP = el('input', { type: 'number', min: 0.1, max: 0.6, step: 0.05, value: 0.3 });
  const campoSemilla = el('input', { type: 'number', step: 1, value: Date.now() % 1000000, inputMode: 'numeric' });
  const campoRejilla = el('select');
  for (const g of generadores) campoRejilla.append(new Option(g.nombre, g.id));
  const entradaArchivo = el('input', { type: 'file', accept: '.json,application/json', hidden: true });

  const botonBorrar = boton('Borrar', borrar);
  const botonExportar = boton('Exportar', exportar);
  const botonJugar = boton('Jugar con este tablero', jugar, 'principal');

  const panel = el(
    'div', { class: 'panel-editor' },
    el('p', { class: 'ayuda' }, 'Pulsa en un hueco para crear una casilla; pulsa dos casillas seguidas para conectarlas o desconectarlas; arrastra para moverlas. La selección se encadena: tras conectar dos casillas queda seleccionada la segunda, y una casilla nueva queda seleccionada; para empezar de cero, pulsa otra vez la seleccionada y se deselecciona.'),
    contador, aviso,
    el('div', { class: 'botones' }, botonBorrar, botonExportar,
      boton('Importar', () => entradaArchivo.click()), entradaArchivo),
    el('fieldset', {}, el('legend', {}, 'Grafo aleatorio'),
      campo('Casillas (5-40)', campoN), campo('Probabilidad (0,1-0,6)', campoP), campo('Semilla', campoSemilla),
      boton('Grafo aleatorio', aleatorio)),
    el('fieldset', {}, el('legend', {}, 'Rejilla como punto de partida'),
      campo('Tablero', campoRejilla), boton('Cargar rejilla', cargarRejilla)),
    botonJugar,
    listaErrores,
  );
  contenedor.replaceChildren(el('div', { class: 'editor' }, el('div', { class: 'zona-lienzo' }, svg), panel));

  const jugable = () => estado.casillas.length >= MIN_CASILLAS_JUGABLE && esConexo(estado);

  function pinta() {
    svg.setAttribute('viewBox', `0 0 ${lado} ${lado}`);
    const aristas = estado.aristas.map(([i, j]) => elSvg('line', {
      class: 'arista',
      x1: estado.casillas[i].x, y1: estado.casillas[i].y,
      x2: estado.casillas[j].x, y2: estado.casillas[j].y,
    }));
    const nodos = estado.casillas.map((c, i) => elSvg('circle', {
      class: `nodo${i === seleccionada ? ' seleccionado' : ''}`,
      cx: c.x, cy: c.y, r: RADIO + 0.05, 'data-i': i,
    }));
    svg.replaceChildren(...aristas, ...nodos);

    const n = estado.casillas.length;
    contador.textContent = `${n} ${n === 1 ? 'casilla' : 'casillas'} y ${estado.aristas.length} ${estado.aristas.length === 1 ? 'arista' : 'aristas'}.`;
    const problemas = [];
    if (n >= 1 && !esConexo(estado)) problemas.push('No conexo: hay casillas sin camino entre sí.');
    if (n < MIN_CASILLAS_JUGABLE) problemas.push(`Hacen falta al menos ${MIN_CASILLAS_JUGABLE} casillas para jugar.`);
    aviso.textContent = [mensaje, ...(soloArchivo ? [] : problemas)].filter(Boolean).join(' ');
    botonBorrar.disabled = seleccionada === null;
    botonExportar.disabled = n < 2;
    botonJugar.disabled = !jugable();
    listaErrores.replaceChildren(...errores.map((e) => el('li', {}, e)));
  }

  function cambia(mensajeNuevo = '') {
    mensaje = mensajeNuevo;
    errores = [];
    soloArchivo = false;
    pinta();
  }

  // ---------- edición ----------

  function puntoDe(evento) {
    const p = svg.createSVGPoint();
    p.x = evento.clientX;
    p.y = evento.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    const acota = (v) => Math.min(lado - RADIO, Math.max(RADIO, v));
    return { x: redondea(acota(q.x)), y: redondea(acota(q.y)) };
  }

  function alternaArista(a, b) {
    const [i, j] = a < b ? [a, b] : [b, a];
    const k = estado.aristas.findIndex(([p, q]) => p === i && q === j);
    if (k >= 0) estado.aristas.splice(k, 1);
    else estado.aristas.push([i, j]);
  }

  function borrar() {
    if (seleccionada === null) return;
    const s = seleccionada;
    estado.casillas.splice(s, 1);
    estado.aristas = estado.aristas
      .filter(([i, j]) => i !== s && j !== s)
      .map(([i, j]) => [i > s ? i - 1 : i, j > s ? j - 1 : j]);
    seleccionada = null;
    cambia();
  }

  svg.addEventListener('pointerdown', (e) => {
    svg.focus({ preventScroll: true });
    try { svg.setPointerCapture(e.pointerId); } catch { /* puntero sintético o ya soltado */ }
    const nodo = e.target.closest?.('[data-i]');
    if (nodo) {
      arrastre = { i: Number(nodo.dataset.i), movida: false, inicio: puntoDe(e) };
    } else {
      estado.casillas.push(puntoDe(e));
      seleccionada = estado.casillas.length - 1;
      arrastre = null;
      cambia();
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const p = puntoDe(e);
    if (!arrastre.movida && Math.hypot(p.x - arrastre.inicio.x, p.y - arrastre.inicio.y) < 0.2) return;
    arrastre.movida = true;
    estado.casillas[arrastre.i] = p;
    seleccionada = arrastre.i;
    pinta();
  });

  svg.addEventListener('pointerup', () => {
    if (!arrastre) return;
    const { i, movida } = arrastre;
    arrastre = null;
    if (movida) { cambia(); return; }
    if (seleccionada === null || seleccionada === i) {
      seleccionada = seleccionada === i ? null : i;
    } else {
      alternaArista(seleccionada, i);
      seleccionada = i;
    }
    cambia();
  });

  svg.addEventListener('pointercancel', () => { arrastre = null; });

  svg.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); borrar(); }
  });

  // ---------- grafo aleatorio, rejilla, exportar, importar, jugar ----------

  function aleatorio() {
    const n = Math.min(40, Math.max(5, Math.round(Number(campoN.value)) || 12));
    const p = Math.min(0.6, Math.max(0.1, Number(campoP.value) || 0.3));
    const semilla = Math.round(Number(campoSemilla.value)) || Date.now() % 1000000;
    campoN.value = n;
    campoP.value = p;
    const tablero = grafoAleatorio(n, p, crearAzar(semilla));
    estado = estadoDesdeTablero(tablero);
    lado = LADO_LIENZO;
    seleccionada = null;
    campoSemilla.value = (semilla + 1) % 1000000;
    cambia(`Grafo aleatorio con semilla ${semilla}.`);
  }

  function cargarRejilla() {
    const tablero = generador(campoRejilla.value).crear({});
    estado = estadoDesdeTablero(tablero);
    lado = Math.max(LADO_LIENZO, Math.ceil(Math.max(tablero.dibujo.ancho, tablero.dibujo.alto)));
    seleccionada = null;
    cambia(`Cargado «${tablero.nombre}» como punto de partida.`);
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(tableroDesdeEditor(estado), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = el('a', { href: url, download: 'tablero.json' });
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  entradaArchivo.addEventListener('change', async () => {
    const archivo = entradaArchivo.files[0];
    entradaArchivo.value = '';
    if (!archivo) return;
    let tablero;
    try {
      tablero = JSON.parse(await archivo.text());
    } catch (error) {
      mensaje = '';
      errores = [`El archivo no es JSON válido: ${error.message}`];
      soloArchivo = true;
      pinta();
      return;
    }
    const veredicto = validarTablero(tablero);
    if (!veredicto.ok) {
      mensaje = 'El tablero importado no es válido:';
      errores = veredicto.errores;
      soloArchivo = true;
      pinta();
      return;
    }
    estado = estadoDesdeTablero(tablero);
    lado = Math.max(LADO_LIENZO, Math.ceil(Math.max(tablero.dibujo.ancho, tablero.dibujo.alto)));
    seleccionada = null;
    cambia(`Importado «${tablero.nombre ?? archivo.name}».`);
  });

  function jugar() {
    if (jugable()) irA('jugar', { tablero: tableroDesdeEditor(estado) });
  }

  pinta();
}

export default { id, titulo, montar, grafoAleatorio, tableroDesdeEditor, estadoDesdeTablero };
