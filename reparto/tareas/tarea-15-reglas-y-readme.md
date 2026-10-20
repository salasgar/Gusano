# Tarea 15 · Página de reglas y README

Actualizado: 2026-10-20
Precondición: 07 LISTA · Disparo: MANUAL
Duración esperada: 30 min (tiempo de sesión, no de persona) · Caducidad del reclamo: 60 min · Banda de modelo: MEDIO · Encadenable con: —
Ficheros que toca: `reglas.html`, `css/reglas.css` (nuevos), `README.md` (reescribe el de la 01)

La banda dice con qué modelo conviene abrir la sesión (tabla en `reparto/proyecto.md`).
**Este fichero es la fuente de la banda**: el tablón la copia de aquí.

## Antes de empezar
1. Lee `_COMUN.md`, `ESPECIFICACION.md` (§0, §1, §2.2, §9) y `reparto/_ESTADO.md`; lista
   `reparto/hechos/`. `date -u`.
2. Precondición: `terminadas/07--*` existe.
3. Reclama (`NN` = `15`, `MINUTOS` = `60`), `sleep 30 && ls hechos/reclamos/`, cede o
   regenera, y sigue hasta cerrar o soltar.

## Objetivo
Que un alumno entienda el juego sin que nadie se lo explique (`reglas.html`, enlazada
desde el pie de la app), y que quien abra el repositorio sepa qué es, cómo se ejecuta y
cómo se amplía (`README.md`).

## Siguiente paso
`npm test` en verde. Juega una partida en Chrome para ver la app tal como está; lee la
sección de ayuda de `/Users/salasgar/Documents/git/Conecta-puntos/index.html` para
copiar el tono (de tú, frases cortas, sin tecnicismos).

## Qué hay que hacer
1. `reglas.html` (misma cabecera que `index.html`, carga `css/estilo.css` y
   `css/reglas.css`, pie con el copyright y enlace de vuelta a `index.html`): «Cómo se
   juega» (las reglas de §1 en lenguaje de alumno de 12 años, con un ejemplo paso a
   paso en un SVG pequeño en línea: una rejilla 4×4 con un gusano de 6 tramos, la
   cabeza y las legales resaltadas; puedes generarlo con `demo/vista.html` y copiar el
   SVG del DOM, limpiándolo), «Gusano y pájaro» (quién quiere qué), «Pares y puntos»
   (formato duplicado, desempate), «Tableros» (una línea por generador de §2.2, qué
   cambia en cada uno; superficies y poliedros con una frase que invite a pensarlos),
   «Obstáculos y valores» (una línea cada uno), «Consejos» (tres: el pájaro busca
   esquinas y callejones; el gusano huye de los bordes; mira el techo en modo ayuda),
   «Para clase» (reto del día: todos el mismo problema; análisis para ver los errores).
   Sin números de página ni nada de imprimir: es una página web.
2. `css/reglas.css`: anchura de lectura (65 caracteres), figuras centradas, modo
   oscuro vía variables.
3. `README.md`: qué es (dos párrafos), captura no (no hay imágenes aún), «Ver en
   local» (`python3 -m http.server 8000`), «Pruebas» (`npm test`, `node
   herramientas/test-ui.js` si la 08 está LISTA: compruébalo en `hechos/terminadas/`),
   «Estructura» (la lista de §0 resumida), «Añadir un tablero» (un generador nuevo en
   `js/tableros/`, registrarlo en `index.js`, pruebas de grados), «Publicar» (GitHub
   Pages sobre `main`, sin compilar: pasos para Juan Luis, no ejecutados), licencia MIT
   y autor. En español.
4. Comprueba en Chrome `reglas.html` a 375 px y en escritorio, y el enlace del pie de
   la app.

## Datos de entrada
- `ESPECIFICACION.md` §1 y §2.2. La app (07) para describirla tal como es.
- Conecta-puntos `index.html` (solo lectura, para el tono).

## Salida esperada
Commit: `git add reglas.html css/reglas.css && git commit -m "Tarea 15: reglas y
README" -- reglas.html css/reglas.css README.md`.

## Cómo saber que ha terminado
`reglas.html` abre desde el pie de la app, con las siete secciones y la figura; el
README tiene las siete secciones; `npm test` sigue en verde.

## Al terminar
Sigue «Cierre» de `_COMUN.md`. No encadenes.

## Trampas conocidas
- Si copias un SVG de `demo/vista.html`, quita `data-indice` y los oyentes no viajan:
  es solo una figura; dale `role="img"` y un `aria-label`.

## Prohibido
- Tocar `index.html` (el enlace del pie ya existe). Inventar reglas que no estén en
  §1: si algo no está claro, pregúntalo como propuesta.
- Editar desde el shell. `git add -A`. Dependencias. Remoto o `push`.
