/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Sentido único (ESPECIFICACION.md §10.1): pasa al azar conexiones de doble sentido a un
// solo sentido sin dejar ninguna casilla libre sin salida ni sin entrada.

import { crearTablero, validarTablero } from './tipos.js';

export function conSentidoUnico(tablero, proporcion, azar) {
  const copia = structuredClone(tablero);
  const n = copia.casillas.length;
  const libre = copia.casillas.map((c) => c.bloqueada !== true);
  const salen = copia.vecinos.map((l) => new Set(l));

  // Pares de doble sentido (i < j) y arcos que el tablero ya tenía.
  const dobles = [];
  const arcos = [];
  for (let i = 0; i < n; i++) {
    for (const j of copia.vecinos[i]) {
      if (salen[j].has(i)) { if (i < j) dobles.push([i, j]); } else arcos.push([i, j]);
    }
  }

  // Salidas y entradas de cada casilla libre hacia otras libres: lo que no puede quedar a 0.
  const salidas = new Array(n).fill(0);
  const entradas = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (const j of copia.vecinos[i]) {
      if (libre[i] && libre[j]) { salidas[i]++; entradas[j]++; }
    }
  }

  // Orientar de i a j quita la salida de j y la entrada de i.
  const sePuede = (i, j) => !(libre[i] && libre[j]) || (salidas[j] > 1 && entradas[i] > 1);
  const orientar = (i, j) => {
    if (libre[i] && libre[j]) { salidas[j]--; entradas[i]--; }
    arcos.push([i, j]);
  };

  const objetivo = Math.round(proporcion * dobles.length);
  const quedan = [];
  let puestas = 0;
  for (const [i, j] of azar.barajar(dobles)) {
    if (puestas >= objetivo) { quedan.push([i, j]); continue; }
    const [a, b] = azar.siguiente() < 0.5 ? [i, j] : [j, i];
    if (sePuede(a, b)) { orientar(a, b); puestas++; }
    else if (sePuede(b, a)) { orientar(b, a); puestas++; }
    else quedan.push([i, j]);
  }
  if (puestas === 0) return copia;

  const nuevo = crearTablero({
    id: copia.id,
    nombre: copia.nombre,
    casillas: copia.casillas,
    aristas: quedan,
    arcos,
    dibujo: copia.dibujo,
  });
  copia.vecinos = nuevo.vecinos;
  copia.predecesores = nuevo.predecesores;
  copia.dirigido = true;
  copia.id = `${tablero.id}-sen${Math.round(proporcion * 100)}`;
  const nota = `${puestas} conexiones de un solo sentido`;
  copia.descripcion = tablero.descripcion ? `${tablero.descripcion} ${nota}` : nota;
  const valida = validarTablero(copia);
  if (!valida.ok) throw new Error(`sentido único: tablero inválido (${valida.errores[0]})`);
  return copia;
}
