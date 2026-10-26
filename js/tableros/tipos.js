// Estructura de datos de un tablero (ESPECIFICACION.md §2.1).

// Construye un tablero a partir de la lista de pares `aristas`: `vecinos` sale
// simétrica, ordenada y sin repetidos. `arcos` ([i, j]: de i a j en un solo sentido) hace el
// tablero dirigido (§10.1): `vecinos` son las salidas y `predecesores` las entradas; sin
// arcos el tablero no lleva ni `dirigido` ni `predecesores`. Lanza Error si algo no cuadra.
export function crearTablero({ id, nombre, descripcion, generador, casillas, aristas, arcos, dibujo }) {
  if (!Array.isArray(casillas) || casillas.length < 2) {
    throw new Error('un tablero necesita al menos 2 casillas');
  }
  const n = casillas.length;
  const conjuntos = Array.from({ length: n }, () => new Set());
  for (const par of aristas ?? []) {
    const [i, j] = par;
    if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || j < 0 || i >= n || j >= n) {
      throw new Error(`arista fuera de rango: [${i}, ${j}]`);
    }
    if (i === j) throw new Error(`arista de una casilla consigo misma: ${i}`);
    conjuntos[i].add(j);
    conjuntos[j].add(i);
  }
  const dirigido = (arcos ?? []).length > 0;
  const entradas = dirigido ? conjuntos.map((c) => new Set(c)) : null;
  for (const par of arcos ?? []) {
    const [i, j] = par;
    if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || j < 0 || i >= n || j >= n) {
      throw new Error(`arco fuera de rango: [${i}, ${j}]`);
    }
    if (i === j) throw new Error(`arco de una casilla consigo misma: ${i}`);
    if (conjuntos[i].has(j) && conjuntos[j].has(i)) {
      throw new Error(`el par ${i}-${j} es a la vez arista y arco`);
    }
    conjuntos[i].add(j);
    entradas[j].add(i);
  }
  const ordenada = (c) => [...c].sort((a, b) => a - b);
  const tablero = { id, nombre };
  if (descripcion !== undefined) tablero.descripcion = descripcion;
  if (generador !== undefined) tablero.generador = generador;
  tablero.casillas = casillas;
  tablero.vecinos = conjuntos.map(ordenada);
  if (dirigido) {
    tablero.predecesores = entradas.map(ordenada);
    tablero.dirigido = true;
  }
  tablero.dibujo = dibujo;
  return tablero;
}

// → { ok: true } | { ok: false, errores: ['…'] }
export function validarTablero(tablero) {
  const errores = [];
  const { casillas, vecinos, dibujo } = tablero ?? {};
  if (!Array.isArray(casillas) || casillas.length < 2) {
    errores.push('hay menos de 2 casillas');
  }
  if (!Array.isArray(vecinos) || !Array.isArray(casillas) || vecinos.length !== casillas.length) {
    errores.push('vecinos no tiene la misma longitud que casillas');
  }
  const numero = (v) => typeof v === 'number' && Number.isFinite(v);
  const cajaOk = dibujo && numero(dibujo.ancho) && numero(dibujo.alto);
  if (!cajaOk) errores.push('dibujo sin ancho y alto numéricos');

  if (Array.isArray(casillas)) {
    casillas.forEach((c, i) => {
      if (!numero(c?.x) || !numero(c?.y)) {
        errores.push(`casilla ${i}: coordenadas no numéricas`);
      } else if (cajaOk && (c.x < 0 || c.x > dibujo.ancho || c.y < 0 || c.y > dibujo.alto)) {
        errores.push(`casilla ${i}: fuera de la caja del dibujo`);
      }
      if (c?.valor !== undefined && !Number.isInteger(c.valor)) {
        errores.push(`casilla ${i}: valor no entero`);
      }
      if (c?.bloqueada !== undefined && typeof c.bloqueada !== 'boolean') {
        errores.push(`casilla ${i}: bloqueada no es booleana`);
      }
    });
  }

  if (Array.isArray(vecinos) && Array.isArray(casillas) && vecinos.length === casillas.length) {
    const n = vecinos.length;
    vecinos.forEach((lista, i) => {
      if (!Array.isArray(lista)) {
        errores.push(`casilla ${i}: vecinos no es una lista`);
        return;
      }
      lista.forEach((j, k) => {
        if (!Number.isInteger(j) || j < 0 || j >= n) {
          errores.push(`casilla ${i}: vecina fuera de rango (${j})`);
          return;
        }
        if (j === i) errores.push(`casilla ${i}: es vecina de sí misma`);
        if (k > 0 && lista[k - 1] === j) errores.push(`casilla ${i}: vecina repetida (${j})`);
        else if (k > 0 && lista[k - 1] > j) errores.push(`casilla ${i}: vecinos sin ordenar`);
        if (!tablero.dirigido && !vecinos[j]?.includes(i)) {
          errores.push(`conexión no simétrica: ${i} → ${j}`);
        }
      });
    });
    if (tablero.dirigido) {
      const esperado = Array.from({ length: n }, () => []);
      vecinos.forEach((lista, i) => {
        if (Array.isArray(lista)) {
          lista.forEach((j) => { if (Number.isInteger(j) && j >= 0 && j < n) esperado[j].push(i); });
        }
      });
      const { predecesores } = tablero;
      if (!Array.isArray(predecesores) || predecesores.length !== n) {
        errores.push('predecesores no tiene la misma longitud que casillas');
      } else {
        esperado.forEach((lista, j) => {
          if (JSON.stringify(predecesores[j]) !== JSON.stringify(lista)) {
            errores.push(`casilla ${j}: predecesores no es la inversa de vecinos`);
          }
        });
      }
    }
  }
  return errores.length ? { ok: false, errores } : { ok: true };
}

// Mezcla los parámetros recibidos con los defectos del generador y los comprueba.
// Lanza Error si alguno no es válido.
export function resolverParametros(definiciones, parametros = {}) {
  const resultado = {};
  for (const d of definiciones) {
    const v = parametros[d.id] ?? d.defecto;
    if (d.tipo === 'entero') {
      if (!Number.isInteger(v) || v < d.min || v > d.max) {
        throw new Error(`${d.nombre}: ${v} no está entre ${d.min} y ${d.max}`);
      }
    } else if (d.tipo === 'opcion') {
      if (!d.opciones.some((o) => o.valor === v)) {
        throw new Error(`${d.nombre}: opción desconocida (${v})`);
      }
    }
    resultado[d.id] = v;
  }
  return resultado;
}
