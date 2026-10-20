# Tarea 03 · Tableros poliédricos (caras de un poliedro)

Actualizado: 2026-10-20
Precondición: 02 LISTA · Disparo: MANUAL
Duración esperada: 45 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 90 min · Banda de modelo: MEDIO · Encadenable con: 02
Ficheros que toca: `js/tableros/poliedros.js` (nuevo), `js/tableros/index.js` (una línea: añadir `poliedro` al final de `generadores`), `tests/poliedros.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§2, en especial el párrafo «Poliedros») y
   `reparto/_ESTADO.md`; lista `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/02--*` existe. **Y ningún reclamo vivo de la 02** (comparte
   `js/tableros/index.js`).
3. Reclama (`NN` = `03`, `MINUTOS` = `90`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
El generador `poliedro` de §2.2: las casillas son las caras de un sólido y dos son
vecinas si comparten arista; se dibujan en plano, como nodos del diagrama de Schlegel
del poliedro dual, con las aristas pintadas.

## Siguiente paso
`npm test` en verde. Lee `/Users/salasgar/Documents/git/Damas-poliédricas/js/polyhedra.js`
(código de Juan Luis, MIT): `buildPolyhedron(def)` obtiene aristas (distancia mínima) y
caras (planos de soporte) a partir de los vértices; `cyclicWithSigns`,
`allPermsWithSigns` y las definiciones de dodecaedro, icosaedro e «Icosaedro truncado»
dan las coordenadas. Adáptalo a un módulo ES en español; no lo copies entero.

## Qué hay que hacer
1. `js/tableros/poliedros.js`: para cada sólido (`tetraedro`, `cubo`, `octaedro`,
   `dodecaedro`, `icosaedro`, `balon` = icosaedro truncado): vértices → aristas (pares a
   distancia mínima, con tolerancia) → caras (planos por tres vértices que dejan a todos
   los demás a un lado; ordena los vértices de cada cara en sentido circular) → grafo de
   caras (vecinas si comparten dos vértices). Centro de cada cara = media de sus
   vértices.
2. Diagrama de Schlegel del dual: los nodos son los centros de las caras (vértices del
   dual); elige una cara del dual (un vértice V del sólido original: las caras que lo
   rodean forman el polígono exterior), proyecta desde un punto situado un poco más allá
   de V en la dirección de V (por ejemplo 1,15 × |V|) sobre el plano perpendicular a V
   que pasa por el centro del polígono exterior, y pasa a 2D con una base ortonormal de
   ese plano. Escala y desplaza a una caja cuadrada de lado 10 con margen; `dibujo = {
   ancho: 10, alto: 10, aristas: true, radio }` con `radio` tal que dos nodos no se
   toquen (empieza en 0,35 y baja si hace falta; el balón tiene 32 nodos).
3. Generador `poliedro` con parámetro `solido` (tipo `opcion`, defecto `dodecaedro`),
   `id` del tablero `poliedro-dodecaedro`, `nombre` «Caras del dodecaedro», `etiqueta`
   opcional vacía, sin `valor` ni `bloqueada`. `descripcion`: «Las casillas son las caras;
   dos caras son vecinas si comparten una arista».
4. `js/tableros/index.js`: añade `poliedro` al final de `generadores` (una línea de
   importación y una en la lista; nada más).
5. `tests/poliedros.test.js`: para cada sólido, número de casillas 4/6/8/12/20/32,
   `validarTablero` ok, grafo conexo, grados: tetraedro todas 3, cubo 4, octaedro 3,
   dodecaedro 5, icosaedro 3, balón 12 de grado 5 y 20 de grado 6; todos los centros
   dentro de la caja; distancia mínima entre centros > 2 × radio × 0,9;
   `generadores.at(-1).id === 'poliedro'`.
6. Mira el resultado una vez: `python3 -m http.server 8000` en segundo plano y una
   página de prueba temporal en el scratchpad de la sesión (no en el repositorio) que
   dibuje nodos y aristas en un `<svg>`, o imprime las coordenadas y comprueba a ojo que
   no hay dos nodos encima. Si una proyección sale fea (nodos muy juntos en el borde),
   prueba otro V o acerca el punto de proyección; que no cruce ninguna arista es lo que
   garantiza Schlegel.
7. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §2.
- `/Users/salasgar/Documents/git/Damas-poliédricas/js/polyhedra.js` (solo lectura).
- Coordenadas clásicas: tetraedro (±1, ±1, ±1) con número par de signos negativos;
  cubo (±1, ±1, ±1); octaedro permutaciones de (±1, 0, 0); icosaedro permutaciones
  cíclicas de (0, ±1, ±φ); dodecaedro (±1, ±1, ±1) y permutaciones cíclicas de
  (0, ±1/φ, ±φ); icosaedro truncado: permutaciones cíclicas pares de (0, ±1, ±3φ),
  (±1, ±(2+φ), ±2φ) y (±φ, ±2, ±(2φ+1)).

## Salida esperada
Tres ficheros en un commit: `git add js/tableros/poliedros.js tests/poliedros.test.js &&
git commit -m "Tarea 03: tableros poliédricos" -- js/tableros/poliedros.js
js/tableros/index.js tests/poliedros.test.js`.

## Cómo saber que ha terminado
`npm test` en verde con ≥ 8 pruebas nuevas; `generadores` termina en `poliedro`;
`generador('poliedro').crear({ solido: 'balon' }).casillas.length === 32`.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. No desbloquea nada por sí sola (la 07 usa el registro
tal como esté). Si vienes de la 02 encadenada, para aquí y da las frases.

## Trampas conocidas
- La tolerancia de «distancia mínima» en el icosaedro truncado: las aristas miden 2;
  usa tolerancia relativa (1 %), no absoluta.
- La proyección de Schlegel se deforma mucho si el punto de proyección está demasiado
  lejos de V (se convierte en una proyección paralela con nodos superpuestos).

## Prohibido
- Tocar otra cosa de `index.js` que la línea de `poliedro`. Tocar `rejillas.js`,
  `hexagonal.js` o `tipos.js`: si te falta algo ahí, incidencia.
- Editar código desde el shell. `git add -A`. Dependencias. Remoto o `push`.
- Meter 3D (Three.js, canvas giratorio): fuera de esta tanda (§9).
