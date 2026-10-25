# Tarea 18 · Retoques de la verificación final: contraste, foco, editor y análisis

Actualizado: 2026-10-25 (dada de alta por la coordinadora s-20261025T073409-9564e458 con
las decisiones de Juan Luis sobre los hallazgos de la 16)
Precondición: 16 y 17 LISTAS (lo están) · Disparo: MANUAL
Duración esperada: 15 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: MEDIO · Encadenable con: 19 (después de esta)
Ficheros que toca: `css/estilo.css`, `css/analisis.css` (solo su bloque de modo oscuro,
si hace falta), `js/pantallas/jugar.js` (solo el foco al cerrar ventanas),
`js/pantallas/editor.js` (aviso de importar y texto de ayuda), `js/pantallas/analisis.js`
(solo los textos «regaló» → «perdió»), y `tests/` si añades pruebas (`tests/editor.test.js`)

**Esta tarea toma ficheros de tareas cerradas** (07, 09, 11, 17) para retoques que decidió
Juan Luis después: son suyos durante esta tarea. **No toca `herramientas/test-ui.js`**:
eso es de la 19, que va detrás y comprueba esto.

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §6 (el apartado de T17 y los puntos «(T18)»),
   §7.1 y §7.3, y `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Lee los «Hallazgos fuera de criterio» 1, 3, 4, 5 y 6 de
   `reparto/salidas/16-verificacion-final/veredicto.md`: dicen dónde y cómo se vio cada uno.
3. Reclama (`NN` = `18`, `MINUTOS` = `45`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Cerrar los hallazgos de la verificación final que Juan Luis ha decidido arreglar, sin
cambiar nada más.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde tal como están (179 pruebas; 17
casos). Después, el contraste.

## Qué hay que hacer
1. **Contraste en modo oscuro** (hallazgo 1). En `css/estilo.css`, dentro de
   `@media (prefers-color-scheme: dark)`: que el botón principal (`button.principal`,
   hoy blanco sobre `--acento` `#6b9cff`, 2,7:1), la etiqueta `.rol.gusano` / `.rol.pajaro`,
   el saldo (`.saldo.positivo` / `.saldo.negativo`) y los nombres coloreados de
   `dialog.ventana` lleguen a **4,5:1**. Si para el texto hacen falta colores distintos
   de los de relleno del tablero, crea variables de texto propias (por ejemplo
   `--gusano-texto`, `--pajaro-texto`) y no toques `--gusano` / `--pajaro`, que usa
   `css/vista-tablero.css`. El tema claro no cambia. Mira también
   `css/analisis.css` (`.veredicto.bueno` usa `--gusano`). Mide con el caso q) del arnés:
   en su detalle salen los «AVISO contraste < 4,5»; al acabar no debe salir ninguno.
2. **Foco al cerrar una ventana** (hallazgo 3). En `js/pantallas/jugar.js`, al cerrar
   cualquiera de las ventanas (botón o `Esc`), el foco va al botón «Continuar con …» de la
   zona de botones si está, y si no al primer botón de esa zona (§6). Nada más del
   fichero.
3. **Editor, importar** (hallazgo 4). En `js/pantallas/editor.js`, cuando la importación
   falla, el aviso solo dice lo del archivo (§7.3): que `pinta()` no le añada los
   «problemas» del lienzo («No conexo…», «Hacen falta…») mientras se muestra ese error.
   En cuanto el lienzo cambia (`cambia()`), todo vuelve a ser como ahora.
4. **Editor, ayuda** (hallazgo 5). Amplía el párrafo `.ayuda` con una frase sobre la
   selección encadenada, con el comportamiento real (§7.3): tras conectar dos casillas
   queda seleccionada la segunda; una casilla nueva queda seleccionada; pulsar otra vez la
   seleccionada la deselecciona.
5. **Análisis, «perdió»** (hallazgo 6, segunda parte). En `js/pantallas/analisis.js`,
   «Aquí el pájaro regaló …» → «Aquí el pájaro perdió …», y en el resumen «(pájaro)
   regaló …» → «(pájaro) perdió …». Nada más: el análisis sigue empezando en la jugada 0
   (decidido por Juan Luis).
6. Si quieres una prueba unitaria del aviso de importar, va a `tests/editor.test.js`
   (solo si la lógica está en una función pura; no saques código del componente para
   eso).
7. En Chrome sin cabeza o con capturas (`node herramientas/test-ui.js --capturas
   <carpeta del scratchpad>`): las dos ventanas en oscuro, el editor tras importar un
   JSON inválido, y el análisis de una partida en la que el pájaro pierde puntos.
8. `npm test` y `node herramientas/test-ui.js` en verde. **Si un caso del arnés se rompe
   por un texto que has cambiado** («regaló»), no toques el arnés: anótalo en la
   terminada para la 19 y deja el caso como esté (la 19 lo ajusta). Lo mismo si el caso
   l) falla de forma intermitente: es lo que investiga la 19.

## Datos de entrada
- `ESPECIFICACION.md` §6, §7.1, §7.3 (el contrato).
- Veredicto de la 16 (`reparto/salidas/16-verificacion-final/veredicto.md`).

## Salida esperada
Commit: `git commit -m "Tarea 18: contraste, foco, editor y análisis" -- css/estilo.css
js/pantallas/jugar.js js/pantallas/editor.js js/pantallas/analisis.js` (añade
`css/analisis.css` o `tests/editor.test.js` si los tocaste).

## Cómo saber que ha terminado
`npm test` en verde; el caso q) sin ningún «AVISO contraste < 4,5»; tras «Ver tablero» el
foco está en «Continuar con …»; el aviso de importar ya no mezcla; la ayuda del editor
explica la selección; «perdió» en el análisis para el pájaro.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 18 LISTA pasa a PENDIENTE la 19: si tu frase la
nombra, encadénala (misma banda, corta, solo depende de esta). **No hagas `push`.**

## Trampas conocidas
- El caso q) del arnés hoy **avisa** por debajo de 4,5 y solo **falla** por debajo de 2:
  que pase en verde no prueba que el contraste esté arreglado; mira su detalle.
- `color-mix()` de `css/vista-tablero.css` mezcla `--gusano` / `--pajaro` con `--panel`:
  si cambias esas variables cambia el relleno del tablero. Por eso, variables de texto
  aparte.
- Un `<dialog>` cerrado con `Esc` dispara `cancel` y luego `close`; `jugar.js` ya los
  atiende una sola vez (función `atender`): pon el foco ahí, después de la acción.

## Prohibido
- Tocar `herramientas/test-ui.js`, `js/motor/`, `js/ia/`, `js/ui/vista-tablero.js` o el
  tema claro.
- Manejar las casillas con el teclado (decidido: se deja como está).
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
