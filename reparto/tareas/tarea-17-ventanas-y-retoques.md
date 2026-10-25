# Tarea 17 · Marcador de suma cero, ventanas de papeles y fin de ronda, y retoques

Actualizado: 2026-10-25 (dada de alta por la coordinadora s-20261025T073409-9564e458 a
petición de Juan Luis)
Precondición: 01-15 LISTAS (lo están) y ningún reclamo vivo de la 16 · Disparo: MANUAL
Duración esperada: 40 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 80 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/pantallas/jugar.js`, `js/ui/textos-partida.js` (nuevo),
`tests/textos-partida.test.js` (nuevo), `css/estilo.css`, `js/ui/app.js`,
`js/ui/ajustes.js` (una etiqueta), `index.html` y `reglas.html` (una línea en `<head>`;
`reglas.html` también el texto de los puntos), `README.md` (apartado Pruebas),
`herramientas/test-ui.js`

**Esta tarea toma ficheros de tareas cerradas** (07, 08, 15) para cambios que pidió Juan
Luis después: son suyos durante esta tarea y de nadie más. Las terminadas de aquellas
siguen siendo ciertas sobre lo que produjeron.

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§1, §6 entero, sobre todo el apartado «Marcador
   de suma cero, ventanas…», §7.4 y §8) y `reparto/_ESTADO.md`; lista `reparto/hechos/`.
   `date -u`.
2. Precondición: ningún reclamo vivo de la 16 (comparte `herramientas/test-ui.js`, y
   verifica lo que esta tarea cambia).
3. Reclama (`NN` = `17`, `MINUTOS` = `80`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que en la pantalla de juego se entienda en todo momento quién quiere qué y cómo va la
partida: saldo con signo (uno gana lo que el otro pierde), una ventana que explica los
papeles al empezar y otra que da el resultado de cada ronda antes de seguir. Y cerrar los
cuatro hallazgos de la verificación de la 08.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde tal como están. Después, las
funciones puras de `textos-partida.js` con sus pruebas; luego `jugar.js`.

## Qué hay que hacer
1. `js/ui/textos-partida.js` (nuevo, puro, sin DOM): `saldos(puntos)` → `[a − b, b − a]`;
   `conSigno(n)` → `'+9'`, `'−9'` (signo menos U+2212), `'0'`; y los textos de §6 como
   funciones de `(partida, nombres)`: papeles de una ronda (con la variante de valores y
   la línea de quién empieza según el inicio), fin de ronda y resultado de la partida.
2. `tests/textos-partida.test.js`: saldos opuestos y de suma cero; `conSigno` con
   positivo, negativo y 0; papeles con inicio libre y con azar, con y sin valores; fin
   de ronda con siguiente ronda en el mismo par, con siguiente par y en la última;
   resultado con ganador y con empate. Los números, contra `marcador()` de una partida
   real jugada con `jugarEnPartida` en un tablero pequeño.
3. `js/pantallas/jugar.js`: marcador con el saldo y los puntos brutos debajo (§6); quita
   el aviso «Fin de la ronda: …»; las dos ventanas con `<dialog>` y `showModal()`, foco
   en el botón principal, `Esc` = «Ver tablero» (evento `cancel`); la pausa: con una
   ventana abierta, o con el tablero de una ronda terminada a la vista, ni `alClicar` ni
   `programaMaquina` juegan. «Ver tablero» pinta la ronda **cerrada**
   (`partida.pares[parAnterior].rondas[rondaAnterior]`) sobre **su** tablero, aunque el
   motor ya haya pasado a la ronda o al par siguiente; «Continuar con …» vuelve a la
   ronda en curso y quita la pausa. Ventana de papeles al empezar y al cargar desde
   enlace una ronda sin empezar (§6), no al cargar una a medias ni una terminada.
4. `css/estilo.css`: estilo sobrio del `<dialog>` y su `::backdrop`, con los colores del
   gusano y el pájaro en los nombres, legible en modo oscuro y a 375 px; saldo grande y
   puntos brutos pequeños.
5. Retoques de la verificación de la 08 (`reparto/salidas/08-verificacion-app/veredicto.md`,
   «Hallazgos fuera de criterio» 1-3, y la nota de la terminada de la 15):
   - `js/ui/app.js`, `irA`: si `location.hash` ya es `#<id>` (el enlace del menú lo
     acaba de poner), no hagas `pushState`. Comprueba: Jugar → Reto → Análisis →
     Editor y un solo `history.back()` vuelve a Análisis.
   - `index.html` y `reglas.html`: `<link rel="icon" href="data:,">` en `<head>`, para
     que la consola no anote el 404 de `/favicon.ico`.
   - `js/ui/ajustes.js`: la etiqueta del desplegable pasa de «Tablero» a «Tipo» (la
     leyenda del grupo sigue siendo «Tablero»). Nada más del fichero.
   - `README.md`, apartado «Pruebas»: cómo se lanza `node herramientas/test-ui.js` y
     sus opciones `--solo` y `--capturas <carpeta>` (léelas en el propio fichero).
