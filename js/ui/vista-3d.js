/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Vista 3D de los tableros poliédricos en SVG (ESPECIFICACION.md §10.5): cada cara es una
// casilla, se gira arrastrando y se juega pulsando una cara. Proyección ortográfica, sin
// dependencias. Ejes de pantalla: x a la derecha, y hacia abajo, z hacia quien mira.

const NS = 'http://www.w3.org/2000/svg';
const UMBRAL_ARRASTRE = 5; // píxeles: menos es una pulsación, más es un giro
const MARGEN = 1.15; // el sólido tiene radio 1; el resto es aire
const CANTO_MINIMO = 0.08; // |z| de la normal por debajo del cual una cara está «de canto»

// --- Álgebra mínima (matrices 3×3 como filas) -------------------------------------------

const IDENTIDAD = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norma = (a) => Math.hypot(a[0], a[1], a[2]);
const unitario = (a) => a.map((v) => v / norma(a));

function multiplica(a, b) {
  return a.map((fila) => [0, 1, 2].map((j) => fila[0] * b[0][j] + fila[1] * b[1][j] + fila[2] * b[2][j]));
}

// Gram-Schmidt por filas: frena la deriva numérica de tantos giros acumulados.
function reortogonaliza(m) {
  const f0 = unitario(m[0]);
  const f2 = unitario(cruz(f0, m[1]));
  return [f0, cruz(f2, f0), f2];
}

// Gira `angulo` radianes alrededor del eje y de pantalla (positivo: lo cercano va a la derecha).
function giroY(angulo) {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
}

// Ídem alrededor del eje x (positivo: lo cercano va hacia abajo).
function giroX(angulo) {
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return [[1, 0, 0], [0, c, s], [0, -s, c]];
}

// --- Geometría pura (la usan la vista y las pruebas) -------------------------------------

// → [x, y, z] del punto 3D tras girarlo: x, y son la posición en pantalla y z la cercanía
// (mayor z, más cerca de quien mira). Vale igual para vectores, como las normales.
export function proyectar(punto, rotacion = IDENTIDAD) {
  return rotacion.map((fila) => fila[0] * punto[0] + fila[1] * punto[1] + fila[2] * punto[2]);
}

// Normal unitaria hacia fuera de una cara cuyos vértices vienen ordenados (regla de la mano derecha).
export function normalDeCara(cara) {
  return unitario(cruz(resta(cara[1], cara[0]), resta(cara[2], cara[0])));
}

export function centroDeCara(cara) {
  const suma = cara.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]);
  return suma.map((v) => v / cara.length);
}

// Índices de las caras que miran a quien mira (la normal girada apunta hacia z positivo).
export function carasVisibles(caras, rotacion) {
  const visibles = [];
  caras.forEach((cara, i) => {
    if (proyectar(normalDeCara(cara), rotacion)[2] > 0) visibles.push(i);
  });
  return visibles;
}

// Una rotación inicial que enseña algunas caras pero no todas y no deja ninguna de canto.
export function rotacionInicial(caras) {
  const normales = caras.map(normalDeCara);
  const bien = (r) => {
    const zs = normales.map((n) => proyectar(n, r)[2]);
    const visibles = zs.filter((z) => z > 0).length;
    return visibles >= 1 && visibles <= caras.length - 1 && zs.every((z) => Math.abs(z) > CANTO_MINIMO);
  };
  for (let k = 0; k < 400; k++) {
    const r = multiplica(giroX(-0.45 + 0.013 * k), giroY(0.6 + 0.017 * k));
    if (bien(r)) return r;
  }
  return IDENTIDAD;
}

// --- Vista -------------------------------------------------------------------------------

function el(nombre, atributos = {}, clase) {
  const nodo = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(atributos)) nodo.setAttribute(k, v);
  if (clase) nodo.setAttribute('class', clase);
  return nodo;
}

const redondea = (n) => Math.round(n * 1000) / 1000;
const puntosSvg = (puntos) => puntos.map(([x, y]) => `${redondea(x)},${redondea(y)}`).join(' ');

