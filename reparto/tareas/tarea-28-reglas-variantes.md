# Tarea 28 · Las variantes en la página de reglas y en el README

Actualizado: 2026-10-26 (tanda 2; coordinadora s-20261025T073409-9564e458)
Precondición: 26 LISTA · Disparo: MANUAL
Duración esperada: 20 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 45 min · Banda de modelo: MEDIO · Encadenable con: 26 (detrás de ella)
Ficheros que toca: `reglas.html`, `css/reglas.css`, `README.md`

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` §1 y **§10 entero**, `reglas.html` y `README.md`
   tal como están, y `reparto/_ESTADO.md`; lista `reparto/hechos/`. Lee la terminada de la
   26 (los textos reales de la app). `date -u`.
2. Precondición: `terminadas/26--*` existe.
3. Reclama (`NN` = `28`, `MINUTOS` = `45`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que quien lea las reglas entienda cada variante nueva en un par de frases y con un dibujo,
con las mismas palabras que usa la app.

## Siguiente paso
Mira cómo explica hoy `reglas.html` las variantes de la tanda 1 (obstáculos, casillas con
valor) y sigue ese estilo.

## Qué hay que hacer
1. `reglas.html`, en la sección de variantes (o una nueva «Más variantes»): bordes pegados
   y casillas fantasma (toro, cilindro, Möbius, Klein, en cualquier rejilla); flechas (al
   azar y con patrón); gusano de dos cabezas; dos gusanos; y que todo se combina. Para
   cada una, la regla en dos o tres frases, con los textos de la app (§10.6), y una figura
   SVG pequeña escrita a mano con las clases de `css/vista-tablero.css`, como la figura que
   ya hay. Los poliedros en 3D, una frase en la parte de tableros.
2. `css/reglas.css`: lo que necesiten las figuras nuevas, legible en oscuro (≥ 4,5).
3. `README.md`: la lista de variantes y los ficheros nuevos de la tanda 2
   (`js/tableros/sentido.js`, `js/ui/vista-3d.js`, `css/vista-3d.css`, `demo/vista-3d.*`)
   en su sitio de la estructura.
4. En Chrome, `reglas.html` a 375 y 1200 px, claro y oscuro, sin desplazamiento horizontal
   y con la consola limpia.
5. `npm test` y `node herramientas/test-ui.js` en verde (el caso de las reglas cuenta sus
   secciones: si añades una, dilo en la terminada para la 29).

## Datos de entrada
- `ESPECIFICACION.md` §1, §10. Terminada de la 26. `reparto/datos/sugerencias-futuras.md`
  (lo que **no** hay que describir: no está en la app).

## Salida esperada
Commit: `git commit -m "Tarea 28: las variantes en las reglas" -- reglas.html
css/reglas.css README.md`.

## Cómo saber que ha terminado
Las reglas explican las cuatro variantes nuevas con figura; arneses en verde.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. **No hagas `push`.**

## Trampas conocidas
- El caso de las reglas del arnés comprueba el número de secciones: si añades una sección,
  el caso fallará; no lo toques (es de la 29), anótalo.

## Prohibido
- Describir lo que no está en la app (sugerencias futuras). Tocar `herramientas/test-ui.js`
  o la app.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
