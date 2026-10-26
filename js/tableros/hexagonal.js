// Tablero de hexágonos de vértice arriba, en forma de hexágono grande (ESPECIFICACION.md §2.2, §10.2).
// Coordenadas axiales (q, r) con |q|, |r|, |q + r| ≤ radio; centros a distancia 1.

import { crearTablero, resolverParametros } from './tipos.js';
import { acumuladorDeConexiones } from './rejillas.js';

const RAIZ3 = Math.sqrt(3);
const CIRCUNRADIO = 1 / RAIZ3;
const MARGEN = 0.6;
// Las seis direcciones; las tres primeras, a 120° entre sí, son las de las «corrientes».
const DIRECCIONES = [[1, 0], [-1, 1], [0, -1], [-1, 0], [1, -1], [0, 1]];
const CORRIENTES = 3;

export const hexagonal = {
  id: 'hexagonal',
  nombre: 'Hexagonal',
  descripcion: 'Casillas hexagonales; cada una se conecta con las seis que la rodean.',
  parametros: [
    { id: 'radio', nombre: 'Radio', tipo: 'entero', min: 1, max: 5, defecto: 3 },
    {
      id: 'bordes', nombre: 'Bordes', tipo: 'opcion', defecto: 'normales',
      opciones: [{ valor: 'normales', nombre: 'Normales' }, { valor: 'toro', nombre: 'Toro' }],
    },
    {
      id: 'flechas', nombre: 'Flechas', tipo: 'opcion', defecto: 'ninguna',
      opciones: [
        { valor: 'ninguna', nombre: 'Sin flechas' },
        { valor: 'corrientes', nombre: 'Tres corrientes' },
      ],
    },
  ],
  crear(parametros) {
    const p = resolverParametros(hexagonal.parametros, parametros);
    const { radio, bordes, flechas } = p;
    const toro = bordes === 'toro';

    const coordenadas = [];
    const indice = new Map();
    for (let r = -radio; r <= radio; r++) {
      for (let q = Math.max(-radio, -radio - r); q <= Math.min(radio, radio - r); q++) {
        indice.set(`${q},${r}`, coordenadas.length);
        coordenadas.push([q, r]);
      }
    }

    // Toro: lados opuestos pegados. Una posición que cae fuera se trae dentro sumándole
    // una combinación entera de las traslaciones (2r+1, −r) y (r, r+1).
    const reducir = (q, r) => {
      for (let m = -3; m <= 3; m++) {
        for (let n = -3; n <= 3; n++) {
          const j = indice.get(`${q + m * (2 * radio + 1) + n * radio},${r - m * radio + n * (radio + 1)}`);
          if (j !== undefined) return j;
        }
      }
      throw new Error(`toro hexagonal: no se pudo reducir (${q}, ${r})`);
    };

    // En el toro la caja deja sitio para el anillo de casillas fantasma.
    const caja = toro ? radio + 1 : radio;
    // La caja empieza en 0: el centro de más a la izquierda queda en x = MARGEN,
    // el de más arriba en y = MARGEN.
    const desdeX = MARGEN + caja;
    const desdeY = MARGEN + caja * RAIZ3 / 2;
    const forma = (q, r) => {
      const x = q + r / 2 + desdeX;
      const y = r * RAIZ3 / 2 + desdeY;
      const vertices = [];
      for (let k = 0; k < 6; k++) {
        const angulo = (-90 + 60 * k) * Math.PI / 180;
        vertices.push([x + CIRCUNRADIO * Math.cos(angulo), y + CIRCUNRADIO * Math.sin(angulo)]);
      }
      return { x, y, vertices };
    };
    const casillas = coordenadas.map(([q, r]) => forma(q, r));

    const conexiones = acumuladorDeConexiones();
    const conCorrientes = flechas === 'corrientes';
    coordenadas.forEach(([q, r], i) => {
      DIRECCIONES.forEach(([dq, dr], k) => {
        // Con corrientes, las otras tres direcciones son las inversas de estas.
        if (conCorrientes && k >= CORRIENTES) return;
        const j = toro ? reducir(q + dq, r + dr) : indice.get(`${q + dq},${r + dr}`);
        if (j === undefined || j === i) return;
        conexiones.anota(i, j, !conCorrientes);
      });
    });

    const dibujo = {
      ancho: 2 * caja + 2 * MARGEN,
      alto: caja * RAIZ3 + 2 * MARGEN,
      aristas: false,
      radio: 0.4,
    };
    if (toro) {
      // Anillo de casillas a distancia radio + 1, cada una copia de la casilla real de enfrente.
      dibujo.fantasmas = [];
      const anillo = radio + 1;
      for (let r = -anillo; r <= anillo; r++) {
        for (let q = Math.max(-anillo, -anillo - r); q <= Math.min(anillo, anillo - r); q++) {
          if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) !== anillo) continue;
          dibujo.fantasmas.push({ casilla: reducir(q, r), ...forma(q, r) });
        }
      }
    }

    let id = `hexagonal-${radio}`;
    let nombre = `Hexagonal, radio ${radio}`;
    const notas = [];
    if (toro) {
      id += '-toro';
      nombre += ', toro';
      notas.push('Los lados opuestos del hexágono están pegados.');
    }
    if (conCorrientes) {
      id += '-corrientes';
      nombre += ', tres corrientes';
      notas.push('Las flechas marcan el sentido único de cada conexión.');
    }
    return crearTablero({
      id,
      nombre,
      descripcion: notas.length ? notas.join(' ') : undefined,
      generador: { id: hexagonal.id, parametros: p },
      casillas,
      aristas: conexiones.aristas(),
      arcos: conexiones.arcos(),
      dibujo,
    });
  },
};
