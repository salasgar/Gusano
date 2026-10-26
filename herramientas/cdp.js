/* Gusano · © 2026 Juan Luis Salas García · Licencia MIT */
// Mini cliente del protocolo DevTools (CDP) para Chrome sin cabeza, sin paquetes
// (Node ≥ 22 trae `fetch` y `WebSocket` globales). Lo usa herramientas/test-ui.js.

import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

export const CANDIDATOS_CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

export function buscarChrome(ruta) {
  return ruta || process.env.CHROME || CANDIDATOS_CHROME.find((r) => fs.existsSync(r));
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// Chromes lanzados por este proceso que siguen vivos. Se matan al salir pase lo que pase
// (fallo a medias, Ctrl-C, SIGTERM de quien nos lanzó): un Chrome sin cabeza que sobrevive
// a su script queda colgado de launchd y no deja abrir el Chrome normal.
const vivos = new Set();
let manejadoresInstalados = false;

const sigueVivo = (proc) => proc.exitCode === null && proc.signalCode === null;

function matarVivos() {
  for (const proc of vivos) {
    if (sigueVivo(proc)) {
      try { proc.kill('SIGKILL'); } catch { /* ya no existe */ }
    }
  }
}

// Mata los procesos con perfil gusano-cdp que se han quedado sin dueño (de esta ejecución o
// de una anterior que murió sin cerrar) y lo dice. Los de otra ejecución en curso no se
// tocan: su padre sigue vivo.
export function limpiarHuerfanos() {
  let lineas;
  try {
    const pids = execFileSync('pgrep', ['-f', 'gusano-cdp'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    lineas = execFileSync('ps', ['-o', 'pid=,ppid=,lstart=,command=', '-p', pids.join(',')], { encoding: 'utf8' }).trim().split('\n');
  } catch {
    return []; // pgrep sale con 1 cuando no encuentra ninguno
  }
  const propios = new Set([...vivos].map((p) => p.pid));
  const matados = [];
  for (const linea of lineas) {
    const m = linea.trim().match(/^(\d+)\s+(\d+)\s+(\w+ \w+ +\d+ [\d:]+ \d+)\s+(.*)$/);
    if (!m || !m[4].includes('gusano-cdp')) continue;
    const pid = Number(m[1]);
    const ppid = Number(m[2]);
    // Los propios ya los ha matado matarVivos; sus hijos y los huérfanos (padre 1), aquí.
    if (pid === process.pid || propios.has(pid)) continue;
    if (ppid !== 1 && !propios.has(ppid)) continue;
    try {
      process.kill(pid, 'SIGKILL');
      matados.push(`pid ${pid}, arrancado ${m[3]}`);
    } catch { /* ya salió */ }
  }
  if (matados.length) {
    console.error(`AVISO: quedaban ${matados.length} proceso(s) de Chrome sin cerrar (gusano-cdp) y los he matado: ${matados.join('; ')}`);
  }
  return matados;
}

function instalarManejadores() {
  if (manejadoresInstalados) return;
  manejadoresInstalados = true;
  process.on('exit', () => { matarVivos(); limpiarHuerfanos(); });
  for (const [senal, codigo] of [['SIGINT', 130], ['SIGTERM', 143]]) {
    process.once(senal, () => { matarVivos(); process.exit(codigo); });
  }
}

// El perfil temporal va al scratchpad de la sesión de Claude Code si se puede deducir;
// si no, a la carpeta temporal del sistema.
function carpetaPerfiles() {
  const sesion = process.env.CLAUDE_CODE_SESSION_ID;
  if (sesion && process.getuid) {
    const scratchpad = path.join(`/private/tmp/claude-${process.getuid()}`, process.cwd().replaceAll('/', '-'), sesion, 'scratchpad');
    if (fs.existsSync(scratchpad)) return scratchpad;
  }
  return os.tmpdir();
}

// Pide un puerto libre al sistema (otras sesiones pueden tener su propio Chrome con depuración).
function puertoLibre() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.on('error', rej);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
  });
}

