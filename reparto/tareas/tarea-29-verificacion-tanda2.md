# Tarea 29 · Verificación de la tanda 2

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: 20 a 28 LISTAS, sin reabiertas pendientes · Disparo: MANUAL
Duración esperada: 45 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 90 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `herramientas/test-ui.js` (casos nuevos) y la carpeta de salida
`reparto/salidas/29-verificacion-tanda2/`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` entero (sobre todo §10) y `reparto/_ESTADO.md`;
   lista `reparto/hechos/` (una reabierta sin terminada posterior bloquea esta tarea).
   Lee las terminadas de 20 a 28 y el veredicto de la 16
   (`reparto/salidas/16-verificacion-final/veredicto.md`). `date -u`.
2. Precondición: las nueve terminadas existen.
3. Reclama (`NN` = `29`, `MINUTOS` = `90`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Decir si la tanda 2 cumple §10 sin haber roto nada de la tanda 1, con pruebas repetibles
para lo que se pueda y a mano para lo demás, y sacar a la luz lo que nadie previó.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde tal como están.

## Qué hay que hacer
1. Casos nuevos en `herramientas/test-ui.js`: toro rectangular con su franja de fantasmas
   (pulsar un fantasma juega la casilla real); flechas `manhattan` (solo se resaltan las
   salidas a favor de la flecha); dos cabezas (una casilla ambigua pide extremo, y elegir
   uno juega); dos gusanos máquina contra máquina hasta el final con el resultado del más
   largo; dos gusanos de dos cabezas; un poliedro en 3D (arrastrar gira sin jugar, pulsar
   una cara juega); un enlace `v: 2` abierto en otra pestaña; `soloSi` oculta `corriente`
   sin toro. Ajusta el caso de las reglas si la 28 añadió secciones. Sigue en «TODO OK».
2. A mano en Chrome (el navegador de la sesión o capturas sin cabeza a 375 y 1200 px,
   claro y oscuro): cada modo con cada tipo de bordes, el toro hexagonal, los seis
   sólidos en 3D con ratón y con táctil emulado, una partida de cada modo con análisis, y
   una partida clásica de la tanda 1 que se vea y se juegue igual que antes.
3. `reparto/salidas/29-verificacion-tanda2/veredicto.md` con **Veredicto** (cada punto de
   §10: cumple / no cumple y cómo lo viste) y **Hallazgos fuera de criterio** aparte;
   marcador `.ok-<sid>`. Lo que no cumpla va a `hechos/reabiertas/NN--<sid>.md` de la tarea
   responsable con lo exacto a corregir; no lo arregles tú.
4. `npm test` y `node herramientas/test-ui.js` en verde dos veces seguidas.

## Datos de entrada
- Todo el repositorio (solo lectura salvo `test-ui.js`). Veredicto de la 16.

## Salida esperada
Commit: `git commit -m "Tarea 29: casos de la tanda 2 en el arnés" --
herramientas/test-ui.js`; el veredicto con su marcador va en el commit de cierre.

## Cómo saber que ha terminado
Los dos arneses en verde dos veces seguidas; veredicto con las dos partes y marcador; cada
«no cumple» tiene su reabierta.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. En el mensaje de cierre, a Juan Luis: el veredicto en una
línea, los hallazgos fuera de criterio como decisiones pendientes, y qué tareas quedaron
reabiertas, con sus frases. **No hagas `push`.**

## Trampas conocidas
- Las de la 08 y la 19 para el arnés (coordenadas de pulsación, espera a la máquina, la
  ventana de fin de ronda que puede salir antes de que el humano mueva).
- En 3D, una pulsación tiene que ser sin movimiento: con CDP, `mousePressed` y
  `mouseReleased` en el mismo punto.

## Prohibido
- Arreglar código de la app. Editar desde el shell. `git add -A`. Dependencias. Remoto o
  `push`.
