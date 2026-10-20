# Sugerencias de mejora de Gusano (2026-10-20)

Resumen del mensaje que dio la sesión que montó el reparto, antes de que Juan Luis
pidiera repartir el desarrollo. Es la razón de ser de varias decisiones de
`ESPECIFICACION.md`. Los números están en `analisis-2026-10-20/valores-minimax.md`.

## Reglas que se cambian o se fijan

1. **Formato «duplicado».** Las dos rondas de cada par se juegan en el mismo tablero y
   desde la misma casilla inicial, sorteada por la app. El resultado del par es la
   diferencia de puntos; la partida suma diferencias. Así da igual quién elige el inicio
   (en el caballo 5x5 va de 8 a 25 según la casilla) y se pueden mezclar tableros de
   tamaños distintos.
2. **Nombres de los papeles.** «Gusano» para quien quiere crecer (maximizador) y
   «Pájaro» para quien quiere comérselo pronto (minimizador).
3. **Desempates.** Habrá muchos pares empatados en tableros pequeños. Lo más limpio: un
   par extra en un tablero nuevo.
4. **Aclaraciones.** El pájaro puede cerrar la ronda metiéndose él mismo en un callejón
   sin salida (es su arma principal). Con 8 vecinas, dos tramos diagonales del gusano
   pueden cruzarse: las casillas son nodos, no hay problema.

## Variantes que dan profundidad (en esta tanda: obstáculos y casillas con valor)

- **Obstáculos aleatorios**: un 10-20 % de casillas tapadas hace cada tablero distinto y
  da armas al pájaro en los tableros densos.
- **Casillas con valor**: cada casilla lleva un número y se suman los rellenados.
  Trampas con valor negativo. Cálculo mental gratis en clase.
- **Toro, cilindro, Möbius, Klein**: rejilla con bordes pegados; quita las esquinas.
- **Grafos dirigidos** (fuera de esta tanda): conexiones de un solo sentido.
- **Gusano de dos cabezas** (fuera de esta tanda): se alarga por los dos extremos; es la
  mecánica de Slither (años 70) con puntuación por longitud.
- **Dos gusanos** (fuera de esta tanda): cada jugador alarga el suyo (Tron).
- **Reto del día**: tablero e inicio fijos, el pájaro perfecto lo lleva el ordenador,
  «¿llegas a 12?». El minimax da el par.

## Para la app

- Todo es un grafo: nodos con coordenadas y lista de vecinos; cada topología es un
  generador; motor e IA sirven para todas. Editor de tableros y grafos aleatorios.
- Poliedros en plano: diagrama de Schlegel. 3D giratorio, después.
- Ayudas desconectables: jugadas legales, gusano como línea gruesa con cabeza, tramos
  numerados, casillas inalcanzables atenuadas con el «techo» (cota superior).
- Rival artificial por niveles: minimax exacto hasta ~25-30 casillas, alfa-beta con
  heurística de región alcanzable para tableros grandes.
- Primero dos personas en un dispositivo más la IA, sin servidor; enlace con la partida
  en la URL para jugar a distancia; repetición con análisis al acabar.
