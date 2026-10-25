/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Obstáculos (ESPECIFICACION.md §2.3): casillas bloqueadas al azar sin desconectar el resto.

// ¿Siguen conexas las casillas libres? Búsqueda en anchura desde la primera libre.
function libresConexas(vecinos, bloqueada) {
  const inicio = bloqueada.indexOf(false);
  if (inicio < 0) return true;
  const visto = new Set([inicio]);
  const cola = [inicio];
  for (let i = 0; i < cola.length; i++) {
    for (const v of vecinos[cola[i]]) {
      if (!bloqueada[v] && !visto.has(v)) { visto.add(v); cola.push(v); }
    }
  }
  return visto.size === bloqueada.filter((b) => !b).length;
}

export function conObstaculos(tablero, proporcion, azar) {
  const copia = structuredClone(tablero);
  const bloqueada = copia.casillas.map((c) => c.bloqueada === true);
  const libres = bloqueada.filter((b) => !b).length;
  const objetivo = Math.round(proporcion * libres);
  let puestas = 0;
  if (objetivo > 0) {
    const candidatas = azar.barajar(bloqueada.flatMap((b, i) => (b ? [] : [i])));
    for (const i of candidatas) {
      if (puestas === objetivo) break;
      // Quedan siempre al menos dos libres: con una sola no habría partida.
      if (libres - puestas <= 2) break;
      bloqueada[i] = true;
      if (libresConexas(copia.vecinos, bloqueada)) puestas++;
      else bloqueada[i] = false;
    }
  }
  if (puestas === 0) return copia;
  bloqueada.forEach((b, i) => { if (b) copia.casillas[i].bloqueada = true; });
  copia.id = `${tablero.id}-obs${Math.round(proporcion * 100)}`;
  const nota = `${puestas} casillas bloqueadas`;
  copia.descripcion = tablero.descripcion ? `${tablero.descripcion} ${nota}` : nota;
  return copia;
}
