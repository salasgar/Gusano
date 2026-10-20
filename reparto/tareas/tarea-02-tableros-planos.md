# Tarea 02 · Tableros planos: rejillas, caballo, hexagonal y superficies

Actualizado: 2026-10-20
Precondición: 01 LISTA · Disparo: MANUAL
Duración esperada: 40 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 80 min · Banda de modelo: MEDIO · Encadenable con: 03
Ficheros que toca: `js/tableros/tipos.js`, `js/tableros/rejillas.js`, `js/tableros/hexagonal.js`, `js/tableros/index.js`, `tests/tableros.test.js` (todos nuevos)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `reparto/tareas/_COMUN.md`, `ESPECIFICACION.md` (§0, §2 entero, §8) y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `ls reparto/hechos/terminadas/ | grep '^01--'` lista un fichero y no
   hay `reabiertas/01--*` posterior.
3. Reclama con el comando de `_COMUN.md` (`NN` = `02`, `MINUTOS` = `80`), `sleep 30 &&
   ls hechos/reclamos/`, cede si otra llegó antes, regenera el tablón si ganas, y sigue
   hasta cerrar o soltar.

## Objetivo
Los tableros planos de la app con la estructura de datos de §2.1, el registro de
generadores de §2.2 y las pruebas que fijan recuentos y grados. Sin esto no hay nada que
dibujar ni contra lo que probar la máquina.

## Siguiente paso
`npm test` → `pass 4`. Crea `js/tableros/tipos.js` con `crearTablero` y
`validarTablero` (§2.1) y su primera prueba; después los generadores.

## Qué hay que hacer
1. `js/tableros/tipos.js`: `crearTablero({ id, nombre, descripcion, generador, casillas,
   aristas, dibujo })` construye `vecinos` a partir de la lista de pares `aristas`
   (simétrica, ordenada, sin repetidos, sin bucles; lanza `Error` si un índice se sale)
   y devuelve el tablero; `validarTablero(tablero)` → `{ ok: true }` o `{ ok: false,
   errores }` (comprueba: ≥ 2 casillas, `vecinos` de la misma longitud, simetría, sin
   bucles ni repetidos, coordenadas numéricas dentro de `dibujo`, `valor` entero si
   existe, `bloqueada` booleana si existe).
2. `js/tableros/rejillas.js`: generadores `cuadrado4`, `cuadrado8`, `caballo` y
   `superficie` con los parámetros, identificadores, casillas y dibujo de la tabla de
   §2.2. Casilla (fila f, columna c) → índice `f * lado + c`, centro `(c + 0.5, f + 0.5)`,
   `vertices` con las cuatro esquinas, `dibujo = { ancho: lado, alto: lado, aristas:
   false, radio: 0.35 }`. `superficie`: bordes pegados como dice §2.2; `descripcion`
   explica qué bordes están pegados («Los bordes izquierdo y derecho están pegados; al
   cruzarlos, la fila se invierte» para Möbius, etc.). `id` del tablero:
   `cuadrado4-6`, `caballo-5`, `superficie-toro-6`.
3. `js/tableros/hexagonal.js`: generador `hexagonal` (radio r, 3r²+3r+1 casillas, las 6
   vecinas). Coordenadas axiales (q, r) con |q|, |r|, |q+r| ≤ radio; hexágonos de vértice
   arriba, circunradio 1/√3, centros a distancia 1 (x = q + r/2, y = r · √3/2),
   desplazados para que la caja empiece en 0 con margen 0.6; `vertices` con los seis
   vértices; `dibujo.aristas: false`.
4. `js/tableros/index.js`: `export const generadores = [cuadrado4, cuadrado8, caballo,
   hexagonal, superficie]` (en ese orden) y `export function generador(id)`. Deja un
   comentario «La tarea 03 añade `poliedro` al final».
5. `tests/tableros.test.js`: para cada generador con sus valores por defecto,
   `validarTablero` ok y `tablero.generador` relleno; `crear()` sin parámetros usa los
   defectos; oráculos de §8: `cuadrado4` lado 6 → 36 casillas, esquinas grado 2,
   bordes 3, interior 4, y bipartito (toda vecina de (f, c) tiene paridad distinta de
   f + c); `cuadrado8` lado 4 → esquinas 3, centro 8; `caballo` lado 4 → esquinas 2,
   lado 5 → la central 8; `hexagonal` radio 1, 2, 3 → 7, 19, 37 casillas, centro grado
   6, borde ≤ 4; `superficie` toro lado 4 → todas grado 4, cilindro → filas 0 y 3
   grado 3, klein → todas 4, mobius → filas 0 y 3 grado 3 y la casilla (1, 3) es vecina
   de (2, 0); ningún tablero tiene una casilla vecina de sí misma; `generador('x')` →
   `undefined`.
6. `npm test` en verde (≥ 4 + las tuyas).

## Datos de entrada
- `ESPECIFICACION.md` §2 (estructura y tabla de generadores). Los oráculos de §8.
- `js/util/azar.js` (de la 01) no hace falta aquí.

## Salida esperada
Los cinco ficheros en un commit: `git add js/tableros/tipos.js js/tableros/rejillas.js
js/tableros/hexagonal.js js/tableros/index.js tests/tableros.test.js && git commit -m
"Tarea 02: tableros planos" -- js/tableros/tipos.js js/tableros/rejillas.js
js/tableros/hexagonal.js js/tableros/index.js tests/tableros.test.js`.

## Cómo saber que ha terminado
`npm test` en verde con al menos 15 pruebas nuevas; `node -e "import('./js/tableros/index.js').then(m => console.log(m.generadores.map(g => g.id)))"`
imprime `[ 'cuadrado4', 'cuadrado8', 'caballo', 'hexagonal', 'superficie' ]`.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Con la 02 LISTA pasa a PENDIENTE la 03 (y la 05 y la 06
si la 04 está LISTA). Encadena la 03 (misma banda, corta, depende solo de esta) si el
semáforo está en verde; si no, dilo y da las frases.

## Trampas conocidas
- Importaciones con `.js`; `node --test` sin argumentos (`_COMUN.md`).
- En `superficie` con Möbius o Klein es fácil generar una vecina repetida en lados
  pares (la inversión puede mandar al mismo sitio por dos caminos): `crearTablero`
  deduplica, pero comprueba en las pruebas que ninguna casilla es vecina de sí misma.

## Prohibido
- Tocar ficheros que no están en «Ficheros que toca». `index.html` es de la 07.
- Editar código desde el shell. `git add -A`. Dependencias npm. Remoto o `push`.
- Cambiar los identificadores de generadores o parámetros de §2.2: van en las URL.
