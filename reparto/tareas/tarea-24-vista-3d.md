# Tarea 24 · Poliedros en 3D que se giran con el ratón

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: ninguna (la tanda 1 está LISTA) · Disparo: MANUAL
Duración esperada: 50 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 100 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `js/tableros/poliedros.js` (añade `dibujo3d`), `js/ui/vista-3d.js`
(nuevo), `css/vista-3d.css` (nuevo), `demo/vista-3d.html` y `demo/vista-3d.js` (nuevos),
`tests/poliedros3d.test.js` (nuevo)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §2.2 (poliedros), §5 y **§10 entero** (esta tarea
   es la segunda mitad de §10.5), y `reparto/_ESTADO.md`; lista `reparto/hechos/`.
   `date -u`.
2. Reclama (`NN` = `24`, `MINUTOS` = `100`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Ver y jugar los poliedros como sólidos: cada cara es una casilla, se gira arrastrando y se
juega pulsando una cara.

## Siguiente paso
`npm test` en verde. Después `dibujo3d` en `poliedros.js` y su prueba.

## Qué hay que hacer
1. `js/tableros/poliedros.js`: cada tablero de poliedro gana `dibujo3d = { caras }`
   (§10.5): el polígono 3D de cada casilla, en el mismo orden que `casillas`, con los
   vértices ordenados alrededor de la cara (de modo que la normal calculada por la regla de
   la mano derecha apunte hacia fuera) y el sólido centrado en el origen y escalado a radio
   1. Nada más cambia: `id`, casillas, vecinos y `dibujo` iguales (los usan la URL y el
   reto).
2. `js/ui/vista-3d.js`: `crearVista3D(contenedor, tablero, { alClicar })` con la interfaz de
   `crearVista` (§5, §10.5): `actualizar({ ronda, legales, decoraciones, mostrarValores,
   elegirExtremo })`, `destruir()`. SVG sin dependencias; rotación con punteros (arrastrar
   gira como una bola, también con el dedo; `touch-action: none` en el lienzo); pulsar sin
   arrastrar (< 5 px) llama a `alClicar`; caras traseras ocultas; pintado de atrás
   adelante; mismas clases que la vista plana (gusano, pájaro, `gusano-0/1`, cabeza, legal,
   bloqueada, decoraciones, `elegir-extremo`); el gusano, por `ronda.cuerpos` (o `camino`
   si no lo hay, como la 23), dibujado solo en los tramos cuyas dos caras se ven. Una
   rotación inicial que no deje ninguna cara de canto.
3. `css/vista-3d.css`: lo propio de la vista 3D, con las variables de color de
   `css/estilo.css` y legible en oscuro (≥ 4,5 en los textos).
4. `demo/vista-3d.html` / `demo/vista-3d.js`: los seis sólidos, con un gusano de ejemplo
   escrito a mano y legales marcadas; un selector de sólido.
5. `tests/poliedros3d.test.js`: para los seis sólidos, `dibujo3d.caras.length` =
   casillas; cada cara plana (todos sus vértices en un plano), con 3/4/5/6 vértices según
   el sólido (el balón, 12 de 5 y 20 de 6); normales hacia fuera; dos casillas vecinas
   comparten exactamente dos vértices 3D; y la proyección de la vista (exporta una función
   pura, por ejemplo `proyectar(punto, rotacion)`) deja visibles entre 1 y n − 1 caras en
   la rotación inicial.
6. En Chrome (el navegador de la sesión o capturas sin cabeza a 375 y 1200 px, claro y
   oscuro): la demo gira, y pulsar una cara visible la marca.
7. `npm test` en verde.

## Datos de entrada
- `ESPECIFICACION.md` §2.2, §5, §10.5. `js/tableros/poliedros.js` ya calcula `vertices` y
  `encontrarCaras` (con normales hacia fuera): reutilízalos.

## Salida esperada
Commit: `git add js/ui/vista-3d.js css/vista-3d.css demo/vista-3d.html demo/vista-3d.js
tests/poliedros3d.test.js && git commit -m "Tarea 24: vista 3D de los poliedros" --
js/tableros/poliedros.js js/ui/vista-3d.js css/vista-3d.css demo/vista-3d.html
demo/vista-3d.js tests/poliedros3d.test.js`.

## Cómo saber que ha terminado
`npm test` en verde (≥ 8 pruebas nuevas); la demo gira y responde a las pulsaciones en
ratón y táctil.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. La integración en la app (el interruptor «Vista: plano /
3D») es de la 26. **No hagas `push`.**

## Trampas conocidas
- Un `pointerdown` seguido de `pointerup` sin moverse es una pulsación; con más de 5 px es
  un giro y no llama a `alClicar`.
- Las URL compartidas y el reto llevan tableros de poliedro: que `dibujo3d` sea un campo
  más no rompe `validarTablero` (compruébalo).

- (Añadida por la sesión que la cerró.) Con `setPointerCapture` el `pointerup` llega al
  `<svg>`, no a la cara: hay que guardar la cara en el `pointerdown`. Y `dibujo3d` se
  añade a `poliedros.js` tras `crearTablero` (que no lo conoce y es de la 20), como copia
  para que nadie mute la geometría cacheada.

## Prohibido
- Cambiar `id`, casillas, vecinos o `dibujo` de los poliedros. Tocar `index.js`,
  `rejillas.js`, `hexagonal.js` (de la 21), la vista plana (de la 23) o `jugar.js`.
- Editar desde el shell. `git add -A`. Dependencias (ni three.js ni nada). Remoto o `push`.
