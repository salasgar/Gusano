# Tarea 01 · Esqueleto del proyecto

Actualizado: 2026-10-20
Precondición: ninguna, pero **ningún otro reclamo vivo** (es la primera tarea y todas dependen de ella) · Disparo: MANUAL
Duración esperada: 15 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: BAJO · Encadenable con: —
Ficheros que toca: `package.json`, `LICENSE`, `index.html`, `css/estilo.css`, `js/util/azar.js`, `tests/azar.test.js`, `README.md` (todos nuevos)

La banda dice con qué modelo conviene abrir la sesión: BAJO es el más rápido del menú
(tabla de bandas en `reparto/proyecto.md`). **Este fichero es la fuente de la banda**: el
tablón la copia de aquí al regenerarse. Todo lo que hay que escribir está dado
literalmente abajo; no hay nada que decidir.

## Antes de empezar
1. Lee `reparto/tareas/_COMUN.md`, `reparto/_ESTADO.md` y lista `reparto/hechos/`
   (reclamos, terminadas, reabiertas, sustituidas, fallos). `date -u` para la hora real.
   Si hay **cualquier** reclamo vivo, esta tarea no se reclama: dilo y para.
2. Comprueba que no está hecha: `ls /Users/salasgar/Documents/git/Gusano/package.json`
   debe fallar. Si existe, mira `git log --oneline` y `reparto/hechos/terminadas/`.
3. Reclama con el comando de `_COMUN.md` poniendo `NN` = `01` y `MINUTOS` = `45`.
4. `sleep 30 && ls hechos/reclamos/`. Si hay otro reclamo vivo de la 01 anterior al tuyo,
   `CEDIDA a <sid>` y para.
5. Si ganas, regenera `reparto/_ESTADO.md` entero y sigue hasta cerrar; no termines el
   turno para pedir confirmación.

## Objetivo
Que el repositorio tenga lo mínimo para que las tareas 02 y 04 empiecen en paralelo:
`package.json` con `npm test`, la licencia, un `index.html` provisional, las variables de
estilo, el generador aleatorio con semilla (lo usan motor, máquina, reto y obstáculos) y
una prueba que pase.

## Siguiente paso
`cd /Users/salasgar/Documents/git/Gusano && ls` debe mostrar `.gitignore`,
`ESPECIFICACION.md` y `reparto/`, nada más.

## Qué hay que hacer
Crea estos siete ficheros con el contenido exacto (con la herramienta de escritura de la
sesión, no desde el shell):

1. `package.json`:
```json
{
  "name": "gusano",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Gusano: juego de estrategia para dos jugadores sobre un grafo",
  "author": "Juan Luis Salas García",
  "license": "MIT",
  "scripts": {
    "test": "node --test",
    "servir": "python3 -m http.server 8000"
  }
}
```
2. `LICENSE`: la licencia MIT estándar en inglés («MIT License», «Copyright (c) 2026 Juan
   Luis Salas García», los tres párrafos habituales: permiso, inclusión del aviso, sin
   garantía).
