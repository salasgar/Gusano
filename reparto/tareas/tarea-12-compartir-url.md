# Tarea 12 · Compartir la partida por URL

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 35 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 70 min · Banda de modelo: MEDIO · Encadenable con: 09, 10
Ficheros que toca: `js/compartir/url.js` (llena el esbozo), `tests/url.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§3.2, §6, §7.4) y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe.
3. Reclama (`NN` = `12`, `MINUTOS` = `70`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Un enlace que contiene la partida: para enseñar una acabada y para jugar por turnos a
distancia sin servidor (cada uno manda el enlace tras su jugada).

## Siguiente paso
`npm test` en verde. Escribe `codificar`/`decodificar` y la prueba de ida y vuelta.

## Qué hay que hacer
1. `js/compartir/url.js` exporta `codificar(partida)` → texto base64url (JSON de §7.4
   en UTF-8: `TextEncoder` + `btoa` sobre la cadena binaria, con `+/=` sustituidos por
   `-_` y sin relleno), `decodificar(texto)` → partida o `null` (cualquier error →
   null; comprueba `v === 1`; reconstruye los tableros con `generador(g).crear(pa)` o
   con `t` literal validado; `nuevaPartida` con `n`, `i`, `s`; reproduce `j` con
   `jugarEnPartida`, y si una jugada es ilegal → null), `enlaceDe(partida)` → `origen +
   ruta + '#jugar&p=' + codificar(partida)` (en Node, sin `location`, solo la parte
   desde `#`), y `partidaDesdeURL()` → lee `location.hash`, busca `p=` y decodifica;
   `null` si no hay. Mantén los nombres del esbozo.
2. `tests/url.test.js`: ida y vuelta de una partida de 2 pares en `cuadrado4` lado 4
   con 7 jugadas (mismo `marcador`, mismo `camino`, misma ronda y par); partida
   terminada; partida con `inicio: 'libre'`; tablero del editor (sin `generador`) va
   con `t` y vuelve igual; texto corrupto → null; jugada ilegal inyectada → null; el
   enlace de una partida de 2 pares en `cuadrado4` lado 6 mide menos de 2000
   caracteres.
3. En Chrome: juega tres jugadas, «Compartir», abre el enlace en otra pestaña y sigue
   la partida; comprueba que al terminar el enlace reproduce el resultado.
4. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §7.4. `js/motor/partida.js` (04), `js/tableros/index.js` y
  `tipos.js` (02): solo lectura.

## Salida esperada
Commit: `git add tests/url.test.js && git commit -m "Tarea 12: compartir por URL" --
js/compartir/url.js tests/url.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 6 pruebas nuevas); el enlace abre la partida en otra pestaña.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Encadena la 09 o la 10 si están libres y estás en verde.

## Trampas conocidas
- `btoa` falla con caracteres fuera de Latin-1 (los nombres de jugador pueden llevar
  tildes y emojis): pasa siempre por `TextEncoder`.
- El `hash` puede traer `#jugar&p=…`: separa por `&` antes de buscar `p=`.

## Prohibido
- Tocar `jugar.js` o `main.js`: la 07 ya llama a `partidaDesdeURL` y `enlaceDe`; si
  no lo hace como dice §6, reabierta de la 07.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
