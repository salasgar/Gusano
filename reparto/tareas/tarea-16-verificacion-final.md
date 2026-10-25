# Tarea 16 · Verificación final de la tanda

Actualizado: 2026-10-25 (coordinadora s-20261025T073409-9564e458: añadida la 17 a la precondición y a lo que se verifica)
Precondición: 08, 09, 10, 11, 12, 13, 14, 15 y 17 LISTAS (y sin reabiertas pendientes) · Disparo: MANUAL
Duración esperada: 45 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 90 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `herramientas/test-ui.js` (añade casos; la 08 está LISTA) y la carpeta de salida `reparto/salidas/16-verificacion-final/`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` entero y `reparto/_ESTADO.md`; lista
   `reparto/hechos/` (mira `reabiertas/` con cuidado: una reabierta sin terminada
   posterior bloquea esta tarea). `date -u`.
2. Precondición: las nueve terminadas existen (08-15 y 17).
3. Reclama (`NN` = `16`, `MINUTOS` = `90`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Decir si la tanda entera cumple la especificación, con pruebas repetibles para lo que
se pueda y a mano para lo demás, y sacar a la luz lo que nadie previó.

## Siguiente paso
`npm test` y `node herramientas/test-ui.js` en verde tal como están. Lee el veredicto
de la 08 (`reparto/salidas/08-verificacion-app/veredicto.md`) para no repetir lo que ya
se verificó ni perder sus hallazgos.

## Qué hay que hacer
1. Añade a `herramientas/test-ui.js` casos para: reto del día (se juega hasta el final
   y aparece el par); editor (grafo aleatorio de 10, «Jugar con este tablero», una
   jugada); compartir (tras 3 jugadas, el enlace de «Compartir» abierto en otra pestaña
   reproduce `marcador` y `camino`); obstáculos 20 % y valores `centro` en `cuadrado8`
   lado 5 máquina-máquina hasta el final; análisis (tras una partida, `#analisis`
   muestra la posición final y «Siguiente ›» recorre); `reglas.html` carga con las
   siete secciones; modo oscuro (`Emulation.setEmulatedMedia` con
   `prefers-color-scheme: dark`) sin texto ilegible (comprueba que el fondo del `body`
   cambia). Sigue en < 90 s y en «TODO OK». La 17 ya añadió casos para el saldo, las
   ventanas de papeles y de fin de ronda y el botón «atrás»: no los repitas; los
   casos nuevos tienen que pulsar «Empezar» y «Continuar con …» como los suyos.
2. A mano en Chrome (el navegador de la sesión si lo tienes; si no, capturas con Chrome
   sin cabeza a 375 y 1200 px): cada pantalla, cada generador con sus parámetros
   extremos (lado 3 y 12, radio 1 y 5, el balón), partida de 3 pares con «Un par más»,
   teclado (Tab llega a los botones), consola limpia en todo.
3. `reparto/salidas/16-verificacion-final/veredicto.md` con **Veredicto** (cada
   apartado de §6 y §7 y cada criterio de §8: cumple / no cumple y cómo lo viste) y
   **Hallazgos fuera de criterio** aparte; marcador `.ok-<sid>`. Lo que no cumpla va a
   `hechos/reabiertas/NN--<sid>.md` de la tarea responsable con lo exacto a corregir;
   no lo arregles tú.
4. `npm test` y `node herramientas/test-ui.js` en verde.

## Datos de entrada
- Todo el repositorio (solo lectura salvo `test-ui.js`). Veredicto de la 08.

## Salida esperada
Commit: `git commit -m "Tarea 16: casos finales del arnés" -- herramientas/test-ui.js`;
el veredicto con su marcador va en el commit de cierre.

## Cómo saber que ha terminado
Los dos arneses en verde dos veces seguidas; veredicto con las dos partes y marcador;
cada «no cumple» tiene su reabierta.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. En el mensaje de cierre, a Juan Luis: el veredicto en una
línea, los hallazgos fuera de criterio como decisiones pendientes, y qué tareas quedaron
reabiertas. Es la última de la tanda: no hay frases que dar salvo las de las reabiertas.

## Trampas conocidas
- Las de la 08 (coordenadas de pulsación, espera a la máquina). Lee sus trampas en
  `tarea-08-verificacion-app.md` antes de empezar.
- (Añadidas por la sesión que la cerró, 2026-10-25.) Cada caso nuevo del arnés tiene que
  pulsar las ventanas («Empezar», «Continuar con …»): `configurar` ya pulsa «Empezar», y
  `dejarJugarMaquinas` y `pulsarVentana` hacen el resto. `configurar` acepta ahora
  `obstaculos` y `valores`.
- En un grafo aleatorio del editor la ronda puede acabar antes de que el humano mueva: el
  caso l) pulsa «Continuar con …» mientras espera una jugada legal.
- Al abrir un enlace de «Compartir» en otra pestaña, cambia el origen por el del servidor
  del arnés (`enlace.replace(/^https?:\/\/[^/]+/, ctx.base)`): el enlace lleva el de la
  página que lo generó.
- El editor encadena la selección (la casilla creada o la última pulsada queda
  seleccionada): para conectar 0-1 de cero hay que mirar qué hay seleccionado.
- Contraste: el caso q) falla solo por debajo de 2 y anota en el detalle lo que no llega a
  4,5; hoy avisa de cuatro textos en oscuro (veredicto, hallazgo 1).

## Prohibido
- Arreglar código de la app. Editar desde el shell. `git add -A`. Dependencias. Remoto
  o `push`.
