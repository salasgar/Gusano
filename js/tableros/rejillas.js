// Tableros de casillas cuadradas: cuadrados, caballo y superficies (ESPECIFICACION.md §2.2, §10.2).
// Casilla (fila f, columna c) → índice f * lado + c, centro (c + 0.5, f + 0.5) más el
// desplazamiento de la franja de casillas fantasma, si los bordes están pegados.

import { crearTablero, resolverParametros } from './tipos.js';

// Bordes: qué lados están pegados (h: izquierda con derecha, v: arriba con abajo) y si al
// cruzar izquierda-derecha la fila se invierte.
const PEGADO = {
  normales: { h: false, v: false, inv: false },
  cilindro: { h: true, v: false, inv: false },
  toro: { h: true, v: true, inv: false },
  mobius: { h: true, v: false, inv: true },
  klein: { h: true, v: true, inv: true },
};

const SUPERFICIES = {
  cilindro: {
    nombre: 'Cilindro',
    descripcion: 'Los bordes izquierdo y derecho están pegados; arriba y abajo hay borde.',
  },
  toro: {
    nombre: 'Toro',
    descripcion: 'Los bordes izquierdo y derecho están pegados, y también el de arriba con el de abajo.',
  },
  mobius: {
    nombre: 'Banda de Möbius',
    descripcion: 'Los bordes izquierdo y derecho están pegados; al cruzarlos, la fila se invierte. Arriba y abajo hay borde.',
  },
  klein: {
    nombre: 'Botella de Klein',
    descripcion: 'Los bordes izquierdo y derecho están pegados invirtiendo la fila al cruzarlos, y el de arriba con el de abajo sin invertir.',
  },
};

const NOTA_FLECHAS = 'Las flechas marcan el sentido único de cada conexión.';

const parametroLado = (min, max, defecto) => ({
  id: 'lado', nombre: 'Lado', tipo: 'entero', min, max, defecto,
});

// `alto` (filas) tiene el mismo rango que `lado`; si no se pide, vale lo mismo que `lado`.
const parametroAlto = (min, max, defecto) => ({
  id: 'alto', nombre: 'Alto', tipo: 'entero', min, max, defecto,
});

const parametroBordes = {
  id: 'bordes', nombre: 'Bordes', tipo: 'opcion', defecto: 'normales',
  opciones: [
    { valor: 'normales', nombre: 'Normales' },
    ...Object.entries(SUPERFICIES).map(([valor, { nombre }]) => ({ valor, nombre })),
  ],
};

const parametroFlechas = {
  id: 'flechas', nombre: 'Flechas', tipo: 'opcion', defecto: 'ninguna',
  opciones: [
    { valor: 'ninguna', nombre: 'Sin flechas' },
    { valor: 'manhattan', nombre: 'Calles alternas (Manhattan)' },
    { valor: 'corriente', nombre: 'Corriente (solo en el toro)', soloSi: { bordes: ['toro'] } },
  ],
};

// Lanza Error si una opción con `soloSi` se pide sin cumplirse.
export function comprobarSoloSi(definiciones, p) {
  for (const d of definiciones) {
    for (const o of d.opciones ?? []) {
      if (o.valor !== p[d.id] || !o.soloSi) continue;
      for (const [clave, validos] of Object.entries(o.soloSi)) {
        if (!validos.includes(p[clave])) {
          throw new Error(`${d.nombre}: «${o.nombre}» solo con ${clave} ${validos.join(' o ')}`);
        }
      }
    }
  }
}

// Acumula conexiones: de doble sentido (arista) o de un sentido (arco). Si la misma pareja
// se anota con sentidos distintos, se queda de doble sentido.
export function acumuladorDeConexiones() {
  const estado = new Map();
  return {
    anota(i, j, doble = true) {
      const clave = i < j ? `${i}-${j}` : `${j}-${i}`;
      const previo = estado.get(clave);
      if (previo === undefined) estado.set(clave, doble ? 'doble' : [i, j]);
      else if (previo === 'doble' || doble || previo[0] !== i) estado.set(clave, 'doble');
    },
    aristas() {
      return [...estado.entries()].filter(([, v]) => v === 'doble').map(([k]) => k.split('-').map(Number));
    },
    arcos() {
      return [...estado.values()].filter((v) => v !== 'doble');
    },
  };
}

