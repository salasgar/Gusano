# Tarea 06 · Vista del tablero en SVG

Actualizado: 2026-10-20
Precondición: 02 LISTA y 04 LISTA · Disparo: MANUAL
Duración esperada: 50 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 100 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/ui/vista-tablero.js`, `css/vista-tablero.css`, `demo/vista.html`, `demo/vista.js` (todos nuevos)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§0 estilo, §2.1, §3.1, §5) y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/02--*` y `terminadas/04--*` existen.
3. Reclama (`NN` = `06`, `MINUTOS` = `100`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
El único módulo que dibuja el tablero y el gusano, con la interfaz de §5, para que la
app (07), el análisis (09), el reto (10) y el editor (11) lo usen sin tocarlo. Y una
página de demostración para verlo funcionar antes de que exista la app.

## Siguiente paso
`npm test` en verde. `python3 -m http.server 8000` en segundo plano desde la raíz.
Escribe `js/ui/vista-tablero.js` con `crearVista` y `actualizar` y una `demo/vista.html`
que cargue `cuadrado4` lado 6.

## Qué hay que hacer
1. `js/ui/vista-tablero.js` (§5): `crearVista(contenedor, tablero, { alClicar })` crea un
   `<svg>` con `viewBox="0 0 ancho alto"`, `width: 100%`, `aspect-ratio` = ancho/alto, y
   `preserveAspectRatio="xMidYMid meet"`; capas en este orden: aristas (si
   `dibujo.aristas`), casillas, cuerpo del gusano, cabeza, textos. Cada casilla es un
   `<polygon>` (con `vertices`) o un `<circle>` (radio `dibujo.radio`) con
   `data-indice` y las clases de §5; pulsar llama a `alClicar(indice)`. `actualizar({
   ronda, legales, decoraciones, mostrarValores })` repinta clases, el cuerpo del gusano
   (`<polyline>` por los centros del camino; `stroke-width` ≈ 0,45 en unidades del
   tablero, `stroke-linejoin` y `stroke-linecap` redondeados, color `--gusano` con
   opacidad), la cabeza (círculo en la última casilla con dos ojos: dos puntos blancos
   con pupila, orientados hacia la casilla anterior si la hay) y los textos
   (`decoraciones[i].texto` y, con `mostrarValores`, el `valor` cuando algún valor ≠ 1;
   `etiqueta` pequeña en la esquina). Las casillas del camino llevan `gusano` o
   `pajaro` según la paridad de su posición (§3.1); la clase de `decoraciones[i].clase`
   se añade tal cual. `destruir()` vacía el contenedor.
2. `css/vista-tablero.css`: estilos por clase usando las variables de `css/estilo.css`
   con valores por defecto (`var(--gusano, #2f9e5a)`): casilla libre con borde suave y
   relleno de panel, `.legal` con relleno `--legal` y cursor pointer, `.gusano` y
   `.pajaro` rellenas con su color al 35 %, `.cabeza` borde grueso, `.bloqueada` relleno
   `--bloqueada` con tramado o cruz, `.inalcanzable` opacidad 0,4, `.arista` gris fino,
   textos con `font-size` relativo al tablero (`0.4` unidades) y `pointer-events: none`.
   Modo oscuro vía las variables.
3. `demo/vista.html` + `demo/vista.js` (módulo): desplegable con `generadores` y sus
   parámetros (campos numéricos / `select` a partir de `parametros`), botón «Nuevo»,
   casillas de verificación «Resaltar legales», «Numerar tramos», «Mostrar valores»;
   juega una ronda a dos manos con `js/motor/ronda.js` (`jugar` al pulsar una legal;
   ignora las no legales), muestra turno, puntuación y «Ronda terminada». Un botón
   «Valores de prueba» que asigna valor 1-3 al azar al tablero actual (para ver los
   números) y otro «Bloquear 3» que marca tres casillas al azar como bloqueadas y
   reinicia la ronda. La demo sirve a la 07 de referencia y a la 08 de humo; se queda en
   el repositorio.
4. Míralo en Chrome con los generadores `cuadrado4`, `cuadrado8`, `caballo`,
   `hexagonal` y `superficie` (y `poliedro` si la 03 está LISTA): a 375 px de ancho y a
   escritorio. Si no tienes el navegador de la sesión, captura con
   `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless
   --disable-gpu --screenshot=/tmp/vista.png --window-size=420,800
   http://localhost:8000/demo/vista.html` y mira el PNG.
5. `npm test` sigue en verde (esta tarea no añade pruebas unitarias: no hay DOM en
   Node; la 08 la cubre con Chrome).

## Datos de entrada
- `ESPECIFICACION.md` §5 (y §3.1 para «quién rellenó cada casilla»).
- `js/tableros/index.js` (02), `js/motor/ronda.js` (04), `css/estilo.css` (01): solo
  lectura.

## Salida esperada
Cuatro ficheros en un commit: `git add js/ui/vista-tablero.js css/vista-tablero.css
demo/vista.html demo/vista.js && git commit -m "Tarea 06: vista del tablero" --
js/ui/vista-tablero.js css/vista-tablero.css demo/vista.html demo/vista.js`.

## Cómo saber que ha terminado
En `demo/vista.html` se juega una ronda entera en cada generador sin errores en la
consola; a 375 px el tablero cabe sin desplazamiento horizontal; con «Mostrar valores»
se ven los números y con «Bloquear 3» las bloqueadas se ven distintas y no son legales.
Anota en la terminada qué generadores miraste y en qué anchos.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 06 LISTA (y la 05) pasa a PENDIENTE la 07. No
encadenes (la 07 es larga).

## Trampas conocidas
- En SVG, `aspect-ratio` en CSS evita el salto de altura al cargar; sin `height: auto`
  Safari puede dar altura 150 px.
- Los eventos de pulsación: usa `pointerdown`/`click` sobre el `<svg>` con delegación
  (`event.target.closest('[data-indice]')`), no un oyente por casilla (el balón tiene 32,
  una rejilla 12×12 tiene 144).
- Ninguna otra por ahora.

## Prohibido
- Tocar `index.html`, `css/estilo.css` (si necesitas una variable nueva, pon el valor
  por defecto en `vista-tablero.css` y propónla en la terminada) o cualquier fichero de
  otra tarea.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
