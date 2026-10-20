# Tarea 08 · Arnés de interfaz en Chrome sin cabeza y verificación de la app

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 40 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 80 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `herramientas/cdp.js`, `herramientas/test-ui.js` (nuevos) y la carpeta de salida `reparto/salidas/08-verificacion-app/`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§6, §8) y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe.
3. Reclama (`NN` = `08`, `MINUTOS` = `80`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Dos cosas: una prueba de interfaz **repetible** (`node herramientas/test-ui.js`), que la
16 y cualquier sesión futura puedan lanzar antes de dar algo por bueno; y el veredicto
sobre la app de la 07 contra los criterios de §6, con los hallazgos fuera de criterio
aparte.

## Siguiente paso
`npm test` en verde. Lee
`/Users/salasgar/Documents/git/Conecta-puntos/reparto/datos/analisis-2026-10-19/accesibilidad/cdp.js`
(cliente DevTools sin dependencias) y `herramientas/test-ui.js` del mismo repositorio:
son el modelo. Aquí hay una diferencia: la app es de módulos ES y hay que servirla por
HTTP, así que `test-ui.js` arranca su propio servidor estático con `node:http` (sirve la
raíz del repositorio en un puerto libre, con los `Content-Type` de html, js, css, json,
svg, png) y lo apaga al terminar.

## Qué hay que hacer
1. `herramientas/cdp.js`: módulo ES con lo que necesita `test-ui.js`: lanzar Chrome sin
   cabeza con puerto de depuración, abrir una pestaña, navegar, evaluar JS en la página,
   pulsar en coordenadas de un elemento (`Input.dispatchMouseEvent` sobre el centro del
   `getBoundingClientRect` de un selector), recoger la consola, cambiar el tamaño de la
   ventana (`Emulation.setDeviceMetricsOverride`), capturar PNG, cerrar. Sin paquetes.
2. `herramientas/test-ui.js`: casos de §8 como mínimo: (a) `index.html` carga y la
   consola queda limpia (sin `error` ni `warning` propios); (b) partida humano-humano de
   un par en `cuadrado4` lado 4 jugada a pulsaciones sobre `[data-indice]` legales hasta
   el final, comprobando en cada jugada que el DOM del marcador coincide con lo que
   dice el motor (evalúa `marcador` importando el módulo en la página con `import()`
   dinámico) y que al final aparece el resultado; (c) `aleatorio` contra `perfecto` en
   `caballo` lado 5 termina sola en menos de 60 s; (d) a 375 × 700 el `scrollWidth` del
   documento no supera 375 y el tablero ocupa al menos 300 px de ancho; (e) el modo
   ayuda no rompe nada (activar y jugar dos jugadas). Imprime una línea `OK`/`FALLO`
   por caso y «TODO OK» con código 0, o código 1. Uso: `node herramientas/test-ui.js
   [--solo texto] [--chrome ruta]`. Duración objetivo: < 60 s.
3. Veredicto: `reparto/salidas/08-verificacion-app/veredicto.md` con dos partes
   separadas: **Veredicto** (criterio por criterio de §6 «Pantalla jugar», «Ajustes» y
   «Esbozos», y los cinco casos de arriba: cumple / no cumple, con la prueba) y
   **Hallazgos fuera de criterio** (todo lo que viste y no estaba previsto: textos
   confusos, colores, un botón que falta, lentitud). Marcador `veredicto.md.ok-<sid>`
   al acabar. Si un criterio no se cumple, no lo arregles: incidencia
   `hechos/incidencias/<sid>.md` y `hechos/reabiertas/07--<sid>.md` con lo exacto que
   hay que corregir (y la 07 vuelve a ser cogible).
4. `npm test` en verde (no cambia) y `node herramientas/test-ui.js` → «TODO OK».

## Datos de entrada
- `ESPECIFICACION.md` §6 y §8. La app entera (solo lectura).
- Conecta-puntos: `cdp.js` y `herramientas/test-ui.js` (solo lectura, modelo).

## Salida esperada
- Commit: `git add herramientas/cdp.js herramientas/test-ui.js && git commit -m "Tarea
  08: arnés de interfaz" -- herramientas/cdp.js herramientas/test-ui.js`.
- `reparto/salidas/08-verificacion-app/veredicto.md` + `veredicto.md.ok-<sid>` (van en
  el commit de cierre con tus `hechos/`).

## Cómo saber que ha terminado
`node herramientas/test-ui.js` termina en «TODO OK» dos veces seguidas (repetible); el
veredicto tiene las dos partes y el marcador.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Dile a Juan Luis los hallazgos fuera de criterio **en el
mensaje de cierre como decisiones pendientes**, no solo en el fichero. No desbloquea
tareas (la 16 espera a todas). No encadenes.

## Trampas conocidas
- `Input.dispatchMouseEvent` necesita `mousePressed` y `mouseReleased` con `button:
  'left'` y `clickCount: 1`; las coordenadas son de la ventana, no del documento.
- Esperar a que la máquina termine: sondea con `Runtime.evaluate` cada 200 ms una
  condición en el DOM, con tope.
- Ninguna otra por ahora.

## Prohibido
- Arreglar código de la app: esta tarea verifica. Lo que falle va a `reabiertas/`.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
