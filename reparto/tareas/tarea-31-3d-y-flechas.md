# Tarea 31 · 3D que gira solo cuando no se ve ninguna jugada, y flechas más finas

Actualizado: 2026-10-28 (dada de alta por la coordinadora s-20261025T073409-9564e458 con las
decisiones de Juan Luis sobre los hallazgos de la 29)
Precondición: 29 LISTA (lo está) · Disparo: MANUAL
Duración esperada: 20 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/ui/vista-3d.js`, `js/ui/vista-tablero.js` (solo el tamaño de la punta
de las flechas), `css/vista-tablero.css` (solo `.arco`), `tests/poliedros3d.test.js`

**Esta tarea toma ficheros de tareas cerradas** (23, 24): son suyos durante esta tarea.
Puede ir a la vez que la 30 (no comparten ficheros).

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §10.5 y **§10.7**, y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. Lee los hallazgos 1 y 2 de
   `reparto/salidas/29-verificacion-tanda2/veredicto.md` y la terminada de la 24. `date -u`.
2. Reclama (`NN` = `31`, `MINUTOS` = `45`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que en 3D nunca se quede alguien mirando un sólido sin jugadas a la vista, y que las
flechas no tapen las casillas en el móvil.

## Siguiente paso
`npm test` en verde. Después una función pura que dé la rotación que pone una cara de
frente, con su prueba.

## Qué hay que hacer
1. `js/ui/vista-3d.js`: exporta una función pura `rotacionHacia(cara, rotacion)` (la
   rotación más corta desde `rotacion` que deja el centro de esa cara de frente) y úsala en
   `actualizar` según §10.7: solo con `legales` no vacías y ninguna visible; animación de
   unos 400 ms con `requestAnimationFrame` (interpolando la rotación), instantánea con
   `prefers-reduced-motion`; nunca durante un arrastre (si llega un `actualizar` mientras se
   arrastra, se gira al soltar si sigue haciendo falta).
2. Flechas: en `vista-tablero.js` la punta (`markerWidth`, `markerHeight` y su trazado) y en
   `css/vista-tablero.css` el grosor de `.arco`, más pequeños. Mira el resultado en
   `hexagonal` radio 3 con `flechas: corrientes` a 375 px y en `cuadrado4` lado 6
   `manhattan` a 1200 px: las casillas se distinguen y las flechas se siguen viendo.
3. `tests/poliedros3d.test.js`: para cada sólido y cada cara, `rotacionHacia` deja esa cara
   visible y su normal mirando al espectador (componente z máxima entre las caras); y en un
   tetraedro con la rotación inicial, una cara de detrás pasa a verse.
4. En Chrome (o capturas sin cabeza a 375 y 1200 px, claro y oscuro): un tetraedro en el que
   tras la primera jugada todas las salidas quedan detrás → gira solo y se ven; uno en que
   se ve alguna → no gira. Y las flechas de los dos tableros del punto 2.
5. `npm test` y `node herramientas/test-ui.js` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §10.5, §10.7. Veredicto de la 29. `carasVisibles`, `rotacionInicial` y
  `proyectar` de `vista-3d.js` (24).

## Salida esperada
Commit: `git commit -m "Tarea 31: 3D gira solo si no se ve ninguna jugada, y flechas más
finas" -- js/ui/vista-3d.js js/ui/vista-tablero.js css/vista-tablero.css
tests/poliedros3d.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 3 pruebas nuevas); en 3D nunca queda un turno humano sin jugadas a la
vista; flechas finas y legibles.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. Cuando la 30 y la 31 estén LISTAS pasa a PENDIENTE la 32: da
su frase si la otra ya está cerrada. **No hagas `push`.**

## Trampas conocidas
- La de la 29: en 3D solo se pueden pulsar las caras visibles, y en tetraedro, octaedro e
  icosaedro las legales pueden estar detrás.
- `legales` viene vacía en el turno de la máquina: ahí no se gira (lo haría a cada jugada de
  la máquina y marea).

## Prohibido
- Tocar `jugar.js` (de la 30), el motor, `herramientas/test-ui.js` (de la 32), o de
  `vista-tablero.js` otra cosa que la punta de las flechas.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
