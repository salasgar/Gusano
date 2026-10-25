# Tarea 19 · Investigar el fallo intermitente del arnés y endurecerlo con lo de la 18

Actualizado: 2026-10-25 (dada de alta por la coordinadora s-20261025T073409-9564e458;
Juan Luis pidió «investiga qué pasa» con el hallazgo 7 de la 16)
Precondición: 18 LISTA · Disparo: MANUAL
Duración esperada: 20 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: MEDIO · Encadenable con: 18 (detrás de ella)
Ficheros que toca: `herramientas/test-ui.js`; y **solo si la causa del fallo está en el
código de la app**, el fichero donde esté (`js/pantallas/jugar.js` o
`js/pantallas/editor.js`), con el arreglo mínimo. Informe en
`reparto/salidas/19-arnes-intermitente/` con marcador `.ok-<sid>`.

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §6 y §8, y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. `date -u`.
2. Lee el hallazgo 7 de `reparto/salidas/16-verificacion-final/veredicto.md`, la
   terminada de la 16 y la de la 18 (`reparto/hechos/terminadas/1[68]--*`): la 18 puede
   haberte dejado notas para el arnés.
3. Precondición: `terminadas/18--*` existe y ningún reclamo vivo de la 18.
4. Reclama (`NN` = `19`, `MINUTOS` = `45`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Saber por qué el caso l) del arnés falló una vez de cada 30 en la 16, con pruebas, y
dejarlo fiable. Y que el arnés compruebe lo que arregló la 18, para que no vuelva.

## Siguiente paso
`node herramientas/test-ui.js` en verde tal como está. Después, repetir el caso l) muchas
veces guardando el estado cuando falle.

## Qué hay que hacer
1. **Reproducir.** El caso es «l) editor: grafo aleatorio de 10, «Jugar con este tablero»
   y una jugada»; el mensaje que dio la 16 fue «el humano no llega a tener jugadas
   legales». Ejecútalo en bucle (`for i in $(seq 1 60); do node herramientas/test-ui.js
   --solo "l)" || break; done`), y también con carga (dos bucles a la vez, o el arnés
   entero en paralelo con el caso suelto). Para poder explicar un fallo, haz que el caso,
   **cuando falle**, incluya en su error el JSON del tablero del editor, la casilla
   inicial y el estado de la ronda (`window.__motor` si está, o lo que exponga la página)
   y qué ventana había abierta.
2. **Explicar.** Escribe la causa con lo que viste: un grafo concreto en el que la ronda
   acaba sin que el humano mueva, una carrera de tiempos entre la máquina y la ventana,
   un fallo de la app, o «no se reproduce en N ejecuciones» si es así (con N, y con carga
   y sin carga). No des por buena una hipótesis que no hayas visto pasar.
3. **Arreglar donde esté la causa.** Si es el caso (espera mal hecha, una ventana que no
   se pulsa, un tiempo demasiado justo), arréglalo en el caso. Si es la app, arreglo
   mínimo en `jugar.js` o `editor.js` y un caso del arnés que lo reproduzca; si la causa
   está en cualquier otro fichero, no lo toques: `hechos/incidencias/<sid>.md` con la
   causa y para.
4. **Endurecer con lo de la 18** (§6, §7.1, §7.3, §8):
   - caso q): un contraste por debajo de 4,5 en modo oscuro pasa a ser **fallo**, no
     aviso;
   - foco: tras «Ver tablero» (y tras `Esc`), `document.activeElement` es el botón
     «Continuar con …»;
   - editor: importar un JSON inválido deja un aviso sin «No conexo» ni «Hacen falta»;
   - análisis: en una partida donde el pájaro pierde puntos sale «perdió», nunca
     «regaló»;
   - y ajusta cualquier caso que la 18 haya anotado como roto por un texto.
5. `reparto/salidas/19-arnes-intermitente/informe.md`: cuántas ejecuciones, con y sin
   carga, cuántos fallos antes y después, la causa (o por qué no se pudo saber) y qué se
   cambió. Marcador `.ok-<sid>`.
6. `npm test` en verde y `node herramientas/test-ui.js` en «TODO OK» **dos veces
   seguidas**, y el caso l) 50 veces seguidas sin fallo.

## Datos de entrada
- Veredicto de la 16; terminadas de la 16 y la 18. `herramientas/test-ui.js` (las
  ayudas `pulsarVentana`, `ventana`, `HAY_VENTANA`, `esperarHasta`).

## Salida esperada
Commit: `git commit -m "Tarea 19: arnés fiable y casos de la 18" -- herramientas/test-ui.js`
(y el fichero de la app si lo arreglaste); el informe con su marcador va en el commit de
cierre.

## Cómo saber que ha terminado
El informe dice la causa con pruebas, o cuántas ejecuciones se hicieron sin reproducirlo;
el caso l) pasa 50 veces seguidas; el arnés falla si el contraste en oscuro baja de 4,5;
los cuatro casos de la 18 están y en verde.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. En el mensaje de cierre, a Juan Luis: la causa del fallo en
dos líneas. Es la última tarea abierta: no hay frases que dar. **No hagas `push`**:
publica Juan Luis cuando lo pida.

## Trampas conocidas
- En el caso l) Jugador A es humano y B la máquina, que mueve primero tras la casilla
  inicial: en un grafo aleatorio la ronda puede acabar antes de que A mueva, y entonces
  sale la ventana de fin de ronda (el caso ya intenta pulsarla).
- `--solo` filtra por el texto del nombre del caso: `--solo "l)"`. (Ojo: filtra por
  subcadena y «r)» o «e)» casan también con otros nombres; usa una subcadena más larga.)
- (Hallado por la 19.) En el caso l) el fallo intermitente era la ronda 1 acabando antes de
  que el humano mueva; el caso debe pulsar «Continuar con …». Un caso que dependa de una
  partida aleatoria no puede exigir un suceso que el azar no garantiza: reintentar (caso t).
- Las de la 08 para el arnés: léelas en `tarea-08-verificacion-app.md`.

## Prohibido
- Subir tiempos de espera a ciegas para que «pase» sin saber por qué fallaba.
- Tocar ficheros de la app fuera de `jugar.js` / `editor.js`. Editar desde el shell.
  `git add -A`. Dependencias. Remoto o `push`.