export function crearVista3D(contenedor, tablero, { alClicar = () => {} } = {}) {
  const caras = tablero.dibujo3d?.caras;
  if (!Array.isArray(caras) || caras.length !== tablero.casillas.length) {
    throw new Error('crearVista3D necesita tablero.dibujo3d.caras con una cara por casilla');
  }
  const normales = caras.map(normalDeCara);
  const centros = caras.map(centroDeCara);
  const radiosDeCara = caras.map((cara, i) => cara.reduce((s, p) => s + norma(resta(p, centros[i])), 0) / cara.length);
  const radioMinimo = Math.min(...radiosDeCara);
  const anchoGusano = Math.min(0.12, radioMinimo * 0.35);
  const tamanoTexto = Math.min(0.25, radioMinimo * 0.9);

  const lado = 2 * MARGEN;
  const svg = el('svg', {
    viewBox: `${-MARGEN} ${-MARGEN} ${lado} ${lado}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': `${tablero.nombre ?? 'Poliedro'} (se gira arrastrando)`,
  }, 'vista-tablero vista-3d');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.aspectRatio = '1 / 1';
  svg.style.touchAction = 'none';

  const capaCaras = el('g', {}, 'capa-casillas');
  const capaCuerpo = el('g', { 'pointer-events': 'none' }, 'capa-cuerpo');
  const capaCabeza = el('g', { 'pointer-events': 'none' }, 'capa-cabeza');
  const capaTextos = el('g', { 'pointer-events': 'none' }, 'capa-textos');
  svg.append(capaCaras, capaCuerpo, capaCabeza, capaTextos);

  const formas = caras.map((_, i) => {
    const forma = el('polygon', {}, 'casilla');
    forma.dataset.indice = String(i);
    return forma;
  });

  let rotacion = rotacionInicial(caras);
  let estado = {};

  const texto = (x, y, contenido, tamano, clase) => {
    const t = el('text', { x: redondea(x), y: redondea(y), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, clase);
    t.style.fontSize = `${redondea(tamano)}px`;
    t.textContent = contenido;
    return t;
  };

  // Ojos mirando hacia donde viene el cuerpo (en pantalla); `hacia` es la casilla siguiente.
  function dibujaCabeza(casilla, hacia, claseCuerpo) {
    const [x, y] = proyectar(centros[casilla], rotacion);
    const r = anchoGusano * 0.85;
    capaCabeza.append(el('circle', { cx: redondea(x), cy: redondea(y), r: redondea(r) }, `gusano-cabeza ${claseCuerpo}`));
    let dx = 0;
    let dy = -1;
    if (hacia !== undefined) {
      const [hx, hy] = proyectar(centros[hacia], rotacion);
      const largo = Math.hypot(hx - x, hy - y);
      if (largo > 1e-9) {
        dx = (hx - x) / largo;
        dy = (hy - y) / largo;
      }
    }
    for (const lado of [-1, 1]) {
      const ox = x + dx * r * 0.3 + -dy * lado * r * 0.42;
      const oy = y + dy * r * 0.3 + dx * lado * r * 0.42;
      capaCabeza.append(el('circle', { cx: redondea(ox), cy: redondea(oy), r: redondea(r * 0.3) }, 'ojo'));
      capaCabeza.append(el('circle', { cx: redondea(ox + dx * r * 0.1), cy: redondea(oy + dy * r * 0.1), r: redondea(r * 0.14) }, 'pupila'));
    }
  }

  function pinta() {
    const { ronda, legales = [], decoraciones = new Map(), mostrarValores = false, elegirExtremo = [] } = estado;
    const camino = ronda?.camino ?? [];
    const cuerpos = ronda?.cuerpos ?? [camino];
    const dosGusanos = (ronda?.modo?.gusanos ?? 1) === 2 && cuerpos.length === 2;
    const dosCabezas = (ronda?.modo?.cabezas ?? 1) === 2;

    // Quién rellenó cada casilla: el gusano al que pertenece o, con uno solo, la paridad del turno.
    const dueno = new Map();
    if (dosGusanos) cuerpos.forEach((cuerpo, g) => cuerpo.forEach((c) => dueno.set(c, g)));
    else camino.forEach((c, k) => dueno.set(c, k % 2));
    const extremos = new Set();
    for (const cuerpo of cuerpos) {
      if (cuerpo.length === 0) continue;
      extremos.add(cuerpo[cuerpo.length - 1]);
      if (dosCabezas && cuerpo.length > 1) extremos.add(cuerpo[0]);
    }
    const legal = new Set(legales);
    const aElegir = new Set(elegirExtremo);

    const visibles = new Set(carasVisibles(caras, rotacion));
    const profundidad = (i) => proyectar(centros[i], rotacion)[2];
    const ordenadas = [...visibles].sort((a, b) => profundidad(a) - profundidad(b));

    for (const i of ordenadas) {
      const clases = ['casilla'];
      if (tablero.casillas[i].bloqueada) clases.push('bloqueada');
      if (dueno.has(i)) clases.push(dueno.get(i) === 0 ? 'gusano' : 'pajaro');
      if (extremos.has(i)) clases.push('cabeza');
      if (legal.has(i)) clases.push('legal');
      if (aElegir.has(i)) clases.push('elegir-extremo');
      const extra = decoraciones.get(i)?.clase;
      if (extra) clases.push(extra);
      formas[i].setAttribute('class', clases.join(' '));
      formas[i].setAttribute('points', puntosSvg(caras[i].map((p) => proyectar(p, rotacion))));
    }
    capaCaras.replaceChildren(...ordenadas.map((i) => formas[i]));

    capaCuerpo.replaceChildren();
    capaCabeza.replaceChildren();
    capaTextos.replaceChildren();

    // El gusano, solo en los tramos cuyas dos caras se ven.
    cuerpos.forEach((cuerpo, g) => {
      const clase = `gusano-cuerpo gusano-${dosGusanos ? g : 0}`;
      let tramo = [];
      const cierra = () => {
        if (tramo.length > 1) {
          capaCuerpo.append(el('polyline', {
            points: puntosSvg(tramo),
            fill: 'none',
            'stroke-width': redondea(anchoGusano),
            'stroke-linejoin': 'round',
            'stroke-linecap': 'round',
          }, clase));
        }
        tramo = [];
      };
      for (const c of cuerpo) {
        if (visibles.has(c)) tramo.push(proyectar(centros[c], rotacion));
        else cierra();
      }
      cierra();
      const claseCabeza = `gusano-${dosGusanos ? g : 0}`;
      const cabeza = cuerpo[cuerpo.length - 1];
      if (cabeza !== undefined && visibles.has(cabeza)) {
        const previa = cuerpo.length > 1 ? cuerpo[cuerpo.length - 2] : undefined;
        dibujaCabeza(cabeza, previa !== undefined && visibles.has(previa) ? previa : undefined, claseCabeza);
      }
      const cola = cuerpo[0];
      if (dosCabezas && cuerpo.length > 1 && visibles.has(cola)) {
        dibujaCabeza(cola, visibles.has(cuerpo[1]) ? cuerpo[1] : undefined, claseCabeza);
      }
    });

    const conValores = mostrarValores && tablero.casillas.some((c) => (c.valor ?? 1) !== 1);
    for (const i of ordenadas) {
      const c = tablero.casillas[i];
      const [x, y] = proyectar(centros[i], rotacion);
      const tam = tamanoTexto * (0.6 + 0.4 * proyectar(normales[i], rotacion)[2]);
      const deco = decoraciones.get(i)?.texto;
      const hayDeco = deco !== undefined && deco !== null && deco !== '';
      if (hayDeco) capaTextos.append(texto(x, y, String(deco), tam, 'texto-deco'));
      if (conValores && !c.bloqueada) {
        const valor = String(c.valor ?? 1);
        if (hayDeco) capaTextos.append(texto(x + tam * 0.6, y + tam * 0.6, valor, tam * 0.55, 'valor valor-esquina'));
        else capaTextos.append(texto(x, y, valor, tam, 'valor'));
      }
    }
  }

  function actualizar(nuevo = {}) {
    estado = nuevo;
    pinta();
  }

  // --- Punteros: arrastrar gira, pulsar sin arrastrar juega ---
  let arrastre = null; // { id, inicioX, inicioY, ultimoX, ultimoY, girando, indice }

  const alBajar = (evento) => {
    if (arrastre || (evento.pointerType === 'mouse' && evento.button !== 0)) return;
    const forma = evento.target.closest?.('[data-indice]');
    arrastre = {
      id: evento.pointerId,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      ultimoX: evento.clientX,
      ultimoY: evento.clientY,
      girando: false,
      indice: forma && svg.contains(forma) ? Number(forma.dataset.indice) : null,
    };
    svg.setPointerCapture?.(evento.pointerId);
  };

  const alMover = (evento) => {
    if (!arrastre || evento.pointerId !== arrastre.id) return;
    if (!arrastre.girando) {
      if (Math.hypot(evento.clientX - arrastre.inicioX, evento.clientY - arrastre.inicioY) < UMBRAL_ARRASTRE) return;
      arrastre.girando = true;
      svg.classList.add('girando');
    }
    const k = 2.5 / Math.max(svg.clientWidth || 0, 200); // radianes por píxel
    const dx = evento.clientX - arrastre.ultimoX;
    const dy = evento.clientY - arrastre.ultimoY;
    arrastre.ultimoX = evento.clientX;
    arrastre.ultimoY = evento.clientY;
    rotacion = reortogonaliza(multiplica(multiplica(giroX(dy * k), giroY(dx * k)), rotacion));
    pinta();
  };

  const alSoltar = (evento) => {
    if (!arrastre || evento.pointerId !== arrastre.id) return;
    const { girando, indice } = arrastre;
    arrastre = null;
    svg.classList.remove('girando');
    svg.releasePointerCapture?.(evento.pointerId);
    if (!girando && indice !== null) alClicar(indice);
  };

  const alCancelar = (evento) => {
    if (!arrastre || evento.pointerId !== arrastre.id) return;
    arrastre = null;
    svg.classList.remove('girando');
  };

  svg.addEventListener('pointerdown', alBajar);
  svg.addEventListener('pointermove', alMover);
  svg.addEventListener('pointerup', alSoltar);
  svg.addEventListener('pointercancel', alCancelar);

  function destruir() {
    svg.removeEventListener('pointerdown', alBajar);
    svg.removeEventListener('pointermove', alMover);
    svg.removeEventListener('pointerup', alSoltar);
    svg.removeEventListener('pointercancel', alCancelar);
    contenedor.replaceChildren();
  }

  contenedor.replaceChildren(svg);
  actualizar({});
  return { actualizar, destruir };
}
