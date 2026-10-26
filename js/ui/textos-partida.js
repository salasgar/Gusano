/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Textos y cuentas de la pantalla de juego: saldo de suma cero, ventana de papeles, fin de ronda y
// resultado (ESPECIFICACION.md §6, «Marcador de suma cero…»). Funciones puras, sin DOM.
// Los textos marcan con **…** lo que la ventana pone en negrita.

import { puntuacion } from '../motor/ronda.js';
import { marcador } from '../motor/partida.js';

const MENOS = '−';

// Saldo de cada jugador: lo que gana como gusano menos lo que pierde como pájaro. Uno es el opuesto del otro.
export function saldos(puntos) {
  return [puntos[0] - puntos[1], puntos[1] - puntos[0]];
}

// '+9', '−9' (signo menos U+2212) o '0'.
export function conSigno(n) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${MENOS}${-n}`;
  return '0';
}

const entero = (n) => (n < 0 ? `${MENOS}${-n}` : String(n));

// Marcador tal como estaba al cerrarse la ronda `cierre` ({ par, ronda }): no cuenta la ronda siguiente,
// que `marcador()` ya incluye en cuanto el motor pasa a ella (su casilla inicial vale puntos).
export function marcadorAlCierre(partida, cierre) {
  return marcador({ ...partida, par: cierre.par, ronda: cierre.ronda });
}

export const hayValores = (tablero) => tablero.casillas.some((c) => !c.bloqueada && (c.valor ?? 1) !== 1);

export const dosGusanos = (partida) => partida.modo?.gusanos === 2;
export const dosCabezas = (partida) => partida.modo?.cabezas === 2;

// Aviso cuando la casilla pulsada admite dos jugadas (§10.6).
export const AVISO_EXTREMO = '¿Por qué extremo? Pulsa uno';

const TEXTO_CABEZAS = 'El gusano puede crecer por cualquiera de sus dos extremos.';
const TEXTO_CABEZAS_DOS = 'Cada gusano puede crecer por cualquiera de sus dos extremos.';
const TEXTO_FLECHAS = 'Las flechas marcan el sentido: la cabeza avanza a favor de la flecha y la cola, en contra.';
const TEXTO_FLECHAS_UNA = 'Las flechas marcan el sentido: la cabeza avanza a favor de la flecha.';

// Líneas que cada ventana de papeles añade según el modo y el tablero.
function lineasDeModo(partida, tablero) {
  const lineas = [];
  if (dosCabezas(partida)) lineas.push(dosGusanos(partida) ? TEXTO_CABEZAS_DOS : TEXTO_CABEZAS);
  if (tablero.dirigido) lineas.push(dosCabezas(partida) ? TEXTO_FLECHAS : TEXTO_FLECHAS_UNA);
  return lineas;
}

// Etiqueta de papel de cada jugador en el marcador: { texto, clase } (la clase da el color).
export function etiquetaDePapel(partida, jugador) {
  if (dosGusanos(partida)) {
    return jugador === partida.ronda ? { texto: 'gusano verde', clase: 'gusano' } : { texto: 'gusano violeta', clase: 'pajaro' };
  }
  return jugador === partida.ronda ? { texto: 'gusano', clase: 'gusano' } : { texto: 'pájaro', clase: 'pajaro' };
}

// Línea pequeña del marcador con los puntos brutos; null con dos gusanos (allí solo cuenta la diferencia).
export function brutos(partida, puntos, jugador) {
  return dosGusanos(partida) ? null : `${puntos[jugador]} como gusano`;
}

// Casillas con la salida ya puesta al empezar la ronda: una por gusano, o ninguna con inicio libre.
function salidasPuestas(par) {
  if (par.inicioFijo === null) return 0;
  return Array.isArray(par.inicioFijo) ? par.inicioFijo.length : 1;
}

// ¿La ronda en curso aún no ha tenido ninguna jugada? (la casilla inicial puesta por la app no cuenta)
export function sinEmpezar(partida) {
  if (partida.terminada) return false;
  const par = partida.pares[partida.par];
  return par.rondas[partida.ronda].camino.length <= salidasPuestas(par);
}

// Suma de los valores de las casillas de un cuerpo (cada casilla vale 1 si no tiene valor).
const sumaDe = (tablero, cuerpo) => cuerpo.reduce((s, c) => s + (tablero.casillas[c].valor ?? 1), 0);

// Ventana de papeles con dos gusanos: el gusano verde es el del papel 0, que lleva quien tiene la ronda.
function papelesDosGusanos(partida, nombres) {
  const par = partida.pares[partida.par];
  const verde = nombres[partida.ronda];
  const violeta = nombres[1 - partida.ronda];
  const valores = hayValores(par.tablero);
  const gana = valores ? 'el gusano cuyas casillas sumen más' : 'el gusano más largo';
  const empieza = salidasPuestas(par) === 0
    ? `Empieza ${verde} eligiendo la salida de su gusano, y después ${violeta} la del suyo.`
    : `Las salidas ya están puestas: mueve primero ${verde}.`;
  return {
    titulo: `Par ${partida.par + 1} · Ronda ${partida.ronda + 1}`,
    parrafos: [
      `**${verde} lleva el gusano verde** y **${violeta} el violeta**. Cada uno alarga el suyo; las casillas de los dos bloquean; `
        + `si uno se queda sin salida, el otro sigue solo. Gana ${gana}.`,
      ...lineasDeModo(partida, par.tablero),
      empieza,
    ],
    boton: 'Empezar',
  };
}

// Ventana que explica los papeles de la ronda en curso.
export function papeles(partida, nombres = partida.nombres) {
  if (dosGusanos(partida)) return papelesDosGusanos(partida, nombres);
  const par = partida.pares[partida.par];
  const valores = hayValores(par.tablero);
  const gusano = nombres[partida.ronda];
  const pajaro = nombres[1 - partida.ronda];
  const largo = valores ? 'que las casillas del gusano sumen lo más posible' : 'que el gusano sea lo más largo posible';
  const corto = valores ? 'que las casillas del gusano sumen lo menos posible' : 'que el gusano sea lo más corto posible';
  const empieza = par.rondas[partida.ronda].camino.length === 0
    ? `Empieza ${gusano} eligiendo la casilla inicial.`
    : `La casilla inicial ya está puesta: mueve primero ${pajaro} (pájaro).`;
  return {
    titulo: `Par ${partida.par + 1} · Ronda ${partida.ronda + 1}`,
    parrafos: [
      `**${gusano} es el gusano**: tiene que conseguir ${largo}. **${pajaro} es el pájaro**: tiene que conseguir ${corto}.`,
      ...lineasDeModo(partida, par.tablero),
      empieza,
    ],
    boton: 'Empezar',
  };
}

// «Gana Jugador B con +4 (8 como gusano frente a 4).» / «Empate (8 y 8 como gusano).»
export function resultado(partida, nombres = partida.nombres) {
  const m = marcador(partida);
  if (dosGusanos(partida)) {
    return m.ganador === null ? 'Empate.' : `Gana ${nombres[m.ganador]} con ${conSigno(saldos(m.puntos)[m.ganador])}.`;
  }
  if (m.ganador === null) return `Empate (${m.puntos[0]} y ${m.puntos[1]} como gusano).`;
  const g = m.ganador;
  return `Gana ${nombres[g]} con ${conSigno(saldos(m.puntos)[g])} (${m.puntos[g]} como gusano frente a ${m.puntos[1 - g]}).`;
}

// Ventana de fin de ronda. `partida` es la que devuelve el motor tras la última jugada; `cierre` = { par, ronda }
// de la ronda que se acaba de cerrar. `continuar` es null si la partida ha terminado.
export function finDeRonda(partida, cierre, nombres = partida.nombres) {
  const cerrada = partida.pares[cierre.par].rondas[cierre.ronda];
  const n = puntuacion(cerrada);
  const valores = hayValores(partida.pares[cierre.par].tablero);
  const gusano = nombres[cierre.ronda];
  const medida = valores ? `sus casillas suman ${entero(n)}` : `mide ${n} ${n === 1 ? 'casilla' : 'casillas'}`;
  const ganancia = [0, 1].map((i) => `${nombres[i]} ${conSigno(i === cierre.ronda ? n : -n)}`);
  const [sa, sb] = saldos(marcadorAlCierre(partida, cierre).puntos);
  const dos = dosGusanos(partida);
  let medidas = `El gusano de ${gusano} ${medida}`;
  if (dos) {
    // Con dos gusanos se miden los dos: el del papel 0 (verde) es el de quien tenía la ronda.
    const tablero = partida.pares[cierre.par].tablero;
    const [m0, m1] = cerrada.cuerpos.map((c) => (valores ? sumaDe(tablero, c) : c.length));
    const otro = nombres[1 - cierre.ronda];
    medidas = valores
      ? `Las casillas del gusano de ${gusano} suman ${entero(m0)} y las del de ${otro}, ${entero(m1)}`
      : `El gusano de ${gusano} mide ${m0} y el de ${otro}, ${m1}`;
  }
  const parrafos = [
    `Fin de la ronda ${cierre.ronda + 1} del par ${cierre.par + 1}. ${medidas}: ${ganancia[0]}, ${ganancia[1]}.`,
    `Saldo: ${nombres[0]} ${conSigno(sa)} · ${nombres[1]} ${conSigno(sb)}.`,
  ];
  let continuar = null;
  if (partida.terminada) {
    parrafos.push(resultado(partida, nombres));
  } else {
    const mismoPar = partida.par === cierre.par;
    const g = nombres[partida.ronda];
    const p = nombres[1 - partida.ronda];
    const papelesTexto = dos ? `${g} lleva el gusano verde y ${p} el violeta` : `${g} es el gusano y ${p} el pájaro`;
    parrafos.push(mismoPar
      ? `En la ronda ${partida.ronda + 1}, ${papelesTexto}.`
      : `En el par ${partida.par + 1}, ronda ${partida.ronda + 1}, ${papelesTexto}.`);
    continuar = mismoPar ? `Continuar con la ronda ${partida.ronda + 1}` : `Continuar con el par ${partida.par + 1}`;
  }
  return { titulo: `Fin de la ronda ${cierre.ronda + 1}`, parrafos, continuar };
}
