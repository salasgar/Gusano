#!/usr/bin/env node
/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Pruebas de la interfaz en Chrome sin cabeza, repetibles y sin dependencias (ESPECIFICACION.md §8).
// Uso: node herramientas/test-ui.js [--solo texto] [--chrome ruta] [--capturas carpeta]
//   (la ruta de Chrome también puede venir en la variable de entorno CHROME)
// Sirve la raíz del repositorio por HTTP en un puerto libre (los módulos ES no cargan desde file://),
// lanza Chrome sin cabeza, y escribe una línea OK/FALLO por caso. Termina con «TODO OK» y código 0,
// o con código 1 si algún caso falla. Duración objetivo: < 60 s.
// Añadir un caso: una entrada más en `casos` (nombre + función async que recibe `ctx` y lanza Error si falla).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Cdp, Pagina, buscarChrome } from './cdp.js';

// `node --test` (npm test) descubre por su nombre cualquier `test-*.js`, también este. Las pruebas de
// interfaz son lentas y necesitan Chrome: bajo el ejecutor de pruebas se salta a sí mismo y se lanza a mano.
if (process.env.NODE_TEST_CONTEXT) {
  console.log('test-ui.js: omitido bajo `node --test`; se lanza con `node herramientas/test-ui.js`.');
  process.exit(0);
}

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valorDe = (bandera) => { const i = args.indexOf(bandera); return i >= 0 ? args[i + 1] : undefined; };
const solo = valorDe('--solo');
const carpetaCapturas = valorDe('--capturas');
const chrome = buscarChrome(valorDe('--chrome'));
if (!chrome) { console.error('No encuentro Chrome: indica la ruta con --chrome o en la variable CHROME.'); process.exit(2); }

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
};

function servir() {
  const servidor = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const fichero = path.join(raiz, ruta.endsWith('/') ? `${ruta}index.html` : ruta);
    if (!fichero.startsWith(raiz) || !fs.existsSync(fichero) || fs.statSync(fichero).isDirectory()) {
      res.writeHead(404); res.end('no encontrado'); return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(fichero)] ?? 'application/octet-stream' });
    fs.createReadStream(fichero).pipe(res);
  });
  return new Promise((res) => servidor.listen(0, '127.0.0.1', () => res(servidor)));
}

// ---------- utilidades que se ejecutan en la página ----------

// Rellena el formulario de ajustes y pulsa «Empezar». `jugadores`: [{tipo, nivel}, {tipo, nivel}].
// Con `ventanaDePapeles: false` se deja abierta la ventana de papeles; si no, se pulsa «Empezar».
// `obstaculos` (0, 0.1, 0.2) y `valores` ('sin', 'uniforme', 'centro', 'trampas') solo se tocan si se indican.
async function configurar(p, { generadorId = 'cuadrado4', parametros = {}, inicio = 'azar', jugadores, ventanaDePapeles = true, obstaculos, valores }) {
  await p.evaluar(`(() => {
    const ponValor = (campo, valor) => { campo.value = valor; campo.dispatchEvent(new Event('change', { bubbles: true })); };
    ${obstaculos === undefined ? '' : `ponValor(document.querySelector('#ajuste-obstaculos'), ${JSON.stringify(String(obstaculos))});`}
    ${valores === undefined ? '' : `ponValor(document.querySelector('#ajuste-valores'), ${JSON.stringify(valores)});`}
    const g = document.querySelector('#ajuste-generador');
    ponValor(g, ${JSON.stringify(generadorId)});
    const params = ${JSON.stringify(parametros)};
    const campos = [...document.querySelectorAll('.parametros .campo')];
    for (const etiqueta of campos) {
      const campo = etiqueta.querySelector('input, select');
      const nombre = etiqueta.textContent.trim().toLowerCase();
      for (const [clave, valor] of Object.entries(params)) if (nombre.startsWith(clave)) ponValor(campo, String(valor));
    }
    const selInicio = [...document.querySelectorAll('form.ajustes fieldset')][1].querySelector('select');
    ponValor(selInicio, ${JSON.stringify(inicio)});
    const jug = [...document.querySelectorAll('fieldset.jugador')];
    ${JSON.stringify(jugadores)}.forEach((j, i) => {
      const [tipo, nivel] = jug[i].querySelectorAll('select');
      ponValor(tipo, j.tipo);
      if (j.nivel) ponValor(nivel, j.nivel);
    });
  })()`);
  await p.pulsar('form.ajustes button[type=submit]');
  if (!await p.esperarHasta(`!!document.querySelector('.zona-tablero svg')`, 5000)) throw new Error('la partida no arrancó');
  if (!await p.esperarHasta(HAY_VENTANA, 3000)) throw new Error('no sale la ventana de papeles al empezar');
  if (ventanaDePapeles) await pulsarVentana(p, 'Empezar');
}

const HUMANOS = [{ tipo: 'humano' }, { tipo: 'humano' }];

// ---------- ventanas de papeles y de fin de ronda ----------

const HAY_VENTANA = `!!document.querySelector('dialog.ventana[open]')`;
const MENOS = '−';

// { titulo, texto, botones } de la ventana abierta, o null.
const ventana = (p) => p.evaluar(`(() => {
  const d = document.querySelector('dialog.ventana[open]');
  return d ? { titulo: d.querySelector('h2').textContent, texto: d.innerText, botones: [...d.querySelectorAll('button')].map((b) => b.textContent) } : null;
})()`);

// Pulsa de verdad (con el ratón) el botón de la ventana abierta cuyo texto empieza por `inicio`.
async function pulsarVentana(p, inicio) {
  const hay = await p.evaluar(`(() => {
    const b = [...document.querySelectorAll('dialog.ventana[open] button')].find((x) => x.textContent.startsWith(${JSON.stringify(inicio)}));
    if (!b) return false;
    b.dataset.prueba = 'ventana';
    return true;
  })()`);
  if (!hay) throw new Error(`la ventana abierta no tiene el botón «${inicio}»: ${JSON.stringify(await ventana(p))}`);
  await p.pulsar('[data-prueba=ventana]');
  await p.esperar(100);
}

