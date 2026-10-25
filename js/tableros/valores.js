/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Casillas con valor (ESPECIFICACION.md §2.3). Las bloqueadas no cambian de valor.

export const modosValores = ['uniforme', 'centro', 'trampas'];

export function conValores(tablero, modo, azar) {
  if (!modosValores.includes(modo)) throw new Error(`modo de valores desconocido: ${modo}`);
  const copia = structuredClone(tablero);
  const libres = copia.casillas.flatMap((c, i) => (c.bloqueada ? [] : [i]));

  if (modo === 'centro') {
    const cx = copia.dibujo.ancho / 2;
    const cy = copia.dibujo.alto / 2;
    const distancia = (i) => Math.hypot(copia.casillas[i].x - cx, copia.casillas[i].y - cy);
    const orden = libres.slice().sort((a, b) => distancia(a) - distancia(b) || a - b);
    const tercio = Math.ceil(orden.length / 3);
    orden.forEach((i, k) => { copia.casillas[i].valor = k < tercio ? 3 : k < 2 * tercio ? 2 : 1; });
  } else {
    for (const i of libres) copia.casillas[i].valor = azar.entero(1, 3);
    if (modo === 'trampas') {
      const cuantas = Math.round(0.1 * libres.length);
      for (const i of azar.barajar(libres).slice(0, cuantas)) copia.casillas[i].valor = -2;
    }
  }

  copia.id = `${tablero.id}-val-${modo}`;
  const nota = `Casillas con valor: ${modo}`;
  copia.descripcion = tablero.descripcion ? `${tablero.descripcion} ${nota}` : nota;
  return copia;
}
