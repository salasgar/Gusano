// Tablero de hexágonos de vértice arriba, en forma de hexágono grande (ESPECIFICACION.md §2.2).
// Coordenadas axiales (q, r) con |q|, |r|, |q + r| ≤ radio; centros a distancia 1.

import { crearTablero, resolverParametros } from './tipos.js';

const RAIZ3 = Math.sqrt(3);
const CIRCUNRADIO = 1 / RAIZ3;
const MARGEN = 0.6;
const DIRECCIONES = [[1, 0], [0, 1], [-1, 1]]; // las otras tres salen por simetría de la arista

export const hexagonal = {
  id: 'hexagonal',
  nombre: 'Hexagonal',
  descripcion: 'Casillas hexagonales; cada una se conecta con las seis que la rodean.',
  parametros: [{ id: 'radio', nombre: 'Radio', tipo: 'entero', min: 1, max: 5, defecto: 3 }],
  crear(parametros) {
    const p = resolverParametros(hexagonal.parametros, parametros);
    const radio = p.radio;

    const coordenadas = [];
    const indice = new Map();
    for (let r = -radio; r <= radio; r++) {
      for (let q = Math.max(-radio, -radio - r); q <= Math.min(radio, radio - r); q++) {
        indice.set(`${q},${r}`, coordenadas.length);
        coordenadas.push([q, r]);
      }
    }

    // La caja empieza en 0: el centro de más a la izquierda queda en x = MARGEN,
    // el de más arriba en y = MARGEN.
    const desdeX = MARGEN + radio;
    const desdeY = MARGEN + radio * RAIZ3 / 2;
    const casillas = coordenadas.map(([q, r]) => {
      const x = q + r / 2 + desdeX;
      const y = r * RAIZ3 / 2 + desdeY;
      const vertices = [];
      for (let k = 0; k < 6; k++) {
        const angulo = (-90 + 60 * k) * Math.PI / 180;
        vertices.push([x + CIRCUNRADIO * Math.cos(angulo), y + CIRCUNRADIO * Math.sin(angulo)]);
      }
      return { x, y, vertices };
    });

    const aristas = [];
    coordenadas.forEach(([q, r], i) => {
      for (const [dq, dr] of DIRECCIONES) {
        const j = indice.get(`${q + dq},${r + dr}`);
        if (j !== undefined) aristas.push([i, j]);
      }
    });

    return crearTablero({
      id: `hexagonal-${radio}`,
      nombre: `Hexagonal, radio ${radio}`,
      generador: { id: hexagonal.id, parametros: p },
      casillas,
      aristas,
      dibujo: {
        ancho: 2 * radio + 2 * MARGEN,
        alto: radio * RAIZ3 + 2 * MARGEN,
        aristas: false,
        radio: 0.4,
      },
    });
  },
};
