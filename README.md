# Gusano

Juego de estrategia para dos jugadores sobre un grafo, de Juan Luis Salas García. Los dos
jugadores alargan el mismo gusano casilla a casilla: uno quiere que sea largo (el gusano) y
el otro que acabe pronto (el pájaro). Se juega por pares de rondas en el mismo tablero, con
los papeles cambiados, para que gane quien mejor juegue y no quien tenga mejor tablero.

Es una aplicación web estática, sin dependencias ni compilación: HTML, CSS y JavaScript en
módulos ES. Se puede jugar entre dos personas o contra la máquina (cuatro niveles, hasta uno
que resuelve el tablero exacto), sobre rejillas, hexágonos, superficies con los bordes
pegados y poliedros. Las reglas para jugadores están en [`reglas.html`](reglas.html); las
reglas formales y las interfaces entre módulos, en [`ESPECIFICACION.md`](ESPECIFICACION.md).

## Ver en local

Los módulos ES no cargan desde `file://`, así que hay que servir la carpeta:

```sh
python3 -m http.server 8000
```

y abrir <http://localhost:8000/> (también `npm run servir`).

## Pruebas

```sh
npm test
```

Ejecuta `node --test`, que descubre `tests/*.test.js` (hace falta Node 22 o posterior). No
hay nada que instalar.

Las pruebas de la interfaz van aparte, en Chrome sin cabeza (hace falta tener Chrome
instalado; no necesita paquetes):

```sh
node herramientas/test-ui.js
```

Abre la aplicación, juega partidas completas y termina con «TODO OK» (código 0) o con
código 1 si algún caso falla. Opciones: `--solo <texto>` ejecuta solo los casos cuyo nombre
contiene ese texto; `--capturas <carpeta>` guarda capturas de pantalla (por ejemplo,
a 375 px de ancho); `--chrome <ruta>` indica dónde está Chrome si no lo encuentra.

## Estructura

```
index.html            la aplicación
reglas.html           reglas para jugadores
css/                  estilo.css (variables y disposición), vista-tablero.css, una hoja por pantalla
js/tableros/          tablero como dato (tipos.js) y generadores; index.js los registra
js/motor/             reglas de una ronda y de una partida por pares
js/ia/                niveles de máquina y resolutor exacto
js/ui/                vista SVG del tablero, ajustes, navegación, modo ayuda
js/pantallas/         jugar, reto del día, análisis, editor
js/compartir/         partida ⇄ enlace
js/util/azar.js       generador aleatorio con semilla
demo/                 página de prueba de la vista del tablero
tests/                pruebas unitarias
reparto/              coordinación del desarrollo entre sesiones; no es parte de la aplicación
```

## Añadir un tablero

1. Crea un generador en `js/tableros/` (por ejemplo `mitablero.js`) que exporte un objeto
   `{ id, nombre, descripcion, parametros, crear(parametros) }`. `crear` devuelve un tablero
   construido con `crearTablero` de `js/tableros/tipos.js`: casillas con su posición, lista
   de aristas y caja de dibujo. El formato exacto está en `ESPECIFICACION.md`, §2.
2. Regístralo en la lista `generadores` de `js/tableros/index.js`, en el orden en que
   quieras verlo en los ajustes. El `id` va en los enlaces compartidos y en los retos: una
   vez publicado, no lo cambies.
3. Añade pruebas en `tests/` con el número de casillas y los grados esperados (esquinas,
   bordes, centro) y comprueba que `validarTablero` da `{ ok: true }`. Mira
   `tests/tableros.test.js` como modelo.

Los obstáculos y las casillas con valor se aplican sobre cualquier tablero, así que un
generador nuevo los admite sin más.

## Publicar

No se ha publicado nada todavía. Como no hay nada que compilar, bastaría con GitHub Pages
sobre `main`. Pasos para quien quiera hacerlo (no están ejecutados):

1. Crear un repositorio en GitHub y subir el historial (`git remote add origin …`,
   `git push -u origin main`).
2. En el repositorio, Settings → Pages → «Deploy from a branch» → rama `main`, carpeta
   `/ (root)`.
3. Esperar a que GitHub publique y abrir la dirección que indique.

## Licencia y autor

© 2026 Juan Luis Salas García. Licencia MIT (ver [`LICENSE`](LICENSE)).
