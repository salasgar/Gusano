/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Reglas de una ronda. Funciones puras: ninguna muta su argumento (ESPECIFICACION.md §3.1).
// Modo general (§10.3): uno o dos gusanos, con una o dos cabezas cada uno, en tableros con o sin
// flechas. Con el modo por defecto { gusanos: 1, cabezas: 1 } todo es exactamente la tanda 1.

const CLASICO = Object.freeze({ gusanos: 1, cabezas: 1 });

const valorDe = (tablero, casilla) => tablero.casillas[casilla].valor ?? 1;
const bloqueada = (tablero, casilla) => tablero.casillas[casilla].bloqueada === true;
const predecesoresDe = (tablero) => tablero.predecesores ?? tablero.vecinos;
const sumaDe = (tablero, casillas) => casillas.reduce((suma, c) => suma + valorDe(tablero, c), 0);

// Las rondas se crean con nuevaRonda; estos accesores aguantan además una ronda de la tanda 1
// escrita a mano ({ tablero, camino }), que se lee como clásica.
const modoDe = (ronda) => ronda.modo ?? CLASICO;
const cuerposDe = (ronda) => ronda.cuerpos ?? [ronda.camino];
const mueveDe = (ronda) => ronda.mueve ?? ronda.camino.length % 2;

function normalizarModo(modo) {
  const gusanos = modo?.gusanos ?? 1;
  const cabezas = modo?.cabezas ?? 1;
  if (![1, 2].includes(gusanos) || ![1, 2].includes(cabezas)) throw new Error('modo no válido');
  return gusanos === 1 && cabezas === 1 ? CLASICO : Object.freeze({ gusanos, cabezas });
}

export function nuevaRonda(tablero, modo = CLASICO) {
  const m = normalizarModo(modo);
  const cuerpos = m.gusanos === 2 ? [[], []] : [[]];
  return { tablero, modo: m, camino: [], jugadas: [], cuerpos, mueve: 0 };
}

// Cabeza del gusano (por defecto el 0): la punta que crece por `vecinos`; null si aún no ha salido.
// Con un gusano de una cabeza es la última casilla del camino, como en la tanda 1.
export function cabeza(ronda, gusano = 0) {
  const cuerpo = cuerposDe(ronda)[gusano];
  return cuerpo.length === 0 ? null : cuerpo[cuerpo.length - 1];
}

export function extremos(ronda, gusano = 0) {
  const cuerpo = cuerposDe(ronda)[gusano];
  if (cuerpo.length === 0) return [];
  const punta = cuerpo[cuerpo.length - 1];
  return modoDe(ronda).cabezas === 2 && cuerpo.length >= 2 ? [punta, cuerpo[0]] : [punta];
}

export function maximiza(ronda) {
  return mueveDe(ronda) === 0;
}

export function turno(ronda) {
  return maximiza(ronda) ? 'gusano' : 'pajaro';
}

// Papel que rellenó camino[k]: con un gusano, la paridad (la casilla inicial es del gusano);
// con dos, el dueño del gusano que creció.
export function duenoDe(ronda, k) {
  return modoDe(ronda).gusanos === 2 ? ronda.jugadas[k].gusano : k % 2;
}

export function ocupada(ronda, casilla) {
  return bloqueada(ronda.tablero, casilla) || ronda.camino.includes(casilla);
}

// Jugadas con las que puede crecer el gusano `gusano` ahora, sin mirar de quién es el turno.
function jugadasDe(ronda, gusano) {
  const { tablero } = ronda;
  const cuerpo = cuerposDe(ronda)[gusano];
  const libres = (lista, extremo) => lista.filter((c) => !ocupada(ronda, c)).map((casilla) => ({ casilla, gusano, extremo }));
  if (cuerpo.length === 0) return libres(tablero.casillas.map((_, i) => i), 0);
  const jugadas = libres(tablero.vecinos[cuerpo[cuerpo.length - 1]], 0);
  // Con una sola casilla y sin flechas, crecer por la cola daría el mismo gusano: no se ofrece.
  if (modoDe(ronda).cabezas === 2 && (cuerpo.length >= 2 || tablero.dirigido === true)) {
    jugadas.push(...libres(predecesoresDe(tablero)[cuerpo[0]], 1));
  }
  return jugadas;
}

export function jugadasCompletas(ronda) {
  return jugadasDe(ronda, modoDe(ronda).gusanos === 2 ? mueveDe(ronda) : 0);
}

export function jugadasLegales(ronda) {
  return [...new Set(jugadasCompletas(ronda).map((j) => j.casilla))];
}

export function jugadasEn(ronda, casilla) {
  return jugadasCompletas(ronda).filter((j) => j.casilla === casilla);
}