3. `index.html`:
```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="author" content="Juan Luis Salas García">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gusano</title>
<link rel="stylesheet" href="css/estilo.css">
</head>
<body>
<main><h1>Gusano</h1><p>En construcción.</p></main>
</body>
</html>
```
4. `css/estilo.css`:
```css
/* Gusano · © 2026 Juan Luis Salas García */
:root {
  --fondo: #f9f9f7; --texto: #1a1a1a; --texto-suave: #666; --borde: #d8d8d4; --panel: #ffffff;
  --acento: #2f6fdb; --gusano: #2f9e5a; --pajaro: #6a5acd; --legal: #f2c94c; --bloqueada: #3c3c3c;
  --radio: 10px;
}
@media (prefers-color-scheme: dark) {
  :root { --fondo: #0d0d0d; --texto: #ececec; --texto-suave: #a0a0a0; --borde: #333; --panel: #181818; --acento: #6b9cff; --bloqueada: #555; }
}
html { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--fondo); color: var(--texto); }
body { margin: 0 auto; padding: 16px; max-width: 960px; }
```
5. `js/util/azar.js`:
```js
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
```
6. `tests/azar.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAzar, semillaDesdeTexto } from '../js/util/azar.js';

test('la misma semilla da la misma secuencia', () => {
  const a = crearAzar(42);
  const b = crearAzar(42);
  for (let i = 0; i < 100; i++) assert.equal(a.siguiente(), b.siguiente());
});

test('siguiente está en [0, 1) y entero en el rango pedido', () => {
  const azar = crearAzar(7);
  for (let i = 0; i < 1000; i++) {
    const x = azar.siguiente();
    assert.ok(x >= 0 && x < 1);
    const n = azar.entero(3, 5);
    assert.ok(n >= 3 && n <= 5);
  }
});

test('semillaDesdeTexto es estable y distinta para textos distintos', () => {
  assert.equal(semillaDesdeTexto('gusano-1'), semillaDesdeTexto('gusano-1'));
  assert.notEqual(semillaDesdeTexto('gusano-1'), semillaDesdeTexto('gusano-2'));
});

test('barajar conserva los elementos y elegir devuelve uno de la lista', () => {
  const azar = crearAzar(3);
  assert.deepEqual([...azar.barajar([1, 2, 3, 4, 5])].sort(), [1, 2, 3, 4, 5]);
  assert.ok(['a', 'b'].includes(azar.elegir(['a', 'b'])));
});
```
7. `README.md` (lo completa la tarea 15):
```markdown
# Gusano

Juego de estrategia para dos jugadores sobre un grafo, de Juan Luis Salas García.
Aplicación web estática sin dependencias: en construcción.

- Ver en local: `python3 -m http.server 8000` desde esta carpeta y abrir http://localhost:8000/
- Pruebas: `npm test` (Node 22 o posterior)
- Especificación: `ESPECIFICACION.md` · Licencia: MIT
```
8. `cd /Users/salasgar/Documents/git/Gusano && npm test` → `pass 4`, `fail 0`.

## Datos de entrada
Ninguno. `ESPECIFICACION.md` §0 (convenciones) por si quieres entender para qué sirve cada
fichero.

## Salida esperada
Los siete ficheros de arriba, en un commit:
`git add package.json LICENSE index.html css/estilo.css js/util/azar.js tests/azar.test.js README.md && git commit -m "Tarea 01: esqueleto del proyecto" -- package.json LICENSE index.html css/estilo.css js/util/azar.js tests/azar.test.js README.md`
(termina el mensaje con la línea de atribución de tu entorno).

## Cómo saber que ha terminado
`npm test` dice `pass 4` y `fail 0`; `git status --short` no lista nada fuera de
`reparto/hechos/`; `git log --oneline -1` muestra tu commit.

## Al terminar
Sigue «Cierre» de `_COMUN.md`: terminada con el hash y `pass 4`, `CERRADA`, tablón
regenerado (con la 01 LISTA pasan de BLOQUEADA a PENDIENTE la 02 y la 04), commit de tus
`hechos/`, el tablón y esta ficha con rutas explícitas. Foto del momento y frases: tras
la 01 caben dos sesiones a la vez, `GU T02+T03 (MEDIO)` y `GU T04+T05 (MEDIO)` (la 05
espera también a la 02; si al cerrar la 04 la 02 no está LISTA, esa sesión para y lo
dice). No encadenes: la 02 y la 04 son de otra banda.

## Trampas conocidas
- `node --test` sin argumentos (ver `_COMUN.md`).
- Ninguna más por ahora.

## Prohibido
- Tocar `.gitignore`, `ESPECIFICACION.md` o cualquier fichero de `reparto/` que no sea
  tuyo (tus `hechos/`, el tablón al regenerarlo, esta ficha).
- Cambiar una coma del contenido dado: si algo falla, incidencia y avisa.
- `git add -A`, crear un remoto, `push`, añadir dependencias.