6. `reglas.html`, sección «Pares y puntos»: una frase que explique el saldo («el gusano
   gana los puntos de la ronda y el pájaro los pierde; el marcador muestra el saldo de
   cada uno»). No cambies las reglas, solo cómo se cuentan en pantalla.
7. `herramientas/test-ui.js`: que los casos existentes pulsen «Empezar» y «Continuar
   con …» y sigan en verde, y casos nuevos: la ventana de papeles sale al empezar con
   los dos nombres y los dos papeles; a mitad de la ronda 1 los saldos son `+N` y `−N`
   con N = puntos de la ronda en curso; al terminar la ronda sale la ventana de fin de
   ronda, «Ver tablero» deja el tablero de la ronda cerrada sin que la máquina juegue
   (espera 2 s y comprueba que no cambia) y «Continuar con la ronda 2» sigue; un solo
   `history.back()` vuelve a la pantalla anterior; consola sin el 404 del icono (quita
   la excepción que lo ignoraba). Sigue en < 90 s y en «TODO OK».
8. A mano en Chrome (el navegador de la sesión o capturas con `--capturas` a 375 y
   1200 px): las dos ventanas en claro y en oscuro, una partida humano contra máquina de
   2 pares entera, y una con casillas con valor (texto «suman»).
9. `npm test` y `node herramientas/test-ui.js` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §6 (el apartado nuevo es el contrato), §7.4, §8.
- `js/motor/partida.js` (solo lectura: `marcador`, `rondaActual`, `jugarEnPartida`).
- Veredicto de la 08 y terminada de la 15 (`reparto/hechos/terminadas/15--*`).

## Salida esperada
Commit: `git add js/ui/textos-partida.js tests/textos-partida.test.js && git commit -m
"Tarea 17: marcador de suma cero, ventanas y retoques" -- js/pantallas/jugar.js
js/ui/textos-partida.js tests/textos-partida.test.js css/estilo.css js/ui/app.js
js/ui/ajustes.js index.html reglas.html README.md herramientas/test-ui.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 10 pruebas nuevas); `test-ui.js` en «TODO OK» con los casos
nuevos; las dos ventanas vistas en Chrome; `history.back()` de una sola pulsación.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 17 LISTA pasa a PENDIENTE la 16: da su frase.
**No hagas `push`**: publica Juan Luis cuando lo pida.

## Trampas conocidas
- `jugarEnPartida` pasa a la ronda siguiente en la misma jugada que cierra una ronda: la
  ronda cerrada hay que guardarla (par y ronda anteriores) antes de llamar, como ya hace
  `jugarCasilla` para el aviso que se quita.
- Si la ronda siguiente es de otro par, `pintar()` cambia de tablero (`parDeLaVista`):
  durante la pausa la vista tiene que seguir en el tablero del par anterior.
- Un `<dialog>` cerrado con `Esc` dispara `cancel` y después `close`: trata los dos
  como «Ver tablero», no como «Continuar».
- Las de la 08 para el arnés (coordenadas de pulsación, espera a la máquina): léelas en
  `tarea-08-verificacion-app.md`.

## Prohibido
- Cambiar `marcador()` ni nada de `js/motor/`. Tocar `js/pantallas/reto.js`.
- Tocar en `ajustes.js` otra cosa que la etiqueta.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
- (Añadida al cerrar, sid s-20261025T101834-a5ce285e) `marcador()` ya cuenta la casilla inicial de la ronda siguiente en cuanto el motor pasa a ella: para el saldo «al cierre» de una ronda usa `marcadorAlCierre()` de `textos-partida.js`, no `marcador(partida)`.
- Con `<dialog>` modal los clics reales de `test-ui.js` no llegan al tablero: los casos tienen que pulsar «Empezar» / «Continuar con …» (helpers `pulsarVentana`, `jugarHastaVentana`, `dejarJugarMaquinas`).
