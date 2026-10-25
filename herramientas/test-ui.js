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
async function configurar(p, { generadorId = 'cuadrado4', parametros = {}, inicio = 'azar', jugadores }) {
  await p.evaluar(`(() => {
    const ponValor = (campo, valor) => { campo.value = valor; campo.dispatchEvent(new Event('change', { bubbles: true })); };
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
}

const HUMANOS = [{ tipo: 'humano' }, { tipo: 'humano' }];

async function abrirApp(ctx, ancho = 1200, alto = 900) {
  const p = await Pagina.abrir(ctx.cdp);
  await p.tamano(ancho, alto);
  await p.ir(`${ctx.base}/index.html#jugar`);
  return p;
}

const leeMarcadorDom = (p) => p.evaluar(`[...document.querySelectorAll('.jugador-marcador .puntos')].map((e) => Number(e.textContent))`);
const hayResultado = (p) => p.evaluar(`!!document.querySelector('.resultado')`);

function consolaLimpia(p) {
  // El navegador pide /favicon.ico por su cuenta: ese 404 no es de la app.
  const propios = p.consola.filter((l) => !/favicon/.test(l));
  if (propios.length) throw new Error(`consola con mensajes: ${propios.join(' | ')}`);
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
        const esperado = await p.evaluar(`window.__motor.m.marcador(window.__motor.partida).puntos`);
        const dom = await leeMarcadorDom(p);
        if (dom[0] !== esperado[0] || dom[1] !== esperado[1]) {
          throw new Error(`jugada ${jugadas} (casilla ${casilla}): marcador en pantalla ${dom} ≠ motor ${esperado}`);
        }
      }
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
      const acabo = await p.esperarHasta(`!!document.querySelector('.resultado')`, 60000);
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
      const rellenas = () => p.evaluar(`document.querySelectorAll('.zona-tablero [data-indice].gusano, .zona-tablero [data-indice].pajaro').length`);
      for (let k = 1; k <= 2; k++) {
        const antes = await rellenas();
        await p.pulsar(`.zona-tablero [data-indice].legal`);
        await p.esperar(100);
        const despues = await rellenas();
        if (despues !== antes + 1) throw new Error(`jugada ${k}: casillas rellenas ${antes} → ${despues}`);
      }
      if (!await p.evaluar(`!!document.querySelector('.techo')`)) throw new Error('con la ayuda no aparece el techo');
      consolaLimpia(p);
      await captura(ctx, p, 'e-ayuda');
    },
  },
];

// ---------- ejecución ----------

const elegidos = solo ? casos.filter((c) => c.nombre.includes(solo)) : casos;
if (!elegidos.length) { console.error(`Ningún caso contiene «${solo}».`); process.exit(2); }

const t0 = Date.now();
const servidor = await servir();
const base = `http://127.0.0.1:${servidor.address().port}`;
const cdp = await Cdp.lanzar({ chrome });
let fallos = 0;
try {
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
  await cdp.cerrar();
  servidor.close();
}
console.log(fallos ? `${fallos} caso(s) con FALLO (${((Date.now() - t0) / 1000).toFixed(1)} s)` : `TODO OK (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(fallos ? 1 : 0);