const saldosDom = (p) => p.evaluar(`[...document.querySelectorAll('.jugador-marcador .saldo')].map((e) => Number(e.textContent.replace('${MENOS}', '-')))`);
const rellenas = (p) => p.evaluar(`document.querySelectorAll('.zona-tablero [data-indice].gusano, .zona-tablero [data-indice].pajaro').length`);

// Juega a clics la primera casilla legal hasta que salga una ventana. `tope` jugadas.
async function jugarHastaVentana(p, tope = 60) {
  for (let k = 0; k < tope; k++) {
    if (await p.evaluar(HAY_VENTANA)) return;
    if (await p.evaluar(`!!document.querySelector('.zona-tablero [data-indice].legal')`)) await p.pulsar('.zona-tablero [data-indice].legal');
    else await p.esperar(100);
  }
  throw new Error(`no sale ninguna ventana en ${tope} intentos`);
}

// Partida de máquinas: pulsa «Continuar con …» cada vez que sale; termina cuando la ventana final lleva «Un par más».
async function dejarJugarMaquinas(p, tope) {
  const fin = Date.now() + tope;
  while (Date.now() < fin) {
    const v = await ventana(p);
    if (v?.botones.some((b) => b.startsWith('Continuar con'))) await pulsarVentana(p, 'Continuar con');
    else if (v?.botones.includes('Un par más')) return true;
    else await p.esperar(150);
  }
  return false;
}

async function abrirApp(ctx, ancho = 1200, alto = 900) {
  const p = await Pagina.abrir(ctx.cdp);
  await p.tamano(ancho, alto);
  await p.ir(`${ctx.base}/index.html#jugar`);
  return p;
}

const hayResultado = (p) => p.evaluar(`!!document.querySelector('.resultado')`);

function consolaLimpia(p) {
  if (p.consola.length) throw new Error(`consola con mensajes: ${p.consola.join(' | ')}`);
}

async function captura(ctx, p, nombre) {
  if (carpetaCapturas) {
    fs.mkdirSync(carpetaCapturas, { recursive: true });
    await p.captura(path.join(carpetaCapturas, `${nombre}.png`));
  }
}

// ---------- casos (ESPECIFICACION.md §8; tarea 08) ----------

