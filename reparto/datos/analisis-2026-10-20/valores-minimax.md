# Valor de una ronda de Gusano con juego perfecto (minimax exacto)

Calculado el 2026-10-20 con `gusano_minimax.py` (Python 3.9, en el Mac de Juan Luis).
«Valor» = puntos del gusano (maximizador) cuando los dos juegan perfecto. La columna
«elige el gusano» es el máximo sobre todas las casillas iniciales; «elige el pájaro»,
el mínimo. El gusano mueve en los turnos impares (pone la casilla inicial), el pájaro en
los pares. Estos números son el **oráculo de las pruebas de la IA (tarea 05)**: el
resolutor exacto de la app tiene que reproducirlos.

| Tablero | Casillas | Elige inicio el gusano | Elige inicio el pájaro | Media sobre inicios | Estados |
|---|---|---|---|---|---|
| Cuadrado 3x3, 4 vecinas | 9 | 9 | 6 | 7,7 | 438 |
| Cuadrado 4x4, 4 vecinas | 16 | 12 | 12 | 12,0 | 13 716 |
| Cuadrado 4x5, 4 vecinas | 20 | 16 | 12 | 14,2 | 89 334 |
| Cuadrado 5x5, 4 vecinas | 25 | 25 | 14 | 17,5 | 959 085 |
| Cuadrado 4x4, 8 vecinas | 16 | 15 | 14 | 14,5 | 187 036 |
| Toro 4x4, 4 vecinas | 16 | 14 | 14 | 14,0 | 92 624 |
| Toro 5x5, 4 vecinas | 25 | 23 | 23 | 23,0 | 21 327 775 |
| Caballo 4x4 | 16 | 12 | 4 | 8,0 | 13 172 |
| Caballo 5x5 | 25 | 25 | 8 | 18,7 | 4 246 011 |
| Hexagonal radio 2 | 19 | 19 | 15 | 16,5 | 707 604 |
| Caras del cubo (grafo del octaedro) | 6 | 6 | 6 | 6,0 | 174 |
| Caras del dodecaedro (grafo del icosaedro) | 12 | 12 | 12 | 12,0 | 16 788 |
| Caras del icosaedro (grafo del dodecaedro) | 20 | 17 | 17 | 17,0 | 110 780 |

Valor por casilla inicial (fila, columna):

```
3x3, 4 vecinas        4x4, 4 vecinas
 9  6  9              12 12 12 12
 6  9  6              12 12 12 12
 9  6  9              12 12 12 12
                      12 12 12 12

5x5, 4 vecinas        4x4, 8 vecinas
21 14 19 14 21        15 14 14 15
14 21 14 21 14        14 15 15 14
19 14 25 14 19        14 15 15 14
14 21 14 21 14        15 14 14 15
21 14 19 14 21
```

Nota: el cuadro por casilla que imprime el script solo es correcto en tableros cuadrados (usa la raíz cuadrada del número de casillas); para el 4x5 hay que leer la lista `per_start` del propio script.

Hexagonal radio 2, por casilla: centro 19; las seis esquinas (grado 3) 17; los seis
centros de lado (grado 4) 15; las seis restantes del anillo interior (grado 6) 17.

Lo que se lee:

- **Tableros densos** (8 vecinas, hexagonal, caras del dodecaedro): el gusano lo llena
  casi todo. El pájaro apenas puede hacer nada.
- **4 vecinas**: queda un cuarto del tablero vacío en 4x4 y el inicio no importa; en 5x5
  (impar) sí importa muchísimo: 25 desde el centro, 14 desde las casillas de color
  minoritario. Paridad: en una rejilla bipartita con emparejamiento perfecto, el pájaro
  siempre tiene respuesta (estrategia de emparejamiento) y la longitud final es par.
- **Caballo**: elegir el inicio vale más que toda la partida (de 8 a 25 en 5x5).
- De ahí el **formato duplicado**: las dos rondas de cada par en el mismo tablero y con
  la misma casilla inicial.

Cómo reproducirlo: `python3 -I gusano_minimax.py` (todos los tableros que caben en
unos minutos) o `python3 -I gusano_minimax.py 4x4 hexagonal` (filtro por texto del
nombre). El toro 5x5 tarda 80 s; el cuadrado 6x6 y el 5x5 con 8 vecinas no terminan en
Python en tiempo razonable.
