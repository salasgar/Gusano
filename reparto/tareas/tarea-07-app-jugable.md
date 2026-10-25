# Tarea 07 · Aplicación jugable: ajustes, partida, marcador y esbozos

Actualizado: 2026-10-20
Precondición: 05 LISTA y 06 LISTA · Disparo: MANUAL
Duración esperada: 75 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 150 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `index.html` (reescribe el provisional), `css/estilo.css` (añade; conserva las variables de la 01), `js/main.js`, `js/ui/app.js`, `js/ui/ajustes.js`, `js/ui/ayudas.js`, `js/pantallas/jugar.js`, `js/pantallas/reto.js`, `js/pantallas/analisis.js`, `js/pantallas/editor.js`, `js/compartir/url.js`, `css/reto.css`, `css/analisis.css`, `css/editor.css`, `tests/ajustes.test.js` (todos nuevos salvo los dos primeros)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` entero (§6 y §7 con especial atención) y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/05--*` y `terminadas/06--*` existen. Y ningún reclamo vivo
   de la 03 (si la 03 está EN CURSO no pasa nada: no compartís ficheros; es solo para
   que el registro de generadores no cambie mientras pruebas).
3. Reclama (`NN` = `07`, `MINUTOS` = `150`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que Gusano se pueda jugar: dos personas en un dispositivo, o contra la máquina, por
pares en formato duplicado, con marcador. Y dejar preparados, sin implementarlos, los
huecos de las pantallas y enganches que llenan las tareas 09 a 12, para que no tengan que
tocar ningún fichero tuyo.

## Siguiente paso
`npm test` en verde; `python3 -m http.server 8000` en segundo plano; abre
`demo/vista.html` para ver cómo se usa la vista. Empieza por `js/ui/ajustes.js` con sus
funciones puras y su prueba; después `jugar.js`.

## Qué hay que hacer
1. `js/ui/ajustes.js`: `ajustesPorDefecto()` → `{ generadorId: 'cuadrado4', parametros:
   {}, pares: 1, inicio: 'azar', jugadores: [{ tipo: 'humano', nivel: null }, { tipo:
   'maquina', nivel: 'fuerte' }], nombres: ['Jugador A', 'Jugador B'], semilla }`;
   `tablerosDesdeAjustes(ajustes)` → un tablero por par (mismo generador y parámetros;
   si más adelante un ajuste cambia el tablero por par, aquí); `montarAjustes(contenedor,
   ajustes, alAceptar)` pinta el formulario de §6 («Ajustes») generando los campos de
   parámetros a partir de `generador(id).parametros` y llama a `alAceptar(ajustes)` con
   «Empezar». Deja un comentario claro «La tarea 13 añade aquí el campo Obstáculos y la
   14 el campo Valores» en el sitio donde van, y haz que `tablerosDesdeAjustes` pase
   por un punto único donde aplicar transformaciones al tablero.
2. `js/ui/app.js`: `pantallas` y `irA(id, datos)` (§6); `irA` pone el `hash`, vacía
   `<main id="pantalla">` y llama a `montar(contenedor, { irA, generadores, datos })`.
   `js/main.js`: al cargar, `partidaDesdeURL()`; si devuelve partida, `irA('jugar', {
   partida })`; si no, la pantalla del `hash` o `jugar`. Escucha `hashchange`.
3. `js/pantallas/jugar.js` (§6, «Pantalla jugar»): fases ajustes → partida → fin.
   Acepta `datos.tablero` (del editor: un solo par con ese tablero, ajustes de jugadores
   por defecto) y `datos.partida` (de una URL: continúa). La máquina juega con
   `elegirJugada(nivel, ronda, { azar, tiempoMaximoMs })` en un `setTimeout(…, 60)` tras
   pintar, con el aviso «pensando…» y el tablero sin resaltar legales; en humano-humano
   resalta las legales del que tiene el turno. Marcador: nombres, puntos, «Par 1 de 2 ·
   Ronda 2», «A es gusano, B es pájaro», turno; con modo ayuda, «techo» =
   `cotaSuperior`. Botones: «Modo ayuda» (interruptor; pasa `decoraciones(ronda)` de
   `ayudas.js` a la vista), «Compartir» (solo si `enlaceDe(partida)` no es null: copia
   el enlace al portapapeles y lo muestra), «Nueva partida». Fin: resultado y ganador,
   «Un par más» (`anadirPar` con un tablero nuevo del mismo generador), «Analizar»
   (`irA('analisis', { partida })`), «Nueva partida». Con `inicio: 'libre'`, la primera
   casilla la elige el gusano entre todas las legales.
4. Esbozos (§6, «Esbozos»): `js/pantallas/reto.js`, `analisis.js`, `editor.js` exportan
   `{ id, titulo, montar }` y montan un párrafo «Próximamente» (deben poder importarse
   en Node sin tocar `document` fuera de `montar`); `js/ui/ayudas.js` exporta
   `decoraciones(ronda) { return new Map(); }`; `js/compartir/url.js` exporta
   `partidaDesdeURL() { return null; }` y `enlaceDe(partida) { return null; }`;
   `css/reto.css`, `css/analisis.css`, `css/editor.css` con solo un comentario de
   cabecera. `index.html` ya enlaza las tres hojas.
5. `index.html` (§6): cabecera con «Gusano» y enlaces `#jugar`, `#reto`, `#analisis`,
   `#editor`; `<main id="pantalla">`; pie «© 2026 Juan Luis Salas García · Reglas»
   (enlace a `reglas.html`, que escribe la 15). `css/estilo.css`: disposición móvil
   primero (cabecera compacta, tablero en el mayor cuadrado que quepa, botones de 44 px
   de alto como mínimo, marcador de dos columnas), escritorio a partir de 700 px con el
   marcador y los botones al lado del tablero. Conserva las variables de la 01.
6. `tests/ajustes.test.js`: `ajustesPorDefecto()` tiene esas claves;
   `tablerosDesdeAjustes` devuelve tantos tableros como pares y del generador pedido;
   los módulos de pantallas y `url.js` se importan en Node sin error.
7. Juega en Chrome: humano-humano un par en `cuadrado4` lado 4 hasta el final; humano
   contra `fuerte` dos pares en `hexagonal` radio 2; máquina-máquina (`aleatorio` contra
   `perfecto`) en `caballo` lado 5 hasta el final; a 375 px y en escritorio; consola
   limpia. Anota en la terminada lo que probaste.
8. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §6 y §7 (para dejar los huecos donde toca).
- Todo lo de 01-06, solo lectura. `demo/vista.html` como ejemplo de uso de la vista.

## Salida esperada
Los quince ficheros en un commit (ficheros nuevos con `git add` explícito; `index.html` y
`css/estilo.css` ya seguidos): `git add js/main.js js/ui/app.js js/ui/ajustes.js
js/ui/ayudas.js js/pantallas/jugar.js js/pantallas/reto.js js/pantallas/analisis.js
js/pantallas/editor.js js/compartir/url.js css/reto.css css/analisis.css css/editor.css
tests/ajustes.test.js && git commit -m "Tarea 07: aplicación jugable" -- index.html
css/estilo.css js/main.js js/ui/app.js js/ui/ajustes.js js/ui/ayudas.js
js/pantallas/jugar.js js/pantallas/reto.js js/pantallas/analisis.js
js/pantallas/editor.js js/compartir/url.js css/reto.css css/analisis.css css/editor.css
tests/ajustes.test.js`.

## Cómo saber que ha terminado
Las tres partidas del paso 7 se juegan hasta el final con el marcador correcto (compara
con `marcador(partida)` en la consola); `npm test` en verde; los esbozos existen con las
exportaciones de §6 (la 09, 10, 11 y 12 dependen de sus nombres exactos).

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 07 LISTA pasan a PENDIENTE 08, 09, 10, 11, 12, 13 y
15: hasta siete sesiones a la vez (ninguna comparte ficheros; la 14 espera a la 13). Da
las siete frases. No encadenes.

## Trampas conocidas
- `elegirJugada` de `perfecto` puede tardar un segundo largo en tableros de 20-30
  casillas: pinta «pensando…» **antes** del `setTimeout`, no dentro.
- Al copiar al portapapeles, `navigator.clipboard` solo funciona en `localhost` o HTTPS;
  muestra el enlace en un `<input readonly>` además de copiarlo.
- Con la columna lateral en `flex-direction: column`, un `flex-basis: 100%` heredado de la
  versión móvil con `flex-wrap` empuja los botones a una segunda columna y desborda: en
  escritorio, `nowrap` y `flex-basis: auto`. Se vio a 1100 px, no a 375.
- Chrome sin cabeza por CDP: justo tras `Page.navigate` el formulario puede no estar aún
  pintado; espera a `#ajuste-generador` antes de rellenar los ajustes.

## Prohibido
- Implementar el reto, el análisis, el editor, compartir, obstáculos o valores: solo sus
  huecos. Si para dejar un hueco necesitas cambiar §6 o §7, incidencia y propuesta.
- Tocar los módulos de 02-06 (si falta algo, incidencia). Editar desde el shell. `git
  add -A`. Dependencias. Remoto o `push`.
