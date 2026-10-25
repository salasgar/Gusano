/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Vista del tablero y del gusano en SVG (ESPECIFICACION.md §5). Único módulo que dibuja.

const NS = 'http://www.w3.org/2000/svg';

function el(nombre, atributos = {}, clase) {
  const nodo = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(atributos)) nodo.setAttribute(k, v);
  if (clase) nodo.setAttribute('class', clase);
  return nodo;
}

const puntos = (vertices) => vertices.map(([x, y]) => `${x},${y}`).join(' ');
const redondea = (n) => Math.round(n * 1000) / 1000;

export function crearVista(contenedor, tablero, { alClicar = () => {} } = {}) {
  const { ancho, alto, aristas = false, radio = 0.35 } = tablero.dibujo;
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
  const capaCuerpo = el('g', { 'pointer-events': 'none' }, 'capa-cuerpo');
  const capaCabeza = el('g', { 'pointer-events': 'none' }, 'capa-cabeza');
  const capaTextos = el('g', { 'pointer-events': 'none' }, 'capa-textos');
  svg.append(capaAristas, capaCasillas, capaCuerpo, capaCabeza, capaTextos);

  if (aristas) {
    tablero.vecinos.forEach((lista, i) => {
      for (const j of lista) {
        if (j < i) continue;
        const a = tablero.casillas[i];
        const b = tablero.casillas[j];
        capaAristas.append(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'pointer-events': 'none' }, 'arista'));
      }
    });
  }

  const formas = tablero.casillas.map((c, i) => {
    const forma = c.vertices
      ? el('polygon', { points: puntos(c.vertices) })
      : el('circle', { cx: c.x, cy: c.y, r: radio });
    forma.dataset.indice = String(i);
    forma.setAttribute('class', 'casilla');
    capaCasillas.append(forma);
    return forma;
  });

  // Delegación: un solo oyente para todas las casillas.
  const alPulsar = (evento) => {
    const forma = evento.target.closest?.('[data-indice]');
    if (forma && svg.contains(forma)) alClicar(Number(forma.dataset.indice));
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

  // En las superficies pegadas un tramo puede saltar de un borde al opuesto: se corta ahí.
  const esSuperficie = tablero.generador?.id === 'superficie';
  const tramos = (camino) => {
    const salida = [[]];
    camino.forEach((c, k) => {
      const actual = tablero.casillas[c];
      if (k > 0 && esSuperficie) {
        const previa = tablero.casillas[camino[k - 1]];
        if (Math.hypot(actual.x - previa.x, actual.y - previa.y) > 1.5) salida.push([]);
      }
      salida[salida.length - 1].push(`${actual.x},${actual.y}`);
    });
    return salida;
  };

  function dibujaCabeza(camino) {
    const ultima = tablero.casillas[camino[camino.length - 1]];
    const rCabeza = hayVertices ? 0.3 : Math.min(0.3, radio * 0.9);
    capaCabeza.append(el('circle', { cx: ultima.x, cy: ultima.y, r: rCabeza }, 'gusano-cabeza'));
    let dx = 0;
    let dy = -1;
    if (camino.length > 1) {
      const previa = tablero.casillas[camino[camino.length - 2]];
      const largo = Math.hypot(previa.x - ultima.x, previa.y - ultima.y) || 1;
      dx = (previa.x - ultima.x) / largo;
      dy = (previa.y - ultima.y) / largo;
    }
    const k = rCabeza;
    for (const lado of [-1, 1]) {
      const ox = ultima.x + dx * k * 0.3 + -dy * lado * k * 0.42;
      const oy = ultima.y + dy * k * 0.3 + dx * lado * k * 0.42;
      capaCabeza.append(el('circle', { cx: redondea(ox), cy: redondea(oy), r: redondea(k * 0.3) }, 'ojo'));
      capaCabeza.append(el('circle', { cx: redondea(ox + dx * k * 0.1), cy: redondea(oy + dy * k * 0.1), r: redondea(k * 0.14) }, 'pupila'));
    }
  }

  function actualizar({ ronda, legales = [], decoraciones = new Map(), mostrarValores = false } = {}) {
    const camino = ronda?.camino ?? [];
    const posicion = new Map(camino.map((c, k) => [c, k]));
    const legal = new Set(legales);
    const ultima = camino.length > 0 ? camino[camino.length - 1] : null;

    formas.forEach((forma, i) => {
      const clases = ['casilla'];
      if (tablero.casillas[i].bloqueada) clases.push('bloqueada');
      if (posicion.has(i)) clases.push(posicion.get(i) % 2 === 0 ? 'gusano' : 'pajaro');
      if (i === ultima) clases.push('cabeza');
      if (legal.has(i)) clases.push('legal');
      const extra = decoraciones.get(i)?.clase;
      if (extra) clases.push(extra);
      forma.setAttribute('class', clases.join(' '));
    });

    capaCuerpo.replaceChildren();
    capaCabeza.replaceChildren();
    capaTextos.replaceChildren();

    if (camino.length > 1) {
      for (const tramo of tramos(camino)) {
        if (tramo.length < 2) continue;
        capaCuerpo.append(el('polyline', {
          points: tramo.join(' '),
          fill: 'none',
          'stroke-width': 0.45,
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
        }, 'gusano-cuerpo'));
      }
    }
    if (camino.length > 0) dibujaCabeza(camino);

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
