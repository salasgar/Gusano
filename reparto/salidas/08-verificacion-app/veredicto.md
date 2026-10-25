# Verificación de la app de la tarea 07 · tarea 08

Sesión s-20261025T003437-fc7af901 · 2026-10-25T00:45:33Z · contra el árbol de trabajo tras el commit b158e90 (tarea 07).
Prueba repetible: `node herramientas/test-ui.js` (Chrome 155 sin cabeza, servidor estático propio). Dos ejecuciones
seguidas en «TODO OK» (52 s y 84 s con la máquina cargada por otras sesiones; en vacío ~15 s sin contar el arranque de Chrome).
Las comprobaciones manuales de abajo las hizo un guion aparte con el mismo `cdp.js`.

## Veredicto

### Los cinco casos de la ficha
| Caso | Veredicto | Prueba |
|---|---|---|
| a) `index.html` carga, consola limpia | **cumple** | título «Gusano», formulario de ajustes presente; se recorren `#reto`, `#analisis`, `#editor`, `#jugar` y la consola no recoge errores ni avisos (se ignora el 404 de `/favicon.ico`, ver hallazgos). |
| b) humano-humano, un par, `cuadrado4` lado 4, a clics | **cumple** | 31 jugadas pulsadas sobre `[data-indice].legal`; tras cada una el marcador del DOM coincide con `marcador()` del motor (réplica con `import()` dinámico); al final aparece «Empate a 16 puntos.», igual que el motor. |
| c) `aleatorio` contra `perfecto`, `caballo` lado 5 | **cumple** | termina sola en 2–9 s (tope 60 s); «Gana Jugador B por 22 a 14» / 24 a 13 / 23 a 10 en distintas ejecuciones (partidas distintas, semilla de reloj). |
| d) 375 × 700 | **cumple** | `scrollWidth` = 375 en ajustes, partida, Reto, Análisis y Editor; el tablero mide 343 px de ancho. A 320 px también `scrollWidth` = 320. |
| e) modo ayuda | **cumple** | el interruptor queda `aria-pressed=true`, dos jugadas añaden una casilla rellena cada una, aparece el «techo» y la consola sigue limpia. (Con el esbozo de `ayudas.js`; la tarea 09 lo cambia.) |

### §6 «Pantalla jugar»
- Cabecera con título y enlaces a las pantallas, `<main id="pantalla">`, pie con © y enlace a `reglas.html`: **cumple** (`index.html`).
- Ajustes → partida → fin: **cumple**; con `datos.tablero`/`datos.partida` se salta el formulario (leído en `jugar.js`; el camino del editor y el de la URL no se han ejercitado porque sus pantallas son esbozos).
- Marcador arriba con nombres, puntos acumulados, «Par X de N · Ronda Y», rol (gusano/pájaro) y turno: **cumple** (visto: «Par 1 de 1 · Ronda 1 | Jugador A | 2 | gusano | Jugador B | 0 | pájaro | Turno de Jugador A.»).
- Tablero en el mayor cuadrado que quepa: **cumple** (343 px a 375 de ancho).
- Botones: «Modo ayuda» durante la partida y «Nueva partida» siempre: **cumple**; «Compartir» solo si `enlaceDe` devuelve algo: **cumple** (no sale con el esbozo que devuelve `null`).
- Fin de partida: resultado («Gana Jugador B por 8 a 4.»), «Un par más», «Analizar», «Nueva partida»: **cumple**. «Un par más» deja «Par 2 de 2 · Ronda 1» con los puntos acumulados; «Nueva partida» vuelve al formulario.
- Máquinas con `setTimeout` corto y aviso «pensando…»: **cumple** (el texto «está pensando…» se vio en pantalla contra el nivel `fuerte`).
- Modo ayuda: la vista recibe `decoraciones(ronda)` y el marcador muestra el techo del gusano: **cumple** (`.techo` presente).

### §6 «Ajustes»
- Generador desplegable con los seis generadores (Cuadrado 4, Cuadrado 8, Caballo, Hexagonal, Superficie, Poliedro), sus parámetros generados de `parametros`, pares 1-5 (defecto 1), inicio azar/libre, jugador A y B persona o máquina con nivel (Aleatorio, Voraz, Fuerte, Perfecto) y nombres: **cumple**.
- «Devuelve `{ tableros, nombres, inicio, jugadores, semilla }`»: **cumple en sustancia, con una lectura**: `montarAjustes` entrega los ajustes (`generadorId`, `parametros`, `pares`, …) y `tablerosDesdeAjustes` produce `tableros`; `jugar.js` los encadena. Nadie más consume ese objeto hoy. Lo señalo por si 13/14 esperan la otra forma.
- Los campos de obstáculos y valores no están (los añaden 13 y 14): correcto.

### §6 «Esbozos»
- `reto`, `analisis`, `editor` montan «Próximamente» (visto en pantalla), `ayudas.js` devuelve un `Map` vacío y `url.js` devuelve `null`, hojas `reto/analisis/editor.css` existen: **cumple**. (Al escribir esto otras sesiones ya están llenando algunos de ellos en el árbol de trabajo; esta verificación se hizo antes de que cambiase nada de lo que los casos tocan.)

Resultado: **ningún criterio incumplido**; no se abre incidencia ni `reabiertas/07--*`.

## Hallazgos fuera de criterio

1. **El botón «atrás» necesita dos pulsaciones.** Cada clic en el menú añade dos entradas al historial (la del enlace `<a href="#reto">` y el `pushState` de `irA`, que repite la misma URL). Tras ir de Jugar a Reto, Análisis y Editor, `history.length` es 8; `history.back()` una vez deja el hash en `#editor` y solo la segunda vuelve a `#analisis`. Arreglo probable en `js/ui/app.js`: no empujar si `location.hash` ya es `#${id}` (es de la 07, ya cerrada).
2. **`/favicon.ico` da 404** y Chrome lo anota como error en la consola. No es fallo de la app, pero ensucia la consola de cualquiera que la mire; `test-ui.js` lo ignora. Un `<link rel="icon" href="data:,">` en `index.html` lo silencia.
3. En el formulario de ajustes, «Tablero» sale dos veces seguidas (leyenda del grupo y etiqueta del desplegable): texto confuso, no error.
4. Durante la ronda el marcador ya suma los puntos de la ronda en curso (el gusano A con la casilla inicial y la primera del pájaro marca 2 antes de que acabe la ronda). Es coherente con `marcador()` del motor (la prueba b lo comprueba), pero el título «puntos acumulados» podría leerse como «de rondas cerradas». Decisión de diseño de Juan Luis.
5. Tiempos del arnés: depende mucho de la carga de la máquina (con varias sesiones activas, de 15 s a 84 s en total). Si en la 16 hay prisa, `--solo` ejecuta un caso suelto.
6. No se ha podido probar visualmente el modo oscuro ni los colores (solo la prueba funcional); con `--capturas <carpeta>` el arnés guarda PNG de cada caso por si Juan Luis quiere mirarlos.