// Con dos gusanos, tras la jugada del papel p mueve el otro; si el otro no puede crecer y p sí,
// p repite (el bloqueado pasa). Las dos salidas se ponen por orden: papel 0 y después papel 1.
function siguienteMueve(ronda, p) {
  if (modoDe(ronda).gusanos === 1) return ronda.camino.length % 2;
  if (ronda.camino.length < 2) return ronda.camino.length;
  const otro = 1 - p;
  return jugadasDe(ronda, otro).length === 0 && jugadasDe(ronda, p).length > 0 ? p : otro;
}

// jugada: un objeto { casilla, gusano?, extremo? } (extremo 0 si falta) o el índice de una casilla
// que admita una sola jugada.
export function jugar(ronda, jugada) {
  let elegida;
  if (typeof jugada === 'number') {
    const posibles = jugadasEn(ronda, jugada);
    if (posibles.length > 1) throw new Error('jugada ambigua');
    elegida = posibles[0];
  } else if (jugada !== null && typeof jugada === 'object') {
    const extremo = jugada.extremo ?? 0;
    elegida = jugadasCompletas(ronda).find((j) => j.casilla === jugada.casilla && j.extremo === extremo
      && (jugada.gusano === undefined || j.gusano === jugada.gusano));
  }
  if (elegida === undefined) throw new Error('jugada ilegal');

  const { casilla, gusano, extremo } = elegida;
  const cuerpos = cuerposDe(ronda).map((cuerpo, g) => {
    if (g !== gusano) return cuerpo;
    return extremo === 0 ? [...cuerpo, casilla] : [casilla, ...cuerpo];
  });
  const nueva = {
    tablero: ronda.tablero,
    modo: modoDe(ronda),
    camino: [...ronda.camino, casilla],
    jugadas: [...(ronda.jugadas ?? []), { casilla, gusano, extremo }],
    cuerpos,
    mueve: 0,
  };
  nueva.mueve = siguienteMueve(nueva, mueveDe(ronda));
  return nueva;
}

export function rondaTerminada(ronda) {
  return ronda.camino.length > 0 && jugadasCompletas(ronda).length === 0;
}

// Un gusano: suma de los valores del camino. Dos: la del gusano 0 menos la del gusano 1.
export function puntuacion(ronda) {
  const { tablero } = ronda;
  if (modoDe(ronda).gusanos === 1) return sumaDe(tablero, ronda.camino);
  const [g0, g1] = cuerposDe(ronda);
  return sumaDe(tablero, g0) - sumaDe(tablero, g1);
}

// Casillas libres a las que se llega desde los extremos de los gusanos dados, pasando solo por
// libres: desde una cabeza siguiendo `vecinos`, desde una cola (dos cabezas) siguiendo `predecesores`.
function alcanzablesDesde(ronda, gusanos) {
  const { tablero } = ronda;
  const visitadas = new Set();
  const recorrer = (desde, conexiones) => {
    const vistas = new Set();
    const cola = [desde];
    while (cola.length > 0) {
      const actual = cola.shift();
      for (const vecina of conexiones[actual]) {
        if (vistas.has(vecina) || ocupada(ronda, vecina)) continue;
        vistas.add(vecina);
        visitadas.add(vecina);
        cola.push(vecina);
      }
    }
  };
  for (const g of gusanos) {
    const cuerpo = cuerposDe(ronda)[g];
    if (cuerpo.length === 0) continue;
    recorrer(cuerpo[cuerpo.length - 1], tablero.vecinos);
    if (modoDe(ronda).cabezas === 2) recorrer(cuerpo[0], predecesoresDe(tablero));
  }
  return [...visitadas].sort((a, b) => a - b);
}

const todasLibres = (ronda) => ronda.tablero.casillas.map((_, i) => i).filter((i) => !ocupada(ronda, i));

// Desde cualquier extremo de cualquier gusano. Con el camino vacío, todas las libres.
export function alcanzables(ronda) {
  if (ronda.camino.length === 0) return todasLibres(ronda);
  return alcanzablesDesde(ronda, cuerposDe(ronda).map((_, g) => g));
}

const positivos = (tablero, casillas) => casillas.reduce((suma, c) => suma + Math.max(0, valorDe(tablero, c)), 0);

const negativos = (tablero, casillas) => casillas.reduce((suma, c) => suma + Math.min(0, valorDe(tablero, c)), 0);

// Un gusano: puntuación más los valores positivos de lo alcanzable. Dos: suma del gusano 0 más los
// positivos de lo que alcanza el gusano 0, menos la suma del gusano 1 y menos los negativos de lo
// que alcanza el gusano 1 (que puede comérselos y subir la puntuación).
export function cotaSuperior(ronda) {
  const { tablero } = ronda;
  if (modoDe(ronda).gusanos === 1) return puntuacion(ronda) + positivos(tablero, alcanzables(ronda));
  const [g0, g1] = cuerposDe(ronda);
  const alcance = (g, cuerpo) => (cuerpo.length === 0 ? todasLibres(ronda) : alcanzablesDesde(ronda, [g]));
  return sumaDe(tablero, g0) + positivos(tablero, alcance(0, g0))
    - sumaDe(tablero, g1) - negativos(tablero, alcance(1, g1));
}
