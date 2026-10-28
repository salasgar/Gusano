# Verificación de los retoques 30 y 31 (tarea 32)

Sesión s-20261028T174750-b6630b3a · MEDIO (Sonnet 5.5) · casos nuevos en el commit 3557423.

## Veredicto

**Los retoques de §10.7 cumplen. Ningún punto «no cumple»; no hay reabiertas.**

Evidencia: `npm test` pass 321, fail 0 y `node herramientas/test-ui.js` TODO OK con 34 casos
(29 anteriores + 5 nuevos, ae-ai), las dos veces seguidas (70 s cada una).

| Punto de §10.7 | Veredicto | Cómo lo vi |
|---|---|---|
| «Un par más» con los mismos ajustes (T30) | cumple | Caso ae: cuadrado8 lado 5 con obstáculos 20 %, máquina contra máquina hasta el final; el par 1 tiene 5 bloqueadas y, tras «Un par más», el par 2 tiene otras 5 y en otras casillas (p. ej. [1,6,9,16,20] → [3,6,18,19,20]) |
| Enlaces cortos (T30) | cumple | Caso af: cuadrado4 lado 12 con sentido 0,5 (132 flechas), 5 jugadas: el enlace mide 286-288 caracteres (< 1 000; antes, 15 785 con 20 jugadas); abierto en otra pestaña reproduce casillas, cabeza, saldos y número de flechas, y se puede seguir |
| Enlaces `v: 1` antiguos siguen abriendo (T30) | cumple | Caso ag: enlace construido a mano con el tablero literal (`t`), `v: 1`, nombres y 3 jugadas: se reproducen las 3, salen los nombres y se puede jugar una más |
| 3D: gira solo si no se ve ninguna jugada (T31) | cumple | Caso ah (tetraedro): con una sola cara visible, tras la primera jugada las 3 vecinas quedan detrás y el sólido gira hasta enseñar una (la rotación cambia); con dos o más caras visibles, hay una legal a la vista y la rotación no cambia en 900 ms |
| 3D: los seis sólidos, jugando sin girar a mano (T31) | cumple | Script aparte (no está en el arnés): tetraedro, cubo, octaedro, dodecaedro, icosaedro y balón, 1200 px claro y 375 px oscuro, clic en la primera legal visible hasta 40 turnos o fin de ronda: ningún turno se quedó sin una jugada visible, sin desbordar y con la consola limpia. En octaedro e icosaedro llegué a 40 jugadas sin parar |
| 3D: precisión aceptada (giro al punto medio cabeza-legal) | cumple | Con la cabeza sola de frente las vecinas de un cubo quedan de canto; en el cubo y el dodecaedro (que terminan la ronda pronto) no hubo turnos sin jugada a la vista |
| Flechas más finas (T31) | cumple | Caso ai: `stroke-width` de `.arco` = 0,03 (antes 0,06) y `markerWidth` de la punta = 0,17 (antes 0,3), medidos en el DOM; hexagonal radio 3 con corrientes a 375 px: 90 flechas, tablero de 343 px, sin desbordar; capturas en claro y oscuro: las casillas se distinguen y las flechas se leen |

Capturas (en el scratchpad de la sesión, no comiteadas): hexagonal radio 3 con corrientes a
375 y 1200 px, claro y oscuro; icosaedro a 375 px oscuro.

## Hallazgos fuera de criterio

No son incumplimientos; los decide Juan Luis.

1. **Con `sentido` 0,5 en cuadrado4 lado 12, un gusano que juega siempre la primera legal
   se queda sin salida enseguida** (5 jugadas en las muestras). No es un fallo: las flechas
   cierran muchos caminos. Pero significa que el «20 jugadas» de §10.7 no se alcanza a
   clics a ciegas; lo anoto por si conviene un lado o un `sentido` menores como ejemplo en
   la documentación.
2. **Proceso, no producto**: las terminadas de la 30 y la 31 declaran ediciones desde el
   shell (heredoc en las pruebas de la 30, `sed` en el import de la 31) que el hook de
   reservas no vio. Sin consecuencias; la 32 no las ha revisado línea a línea.
3. El caso ah del arnés comprueba el giro en el tetraedro; los otros cinco sólidos solo
   están comprobados con el script manual de arriba, no protegidos por el arnés.
