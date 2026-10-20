# Tarea 10 · Reto del día

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 35 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 70 min · Banda de modelo: MEDIO · Encadenable con: 09, 12
Ficheros que toca: `js/pantallas/reto.js` (llena el esbozo), `css/reto.css`, `tests/reto.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§4, §6, §7.2) y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe.
3. Reclama (`NN` = `10`, `MINUTOS` = `70`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Un problema al día, igual para todos (en clase, todos el mismo), contra el pájaro
perfecto, con el «par» que dice el resolutor exacto.

## Siguiente paso
`npm test` en verde. Escribe en `reto.js` las funciones puras `numeroDeReto(fecha)` y
`tableroDelReto(numero)` y sus pruebas; después la pantalla.

## Qué hay que hacer
1. `js/pantallas/reto.js` exporta, además de `{ id, titulo, montar }`:
   `numeroDeReto(fecha = new Date())` (días completos desde el 2026-10-20 en hora local,
   +1: ese día es el reto 1), `tableroDelReto(numero)` → `{ tablero, inicio }`
   determinista con `crearAzar(semillaDesdeTexto('gusano-' + numero))`, eligiendo entre
   los generadores y parámetros de §7.2 (los poliedros solo si `generador('poliedro')`
   existe) y una casilla inicial no bloqueada, y `textoResultado(numero, puntos,
   casillas, par)` → «Gusano #12 · 14/16 · par 15». Nada de DOM fuera de `montar`.
2. `montar`: muestra «Reto #N», el tablero, el jugador es gusano (`inicio` ya puesto),
   el pájaro es `elegirJugada('perfecto', …)` con `tiempoMaximoMs` 3000 en un
   `setTimeout` con «pensando…»; al acabar: puntos, `par(tablero, inicio)` (calculado al
   terminar, no antes, para no retrasar el inicio; si `par` devuelve null, «par: no
   calculable»), el texto para copiar con botón «Copiar», «Otra vez» y el mejor
   resultado del día (`localStorage['gusano-reto-N']`, guarda el máximo).
3. `css/reto.css`: disposición y el bloque del resultado.
4. `tests/reto.test.js`: `numeroDeReto(new Date(2026, 9, 20))` = 1 y `(2026, 9, 25)` =
   6; `tableroDelReto(1)` igual en dos llamadas; para `numero` 1..30, cada tablero
   tiene ≤ 25 casillas, `validarTablero` ok, el inicio no es bloqueada y `par` no es
   null con `maxEstados` 2 000 000 (si alguno tarda más de 3 s, anótalo y restringe la
   lista de §7.2 en la terminada como propuesta, no en la especificación);
   `textoResultado` exacto.
5. En Chrome, juega el reto de hoy hasta el final y comprueba el texto y el guardado.
6. `npm test` en verde (el conjunto completo sigue por debajo de 60 s).

## Datos de entrada
- `ESPECIFICACION.md` §7.2. `js/ia/*` (05), `js/tableros/index.js` (02/03),
  `js/motor/*` (04), `js/ui/vista-tablero.js` (06), `js/util/azar.js` (01): solo lectura.

## Salida esperada
Commit: `git add tests/reto.test.js && git commit -m "Tarea 10: reto del día" --
js/pantallas/reto.js css/reto.css tests/reto.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 5 pruebas nuevas); el reto de hoy se juega y da par y texto.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Encadena la 09 o la 12 si están libres y estás en verde.

## Trampas conocidas
- `numeroDeReto` con fechas en hora local: usa `Date.UTC(año, mes, día)` de las
  componentes locales para contar días sin líos de horario de verano.
- Ninguna otra por ahora.

## Prohibido
- Tocar la máquina, el motor o `jugar.js`. Editar desde el shell. `git add -A`.
  Dependencias. Remoto o `push`.
