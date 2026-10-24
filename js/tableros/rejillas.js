// Tableros de casillas cuadradas: cuadrados, caballo y superficies (ESPECIFICACION.md §2.2).
// Casilla (fila f, columna c) → índice f * lado + c, centro (c + 0.5, f + 0.5).

import { crearTablero, resolverParametros } from './tipos.js';

function casillasCuadradas(lado) {
  const casillas = [];
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      casillas.push({
        x: c + 0.5,
        y: f + 0.5,
        vertices: [[c, f], [c + 1, f], [c + 1, f + 1], [c, f + 1]],
      });
    }
  }
  return casillas;
}

function dibujoCuadrado(lado) {
  return { ancho: lado, alto: lado, aristas: false, radio: 0.35 };
}

const parametroLado = (min, max, defecto) => ({
  id: 'lado', nombre: 'Lado', tipo: 'entero', min, max, defecto,
});

// Une cada casilla con las que devuelve `destinos(f, c)` (pares [fila, columna]).
function tableroDeRejilla({ id, nombre, descripcion, generador, lado, destinos }) {
  const aristas = [];
  for (let f = 0; f < lado; f++) {
    for (let c = 0; c < lado; c++) {
      for (const [g, d] of destinos(f, c)) aristas.push([f * lado + c, g * lado + d]);
    }
  }
  return crearTablero({
    id, nombre, descripcion, generador,
    casillas: casillasCuadradas(lado), aristas, dibujo: dibujoCuadrado(lado),
  });
}

const dentro = (lado) => (f, c) => f >= 0 && c >= 0 && f < lado && c < lado;

export const cuadrado4 = {
  id: 'cuadrado4',
  nombre: 'Cuadrado, 4 vecinas',
  descripcion: 'Cada casilla se conecta con las de arriba, abajo, izquierda y derecha.',
  parametros: [parametroLado(3, 12, 6)],
  crear(parametros) {
    const p = resolverParametros(cuadrado4.parametros, parametros);
    const lado = p.lado;
    const ok = dentro(lado);
    return tableroDeRejilla({
      id: `cuadrado4-${lado}`,
      nombre: `Cuadrado ${lado}×${lado}, 4 vecinas`,
      generador: { id: cuadrado4.id, parametros: p },
      lado,
      destinos: (f, c) => [[f + 1, c], [f, c + 1]].filter(([g, d]) => ok(g, d)),
    });
  },
};

export const cuadrado8 = {
  id: 'cuadrado8',
  nombre: 'Cuadrado, 8 vecinas',
  descripcion: 'Cada casilla se conecta con las ocho que la rodean, diagonales incluidas.',
  parametros: [parametroLado(3, 12, 6)],
  crear(parametros) {
    const p = resolverParametros(cuadrado8.parametros, parametros);
    const lado = p.lado;
    const ok = dentro(lado);
    return tableroDeRejilla({
      id: `cuadrado8-${lado}`,
      nombre: `Cuadrado ${lado}×${lado}, 8 vecinas`,
      generador: { id: cuadrado8.id, parametros: p },
      lado,
      destinos: (f, c) => [[f + 1, c], [f, c + 1], [f + 1, c + 1], [f + 1, c - 1]]
        .filter(([g, d]) => ok(g, d)),
    });
  },
};

const SALTOS_CABALLO = [[1, 2], [2, 1], [-1, 2], [-2, 1]];

export const caballo = {
  id: 'caballo',
  nombre: 'Caballo',
  descripcion: 'Cada casilla se conecta con aquellas a las que llegaría un caballo de ajedrez de un salto.',
  parametros: [parametroLado(4, 10, 6)],
  crear(parametros) {
    const p = resolverParametros(caballo.parametros, parametros);
    const lado = p.lado;
    const ok = dentro(lado);
    return tableroDeRejilla({
      id: `caballo-${lado}`,
      nombre: `Caballo ${lado}×${lado}`,
      generador: { id: caballo.id, parametros: p },
      lado,
      destinos: (f, c) => SALTOS_CABALLO.map(([a, b]) => [f + a, c + b]).filter(([g, d]) => ok(g, d)),
    });
  },
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
    const invierteLados = tipo === 'mobius' || tipo === 'klein';
    const pegaArribaAbajo = tipo === 'toro' || tipo === 'klein';
    const modulo = (k) => (k + lado) % lado;
    const destinos = (f, c) => {
      const lista = [];
      // Abajo: pegado con la fila 0 solo en toro y Klein.
      if (f + 1 < lado) lista.push([f + 1, c]);
      else if (pegaArribaAbajo) lista.push([0, c]);
      // Derecha: siempre pegada; en Möbius y Klein la fila se invierte.
      if (c + 1 < lado) lista.push([f, c + 1]);
      else lista.push([invierteLados ? lado - 1 - f : f, 0]);
      return lista.map(([g, d]) => [modulo(g), modulo(d)]);
    };
    return tableroDeRejilla({
      id: `superficie-${tipo}-${lado}`,
      nombre: `${SUPERFICIES[tipo].nombre} ${lado}×${lado}`,
      descripcion: SUPERFICIES[tipo].descripcion,
      generador: { id: superficie.id, parametros: p },
      lado,
      destinos,
    });
  },
};
