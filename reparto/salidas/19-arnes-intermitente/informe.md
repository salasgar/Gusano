# Informe de la tarea 19 · fallo intermitente del caso l) del arnés

Sesión `s-20261025T220142-93453c05` · 2026-10-25.

## Causa

El caso l) («editor: grafo aleatorio de 10, «Jugar con este tablero» y una jugada») falla con
«el humano no llega a tener jugadas legales» cuando **la ronda 1 acaba antes de que el humano
mueva** y el caso no pulsa la ventana de fin de ronda. No es un fallo de la app.

- Jugador A es humano y B la máquina («fuerte»). En la ronda 1 A es el gusano y mueve B (el
  pájaro) primero; si el pájaro elige una casilla sin salida (una hoja junto a la casilla
  inicial), el gusano no tiene jugadas y la ronda termina con 2 casillas. Sale la ventana
  «Fin de la ronda 1» y no hay `.legal` hasta pulsar «Continuar con la ronda 2».
- **Visto pasar** (variante del arnés sin el paso «pulsar Continuar»): 6 fallos en 40
  ejecuciones (15 %), todos con el mismo mensaje y, en el estado volcado, la ventana «Fin de la
  ronda 1 del par 1. El gusano de Jugador A mide 2 casillas: Jugador A +2, Jugador B −2»,
  con `rellenas: 2`. Grafos de ejemplo en el volcado (aristas por índice).
- **Simulación con el motor** (grafo aleatorio de 10 casillas, máquina «fuerte», 1500 grafos):
  la ronda 1 acaba sin que el humano mueva en el 13 % con probabilidad de arista 0,3 y en el
  30 % con 0,1; con la máquina «aleatorio», 5 %. **En la ronda 2 el humano siempre mueve**
  (0 casos en 4500): la partida nunca termina sin que el humano juegue, así que pulsar
  «Continuar» basta.

## Estado del caso actual

El caso ya pulsaba «Continuar con …» (lo añadió la 16 al investigarlo). Con esa espera:

| Condición | Ejecuciones | Fallos |
|---|---|---|
| Sin carga (un bucle, `--solo "l)"`) | 60 | 0 |
| Con carga (4 bucles de 40 + 4 procesos que queman CPU) | 160 | 0 |
| Con el arnés ya endurecido, sin carga | 50 | 0 |
| Variante **sin** pulsar «Continuar» | 40 | 6 |

Conclusión: el fallo de una vez en 30 de la 16 corresponde a la ronda que acaba antes de tiempo
(frecuencia esperada 13 %, 1/30 observada en una muestra pequeña); con la espera ya puesta no
se ha vuelto a ver en 270 ejecuciones. No se subió ningún tiempo de espera.

## Qué se cambió (solo `herramientas/test-ui.js`)

- Caso l): si falla, el error incluye el grafo del editor (aristas por índice), la ventana
  abierta (texto y botones), los botones de la zona, la cabecera de la ronda, las casillas
  rellenas y el resultado.
- Caso q): un texto por debajo de 4,5:1 es **fallo**, en tema oscuro y claro (antes: fallo
  solo por debajo de 2, aviso entre 2 y 4,5).
- Caso r) (nuevo): foco tras cerrar una ventana. Esc en la de papeles → primer botón de la
  zona; Esc y «Ver tablero» en el fin de ronda → «Continuar con …»; «Ver tablero» en la
  ventana final → primer botón.
- Caso s) (nuevo): importar un JSON inválido (no es un tablero, y no es JSON) deja un aviso
  sin «No conexo» ni «Hacen falta»; al editar el lienzo vuelve «Hacen falta»; la ayuda
  explica la selección encadenada.
- Caso t) (nuevo): análisis de una partida aleatoria: ninguna jugada dice «regaló», sale
  «Aquí el pájaro perdió …» y el resumen dice «(pájaro) perdió». Una partida aleatoria puede
  no dar ninguna jugada en la que el pájaro pierda, así que reintenta con otra (hasta 6); en
  la primera versión sin reintento falló 1 de 13 pasadas completas.

**Comprobación de que los casos nuevos detectan lo que arregló la 18**: ejecutados contra el
árbol anterior a la 18 (`33dc5e7~1`), r), s), t) y q) fallan (foco en `BODY`; ayuda sin la
selección; «regaló»; contraste 2,7 en «Empezar»); contra el árbol actual pasan.

## Verificación final

- `npm test`: pass 179, fail 0.
- `node herramientas/test-ui.js`: TODO OK, 20 casos, ~39-41 s en vacío; 4 pasadas completas
  seguidas sin fallo tras el último cambio (t con reintento); antes del reintento, 11 de 12.
- Caso l): 50 de 50 seguidas.
