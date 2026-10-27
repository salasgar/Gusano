# Verificación de la tanda 2 (tarea 29)

Sesión s-20261027T062338-9b57cc93 · 2026-10-27T06:39Z · MEDIO (Sonnet 5.5).

## Veredicto

**La tanda 2 cumple §10 y no rompe la tanda 1. Ningún punto «no cumple»; no hay reabiertas.**

Evidencia: `npm test` pass 304, fail 0 (igual que al empezar; la 29 no toca pruebas unitarias) y
`node herramientas/test-ui.js` TODO OK con 29 casos (20 de la tanda 1 + 9 nuevos, u a ad), las dos
veces seguidas, en ~58 s. Además, 60 capturas a 375 y 1200 px en claro y oscuro (15 configuraciones),
sin desbordamiento horizontal, tablero ≥ 343 px a 375 px, consola limpia y jugadas aceptadas.

| Punto de §10 | Veredicto | Cómo lo vi |
|---|---|---|
| 10 · compatibilidad: ajustes por defecto = tanda 1 | cumple | Caso ac: cuadrado4 lado 4 por defecto tiene 16 casillas, 0 fantasmas, 0 flechas, sin interruptor 3D, fin de ronda con el texto clásico; casos a-t de la tanda 1 siguen en verde sin cambios; `tests/url.test.js` mantiene `v: 1` exacta |
| 10 · todo combinable | cumple | Caso y: cuadrado8 5×5 toro + manhattan + dos gusanos + dos cabezas + obstáculos 10 % + valores «trampas» + sentido 25 %, máquina contra máquina hasta el final, consola limpia |
| 10.1 · tablero dirigido y sentido único | cumple | Sonda en Node: `conSentidoUnico` a 0,25 / 0,5 / 1 da tableros válidos, sin casillas sin salida ni entrada, con `id` `-sen25/50/100` y descripción «N conexiones de un solo sentido»; `tests/dirigidos.test.js`; casos v e y en pantalla |
| 10.2 · `alto` y `bordes` | cumple | Sonda: `cuadrado8-6x4-toro`; id de defectos sin cambios. Caso u: 5×3 en toro = 15 casillas reales |
| 10.2 · toro hexagonal | cumple | Sonda: radios 1, 2, 3 → 7, 19, 37 casillas, todas con 6 vecinas. Caso u: radio 2 = 19 casillas + anillo de 18 fantasmas; pulsar un fantasma juega |
| 10.2 · `superficie` oculta pero viva | cumple | Sonda: no está en `generadores`, `generador('superficie')` la devuelve |
| 10.2 · flechas (manhattan, corriente, corrientes) | cumple | Caso v: 24 flechas dibujadas y desde la casilla 5 solo se ofrecen [1, 4]. Valores 1-11 / 8 / 13: `tests/bordes.test.js` (verdes). Sonda: `corriente` sin toro lanza Error |
| 10.2 · `soloSi` | cumple | Caso ab: «corriente» oculta y desactivada sin toro, disponible con toro, y vuelve a «ninguna» si se quita el toro |
| 10.2 · casillas fantasma | cumple | Caso u: 20 fantasmas en 5×3 en toro (franja de una casilla con esquinas); pulsar uno juega la casilla real; cada fantasma lleva las mismas clases de estado que su casilla. Capturas de cilindro (8), Möbius (8), Klein (20), caballo en toro (24) |
| 10.3 · motor: dos cabezas | cumple | Caso w: cuerpo [4, 0] en cuadrado8 3×3, la casilla 1 es vecina de los dos extremos → pide extremo; Esc cancela sin jugar; elegir la cola juega. Caso aa: la jugada por la cola viaja en el enlace y se reproduce |
| 10.3 · motor: dos gusanos | cumple | Caso x: la salida sortea dos gusanos, fin de ronda «El gusano de A mide 10 y el de B, 6», diferencia = 10 − 6, suma ≤ 16, dos trazos con su color; partida hasta el final con «Gana … con +N». `tests/variantes.test.js` (22) |
| 10.3 · partida: salidas y papeles en la ronda 2 | cumple | Caso x: el fin de ronda 1 dice «En la ronda 2, B lleva el gusano verde y A el violeta» |
| 10.4 · máquina en todas las variantes | cumple | Casos x, y, ad: voraz y aleatorio terminan 4 partidas de variante sin errores; `tests/ia-variantes.test.js` (14) contra minimax ingenuo |
| 10.5 · vista: fantasmas, flechas, un trazo por gusano, ojos | cumple | Casos u, v, x; capturas `2gus2cab` (ojos en cabeza y cola de cada gusano), hexagonal con corrientes |
| 10.5 · vista 3D | cumple | Caso z (cubo): arrastrar con ratón gira y no juega; arrastrar con dedo emulado gira y no juega; pulsar sin movimiento juega; volver a «plano» conserva la partida. Capturas de los seis sólidos a 375 y 1200 px, claro y oscuro |
| 10.6 · ajustes nuevos y `alto` que sigue a `lado` | cumple | Caso ab; `ajustesPorDefecto()` trae `gusanos: 1, cabezas: 1, sentido: 0`; el clásico sigue siendo 4×4 (caso ac) |
| 10.6 · jugar: elegir extremo, textos de cada modo | cumple | Casos w, x (papeles «gusano verde / violeta», sin «pájaro»), ac. Textos de dos cabezas y flechas leídos en `js/ui/textos-partida.js` (no comprobados en pantalla uno por uno) |
| 10.6 · techo del modo ayuda solo con un gusano | cumple (por lectura) | `js/pantallas/jugar.js` línea 155 lo restringe a un gusano; no lo cubre ningún caso del arnés |
| 10.6 · ayudas, análisis, compartir | cumple | Caso ad: análisis de dos gusanos (14 jugadas), dos cabezas (9) y flechas en toro (16) recorrido hasta el final, con nombres y no papeles, sin «undefined»/«NaN»; caso aa: `v: 2` con `m: [1, 2]` abierto en otra pestaña reproduce camino, saldos y trazos y se puede seguir; `tests/url.test.js` |
| Reto del día y editor sin cambios | cumple | Casos k y l siguen en verde |

## Hallazgos fuera de criterio

No son incumplimientos; los decide Juan Luis.

1. **En 3D puede no haber ninguna jugada legal a la vista.** En el tetraedro (y en octaedro e
   icosaedro, en mis capturas) la vista inicial mira de frente la cara en que
   está el gusano y todas las salidas están detrás, que §10.5 manda ocultar. Quien no sepa que
   hay que girar ve un tablero sin jugadas y «Turno de Jugador B». Posible mejora: un aviso
   «hay jugadas por detrás: gira el sólido» o girar solo al hacer la jugada.
2. **Flechas «corrientes» del hexagonal a 375 px.** Con 3 salidas y 3 entradas por casilla, las
   seis puntas por hexágono saturan el dibujo con radio 3 en una pantalla estrecha (se ve, pero
   cuesta distinguir las casillas). Quizá flechas más finas o un radio menor por defecto con
   flechas.
3. **Arnés.** Los formularios del arnés tienen que lanzar `input` además de `change`; si no, el
   formulario no marca «alto» como tocado y lo ignora (no es un fallo de la app). Ya está en
   `configurar` de `test-ui.js`.
