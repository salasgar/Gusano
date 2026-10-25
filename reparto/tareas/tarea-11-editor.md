# Tarea 11 · Editor de tableros y grafos aleatorios

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 50 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 100 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/pantallas/editor.js` (llena el esbozo), `css/editor.css`, `tests/editor.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§2.1, §5, §6, §7.3) y `reparto/_ESTADO.md`;
   lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe.
3. Reclama (`NN` = `11`, `MINUTOS` = `100`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
«Infinitas posibilidades»: dibujar un tablero cualquiera, o pedir uno al azar, y jugar
en él. Y poder guardarlo y cargarlo como JSON.

## Siguiente paso
`npm test` en verde. Escribe las funciones puras de `editor.js` (`grafoAleatorio`,
`tableroDesdeEditor`, `estadoDesdeTablero`) y sus pruebas; después el lienzo.

## Qué hay que hacer
1. `js/pantallas/editor.js` exporta, además de `{ id, titulo, montar }`:
   `grafoAleatorio(n, probabilidad, azar)` → tablero conexo (repite el sorteo de
   aristas hasta que sea conexo; posiciones al azar en un cuadrado de lado 10 con
   separación mínima 1 entre centros, reintentando) con `id: 'aleatorio-' + n + '-' +
   semilla`, `dibujo.aristas: true`, `radio` 0,35; `tableroDesdeEditor(estado)` →
   tablero con `crearTablero` (estado = `{ casillas: [{ x, y }], aristas: [[i, j]] }`,
   caja = envolvente con margen 1, `aristas: true`, `id: 'editor-' + Date.now()`);
   `estadoDesdeTablero(tablero)` → el estado (inversa, ignora `vertices`). Nada de DOM
   fuera de `montar`.
2. `montar`: lienzo SVG (reutiliza `crearVista` para pintar el tablero en modo lectura
   o dibuja tú con nodos y aristas: lo segundo es más simple para arrastrar) con los
   modos de §7.3: pulsar en vacío crea casilla; pulsar una y luego otra conecta o
   desconecta; arrastrar mueve; `Supr` o botón «Borrar» quita la seleccionada y sus
   aristas; «Grafo aleatorio» (n de 5 a 40 y probabilidad 0,1-0,6, con semilla
   visible); «Rejilla» (desplegable de `generadores` con parámetros por defecto, carga
   el tablero como estado editable); «Exportar» (descarga `tablero.json` con un enlace
   `download` y un `Blob`); «Importar» (`<input type="file">`, `JSON.parse`,
   `validarTablero`; muestra los errores); «Jugar con este tablero» (`irA('jugar', {
   tablero: tableroDesdeEditor(estado) })`; deshabilitado si el grafo no es conexo o
   tiene menos de 4 casillas). Contador de casillas y aristas y aviso «no conexo».
3. `css/editor.css`: lienzo cuadrado, botones, nodo seleccionado en `--acento`.
4. `tests/editor.test.js`: `grafoAleatorio(12, 0.3, crearAzar(5))` válido, conexo y
   reproducible; con probabilidad 0,05 sigue siendo conexo (reintentos); ida y vuelta
   `estadoDesdeTablero(tableroDesdeEditor(estado))` conserva casillas y aristas;
   `tableroDesdeEditor` de un estado sin aristas da un tablero válido (aunque no
   jugable); el módulo se importa en Node.
5. En Chrome: dibuja un tablero de 6 casillas, juégalo; importa el JSON exportado;
   genera un aleatorio de 20 y juégalo contra `fuerte`.
6. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §7.3. `js/tableros/tipos.js` e `index.js` (02), `js/ui/vista-tablero.js`
  (06), `js/util/azar.js` (01): solo lectura.

## Salida esperada
Commit: `git add tests/editor.test.js && git commit -m "Tarea 11: editor de tableros" --
js/pantallas/editor.js css/editor.css tests/editor.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 5 pruebas nuevas); en Chrome se dibuja, exporta, importa y juega
un tablero propio y uno aleatorio.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. No encadenes (es la más larga de su tanda).

## Trampas conocidas
- Arrastrar en SVG: usa `setPointerCapture` y convierte coordenadas de pantalla a las
  del `viewBox` con `svg.getScreenCTM().inverse()`.
- `jugar.js` (07) acepta `datos.tablero`; si al llegar no se salta los ajustes o no
  usa el tablero, es una reabierta de la 07, no un arreglo tuyo.

- (Añadida al cerrar la 11.) `editor.js` y `editor.css` pueden seguir reservados por el hook
  a nombre de la sesión de la 07 (30 min sin actividad): empieza por `tests/editor.test.js` y
  deja el borrador en el scratchpad, con enlaces simbólicos a `js/` para probarlo; no borres
  su fichero de `.claude/sesiones/`. En headless, `setPointerCapture` falla con punteros
  sintéticos: envuélvelo en `try`. Chrome sin cabeza no baja de ~500 px de ventana: para
  medir 375 px usa un `iframe` de ese ancho y compara `scrollWidth`.

## Prohibido
- Tocar `jugar.js`, `app.js` o los tableros. Editar desde el shell. `git add -A`.
  Dependencias. Remoto o `push`.
