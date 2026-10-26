/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Vista del tablero y del gusano en SVG (ESPECIFICACION.md §5 y §10.5). Único módulo que dibuja.

const NS = 'http://www.w3.org/2000/svg';

function el(nombre, atributos = {}, clase) {
  const nodo = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(atributos)) nodo.setAttribute(k, v);
  if (clase) nodo.setAttribute('class', clase);
  return nodo;
}

const puntos = (vertices) => vertices.map(([x, y]) => `${x},${y}`).join(' ');
const redondea = (n) => Math.round(n * 1000) / 1000;
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

let contadorVistas = 0;

export function crearVista(contenedor, tablero, { alClicar = () => {} } = {}) {
  const { ancho, alto, aristas = false, radio = 0.35, fantasmas = [] } = tablero.dibujo;
  const idPunta = `punta-${++contadorVistas}`;
  const svg = el('svg', {
    viewBox: `0 0 ${ancho} ${alto}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': tablero.nombre ?? 'Tablero',
  }, 'vista-tablero');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.aspectRatio = `${ancho} / ${alto}`;

  const capaAristas = el('g', {}, 'capa-aristas');
  const capaCasillas = el('g', {}, 'capa-casillas');
  const capaArcos = el('g', { 'pointer-events': 'none' }, 'capa-arcos');
  const capaCuerpo = el('g', { 'pointer-events': 'none' }, 'capa-cuerpo');
  const capaCabeza = el('g', { 'pointer-events': 'none' }, 'capa-cabeza');
  const capaTextos = el('g', { 'pointer-events': 'none' }, 'capa-textos');
  svg.append(capaAristas, capaCasillas, capaArcos, capaCuerpo, capaCabeza, capaTextos);

  if (tablero.dirigido) {
    const defs = el('defs');
    const marcador = el('marker', {
      id: idPunta, viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 0.3, markerHeight: 0.3, markerUnits: 'userSpaceOnUse', orient: 'auto',
    });
    marcador.append(el('path', { d: 'M0,0 L10,5 L0,10 z' }, 'punta'));
    defs.append(marcador);
    svg.prepend(defs);
  }

  // Copias de cada casilla en la franja de fantasmas (bordes pegados, §10.2).
  const copiasFantasma = new Map();
  for (const f of fantasmas) {
    if (!copiasFantasma.has(f.casilla)) copiasFantasma.set(f.casilla, []);
    copiasFantasma.get(f.casilla).push({ x: f.x, y: f.y, fantasma: true });
  }

  // La copia de la casilla `j` (la real o un fantasma) más cercana al punto `desde`.
  const masCercana = (desde, j) => {
    let mejor = { ...tablero.casillas[j], fantasma: false };
    let d = distancia(desde, mejor);
    for (const copia of copiasFantasma.get(j) ?? []) {
      const dc = distancia(desde, copia);
      if (dc < d) { mejor = copia; d = dc; }
    }
    return mejor;
  };

  // Sin fantasmas, un tablero pegado (las superficies de la tanda 1) corta los tramos que
  // saltan de un borde al opuesto: se reconocen por ser mucho más largos que el resto.
  const pegado = fantasmas.length === 0 && (tablero.generador?.id === 'superficie'
    || (tablero.generador?.parametros?.bordes ?? 'normales') !== 'normales');
  let umbral = Infinity;
  if (pegado) {
    let corta = Infinity;
    tablero.vecinos.forEach((lista, i) => {
      for (const j of lista) corta = Math.min(corta, distancia(tablero.casillas[i], tablero.casillas[j]));
    });
    umbral = corta * 1.5;
  }

  // Trozos de recta que dibujan la conexión i → j: uno, o dos si cruza un borde pegado (de
  // i al fantasma de j y del fantasma de i a j: nunca cruza el tablero), o ninguno si se corta.
  const segmentos = (i, j) => {
    const a = tablero.casillas[i];
    const b = tablero.casillas[j];
    if (pegado) return distancia(a, b) > umbral ? [] : [[a, b]];
    if (fantasmas.length === 0) return [[a, b]];
    const bVista = masCercana(a, j);
    if (!bVista.fantasma) return [[a, b]];
    const aVista = masCercana(b, i);
    return aVista.fantasma ? [[a, bVista], [aVista, b]] : [[a, bVista]];
  };

  if (aristas) {
    tablero.vecinos.forEach((lista, i) => {
      for (const j of lista) {
        if (j < i || !tablero.vecinos[j].includes(i)) continue; // las de un solo sentido son arcos
        for (const [a, b] of segmentos(i, j)) {
          capaAristas.append(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'pointer-events': 'none' }, 'arista'));
        }
      }
    });
  }

  if (tablero.dirigido) {
    tablero.vecinos.forEach((lista, i) => {
      for (const j of lista) {
        if (tablero.vecinos[j].includes(i)) continue;
        for (const [a, b] of segmentos(i, j)) {
          const largo = distancia(a, b) || 1;
          const ux = (b.x - a.x) / largo;
          const uy = (b.y - a.y) / largo;
          const ini = Math.min(0.22, largo * 0.2);
          const fin = Math.min(0.4, largo * 0.3);
          capaArcos.append(el('line', {
            x1: redondea(a.x + ux * ini), y1: redondea(a.y + uy * ini),
            x2: redondea(b.x - ux * fin), y2: redondea(b.y - uy * fin),
            'marker-end': `url(#${idPunta})`,
          }, 'arco'));
        }
      }
    });
  }

  const dibujaForma = (c, indiceDato, valor) => {
    const forma = c.vertices
      ? el('polygon', { points: puntos(c.vertices) })
      : el('circle', { cx: c.x, cy: c.y, r: radio });
    forma.dataset[indiceDato] = String(valor);
    forma.setAttribute('class', indiceDato === 'fantasma' ? 'casilla fantasma' : 'casilla');
    capaCasillas.append(forma);
    return forma;
  };

  // Los fantasmas van debajo de las casillas reales y no llevan `data-indice` (no son casillas).
  const formasFantasma = fantasmas.map((f) => dibujaForma(f, 'fantasma', f.casilla));
  const formas = tablero.casillas.map((c, i) => dibujaForma(c, 'indice', i));

  // Delegación: un solo oyente para todas las casillas y fantasmas.
  const alPulsar = (evento) => {
    const forma = evento.target.closest?.('[data-indice], [data-fantasma]');
    if (!forma || !svg.contains(forma)) return;
    alClicar(Number(forma.dataset.indice ?? forma.dataset.fantasma));
  };
  svg.addEventListener('click', alPulsar);

  // Tamaño de letra: 0,4 unidades del tablero, o menos si las casillas son círculos pequeños.
  const hayVertices = tablero.casillas.some((c) => c.vertices);
  const tamanoTexto = hayVertices ? 0.4 : Math.min(0.4, radio * 1.1);
  const tamanoEtiqueta = tamanoTexto * 0.55;

  const texto = (x, y, contenido, tamano, clase) => {
    const t = el('text', { x: redondea(x), y: redondea(y), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, clase);
    t.style.fontSize = `${tamano}px`;
    t.textContent = contenido;
    return t;
  };

  // Un trazo por gusano: sus tramos seguidos, sin cruzar el tablero por un borde pegado.
  function trazos(cuerpo) {
    const salida = [];
    for (let k = 1; k < cuerpo.length; k++) {
      for (const [a, b] of segmentos(cuerpo[k - 1], cuerpo[k])) {
        const actual = salida[salida.length - 1];
        const ultimo = actual?.[actual.length - 1];
        if (ultimo && ultimo.x === a.x && ultimo.y === a.y) actual.push(b);
        else salida.push([a, b]);
      }
    }
    return salida.map((tramo) => tramo.map((p) => `${p.x},${p.y}`).join(' '));
  }

  // Cabeza (o cola, con dos cabezas) con dos ojos que miran hacia donde está el cuerpo.
  function dibujaExtremo(casilla, vecina, gusano, esCola) {
    const base = tablero.casillas[casilla];
    const rCabeza = hayVertices ? 0.3 : Math.min(0.3, radio * 0.9);
    const sufijo = esCola ? ' cola' : '';
    capaCabeza.append(el('circle', { cx: base.x, cy: base.y, r: rCabeza }, `gusano-cabeza gusano-${gusano}${sufijo}`));
    let dx = 0;
    let dy = -1;
    if (vecina !== null) {
      const previa = masCercana(base, vecina);
      const largo = distancia(previa, base) || 1;
      dx = (previa.x - base.x) / largo;
      dy = (previa.y - base.y) / largo;
    }
    const k = rCabeza;
    for (const lado of [-1, 1]) {
      const ox = base.x + dx * k * 0.3 + -dy * lado * k * 0.42;
      const oy = base.y + dy * k * 0.3 + dx * lado * k * 0.42;
      capaCabeza.append(el('circle', { cx: redondea(ox), cy: redondea(oy), r: redondea(k * 0.3) }, `ojo${sufijo}`));
      capaCabeza.append(el('circle', { cx: redondea(ox + dx * k * 0.1), cy: redondea(oy + dy * k * 0.1), r: redondea(k * 0.14) }, `pupila${sufijo}`));
    }
  }

  function actualizar({ ronda, legales = [], decoraciones = new Map(), mostrarValores = false, elegirExtremo = [] } = {}) {
    const camino = ronda?.camino ?? [];
    // Una ronda de la tanda 1 no trae `cuerpos`: el camino entero es un solo gusano.
    const cuerpos = ronda?.cuerpos ?? [camino];
    const dosCabezas = ronda?.modo?.cabezas === 2;
    const legal = new Set(legales);
    const extremos = new Set(elegirExtremo);
    const cabezas = new Set(cuerpos.filter((c) => c.length > 0).map((c) => c[c.length - 1]));
    const colas = new Set(dosCabezas ? cuerpos.filter((c) => c.length > 1).map((c) => c[0]) : []);

    // Papel de color de cada casilla ocupada: con dos gusanos, el gusano que la tiene; si no,
    // quien la rellenó (la paridad de su posición en el camino, como siempre).
    const color = new Map();
    if (cuerpos.length === 2) cuerpos.forEach((cuerpo, g) => cuerpo.forEach((c) => color.set(c, g)));
    else camino.forEach((c, k) => color.set(c, k % 2));

    const clasesDe = (i) => {
      const clases = [];
      if (tablero.casillas[i].bloqueada) clases.push('bloqueada');
      if (color.has(i)) clases.push(color.get(i) === 0 ? 'gusano' : 'pajaro');
      if (cabezas.has(i)) clases.push('cabeza');
      if (colas.has(i)) clases.push('cola');
      if (legal.has(i)) clases.push('legal');
      if (extremos.has(i)) clases.push('elegir-extremo');
      const extra = decoraciones.get(i)?.clase;
      if (extra) clases.push(extra);
      return clases;
    };

    formas.forEach((forma, i) => forma.setAttribute('class', ['casilla', ...clasesDe(i)].join(' ')));
    formasFantasma.forEach((forma, k) => {
      forma.setAttribute('class', ['casilla', 'fantasma', ...clasesDe(fantasmas[k].casilla)].join(' '));
    });

    capaCuerpo.replaceChildren();
    capaCabeza.replaceChildren();
    capaTextos.replaceChildren();

    cuerpos.forEach((cuerpo, g) => {
      for (const tramo of trazos(cuerpo)) {
        capaCuerpo.append(el('polyline', {
          points: tramo,
          fill: 'none',
          'stroke-width': 0.45,
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
        }, `gusano-cuerpo gusano-${g}`));
      }
    });
    cuerpos.forEach((cuerpo, g) => {
      if (cuerpo.length === 0) return;
      dibujaExtremo(cuerpo[cuerpo.length - 1], cuerpo.length > 1 ? cuerpo[cuerpo.length - 2] : null, g, false);
      if (dosCabezas && cuerpo.length > 1) dibujaExtremo(cuerpo[0], cuerpo[1], g, true);
    });

    const conValores = mostrarValores && tablero.casillas.some((c) => (c.valor ?? 1) !== 1);
    tablero.casillas.forEach((c, i) => {
      if (c.etiqueta) {
        capaTextos.append(texto(c.x - 0.3, c.y - 0.3, c.etiqueta, tamanoEtiqueta, 'etiqueta'));
      }
      const deco = decoraciones.get(i)?.texto;
      const hayDeco = deco !== undefined && deco !== null && deco !== '';
      if (hayDeco) capaTextos.append(texto(c.x, c.y, String(deco), tamanoTexto, 'texto-deco'));
      if (conValores && !c.bloqueada) {
        const valor = String(c.valor ?? 1);
        if (hayDeco) capaTextos.append(texto(c.x + 0.28, c.y + 0.3, valor, tamanoEtiqueta, 'valor valor-esquina'));
        else capaTextos.append(texto(c.x, c.y, valor, tamanoTexto, 'valor'));
      }
    });
  }

  function destruir() {
    svg.removeEventListener('click', alPulsar);
    contenedor.replaceChildren();
  }

  contenedor.replaceChildren(svg);
  actualizar({ ronda: undefined });
  return { actualizar, destruir };
}