const casos = [
  {
    nombre: 'a) index.html carga y la consola queda limpia',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      const titulo = await p.evaluar('document.title');
      if (titulo !== 'Gusano') throw new Error(`título «${titulo}»`);
      if (!await p.evaluar(`!!document.querySelector('form.ajustes')`)) throw new Error('no aparece el formulario de ajustes');
      // Recorre también las otras pantallas: ninguna debe dejar errores.
      for (const id of ['reto', 'analisis', 'editor', 'jugar']) {
        await p.pulsar(`nav a[data-pantalla=${id}]`);
        await p.esperar(250);
        if (!await p.evaluar(`document.querySelector('#pantalla').children.length > 0`)) throw new Error(`#${id} sale vacía`);
      }
      consolaLimpia(p);
      await captura(ctx, p, 'a-inicio');
    },
  },
  {
    nombre: 'b) humano-humano, un par en cuadrado4 lado 4, marcador coherente con el motor',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 4 }, inicio: 'libre', jugadores: HUMANOS });
      // Réplica del motor dentro de la página, alimentada con las mismas casillas que se pulsan.
      await p.evaluar(`(async () => {
        const t = await import('/js/tableros/index.js');
        const m = await import('/js/motor/partida.js');
        window.__motor = { m, partida: m.nuevaPartida({ nombres: ['A', 'B'], tableros: [t.generador('cuadrado4').crear({ lado: 4 })], inicio: 'libre', semilla: 1 }) };
        return true;
      })()`);
      let jugadas = 0;
      while (!await hayResultado(p)) {
        if (++jugadas > 40) throw new Error('la partida no termina en 40 jugadas');
        const casilla = await p.evaluar(`(() => {
          const e = document.querySelector('.zona-tablero [data-indice].legal');
          return e ? Number(e.dataset.indice) : null;
        })()`);
        if (casilla === null) throw new Error(`jugada ${jugadas}: no hay casillas legales en pantalla`);
        await p.pulsar(`.zona-tablero [data-indice="${casilla}"]`);
        await p.evaluar(`(() => { const o = window.__motor; o.partida = o.m.jugarEnPartida(o.partida, ${casilla}); })()`);
        // Al cerrarse una ronda sale la ventana: se pulsa «Continuar con …» antes de comparar el marcador vivo.
        const v = await ventana(p);
        if (v?.botones.some((b) => b.startsWith('Continuar con'))) await pulsarVentana(p, 'Continuar con');
        const puntos = await p.evaluar(`window.__motor.m.marcador(window.__motor.partida).puntos`);
        const esperado = [puntos[0] - puntos[1], puntos[1] - puntos[0]];
        const dom = await saldosDom(p);
        if (dom[0] !== esperado[0] || dom[1] !== esperado[1]) {
          throw new Error(`jugada ${jugadas} (casilla ${casilla}): saldos en pantalla ${dom} ≠ motor ${esperado}`);
        }
      }
      const final0 = await ventana(p);
      if (!final0?.botones.includes('Ver tablero') || !final0.botones.includes('Un par más')) {
        throw new Error(`la ventana final no trae los botones esperados: ${JSON.stringify(final0)}`);
      }
      await pulsarVentana(p, 'Ver tablero');
      if (await p.evaluar(HAY_VENTANA)) throw new Error('«Ver tablero» no cierra la ventana final');
      const texto = await p.evaluar(`document.querySelector('.resultado').textContent`);
      const final = await p.evaluar(`window.__motor.m.marcador(window.__motor.partida)`);
      const terminada = await p.evaluar(`window.__motor.partida.terminada`);
      if (!terminada) throw new Error('el motor no da la partida por terminada y la pantalla sí');
      const esperadoTexto = final.ganador === null ? 'Empate' : `Gana ${final.ganador === 0 ? 'Jugador A' : 'Jugador B'}`;
      if (!texto.includes(esperadoTexto)) throw new Error(`resultado «${texto}», se esperaba «${esperadoTexto}…»`);
      consolaLimpia(p);
      await captura(ctx, p, 'b-final');
      return `${jugadas} jugadas, resultado «${texto}», marcador ${final.puntos}`;
    },
  },
  {
    nombre: 'c) aleatorio contra perfecto en caballo lado 5 termina sola en < 60 s',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, {
        generadorId: 'caballo', parametros: { lado: 5 },
        jugadores: [{ tipo: 'maquina', nivel: 'aleatorio' }, { tipo: 'maquina', nivel: 'perfecto' }],
      });
      const t0 = Date.now();
      const acabo = await dejarJugarMaquinas(p, 60000);
      const seg = ((Date.now() - t0) / 1000).toFixed(1);
      if (!acabo) throw new Error('no terminó en 60 s');
      consolaLimpia(p);
      return `${seg} s, «${await p.evaluar(`document.querySelector('.resultado').textContent`)}»`;
    },
  },
  {
    nombre: 'd) a 375×700 no hay desplazamiento horizontal y el tablero ocupa ≥ 300 px',
    async correr(ctx) {
      const p = await abrirApp(ctx, 375, 700);
      const medida = () => p.evaluar(`({ scroll: document.documentElement.scrollWidth, ventana: innerWidth })`);
      let m = await medida();
      if (m.scroll > 375) throw new Error(`ajustes: scrollWidth ${m.scroll} > 375`);
      await captura(ctx, p, 'd-ajustes-375');
      await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 6 }, jugadores: HUMANOS });
      m = await medida();
      if (m.scroll > 375) throw new Error(`partida: scrollWidth ${m.scroll} > 375`);
      const ancho = await p.evaluar(`document.querySelector('.zona-tablero svg').getBoundingClientRect().width`);
      if (ancho < 300) throw new Error(`el tablero mide ${ancho.toFixed(0)} px de ancho`);
      await captura(ctx, p, 'd-partida-375');
      // Un tablero ancho y las otras pantallas tampoco deben desbordar.
      for (const id of ['reto', 'analisis', 'editor']) {
        await p.pulsar(`nav a[data-pantalla=${id}]`);
        await p.esperar(250);
        m = await medida();
        if (m.scroll > 375) throw new Error(`#${id}: scrollWidth ${m.scroll} > 375`);
      }
      return `tablero de ${ancho.toFixed(0)} px, scrollWidth ${m.scroll}`;
    },
  },
  {
    nombre: 'e) el modo ayuda no rompe nada (activar y jugar dos jugadas)',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 4 }, inicio: 'libre', jugadores: HUMANOS });
      await p.pulsar(`button[aria-pressed]`);
      if (await p.evaluar(`document.querySelector('button[aria-pressed]').getAttribute('aria-pressed')`) !== 'true') {
        throw new Error('el interruptor no queda activado');
      }
      for (let k = 1; k <= 2; k++) {
        const antes = await rellenas(p);
        await p.pulsar(`.zona-tablero [data-indice].legal`);
        await p.esperar(100);
        const despues = await rellenas(p);
        if (despues !== antes + 1) throw new Error(`jugada ${k}: casillas rellenas ${antes} → ${despues}`);
      }
      if (!await p.evaluar(`!!document.querySelector('.techo')`)) throw new Error('con la ayuda no aparece el techo');
      consolaLimpia(p);
      await captura(ctx, p, 'e-ayuda');
    },
  },
  {
    nombre: 'f) la ventana de papeles sale al empezar, con los dos nombres, y mientras está abierta nadie juega',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, {
        generadorId: 'cuadrado4', parametros: { lado: 4 }, ventanaDePapeles: false,
        jugadores: [{ tipo: 'maquina', nivel: 'aleatorio' }, { tipo: 'maquina', nivel: 'aleatorio' }],
      });
      const v = await ventana(p);
      if (v.titulo !== 'Par 1 · Ronda 1') throw new Error(`título «${v.titulo}»`);
      for (const frase of ['Jugador A es el gusano', 'Jugador B es el pájaro', 'La casilla inicial ya está puesta: mueve primero Jugador B (pájaro).']) {
        if (!v.texto.includes(frase)) throw new Error(`falta «${frase}» en: ${v.texto}`);
      }
      await captura(ctx, p, 'f-papeles-1200');
      const antes = await rellenas(p);
      await p.esperar(1500);
      if (await rellenas(p) !== antes) throw new Error('la máquina jugó con la ventana de papeles abierta');
      await pulsarVentana(p, 'Empezar');
      if (!await p.esperarHasta(`document.querySelectorAll('.zona-tablero [data-indice].gusano, .zona-tablero [data-indice].pajaro').length > ${antes}`, 5000)) {
        throw new Error('al pulsar «Empezar» la máquina no empieza a jugar');
      }
      consolaLimpia(p);
    },
  },
  {
    nombre: 'g) a mitad de la ronda 1 los saldos son +N y −N con N las casillas del gusano',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 4 }, inicio: 'libre', jugadores: HUMANOS });
      for (let k = 0; k < 3; k++) await p.pulsar('.zona-tablero [data-indice].legal');
      const n = await rellenas(p);
      if (n !== 3) throw new Error(`se esperaban 3 casillas rellenas y hay ${n}`);
      const dom = await saldosDom(p);
      if (dom[0] !== n || dom[1] !== -n) throw new Error(`saldos ${dom}, se esperaba [${n}, ${-n}]`);
      const textos = await p.evaluar(`[...document.querySelectorAll('.jugador-marcador .saldo')].map((e) => e.textContent)`);
      if (textos[0] !== `+${n}` || textos[1] !== `${MENOS}${n}`) throw new Error(`saldos escritos «${textos}»`);
      const brutos = await p.evaluar(`[...document.querySelectorAll('.jugador-marcador .brutos')].map((e) => e.textContent)`);
      if (brutos[0] !== `${n} como gusano`) throw new Error(`puntos brutos «${brutos}»`);
      consolaLimpia(p);
      return `saldos ${textos.join(' / ')}`;
    },
  },
  {
    nombre: 'h) fin de ronda: ventana, «Ver tablero» deja la ronda cerrada sin que juegue la máquina, y «Continuar» sigue',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, {
        generadorId: 'cuadrado4', parametros: { lado: 4 },
        jugadores: [{ tipo: 'maquina', nivel: 'aleatorio' }, { tipo: 'humano' }],
      });
      await jugarHastaVentana(p);
      const n = await rellenas(p);
      const v = await ventana(p);
      if (!v.texto.includes('Fin de la ronda 1 del par 1')) throw new Error(`ventana inesperada: ${v.texto}`);
      if (!v.texto.includes(`mide ${n} casillas`)) throw new Error(`se esperaba «mide ${n} casillas» en: ${v.texto}`);
      if (!v.texto.includes(`Jugador A +${n}, Jugador B ${MENOS}${n}`)) throw new Error(`falta el reparto +${n}/−${n}: ${v.texto}`);
      if (!v.botones.includes('Continuar con la ronda 2') || !v.botones.includes('Ver tablero')) throw new Error(`botones ${v.botones}`);
      await captura(ctx, p, 'h-fin-de-ronda-1200');
      await pulsarVentana(p, 'Ver tablero');
      if (await p.evaluar(HAY_VENTANA)) throw new Error('«Ver tablero» no cierra la ventana');
      await p.esperar(2000);
      if (await rellenas(p) !== n) throw new Error('al mirar el tablero cerrado la máquina ha jugado en la ronda siguiente');
      if (!await p.evaluar(`[...document.querySelectorAll('.botones button')].some((b) => b.textContent === 'Continuar con la ronda 2')`)) {
        throw new Error('no queda el botón «Continuar con la ronda 2» en la zona de botones');
      }
      const dom = await saldosDom(p);
      if (dom[0] !== n || dom[1] !== -n) throw new Error(`saldos con el tablero cerrado ${dom}, se esperaba [${n}, ${-n}]`);
      await captura(ctx, p, 'h-ver-tablero-1200');
      await p.pulsar('.botones button.principal');
      const cabecera = await p.evaluar(`document.querySelector('.ronda-actual').textContent`);
      if (!cabecera.includes('Ronda 2')) throw new Error(`tras «Continuar» la cabecera dice «${cabecera}»`);
      if (!await p.esperarHasta(`document.querySelectorAll('.zona-tablero [data-indice].gusano, .zona-tablero [data-indice].pajaro').length !== ${n}`, 5000)) {
        throw new Error('tras «Continuar» la ronda 2 no avanza');
      }
      consolaLimpia(p);
      return `ronda 1 de ${n} casillas`;
    },
  },
  {
    nombre: 'i) un solo history.back() vuelve a la pantalla anterior (Jugar → Reto → Análisis → Editor)',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      for (const id of ['reto', 'analisis', 'editor']) {
        await p.pulsar(`nav a[data-pantalla=${id}]`);
        await p.esperar(250);
      }
      await p.evaluar('history.back()');
      await p.esperar(400);
      const hash = await p.evaluar('location.hash');
      if (hash !== '#analisis') throw new Error(`tras un history.back() el hash es «${hash}», no #analisis`);
      const actual = await p.evaluar(`document.querySelector('nav a[aria-current=page]')?.dataset.pantalla`);
      if (actual !== 'analisis') throw new Error(`la pantalla activa es «${actual}»`);
      consolaLimpia(p);
    },
  },
  {
    nombre: 'j) las páginas no dejan el 404 del icono en la consola',
    async correr(ctx) {
      for (const pagina of ['index.html', 'reglas.html']) {
        const p = await Pagina.abrir(ctx.cdp);
        await p.ir(`${ctx.base}/${pagina}`);
        await p.esperar(300);
        consolaLimpia(p);
      }
    },
  },

  // ---------- casos de la verificación final (tarea 16) ----------

  {
    nombre: 'k) reto del día: se juega hasta el final y aparecen el par y el texto para copiar',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await p.pulsar('nav a[data-pantalla=reto]');
      if (!await p.esperarHasta(`!!document.querySelector('.reto .zona-tablero svg')`, 5000)) throw new Error('el reto no muestra el tablero');
      const fin = Date.now() + 60000;
      let jugadas = 0;
      while (!await p.evaluar(`!!document.querySelector('.reto-final')`)) {
        if (Date.now() > fin) throw new Error('el reto no termina en 60 s');
        if (await p.evaluar(`!!document.querySelector('.zona-tablero [data-indice].legal')`)) { await p.pulsar('.zona-tablero [data-indice].legal'); jugadas++; }
        else await p.esperar(100);
      }
      if (!await p.esperarHasta(`!!document.querySelector('.reto-texto')`, 8000)) throw new Error('no aparece el texto para copiar (el par no se calculó)');
      const r = await p.evaluar(`({ final: document.querySelector('.reto-final').textContent, par: document.querySelector('.reto-par').textContent,
        texto: document.querySelector('.reto-texto').value, otra: [...document.querySelectorAll('.botones button')].map((b) => b.textContent) })`);
      if (!/^Gusano #\d+ · \d+\/\d+ · par (\d+|no calculable)$/.test(r.texto)) throw new Error(`texto para copiar «${r.texto}»`);
      if (!/^Par: \d+$/.test(r.par)) throw new Error(`línea del par «${r.par}»`);
      if (!r.otra.includes('Otra vez')) throw new Error(`botones ${r.otra}`);
      consolaLimpia(p);
      await captura(ctx, p, 'k-reto');
      return `${jugadas} jugadas, «${r.texto}»`;
    },
  },
  {
    nombre: 'l) editor: grafo aleatorio de 10, «Jugar con este tablero» y una jugada',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await p.pulsar('nav a[data-pantalla=editor]');
      if (!await p.esperarHasta(`!!document.querySelector('.editor svg.lienzo')`, 5000)) throw new Error('el editor no monta');
      await p.evaluar(`(() => {
        const n = document.querySelector('.panel-editor input[type=number]');
        n.value = '10'; n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await p.evaluar(`[...document.querySelectorAll('.panel-editor fieldset button')].find((b) => b.textContent === 'Grafo aleatorio').dataset.prueba = 'aleatorio'`);
      await p.pulsar('[data-prueba=aleatorio]');
      const contador = await p.evaluar(`document.querySelector('.contador').textContent`);
      if (!contador.startsWith('10 casillas')) throw new Error(`contador «${contador}»`);
      if (await p.evaluar(`document.querySelectorAll('.lienzo circle.nodo').length`) !== 10) throw new Error('el lienzo no dibuja 10 nodos');
      await captura(ctx, p, 'l-editor');
      // Grafo del lienzo como lista de aristas por índice de nodo, para poder explicar un fallo.
      const grafo = await p.evaluar(`(() => {
        const nodos = [...document.querySelectorAll('.lienzo circle.nodo')].map((c) => [c.getAttribute('cx'), c.getAttribute('cy')].join());
        const aristas = [...document.querySelectorAll('.lienzo line.arista')].map((l) => [nodos.indexOf([l.getAttribute('x1'), l.getAttribute('y1')].join()), nodos.indexOf([l.getAttribute('x2'), l.getAttribute('y2')].join())]);
        return JSON.stringify({ casillas: nodos.length, aristas });
      })()`);
      await p.evaluar(`[...document.querySelectorAll('.panel-editor > button')].find((b) => b.textContent === 'Jugar con este tablero').dataset.prueba = 'jugar'`);
      await p.pulsar('[data-prueba=jugar]');
      if (!await p.esperarHasta(`!!document.querySelector('.zona-tablero svg')`, 5000)) throw new Error('«Jugar con este tablero» no abre la partida');
      if (await p.evaluar(`document.querySelectorAll('.zona-tablero [data-indice]').length`) !== 10) throw new Error('la partida no tiene las 10 casillas del editor');
      if (await p.esperarHasta(HAY_VENTANA, 2000)) await pulsarVentana(p, 'Empezar');
      // Jugador A es humano y B la máquina (que mueve primero tras la casilla inicial): se espera a tener jugadas legales.
      // En un grafo aleatorio la ronda puede acabar antes de que el humano mueva: entonces se pulsa «Continuar con …».
      const fin = Date.now() + 20000;
      while (!await p.evaluar(`!!document.querySelector('.zona-tablero [data-indice].legal')`)) {
        if (Date.now() > fin) {
          const estado = await p.evaluar(`JSON.stringify({
            ventana: (() => { const d = document.querySelector('dialog.ventana[open]'); return d ? { texto: d.innerText, botones: [...d.querySelectorAll('button')].map((b) => b.textContent) } : null; })(),
            zonaBotones: [...document.querySelectorAll('.botones button')].map((b) => b.textContent),
            ronda: document.querySelector('.ronda-actual')?.textContent,
            estado: document.querySelector('.estado')?.textContent,
            rellenas: document.querySelectorAll('.zona-tablero [data-indice].gusano, .zona-tablero [data-indice].pajaro').length,
            resultado: document.querySelector('.resultado')?.textContent ?? null,
          })`);
          throw new Error(`el humano no llega a tener jugadas legales. Grafo del editor: ${grafo}. Estado: ${estado}`);
        }
        const v = await ventana(p);
        if (v?.botones.some((b) => b.startsWith('Continuar con'))) await pulsarVentana(p, 'Continuar con');
        else if (v?.botones.includes('Empezar')) await pulsarVentana(p, 'Empezar');
        else await p.esperar(150);
      }
      const antes = await rellenas(p);
      await p.pulsar('.zona-tablero [data-indice].legal');
      await p.esperar(100);
      if (await rellenas(p) <= antes) throw new Error(`la jugada no rellena nada (${antes} casillas)`);
      consolaLimpia(p);
    },
  },
  {
    nombre: 'm) compartir: el enlace tras 3 jugadas, abierto en otra pestaña, reproduce camino y saldos',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 4 }, inicio: 'libre', jugadores: HUMANOS });
      for (let k = 0; k < 3; k++) await p.pulsar('.zona-tablero [data-indice].legal');
      const estadoDe = (q) => q.evaluar(`({
        casillas: [...document.querySelectorAll('.zona-tablero [data-indice]')].map((e) => [e.dataset.indice, e.classList.contains('gusano') ? 'g' : e.classList.contains('pajaro') ? 'p' : '-', e.classList.contains('cabeza') ? 'c' : '']).filter((c) => c[1] !== '-'),
        saldos: [...document.querySelectorAll('.jugador-marcador .saldo')].map((e) => e.textContent),
        ronda: document.querySelector('.ronda-actual')?.textContent })`);
      const original = await estadoDe(p);
      if (original.casillas.length !== 3) throw new Error(`se esperaban 3 casillas y hay ${original.casillas.length}`);
      await p.evaluar(`[...document.querySelectorAll('.botones button')].find((b) => b.textContent === 'Compartir').dataset.prueba = 'compartir'`);
      await p.pulsar('[data-prueba=compartir]');
      const enlace = await p.evaluar(`document.querySelector('.enlace-campo')?.value`);
      if (!enlace || !enlace.includes('#jugar&p=')) throw new Error(`enlace «${enlace}»`);
      const otra = await Pagina.abrir(ctx.cdp);
      await otra.tamano(1200, 900);
      await otra.ir(enlace.replace(/^https?:\/\/[^/]+/, ctx.base));
      if (!await otra.esperarHasta(`document.querySelectorAll('.zona-tablero [data-indice].gusano, .zona-tablero [data-indice].pajaro').length > 0`, 5000)) throw new Error('el enlace no reconstruye la partida');
      if (await otra.evaluar(HAY_VENTANA)) await pulsarVentana(otra, 'Empezar');
      const copia = await estadoDe(otra);
      if (JSON.stringify(copia) !== JSON.stringify(original)) throw new Error(`la copia difiere: ${JSON.stringify(copia)} ≠ ${JSON.stringify(original)}`);
      // Y se puede seguir jugando desde ahí.
      await otra.pulsar('.zona-tablero [data-indice].legal');
      if (await rellenas(otra) !== 4) throw new Error('en la copia no se puede continuar la partida');
      consolaLimpia(p);
      consolaLimpia(otra);
      return `saldos ${original.saldos.join(' / ')}`;
    },
  },
  {
    nombre: 'n) obstáculos 20 % y valores «centro» en cuadrado8 lado 5, máquina contra máquina hasta el final',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, {
        generadorId: 'cuadrado8', parametros: { lado: 5 }, obstaculos: 0.2, valores: 'centro',
        jugadores: [{ tipo: 'maquina', nivel: 'voraz' }, { tipo: 'maquina', nivel: 'voraz' }],
      });
      const bloqueadas = await p.evaluar(`document.querySelectorAll('.zona-tablero [data-indice].bloqueada').length`);
      if (bloqueadas !== 5) throw new Error(`con 20 % de 25 casillas se esperaban 5 bloqueadas y hay ${bloqueadas}`);
      const valores = await p.evaluar(`[...new Set([...document.querySelectorAll('.zona-tablero svg text')].map((t) => t.textContent))].sort().join(',')`);
      if (!/\b3\b/.test(valores)) throw new Error(`no se dibujan los valores del centro (textos: «${valores}»)`);
      await captura(ctx, p, 'n-obstaculos-valores');
      if (!await dejarJugarMaquinas(p, 60000)) throw new Error('no terminó en 60 s');
      const v = await ventana(p);
      if (!v.texto.includes('suman')) throw new Error(`con valores la ventana final debería decir «suman»: ${v.texto}`);
      consolaLimpia(p);
      return `${bloqueadas} bloqueadas, valores {${valores}}`;
    },
  },
  {
    nombre: 'o) análisis tras una partida: «Siguiente ›» recorre hasta la posición final y «‹ Anterior» vuelve',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await configurar(p, {
        generadorId: 'cuadrado4', parametros: { lado: 4 },
        jugadores: [{ tipo: 'maquina', nivel: 'voraz' }, { tipo: 'maquina', nivel: 'voraz' }],
      });
      if (!await dejarJugarMaquinas(p, 60000)) throw new Error('la partida no termina');
      await pulsarVentana(p, 'Analizar');
      if (!await p.esperarHasta(`!!document.querySelector('.analisis-pos')`, 5000)) throw new Error('no se abre el análisis');
      if (await p.evaluar('location.hash') !== '#analisis') throw new Error('el hash no es #analisis');
      const pos = () => p.evaluar(`document.querySelector('.analisis-pos').textContent`);
      const dentro = () => p.evaluar(`document.querySelectorAll('.analisis-tablero [data-indice].gusano, .analisis-tablero [data-indice].pajaro').length`);
      const boton = (texto) => p.evaluar(`[...document.querySelectorAll('.analisis-controles button')].find((b) => b.textContent === ${JSON.stringify(texto)}).dataset.prueba = 'an'`);
      const [, k0, total] = (await pos()).match(/Jugada (\d+) de (\d+)/);
      if (Number(total) < 2) throw new Error(`la ronda analizada tiene ${total} jugadas`);
      let n = 0;
      while (!await p.evaluar(`[...document.querySelectorAll('.analisis-controles button')].find((b) => b.textContent === 'Siguiente ›').disabled`)) {
        if (++n > 40) throw new Error('«Siguiente ›» nunca se desactiva');
        await boton('Siguiente ›');
        await p.pulsar('[data-prueba=an]');
      }
      if (n !== Number(total) - Number(k0)) throw new Error(`se pulsó ${n} veces «Siguiente ›» y la ronda tiene ${total} jugadas desde la ${k0}`);
      if ((await pos()) !== `Jugada ${total} de ${total}`) throw new Error(`posición final «${await pos()}»`);
      if (await dentro() !== Number(total)) throw new Error(`en la posición final hay ${await dentro()} casillas rellenas, no ${total}`);
      await captura(ctx, p, 'o-analisis-final');
      await boton('‹ Anterior');
      await p.pulsar('[data-prueba=an]');
      if (await dentro() !== Number(total) - 1) throw new Error('«‹ Anterior» no quita una casilla');
      consolaLimpia(p);
      return `${total} jugadas recorridas`;
    },
  },
  {
    nombre: 'p) reglas.html carga con las siete secciones, sin desbordar a 375 px y con la consola limpia',
    async correr(ctx) {
      const p = await Pagina.abrir(ctx.cdp);
      await p.tamano(375, 700);
      await p.ir(`${ctx.base}/reglas.html`);
      const ids = await p.evaluar(`[...document.querySelectorAll('main section, section')].map((s) => s.id)`);
      const esperadas = ['como-se-juega', 'gusano-y-pajaro', 'pares-y-puntos', 'tableros', 'obstaculos-y-valores', 'consejos', 'para-clase'];
      if (JSON.stringify(ids) !== JSON.stringify(esperadas)) throw new Error(`secciones ${ids}`);
      const vacias = await p.evaluar(`[...document.querySelectorAll('section')].filter((s) => !s.querySelector('h2') || s.textContent.trim().length < 80).map((s) => s.id)`);
      if (vacias.length) throw new Error(`secciones sin título o casi vacías: ${vacias}`);
      const scroll = await p.evaluar('document.documentElement.scrollWidth');
      if (scroll > 375) throw new Error(`scrollWidth ${scroll} > 375`);
      if (!await p.evaluar(`!!document.querySelector('a[href="index.html"], a[href="./"], a[href="index.html#jugar"]')`)) throw new Error('no hay enlace de vuelta a la app');
      consolaLimpia(p);
      await captura(ctx, p, 'p-reglas-375');
    },
  },
  {
    nombre: 'r) foco al cerrar una ventana (botón o Esc): «Continuar con …» si está, y si no el primer botón de la zona (§6, T18)',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      const esc = async () => {
        for (const type of ['keyDown', 'keyUp']) await p.enviar('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await p.esperar(300);
      };
      const foco = () => p.evaluar(`document.activeElement.tagName === 'BUTTON' ? document.activeElement.textContent : document.activeElement.tagName`);
      const primero = () => p.evaluar(`document.querySelector('.botones button')?.textContent`);
      await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 4 }, jugadores: HUMANOS, ventanaDePapeles: false });
      await esc();
      if (await p.evaluar(HAY_VENTANA)) throw new Error('Esc no cierra la ventana de papeles');
      if (await foco() !== await primero()) throw new Error(`tras Esc en la ventana de papeles el foco está en «${await foco()}», no en «${await primero()}»`);
      await jugarHastaVentana(p);
      await esc();
      if (!(await foco()).startsWith('Continuar con')) throw new Error(`tras Esc en el fin de ronda el foco está en «${await foco()}»`);
      await p.pulsar('.botones button.principal');
      await p.esperarHasta(HAY_VENTANA, 3000);
      if (await ventana(p)) await pulsarVentana(p, 'Empezar');
      await jugarHastaVentana(p);
      await pulsarVentana(p, 'Ver tablero');
      if (await foco() !== await primero()) throw new Error(`tras «Ver tablero» en la ventana final el foco está en «${await foco()}», no en «${await primero()}»`);
      // Con otra ronda por delante, «Ver tablero» deja el foco en «Continuar con …».
      const q = await abrirApp(ctx);
      await configurar(q, { generadorId: 'cuadrado4', parametros: { lado: 4 }, jugadores: HUMANOS });
      await jugarHastaVentana(q);
      await pulsarVentana(q, 'Ver tablero');
      const f = await q.evaluar(`document.activeElement.textContent`);
      if (!f.startsWith('Continuar con')) throw new Error(`tras «Ver tablero» el foco está en «${f}»`);
      consolaLimpia(p);
      consolaLimpia(q);
      return `Esc/«Ver tablero» → foco en «${f}»`;
    },
  },
  {
    nombre: 's) editor: importar un JSON inválido avisa solo del archivo, sin «No conexo» ni «Hacen falta» (§7.3, T18); la ayuda explica la selección',
    async correr(ctx) {
      const p = await abrirApp(ctx);
      await p.pulsar('nav a[data-pantalla=editor]');
      if (!await p.esperarHasta(`!!document.querySelector('.editor svg.lienzo')`, 5000)) throw new Error('el editor no monta');
      const ayuda = await p.evaluar(`document.querySelector('.editor .ayuda').textContent`);
      if (!/selecci[oó]n se encadena/.test(ayuda)) throw new Error(`la ayuda no explica la selección encadenada: «${ayuda}»`);
      const importa = (contenido) => p.evaluar(`(() => {
        const i = document.querySelector('.editor input[type=file]');
        const dt = new DataTransfer();
        dt.items.add(new File([${JSON.stringify(contenido)}], 'prueba.json'));
        i.files = dt.files;
        i.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      const aviso = () => p.evaluar(`document.querySelector('.editor .aviso').textContent`);
      await importa('{"a":1}');
      if (!await p.esperarHasta(`document.querySelector('.editor .aviso').textContent.includes('no es válido')`, 3000)) throw new Error(`no sale el aviso de tablero inválido: «${await aviso()}»`);
      for (const mezcla of ['No conexo', 'Hacen falta']) {
        if ((await aviso()).includes(mezcla)) throw new Error(`el aviso de importar mezcla «${mezcla}»: «${await aviso()}»`);
      }
      await importa('esto no es json');
      if (!await p.esperarHasta(`document.querySelector('.editor .aviso').textContent === ''  && document.querySelector('.editor li')?.textContent.includes('JSON')`, 3000)) {
        throw new Error(`tras un archivo que no es JSON: aviso «${await aviso()}»`);
      }
      // En cuanto el lienzo cambia, el aviso de siempre vuelve.
      await p.pulsar('.editor svg.lienzo');
      if (!await p.esperarHasta(`document.querySelector('.editor .aviso').textContent.includes('Hacen falta')`, 3000)) throw new Error(`al cambiar el lienzo no vuelve «Hacen falta»: «${await aviso()}»`);
      consolaLimpia(p);
      return 'aviso solo del archivo; vuelve al editar';
    },
  },
  {
    nombre: 't) análisis: el pájaro «perdió» puntos, nunca «regaló» (§7.1, T18)',
    async correr(ctx) {
      // Una partida aleatoria puede no dar ninguna jugada en la que el pájaro pierda: se prueba con otra (hasta 6).
      for (let intento = 1; intento <= 6; intento++) {
        const p = await abrirApp(ctx);
        await configurar(p, {
          generadorId: 'cuadrado4', parametros: { lado: 4 },
          jugadores: [{ tipo: 'maquina', nivel: 'aleatorio' }, { tipo: 'maquina', nivel: 'aleatorio' }],
        });
        if (!await dejarJugarMaquinas(p, 60000)) throw new Error('la partida no termina');
        await pulsarVentana(p, 'Analizar');
        if (!await p.esperarHasta(`!!document.querySelector('.analisis-pos')`, 5000)) throw new Error('no se abre el análisis');
        const texto = () => p.evaluar(`document.querySelector('.analisis').innerText`);
        const sinCalcular = `!document.querySelector('.analisis').innerText.includes('calculando')`;
        let vistoPajaro = false;
        for (let k = 0; k < 40; k++) {
          if (!await p.esperarHasta(sinCalcular, 8000)) throw new Error('el análisis se queda en «calculando…»');
          const t = await texto();
          if (t.includes('regaló')) throw new Error(`el análisis dice «regaló»: ${t.slice(0, 300)}`);
          if (t.includes('Aquí el pájaro perdió')) vistoPajaro = true;
          if (await p.evaluar(`[...document.querySelectorAll('.analisis-controles button')].find((b) => b.textContent === 'Siguiente ›').disabled`)) break;
          await p.evaluar(`[...document.querySelectorAll('.analisis-controles button')].find((b) => b.textContent === 'Siguiente ›').dataset.prueba = 'an'`);
          await p.pulsar('[data-prueba=an]');
        }
        if (!/\(pájaro\) perdió/.test(await texto())) throw new Error('el resumen no dice «(pájaro) perdió»');
        consolaLimpia(p);
        if (vistoPajaro) return `«Aquí el pájaro perdió» visto (partida ${intento}), sin «regaló»`;
      }
      throw new Error('en 6 partidas aleatorias el pájaro no perdió puntos en ninguna jugada: no se vio «Aquí el pájaro perdió»');
    },
  },
  {
    nombre: 'q) modo oscuro: el fondo del body cambia y ningún texto baja de 4,5:1 de contraste (también en el tema claro), en la app y en las reglas',
    async correr(ctx) {
      const medir = `(() => {
        const rgb = (s) => s.match(/[\\d.]+/g).map(Number);
        const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u); return (x + 0.05) / (y + 0.05); };
        const fondoDe = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length < 4 || c[3] > 0.5) return c.slice(0, 3); } return rgb(getComputedStyle(document.documentElement).backgroundColor).slice(0, 3); };
        const malos = [];
        for (const e of document.querySelectorAll('body *')) {
          if (!e.checkVisibility?.() || e.closest('svg')) continue;
          if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          const est = getComputedStyle(e);
          const c = contraste(rgb(est.color).slice(0, 3), fondoDe(e));
          if (c < 4.5) malos.push({ c, texto: e.tagName.toLowerCase() + '.' + e.className + ' ' + c.toFixed(1) + ' «' + e.textContent.trim().slice(0, 20) + '»' });
        }
        return { fondo: getComputedStyle(document.body).backgroundColor, html: getComputedStyle(document.documentElement).backgroundColor, malos };
      })()`;
      const resultados = [];
      for (const [pagina, preparar] of [['index.html#jugar', null], ['reglas.html', null], ['index.html#jugar', 'partida']]) {
        const p = await Pagina.abrir(ctx.cdp);
        await p.tamano(1200, 900);
        await p.enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
        await p.ir(`${ctx.base}/${pagina}`);
        const claro = await p.evaluar(medir);
        await p.enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
        await p.esperar(200);
        if (preparar === 'partida') {
          await configurar(p, { generadorId: 'cuadrado4', parametros: { lado: 4 }, jugadores: HUMANOS, ventanaDePapeles: false });
          await p.esperar(200);
        }
        const oscuro = await p.evaluar(medir);
        const nombre = `${pagina}${preparar ? ' (ventana de papeles)' : ''}`;
        if (!preparar && oscuro.html === claro.html && oscuro.fondo === claro.fondo) throw new Error(`${nombre}: el fondo no cambia (${claro.fondo})`);
        // §6 (T18): todo texto llega a 4,5:1 (WCAG AA) en los dos temas; por debajo es un fallo.
        for (const [tema, m] of [['oscuro', oscuro], ['claro', claro]]) {
          if (m.malos.length) throw new Error(`${nombre} en ${tema}: contraste < 4,5: ${m.malos.slice(0, 8).map((x) => x.texto).join(' | ')}`);
        }
        resultados.push(`${nombre}: ${claro.html} → ${oscuro.html}`);
        if (preparar === 'partida') await captura(ctx, p, 'q-oscuro-papeles');
        else await captura(ctx, p, `q-oscuro-${pagina.split('.')[0]}`);
        consolaLimpia(p);
      }
      return resultados.join('; ');
    },
  },
];

// ---------- ejecución ----------

const elegidos = solo ? casos.filter((c) => c.nombre.includes(solo)) : casos;
if (!elegidos.length) { console.error(`Ningún caso contiene «${solo}».`); process.exit(2); }

const t0 = Date.now();
const servidor = await servir();
const base = `http://127.0.0.1:${servidor.address().port}`;
let cdp = null;
let fallos = 0;
try {
  cdp = await Cdp.lanzar({ chrome });
  for (const caso of elegidos) {
    const t1 = Date.now();
    try {
      const detalle = await caso.correr({ cdp, base });
      console.log(`OK     ${caso.nombre}${detalle ? ` — ${detalle}` : ''} (${((Date.now() - t1) / 1000).toFixed(1)} s)`);
    } catch (e) {
      fallos++;
      console.log(`FALLO  ${caso.nombre} — ${e.message}`);
    }
  }
} finally {
  await cdp?.cerrar();
  servidor.close();
}
console.log(fallos ? `${fallos} caso(s) con FALLO (${((Date.now() - t0) / 1000).toFixed(1)} s)` : `TODO OK (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(fallos ? 1 : 0);
