/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Generador aleatorio con semilla (mulberry32): la misma semilla produce la misma secuencia.

export function crearAzar(semilla = Date.now()) {
  const inicial = (semilla >>> 0) || 1;
  let estado = inicial;
  const siguiente = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const entero = (min, max) => min + Math.floor(siguiente() * (max - min + 1));
  const elegir = (lista) => lista[Math.floor(siguiente() * lista.length)];
  const barajar = (lista) => {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(siguiente() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };
  return { siguiente, entero, elegir, barajar, semilla: inicial };
}

// Semilla entera a partir de un texto (FNV-1a de 32 bits): el mismo texto, la misma semilla.
export function semillaDesdeTexto(texto) {
  let h = 0x811c9dc5;
  for (const c of String(texto)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