const DESPLAZAMIENTOS = {
  cuadrado4: [[0, 1], [1, 0], [0, -1], [-1, 0]],
  cuadrado8: [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
  caballo: [[1, 2], [2, 1], [-1, 2], [-2, 1], [-1, -2], [-2, -1], [1, -2], [2, -1]],
};

// Casilla de la rejilla a la que corresponde la posición (f, c), que puede caer fuera:
// se pega por los bordes que lo permitan; `null` si no hay nada al otro lado.
function pegar(alto, lado, pegado, f, c) {
  let g = f;
  let d = c;
  if (c < 0 || c >= lado) {
    if (!pegado.h) return null;
    const k = Math.floor(c / lado);
    d = c - k * lado;
    if (pegado.inv && Math.abs(k) % 2 === 1) g = alto - 1 - g;
  }
  if (g < 0 || g >= alto) {
    if (!pegado.v) return null;
    g = ((g % alto) + alto) % alto;
  }
  return [g, d];
}

const cuadradoEn = (f, c) => [[c, f], [c + 1, f], [c + 1, f + 1], [c, f + 1]];

// Sentido de la flecha del paso (df, dc) desde (f, c) hasta la fila `g` del destino:
// true = hacia el destino, false = al revés, null = la conexión se queda de doble sentido.
function sentidoDeFlecha(flechas, f, c, df, g) {
  if (flechas === 'corriente') return true;
  if (df === 0) {
    // Filas alternas; en Möbius y Klein el pegado puede llevar a una fila de otro sentido.
    if (f % 2 !== g % 2) return null;
    return f % 2 === 0;
  }
  return c % 2 === 0; // columnas alternas
}

// Rejilla de `alto` filas por `lado` columnas (§10.2): casillas, aristas, arcos y dibujo.
function construirRejilla({ lado, alto, bordes, vecindad, flechas = 'ninguna' }) {
  const pegado = PEGADO[bordes];
  const ox = pegado.h ? 1 : 0;
  const oy = pegado.v ? 1 : 0;
  const conexiones = acumuladorDeConexiones();
  const conFlechas = flechas !== 'ninguna';

  for (let f = 0; f < alto; f++) {
    for (let c = 0; c < lado; c++) {
      for (const [df, dc] of DESPLAZAMIENTOS[vecindad]) {
        // Con flechas, los pasos hacia la izquierda y hacia arriba son los de la otra casilla.
        if (conFlechas && vecindad !== 'caballo' && df + dc < 0 && df * dc === 0) continue;
        const destino = pegar(alto, lado, pegado, f + df, c + dc);
        if (!destino) continue;
        const [g, d] = destino;
        if (g === f && d === c) continue;
        const i = f * lado + c;
        const j = g * lado + d;
        const ortogonal = df * dc === 0 && vecindad !== 'caballo';
        const sentido = conFlechas && ortogonal ? sentidoDeFlecha(flechas, f, c, df, g) : null;
        if (sentido === null) conexiones.anota(i, j);
        else if (sentido) conexiones.anota(i, j, false);
        else conexiones.anota(j, i, false);
      }
    }
  }

  const casillas = [];
  for (let f = 0; f < alto; f++) {
    for (let c = 0; c < lado; c++) {
      casillas.push({
        x: c + ox + 0.5,
        y: f + oy + 0.5,
        vertices: cuadradoEn(f + oy, c + ox),
      });
    }
  }

  const dibujo = { ancho: lado + 2 * ox, alto: alto + 2 * oy, aristas: false, radio: 0.35 };
  if (ox || oy) {
    // Una franja de una casilla junto a cada borde pegado (y las esquinas si son dos):
    // cada fantasma copia la casilla real que hay al otro lado del pegado.
    dibujo.fantasmas = [];
    for (let f = -oy; f < alto + oy; f++) {
      for (let c = -ox; c < lado + ox; c++) {
        if (f >= 0 && f < alto && c >= 0 && c < lado) continue;
        const [g, d] = pegar(alto, lado, pegado, f, c);
        dibujo.fantasmas.push({
          casilla: g * lado + d,
          x: c + ox + 0.5,
          y: f + oy + 0.5,
          vertices: cuadradoEn(f + oy, c + ox),
        });
      }
    }
  }

  return { casillas, aristas: conexiones.aristas(), arcos: conexiones.arcos(), dibujo };
}

// Partes comunes de `cuadrado4`, `cuadrado8` y `caballo`.
function crearRejilla(generador, vecindad, nombreBase, parametros) {
  const lado = parametros?.lado ?? generador.parametros[0].defecto;
  const p = resolverParametros(generador.parametros, { ...parametros, alto: parametros?.alto ?? lado });
  comprobarSoloSi(generador.parametros, p);
  const { alto, bordes } = p;
  const flechas = p.flechas ?? 'ninguna';
  const { casillas, aristas, arcos, dibujo } = construirRejilla({
    lado: p.lado, alto, bordes, vecindad, flechas,
  });

  const medidas = alto === p.lado ? `${p.lado}` : `${p.lado}x${alto}`;
  let id = `${generador.id}-${medidas}`;
  let nombre = `${nombreBase} ${p.lado}×${alto}`;
  if (generador.id !== 'caballo') nombre += generador.id === 'cuadrado4' ? ', 4 vecinas' : ', 8 vecinas';
  const notas = [];
  if (bordes !== 'normales') {
    id += `-${bordes}`;
    nombre += `, ${SUPERFICIES[bordes].nombre.toLowerCase()}`;
    notas.push(SUPERFICIES[bordes].descripcion);
  }
  if (flechas !== 'ninguna') {
    id += `-${flechas}`;
    nombre += flechas === 'manhattan' ? ', calles alternas' : ', corriente';
    notas.push(NOTA_FLECHAS);
  }
  return crearTablero({
    id, nombre,
    descripcion: notas.length ? notas.join(' ') : undefined,
    generador: { id: generador.id, parametros: p },
    casillas, aristas, arcos, dibujo,
  });
}

export const cuadrado4 = {
  id: 'cuadrado4',
  nombre: 'Cuadrado, 4 vecinas',
  descripcion: 'Cada casilla se conecta con las de arriba, abajo, izquierda y derecha.',
  parametros: [parametroLado(3, 12, 6), parametroAlto(3, 12, 6), parametroBordes, parametroFlechas],
  crear(parametros) {
    return crearRejilla(cuadrado4, 'cuadrado4', 'Cuadrado', parametros);
  },
};

export const cuadrado8 = {
  id: 'cuadrado8',
  nombre: 'Cuadrado, 8 vecinas',
  descripcion: 'Cada casilla se conecta con las ocho que la rodean, diagonales incluidas.',
  parametros: [parametroLado(3, 12, 6), parametroAlto(3, 12, 6), parametroBordes, parametroFlechas],
  crear(parametros) {
    return crearRejilla(cuadrado8, 'cuadrado8', 'Cuadrado', parametros);
  },
};

export const caballo = {
  id: 'caballo',
  nombre: 'Caballo',
  descripcion: 'Cada casilla se conecta con aquellas a las que llegaría un caballo de ajedrez de un salto.',
  parametros: [parametroLado(4, 10, 6), parametroAlto(4, 10, 6), parametroBordes],
  crear(parametros) {
    return crearRejilla(caballo, 'caballo', 'Caballo', parametros);
  },
};

// Sigue existiendo para las URL antiguas y el reto del día, pero ya no figura en `generadores`
// (§10.2): sus tipos se piden ahora con `bordes` en `cuadrado4`.
export const superficie = {
  id: 'superficie',
  nombre: 'Superficie',
  descripcion: 'Cuadrícula de 4 vecinas con algunos bordes pegados: cilindro, toro, banda de Möbius o botella de Klein.',
  parametros: [
    parametroLado(4, 10, 6),
    {
      id: 'superficie', nombre: 'Superficie', tipo: 'opcion', defecto: 'toro',
      opciones: Object.entries(SUPERFICIES).map(([valor, { nombre }]) => ({ valor, nombre })),
    },
  ],
  crear(parametros) {
    const p = resolverParametros(superficie.parametros, parametros);
    const { lado, superficie: tipo } = p;
    const { casillas, aristas, dibujo } = construirRejilla({
      lado, alto: lado, bordes: tipo, vecindad: 'cuadrado4',
    });
    return crearTablero({
      id: `superficie-${tipo}-${lado}`,
      nombre: `${SUPERFICIES[tipo].nombre} ${lado}×${lado}`,
      descripcion: SUPERFICIES[tipo].descripcion,
      generador: { id: superficie.id, parametros: p },
      casillas, aristas, dibujo,
    });
  },
};