export class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pendientes = new Map();
    this.oyentes = [];
  }

  // Lanza Chrome sin cabeza con puerto de depuración (aleatorio) y perfil temporal.
  static async lanzar({ chrome, flags = [] } = {}) {
    const ruta = buscarChrome(chrome);
    if (!ruta) throw new Error('No encuentro Chrome: indica la ruta con --chrome o en la variable CHROME.');
    instalarManejadores();
    const perfil = fs.mkdtempSync(path.join(carpetaPerfiles(), 'gusano-cdp-'));
    const puerto = await puertoLibre();
    const proc = spawn(ruta, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
      `--user-data-dir=${perfil}`, `--remote-debugging-port=${puerto}`, '--window-size=1200,900',
      ...flags, 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'], detached: false });
    vivos.add(proc);
    proc.once('exit', () => vivos.delete(proc));
    try {
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d; });
      let version = null;
      for (let i = 0; i < 300 && !version; i++) {
        try { version = await (await fetch(`http://127.0.0.1:${puerto}/json/version`)).json(); } catch { await pausa(100); }
      }
      if (!version) throw new Error(`Chrome no arranca: ${stderr.slice(-500)}`);
      const ws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      const cdp = new Cdp(ws);
      cdp.proc = proc;
      cdp.perfil = perfil;
      ws.onmessage = (m) => cdp.recibir(JSON.parse(m.data));
      return cdp;
    } catch (e) {
      // Falló a medias: Chrome ya está lanzado y nadie más lo va a cerrar.
      if (sigueVivo(proc)) proc.kill('SIGKILL');
      try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* perfil temporal */ }
      throw e;
    }
  }

  recibir(msg) {
    if (msg.id && this.pendientes.has(msg.id)) {
      const { res, rej } = this.pendientes.get(msg.id);
      this.pendientes.delete(msg.id);
      if (msg.error) rej(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`));
      else res(msg.result);
    } else if (msg.method) {
      for (const o of this.oyentes) o(msg);
    }
  }

  enviar(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pendientes.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  // Cierra Chrome y espera a que salga antes de borrar el perfil (si no, aún está escribiendo en él).
  async cerrar() {
    try { this.ws.close(); } catch { /* ya cerrado */ }
    if (sigueVivo(this.proc)) {
      const salio = new Promise((res) => this.proc.once('exit', res));
      this.proc.kill();
      await Promise.race([salio, pausa(5000)]);
      if (sigueVivo(this.proc)) this.proc.kill('SIGKILL');
    }
    try {
      fs.rmSync(this.perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch { /* un perfil temporal que queda no justifica fallar la prueba */ }
  }
}

export class Pagina {
  constructor(cdp, sessionId) {
    this.cdp = cdp;
    this.sessionId = sessionId;
    this.consola = []; // «tipo: texto» de cada mensaje de la consola y cada excepción
  }

  static async abrir(cdp, url) {
    const { targetId } = await cdp.enviar('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.enviar('Target.attachToTarget', { targetId, flatten: true });
    const p = new Pagina(cdp, sessionId);
    await p.enviar('Page.enable');
    await p.enviar('Runtime.enable');
    await p.enviar('Log.enable');
    cdp.oyentes.push((msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === 'Runtime.consoleAPICalled') {
        p.consola.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description).join(' ')}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        p.consola.push(`excepción: ${d.exception?.description || d.text}`);
      } else if (msg.method === 'Log.entryAdded' && ['error', 'warning'].includes(msg.params.entry.level)) {
        p.consola.push(`${msg.params.entry.level}: ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`.trim());
      }
    });
    if (url) await p.ir(url);
    return p;
  }

  enviar(method, params) {
    return this.cdp.enviar(method, params, this.sessionId);
  }

  esperar(ms) {
    return pausa(ms);
  }

  async ir(url) {
    const cargada = new Promise((res) => {
      this.cdp.oyentes.push((msg) => {
        if (msg.sessionId === this.sessionId && msg.method === 'Page.loadEventFired') res();
      });
    });
    await this.enviar('Page.navigate', { url });
    await cargada;
    await this.esperar(150);
  }

  async tamano(ancho, alto, { movil = false } = {}) {
    await this.enviar('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: movil });
    await this.esperar(150);
  }

  async evaluar(expresion) {
    const r = await this.enviar('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`JS: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  }

  // Sondea una expresión JS cada 200 ms hasta que sea verdadera; false si se agota `tope` ms.
  async esperarHasta(expresion, tope = 10000) {
    const fin = Date.now() + tope;
    while (Date.now() < fin) {
      if (await this.evaluar(expresion)) return true;
      await this.esperar(200);
    }
    return false;
  }

  async clic(x, y) {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await this.enviar('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
    await this.esperar(40);
  }

  // Pulsa en el centro del primer elemento que case con `selector` (coordenadas de la ventana).
  async pulsar(selector) {
    const caja = await this.evaluar(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      if (!e) return null;
      e.scrollIntoView({ block: 'center', inline: 'center' });
      const r = e.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (!caja) throw new Error(`No existe ${selector}`);
    await this.clic(caja.x, caja.y);
  }

  async captura(ruta) {
    const { data } = await this.enviar('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(ruta, Buffer.from(data, 'base64'));
    return ruta;
  }
}
