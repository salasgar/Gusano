# Gusano · Especificación

Versión 1 · 2026-10-20 · escrita al montar el reparto (sesión coordinadora; sid en
`reparto/hechos/notas/`). **Es el contrato entre las tareas del reparto**: cada módulo
expone exactamente lo que dice aquí, y lo que no está aquí no se decide en una tarea
MEDIO o BAJO: se entrega como propuesta en la terminada o se para con `BLOQUEADA por
decisión` (ver `reparto/tareas/_COMUN.md`). Revisión de Juan Luis: **pendiente** (§9 lista
las decisiones que conviene que mire antes de abrir sesiones). Si una tarea encuentra
aquí un error o un hueco, lo escribe en `reparto/hechos/incidencias/<sid>.md` y lo dice;
este fichero solo lo edita la coordinadora.

## 0. Qué es y convenciones

Gusano es un juego de estrategia para dos jugadores sobre un grafo. Aplicación web
estática de Juan Luis Salas García (profesor de matemáticas; alumnos de 12 a 18 años),
pensada para jugar en un ordenador o un móvil entre dos personas o contra la máquina, y
para usarse en clase.

- **Sin dependencias, sin compilación.** HTML, CSS y JavaScript moderno en módulos ES
  (`<script type="module">`, `import … from './x.js'` con la extensión `.js` siempre).
  Node 26 para las pruebas (`npm test` ejecuta `node --test`, que descubre
  `tests/*.test.js`). Nada de npm install: `package.json` no tiene dependencias.
- **Servir en local**: desde la raíz del repositorio, `python3 -m http.server 8000` y
  abrir `http://localhost:8000/`. Los módulos ES no cargan desde `file://`.
- **Español** en la interfaz, el código, los identificadores y los comentarios.
  Tildes y eñes en los textos que ve el usuario; los identificadores sin tildes
  (`pajaro`, `tableroHexagonal`).
- **Estilo sobrio**, como los otros juegos del sitio: fuente del sistema, fondo
  `#f9f9f7` (claro) y `#0d0d0d` (oscuro, con `prefers-color-scheme`), esquinas de 8 a
  12 px, nada de librerías de iconos. Primero móvil vertical (375 px de ancho sin
  desplazamiento horizontal), después escritorio.
- Navegadores: Chrome, Safari y Firefox actuales. Sin transpilar.
- Copyright: `© 2026 Juan Luis Salas García`, licencia MIT (`LICENSE`).

Estructura de carpetas (la dueña de cada fichero es la tarea que lo declara en «Ficheros
que toca»; nadie más lo edita):

```
index.html            app (T07; T01 deja un marcador de posición)
reglas.html           reglas para jugadores (T15)
css/estilo.css        variables, tipografía, disposición (T01 crea las variables; T07 el resto)
css/vista-tablero.css estilos de la vista del tablero (T06)
css/<pantalla>.css    una hoja por pantalla extra (T07 crea vacías; T09-T11 las llenan)
js/util/azar.js       generador aleatorio con semilla (T01)
js/tableros/tipos.js  crearTablero, validarTablero (T02)
js/tableros/index.js  registro de generadores (T02; T03 añade los poliedros)
js/tableros/*.js      generadores (T02, T03), obstaculos.js (T13), valores.js (T14)
js/motor/ronda.js     reglas de una ronda (T04)
js/motor/partida.js   partida por pares, formato duplicado, marcador (T04)
js/ia/jugadores.js    niveles de máquina (T05)
js/ia/minimax.js      resolutor exacto y «par» (T05)
js/ui/vista-tablero.js  dibujo SVG del tablero y del gusano (T06)
js/ui/app.js          registro de pantallas y navegación (T07)
js/ui/ajustes.js      formulario de ajustes de partida (T07; T13 y T14 añaden campos)
js/ui/ayudas.js       decoraciones del modo ayuda (T07 deja un esbozo; T09 lo llena)
js/pantallas/jugar.js, reto.js, analisis.js, editor.js (T07 crea; T10, T09, T11 llenan)
js/compartir/url.js   partida ⇄ URL (T07 deja un esbozo; T12 lo llena)
js/main.js            arranque (T07)
demo/vista.html       página de prueba de la vista (T06)
herramientas/         cdp.js y test-ui.js, pruebas de interfaz en Chrome sin cabeza (T08)
tests/*.test.js       pruebas unitarias; cada tarea crea las suyas
reparto/              el reparto (tablón, fichas, hechos); no es parte de la app

Tanda 2 (§10):
js/tableros/sentido.js  conSentidoUnico, flechas al azar (T20)
js/ui/textos-partida.js textos de la pantalla de juego (T17; T26 los amplía)
js/ui/vista-3d.js     vista 3D de los poliedros (T24), con css/vista-3d.css y demo/vista-3d.*
```

## 1. Reglas del juego

1. El tablero es un grafo: casillas (nodos) y conexiones (aristas, simétricas).
2. Una **ronda**: la casilla inicial se rellena (quién la elige, en §3.2). Después, los
   jugadores alternan: cada uno rellena una casilla **libre y vecina de la última
   rellenada** (la cabeza). El primero en mover tras la casilla inicial es el pájaro.
   Las casillas rellenas no se vacían en toda la ronda.
3. La ronda acaba cuando la cabeza no tiene vecinas libres. **Puntos de la ronda** =
   suma de los valores de las casillas rellenas (valor 1 cada una salvo en la variante
   de casillas con valor, §2.1). Se los lleva el jugador que hacía de **gusano**.
4. Papeles: **gusano** (maximizador: quiere el camino largo; es quien «tiene» la casilla
   inicial) y **pájaro** (minimizador: quiere que acabe pronto). El pájaro puede acabar
   la ronda metiéndose él mismo en un callejón sin salida.
5. Una **partida** son uno o más **pares** de rondas. En cada par se juegan dos rondas
   **en el mismo tablero y desde la misma casilla inicial** (formato «duplicado»): en la
   primera el jugador A es gusano, en la segunda lo es B. Gana la partida quien sume más
   puntos; empate si suman igual (la interfaz ofrece «un par más» como desempate).
6. Con 8 vecinas, dos tramos diagonales del gusano pueden cruzarse: las casillas son
   nodos, no hay regla contra ello.
7. Variantes de esta tanda: **obstáculos** (casillas bloqueadas desde el principio, que
   nunca se pueden rellenar) y **casillas con valor** (enteros, también negativos). Fuera
   de esta tanda: grafos dirigidos, gusano de dos cabezas, dos gusanos.

## 2. Tableros

### 2.1 Estructura de datos

Un tablero es un objeto de datos puro, serializable a JSON tal cual (sin funciones):

```js
{
  id: 'cuadrado4-6',                 // único para ese tablero concreto
  nombre: 'Cuadrado 6×6, 4 vecinas', // para la interfaz
  descripcion: '',                   // opcional; p. ej. «Los bordes izquierdo y derecho están pegados»
  generador: { id: 'cuadrado4', parametros: { lado: 6 } },  // opcional; lo pone el generador que lo creó
  casillas: [                        // índice = número de casilla
    { x: 0.5, y: 0.5,                // centro, en coordenadas del dibujo
      vertices: [[0,0],[1,0],[1,1],[0,1]],  // opcional: polígono a dibujar; si falta, círculo de radio dibujo.radio
      etiqueta: 'a1',                // opcional, texto corto
      bloqueada: false,              // opcional (defecto false): obstáculo, nunca se rellena
      valor: 1 },                    // opcional (defecto 1): entero, puede ser negativo
    …
  ],
  vecinos: [[1, 6], [0, 2, 7], …],  // vecinos[i]: índices ordenados, sin repetidos, sin i; simétrica
  dibujo: { ancho: 6, alto: 6, aristas: false, radio: 0.35 }
    // caja [0, ancho] × [0, alto] en la que caben todas las casillas; aristas: true dibuja
    // una línea entre cada par de vecinas (caballo, poliedros, editor); radio: el de los
    // círculos cuando una casilla no trae vertices
}
```

Reglas: al menos 2 casillas; `vecinos` simétrica; una casilla bloqueada conserva su
lista de vecinos (sigue «estando» en el tablero; el motor la trata como ocupada desde
el principio). Las coordenadas crecen hacia la derecha y **hacia abajo** (como SVG).

`js/tableros/tipos.js` (T02):

```js
export function crearTablero({ id, nombre, descripcion, generador, casillas, aristas, dibujo })
  // aristas: lista de pares [i, j]; construye vecinos (simétrica, ordenada, sin repetidos)
  // y devuelve el tablero. Lanza Error si algo no cuadra.
export function validarTablero(tablero) // → { ok: true } | { ok: false, errores: ['…'] }
```

### 2.2 Generadores

```js
// js/tableros/index.js
export const generadores = [ … ];          // en el orden en que los lista la interfaz
export function generador(id)              // → el generador o undefined
// Cada generador:
{ id: 'cuadrado4', nombre: 'Cuadrado, 4 vecinas', descripcion: 'Cada casilla se conecta con las de arriba, abajo, izquierda y derecha.',
  parametros: [ { id: 'lado', nombre: 'Lado', tipo: 'entero', min: 3, max: 12, defecto: 6 } ],
  // tipo 'opcion': { id, nombre, tipo: 'opcion', opciones: [{ valor: 'toro', nombre: 'Toro' }, …], defecto: 'toro' }
  crear(parametros) }                      // → tablero (con tablero.generador relleno); parametros que falten toman el defecto
```

Generadores y sus identificadores (fijos: van en las URL compartidas y en los retos):

| id | Parámetros | Casillas | Vecindad | Dibujo |
|---|---|---|---|---|
| `cuadrado4` | lado 3-12 (6) | lado² | arriba, abajo, izquierda, derecha | cuadrados de lado 1, `aristas: false` |
| `cuadrado8` | lado 3-12 (6) | lado² | las 8 de alrededor | ídem |
| `caballo` | lado 4-10 (6) | lado² | salto de caballo | cuadrados; `aristas: false` (las líneas de los saltos serían un lío; las legales se resaltan) |
| `hexagonal` | radio 1-5 (3) | 3r²+3r+1 | las 6 vecinas | hexágonos de vértice arriba (circunradio 1/√3, separación 1 entre centros) |
| `superficie` | lado 4-10 (6), superficie: cilindro / toro / mobius / klein | lado² | 4 vecinas con bordes pegados | cuadrados; `descripcion` dice qué bordes están pegados y cómo |
| `poliedro` (T03) | solido: tetraedro / cubo / octaedro / dodecaedro / icosaedro / balon | 4/6/8/12/20/32 | caras que comparten arista | círculos en el diagrama de Schlegel del poliedro **dual**; `aristas: true` |

Bordes pegados (`superficie`, casilla (fila f, columna c), lado n): cilindro: c se toma
módulo n; toro: f y c módulo n; mobius: al pasar por el borde derecho/izquierdo, la fila
se invierte (f → n−1−f); klein: toro con la inversión de Möbius en el borde
izquierdo/derecho. Nunca una casilla es vecina de sí misma ni se repite una vecina.

Poliedros: las casillas son las **caras**; dos caras son vecinas si comparten una
arista. El dibujo coloca cada cara en la posición de su vértice en el diagrama de
Schlegel del poliedro dual (todas las casillas quedan dentro de un polígono exterior
y ninguna arista cruza otra). Se construyen a partir de las coordenadas de los vértices
(caras = planos de soporte), como hace `js/polyhedra.js` de Damas-poliédricas (código de
Juan Luis, se puede adaptar). «balon» es el icosaedro truncado (12 pentágonos + 20
hexágonos).

### 2.3 Transformaciones (T13, T14)

```js
// js/tableros/obstaculos.js
export function conObstaculos(tablero, proporcion, azar)
  // → tablero nuevo con round(proporcion × casillas) casillas marcadas bloqueada: true,
  // elegidas con `azar` (§4 de azar.js), sin desconectar el grafo de las libres;
  // id: `${tablero.id}-obs${porcentaje}`; descripcion añade «N casillas bloqueadas».
// js/tableros/valores.js
export function conValores(tablero, modo, azar)
  // modos: 'uniforme' (1, 2 o 3 al azar), 'centro' (3 en el centro, 1 en el borde, según
  // distancia al centro del dibujo), 'trampas' (como uniforme, pero un 10 % de casillas
  // con valor −2). id: `${tablero.id}-val-${modo}`.
```

## 3. Motor

### 3.1 Ronda (`js/motor/ronda.js`, T04)

Funciones puras: ninguna muta su argumento; `jugar` devuelve una ronda nueva que
comparte el tablero.

```js
export function nuevaRonda(tablero)          // → { tablero, camino: [] }
export function cabeza(ronda)                // → índice de la última casilla, o null si el camino está vacío
export function turno(ronda)                 // → 'gusano' si camino.length es par (0 incluido), 'pajaro' si impar
export function ocupada(ronda, casilla)      // → true si está en el camino o es bloqueada
export function jugadasLegales(ronda)        // → índices; camino vacío: todas las no bloqueadas; si no: vecinas libres de la cabeza
export function jugar(ronda, casilla)        // → ronda nueva; lanza Error('jugada ilegal') si no está en jugadasLegales
export function rondaTerminada(ronda)        // → camino no vacío y jugadasLegales vacío
export function puntuacion(ronda)            // → suma de (valor ?? 1) de las casillas del camino
export function alcanzables(ronda)           // → índices de las casillas libres a las que se llega desde la cabeza
                                             //   pasando solo por libres (sin la cabeza); camino vacío: todas las libres
export function cotaSuperior(ronda)          // → puntuacion + suma de los valores positivos de alcanzables
```

«Quién rellenó cada casilla»: `camino[k]` es del gusano si `k` es par y del pájaro si
es impar. La casilla inicial (`k = 0`) cuenta como del gusano aunque la haya puesto la
app.

### 3.2 Partida (`js/motor/partida.js`, T04)

```js
export function nuevaPartida({ nombres: ['A', 'B'], tableros: [t1, t2, …], inicio: 'azar' | 'libre', semilla })
  // Un par por tablero. inicio 'azar': la app sortea la casilla inicial de cada par con crearAzar(semilla)
  // entre las no bloqueadas y la pone antes del primer turno (el pájaro mueve primero).
  // inicio 'libre': en la primera ronda del par el gusano elige la casilla inicial (jugadasLegales de un
  // camino vacío); la segunda ronda empieza con esa misma casilla ya puesta.
  // → { nombres, inicio, semilla, pares: [{ tablero, inicioFijo: índice | null, rondas: [ronda, ronda] }], par: 0, ronda: 0, terminada: false }
export function rondaActual(partida)         // → la ronda en juego
export function rolDe(partida, jugador)      // jugador 0 | 1 → 'gusano' | 'pajaro' en la ronda actual (ronda 0 del par: A gusano; ronda 1: B gusano)
export function jugadorEnTurno(partida)      // → 0 | 1
export function jugarEnPartida(partida, casilla)  // → partida nueva; cierra la ronda cuando termina y pasa a la siguiente o al par siguiente; al acabar el último par, terminada: true
export function marcador(partida)
  // → { puntos: [pA, pB], pares: [{ puntosA, puntosB }], ganador: 0 | 1 | null }  (null: empate o no terminada)
export function anadirPar(partida, tablero)  // → partida nueva con un par más (desempate); solo si terminada
```

## 4. Máquina (`js/ia/`, T05)

```js
// js/ia/jugadores.js
export const niveles = [
  { id: 'aleatorio', nombre: 'Aleatorio' },
  { id: 'voraz',     nombre: 'Voraz' },
  { id: 'fuerte',    nombre: 'Fuerte' },
  { id: 'perfecto',  nombre: 'Perfecto' } ];
export function elegirJugada(nivelId, ronda, { azar, tiempoMaximoMs = 1500 } = {})
  // → una casilla de jugadasLegales(ronda), para el rol que tenga el turno. Síncrona.
```

- `aleatorio`: uniforme entre las legales (con `azar`, reproducible).
- `voraz`: el gusano elige la legal que deja más casillas alcanzables (y evita las que
  cierran la ronda si hay otra); el pájaro, la que deja menos (y prefiere una que cierre
  la ronda). Empates, con `azar`.
- `fuerte`: alfa-beta con profundización iterativa dentro de `tiempoMaximoMs`;
  evaluación de un nodo no terminal = `puntuacion + 0,5 × (cotaSuperior − puntuacion)`;
  terminal = `puntuacion`; orden de jugadas por la heurística voraz; tabla de
  transposición por (casillas ocupadas, cabeza).
- `perfecto`: `valorExacto` si el tablero tiene ≤ 30 casillas y cabe en el presupuesto;
  si no, `fuerte` con 3000 ms.

```js
// js/ia/minimax.js
export function valorExacto(ronda, { maxEstados = 2_000_000 } = {})
  // → { valor, jugada: casilla | null, estados, completo: boolean }  (completo: false si se agotó maxEstados;
  //   entonces valor y jugada son los de la búsqueda parcial y no se garantizan)
export function par(tablero, inicio, opciones)   // valor exacto con camino = [inicio]; null si no completo
```

Representación interna sugerida: máscara de bits de ocupadas (≤ 30 casillas cabe en un
entero de 32 bits sin signo; clave de memoria `mascara * 64 + cabeza`), bloqueadas en la
máscara inicial. **Oráculo**: los valores de
`reparto/datos/analisis-2026-10-20/valores-minimax.md` (p. ej. cuadrado4 lado 4: 12
desde cualquier casilla; cuadrado8 lado 4: 15 desde una esquina y desde una central, 14 desde (0,1);
caballo lado 4: máximo 12 y mínimo 4 sobre los inicios; hexagonal radio 2: 19/15; toro
lado 4: 14). Las pruebas de T05 los reproducen.

## 5. Vista del tablero (`js/ui/vista-tablero.js`, T06)

```js
export function crearVista(contenedor, tablero, { alClicar })   // alClicar(indice) al pulsar una casilla
  // → { actualizar, destruir }
vista.actualizar({ ronda, legales = [], decoraciones = new Map(), mostrarValores = false })
  // decoraciones: Map<índice, { clase?: string, texto?: string }>  (clase se añade al elemento de la casilla;
  // texto se dibuja encima, p. ej. el número de tramo o la cota)
vista.destruir()
```

Dibujo en SVG (`viewBox` = la caja de `dibujo`, `width: 100%`, cuadrado máximo que
quepa). Cada casilla: `<polygon>` con sus `vertices` o `<circle>` de `dibujo.radio`,
con las clases `casilla`, y además `bloqueada`, `gusano` / `pajaro` (según quién la
rellenó, §3.1), `cabeza`, `legal`. Si `dibujo.aristas`, una `<line class="arista">` por
par de vecinas, debajo de las casillas. El gusano se dibuja como una `<polyline
class="gusano-cuerpo">` por los centros del camino (trazo ancho, uniones redondeadas) y
una cabeza con dos ojos en la última casilla. Con `mostrarValores`, el valor de cada
casilla se escribe en su centro (siempre que algún valor ≠ 1). Las etiquetas se dibujan
pequeñas. Pulsar una casilla llama a `alClicar(indice)` aunque no sea legal (la pantalla
decide). Colores (variables en `css/estilo.css`, defectos en `css/vista-tablero.css`):
gusano `--gusano: #2f9e5a`, pájaro `--pajaro: #6a5acd`, legal `--legal: #f2c94c`,
bloqueada gris oscuro, inalcanzable atenuada (`.inalcanzable`).

## 6. Aplicación (T07)

- `index.html`: cabecera con el título «Gusano» y los enlaces a las pantallas, `<main
  id="pantalla">`, pie con `© 2026 Juan Luis Salas García` y enlace a `reglas.html`.
  Carga `css/estilo.css`, `css/vista-tablero.css`, las hojas de las pantallas y
  `js/main.js` como módulo.
- `js/ui/app.js`: `export const pantallas = [jugar, reto, analisis, editor]` (cada una
  `{ id, titulo, montar(contenedor, contexto) }`), `export function irA(id, datos)`.
  `contexto = { irA, generadores, datos }`. La pantalla activa va en el `hash` de la URL
  (`#jugar`, `#reto`, …); `main.js` la lee al arrancar y antes llama a
  `partidaDesdeURL()` (§7.4): si devuelve una partida, abre `jugar` con ella.
- **Pantalla jugar** (`js/pantallas/jugar.js`): 1) ajustes (§6.1) o, si `datos.tablero`
  o `datos.partida` vienen de otra pantalla, se salta; 2) la partida: marcador arriba
  (nombres, puntos acumulados, par y ronda en curso, quién es gusano y quién pájaro,
  de quién es el turno), tablero en el mayor cuadrado que quepa, debajo los botones
  (`Rendirse la ronda` no existe: no hace falta; sí `Nueva partida`, `Compartir` si
  `enlaceDe` devuelve algo, y el interruptor `Modo ayuda`); 3) fin de partida: resultado,
  `Un par más` (desempate: mismo generador, tablero nuevo), `Analizar` (→
  `irA('analisis', { partida })`), `Nueva partida`. Las máquinas juegan con un
  `setTimeout` corto tras pintar, con un aviso «pensando…». Con modo ayuda: la vista
  recibe `decoraciones(ronda)` de `js/ui/ayudas.js` y el marcador muestra la cota
  superior («techo») del gusano.
- **Marcador de suma cero, ventanas de papeles y de fin de ronda** (T17; pedido por Juan
  Luis el 2026-10-25; sustituye a lo que diga arriba sobre «puntos acumulados» y al aviso
  «Fin de la ronda: …»):
  - **Saldo.** Cada jugador muestra su saldo: los puntos de las rondas en que fue gusano
    menos los de las rondas en que fue pájaro. Con `{ puntos } = marcador(partida)`,
    saldo de A = `puntos[0] − puntos[1]` y saldo de B = `puntos[1] − puntos[0]`; uno es
    el opuesto del otro. Se escribe con signo (`+9`, `−9`, `0`) y va en directo: mientras
    el gusano crece, su saldo sube y el del rival baja. Debajo, en pequeño, los puntos
    brutos de cada uno («9 como gusano»). `marcador()` del motor no cambia. Resultado al
    final: «Gana Jugador B con +4 (8 como gusano frente a 4).» / «Empate (8 y 8 como
    gusano).»
  - **Ventana de papeles** (`<dialog>` modal) al empezar la partida, al empezar el par
    que añade «Un par más», y al abrir un enlace (§7.4) que deja una ronda sin empezar.
    `Esc` en ella equivale a «Empezar». Texto, con los nombres de los ajustes: «Par 1
    · Ronda 1. **Jugador A es el gusano**: tiene que conseguir que el gusano sea lo más
    largo posible. **Jugador B es el pájaro**: tiene que conseguir que el gusano sea lo
    más corto posible.» Con casillas con valor, «que las casillas del gusano sumen lo
    más posible / lo menos posible». Y una línea de quién empieza: con inicio libre,
    «Empieza Jugador A eligiendo la casilla inicial»; con inicio al azar, «La casilla
    inicial ya está puesta: mueve primero Jugador B (pájaro)». Botón «Empezar».
  - **Ventana de fin de ronda** (`<dialog>` modal) tras la última jugada de cada ronda:
    «Fin de la ronda R del par P. El gusano de Jugador A mide N casillas» (con valor: «sus
    casillas suman N») «: Jugador A +N, Jugador B −N.», el saldo de los dos, y si queda
    otra ronda, sus papeles («En la ronda 2, Jugador B es el gusano y Jugador A el
    pájaro.»). Botones «Continuar con la ronda 2» (o «Continuar con el par 2») y «Ver
    tablero». «Ver tablero» (y `Esc`) cierra la ventana dejando a la vista el tablero de
    la ronda terminada, con el botón «Continuar con …» en la zona de botones. Tras la
    última ronda de la partida, la ventana añade el resultado y lleva «Ver tablero», «Un
    par más», «Analizar» y «Nueva partida».
  - Mientras una ventana está abierta, o el tablero de una ronda terminada está a la vista
    sin haber pulsado «Continuar», **nadie juega**: tampoco la máquina, también en
    máquina contra máquina. El foco va al botón principal de la ventana.
  - El reto del día (§7.2) no cambia: tiene su propia pantalla.
  - (T18, decidido el 2026-10-25.) Al cerrar una ventana, con su botón o con `Esc`, el
    foco va a un sitio útil: al botón «Continuar con …» de la zona de botones si está
    (tras «Ver tablero»), y si no al primer botón de esa zona; nunca se queda en `<body>`.
  - (T18.) **Contraste**: todo texto de la app y de `reglas.html` llega a 4,5:1 (WCAG AA)
    contra su fondo, en el tema claro y en el oscuro; incluidos el botón principal, las
    etiquetas «gusano» / «pájaro», el saldo y los nombres coloreados de las ventanas. Se
    ajustan los colores del tema oscuro (y, si hace falta, unas variables de texto aparte
    de `--gusano` / `--pajaro`, que el tablero sigue usando para rellenar), no el claro.
  - Las casillas siguen sin manejarse con el teclado (decidido el 2026-10-25: se deja así).
- **Ajustes** (`js/ui/ajustes.js`): generador (desplegable con `generadores`), sus
  parámetros (campos generados a partir de `parametros`), número de pares (1-5, defecto
  1), inicio (azar / libre), jugador A y B: humano o máquina con nivel (`niveles`),
  nombres. T13 añade «Obstáculos: 0 % / 10 % / 20 %» y T14 «Valores: sin / uniforme /
  centro / trampas». Devuelve `{ tableros, nombres, inicio, jugadores: [{ tipo:
  'humano' | 'maquina', nivel }], semilla }`.
- **Esbozos** que T07 deja para que otras tareas los llenen sin tocar nada más:
  `js/pantallas/reto.js`, `analisis.js`, `editor.js` (montan «Próximamente»),
  `js/ui/ayudas.js` (`export function decoraciones(ronda) { return new Map(); }`),
  `js/compartir/url.js` (`partidaDesdeURL() → null`, `enlaceDe(partida) → null`), y
  `css/reto.css`, `css/analisis.css`, `css/editor.css` vacías.

## 7. Pantallas y funciones adicionales

### 7.1 Modo ayuda y análisis (T09)

`decoraciones(ronda)` devuelve, para cada casilla libre no alcanzable desde la cabeza,
`{ clase: 'inalcanzable' }`, y para cada casilla del camino `{ texto: k + 1 }` (número
de tramo). Pantalla `analisis`: recibe `datos.partida` terminada; permite recorrer las
jugadas de cada ronda (anterior / siguiente / deslizador) viendo el tablero en ese
momento; si el tablero tiene ≤ 30 casillas y `valorExacto` completa, marca en cada
posición la mejor jugada y, cuando la jugada real valía menos, escribe «aquí el gusano
(o el pájaro) perdió N puntos».

Decidido por Juan Luis el 2026-10-25 (T18): la pantalla **empieza en la jugada 0** y se
recorre desde el principio (así está y así se queda). Para el pájaro se dice también
**«perdió»**, nunca «regaló», en la frase de cada jugada y en el resumen («Jugador B
(pájaro) perdió N puntos»): con el marcador de suma cero (§6), cada punto de más del
gusano se le resta a él.

### 7.2 Reto del día (T10)

Número de reto = días transcurridos desde 2026-10-20 (reto 1 ese día). Con
`semillaDesdeTexto('gusano-' + numero)` se eligen generador y parámetros entre tableros
de ≤ 25 casillas (`cuadrado4` lado 4 o 5, `cuadrado8` lado 4, `caballo` lado 4 o 5,
`hexagonal` radio 2, `superficie` lado 4, y `poliedro` dodecaedro / icosaedro si el
generador existe) y la casilla inicial. El jugador es el gusano; el pájaro es la máquina
`perfecto`. Al acabar: puntos conseguidos, el **par** (`par(tablero, inicio)`), un
texto para copiar («Gusano #12 · 14/16 · par 15») y «Otra vez». El mejor resultado del
día se guarda en `localStorage` (`gusano-reto-<numero>`).

Detalles fijados al implementar (T10, incorporados el 2026-10-25): si `par` es `null`, el
texto dice «par no calculable»; en `superficie` el azar del reto elige también el tipo
(cilindro, toro, Möbius, Klein); las casillas del texto («14/16») son las no bloqueadas.

### 7.3 Editor de tableros (T11)

Pantalla `editor`: lienzo SVG donde pulsar en vacío crea una casilla (círculo),
pulsar dos casillas seguidas las conecta o desconecta, arrastrar mueve, `Supr` o un
botón borra la seleccionada; «Grafo aleatorio» (N casillas 5-40, probabilidad de arista,
se repite hasta que sea conexo); «Rejilla» como punto de partida (desde cualquier
generador); «Exportar» descarga el JSON del tablero y «Importar» lo lee
(`validarTablero`); «Jugar con este tablero» → `irA('jugar', { tablero })`.

Retoques decididos el 2026-10-25 (T18): si «Importar» falla, el aviso dice solo lo que le
pasa al **archivo** (no es JSON, o la lista de `validarTablero`), sin mezclarlo con los
avisos del tablero del lienzo («No conexo…», «Hacen falta al menos 4 casillas…»), que
mientras tanto no se muestran porque el lienzo no ha cambiado. La ayuda del editor explica
que la selección se encadena: tras conectar dos casillas queda seleccionada la segunda, y
una casilla recién creada queda seleccionada; para empezar de cero, se pulsa otra vez
la casilla seleccionada, que se deselecciona (pulsar un hueco crea una casilla).

### 7.4 Compartir por URL (T12)

`enlaceDe(partida)` → URL absoluta con `#jugar&p=<carga>`; `partidaDesdeURL()` lee
`location.hash` y devuelve la partida reconstruida o `null`. La carga es base64url de
JSON: `{ v: 1, g: generadorId, pa: parametros, t: tablero (solo si no tiene generador),
n: nombres, i: inicio, s: semilla, j: [[jugadas de la ronda 1 del par 1], […], …] }`; la
partida se reconstruye reproduciendo las jugadas con `jugarEnPartida`. Sirve para enseñar
una partida acabada y para jugar por turnos a distancia (cada uno manda el enlace tras
su jugada); `jugar.js` acepta `datos.partida` sin terminar y continúa desde ahí.

Detalles fijados al implementar (T12, incorporados el 2026-10-25): un tablero viaja como
`{ g, pa }` solo si `generador(g).crear(pa)` lo reproduce idéntico; si no (editor,
obstáculos, valores) viaja literal en `t`. Si los pares no comparten tablero, `ts` (lista
de `{ g, pa }` o `{ t }`, uno por par) sustituye a `g`/`pa`/`t`; `v` sigue siendo 1. `j`
tiene siempre 2 × pares listas, `[]` en las rondas no empezadas, y no incluye la casilla
inicial cuando la puso la app. Al decodificar se rechaza lo que pase de 20 pares, 500
casillas o nombres de 40 caracteres.

## 8. Pruebas y verificación

- Unitarias: `npm test` (`node --test`, descubre `tests/*.test.js`). Cada tarea añade
  las suyas y deja todas en verde. Las terminadas anotan el recuento total de pruebas.
- Oráculo de la IA: §4. Oráculo de los tableros: recuentos de casillas y grados
  (cuadrado4: esquinas 2, bordes 3, interior 4; toro: todas 4; hexagonal radio r:
  3r²+3r+1 casillas, centro con 6; caballo lado 4: esquinas 2; poliedros: 4/6/8/12/20/32
  caras y grados 3/4/3/5/3 y, en el balón, 12 de grado 5 y 20 de grado 6).
- Interfaz: `herramientas/test-ui.js` (T08) lanza Chrome sin cabeza por el protocolo
  DevTools sin dependencias (Node ≥ 22 trae `fetch` y `WebSocket`), sirve el repositorio
  por HTTP, carga `index.html`, y comprueba al menos: consola limpia; una partida
  humano-humano de un par en `cuadrado4` lado 4 jugada a clics hasta el final, con el
  marcador coherente con el motor (desde T17, el saldo de §6 derivado de `marcador()`,
  pulsando los botones de las ventanas); una partida máquina-máquina que termina sola
  (pulsando «Empezar» y «Continuar con …»); y a
  375 px de ancho no hay desplazamiento horizontal. Termina con «TODO OK» y código 0.
  Desde T19, un contraste por debajo de 4,5 en el modo oscuro es fallo, no aviso.

## 9. Decisiones tomadas al montar (para que Juan Luis las revise)

1. **Módulos ES sin compilar** en vez de un único `index.html` (Conecta-puntos) o de
   Vite + TypeScript (Hero-Quest): varias sesiones a la vez necesitan ficheros
   separados, y sin compilar se publica en GitHub Pages tal cual. Coste: en local hay
   que servir por HTTP (`python3 -m http.server 8000`); no funciona desde `file://`.
2. **Nombres de los papeles**: gusano y pájaro. Cambiarlos después es buscar y
   sustituir en la interfaz, no en el código.
3. **Formato duplicado por defecto** e inicio sorteado («azar»), con «libre» como
   opción. Justificación en `reparto/datos/sugerencias-2026-10-20.md`.
4. **Obstáculos y valores entran en el modelo de datos desde el principio**
   (`bloqueada`, `valor`), aunque su interfaz llegue en T13 y T14: así el motor, la IA y
   la vista no se reabren.
5. **Poliedros en plano** (Schlegel del dual, nodos y aristas), sin 3D en esta tanda.
6. **Colores**: gusano verde, pájaro violeta, jugadas legales amarillo. Son distinguibles
   con las deficiencias rojo-verde más comunes; se revisan con Juan Luis si quiere.
7. **Sin servidor y sin cuentas**: todo en el navegador; compartir es un enlace.
8. Fuera de esta tanda (la 2, §10, recoge dirigidos, dos cabezas, dos gusanos y 3D): grafos dirigidos, gusano de dos cabezas, dos gusanos, 3D,
   inglés, publicación en GitHub Pages (eso lo hace Juan Luis cuando quiera: crear el
   repositorio en GitHub, `git push` y activar Pages sobre `main`; no hay nada que
   compilar).

## 10. Tanda 2 (T20-T29): toro en todas las rejillas, flechas, dos cabezas, dos gusanos, 3D

Decidido por Juan Luis el 2026-10-26. Lo que no eligió está en
`reparto/datos/sugerencias-futuras.md`. **Todo lo de la tanda 1 sigue valiendo**: con los
ajustes por defecto, los tableros, las rondas, las URL y los retos son idénticos a los de
antes, y las pruebas de la tanda 1 siguen en verde sin cambiarlas (salvo las que cuenten
algo que esta sección cambia, y quien las cambie lo dice en su terminada).

**Todo es combinable**: bordes pegados, flechas, obstáculos y valores con cualquier modo, y
los modos entre sí (dos gusanos de dos cabezas cada uno incluido).

### 10.1 Tablero dirigido (T20)

- `crearTablero` acepta además `arcos: [[i, j], …]`: conexión de i a j en un solo sentido.
  Si hay alguno, el tablero lleva `dirigido: true`, `vecinos[i]` son las casillas a las que
  **se puede ir** desde i (las de las aristas más los arcos que salen de i) y
  `predecesores[i]` las casillas **desde las que se llega** a i. Sin arcos, el tablero no
  lleva ni `dirigido` ni `predecesores` (se entiende `predecesores = vecinos`) y es
  idéntico al de la tanda 1. Un par que salga a la vez como arista y como arco es un error.
- `validarTablero`: si `dirigido`, `predecesores` es exactamente la inversa de `vecinos`
  (ordenada, sin repetidos); si no, `vecinos` simétrica, como ahora.
- `js/tableros/sentido.js`: `conSentidoUnico(tablero, proporcion, azar)` → tablero nuevo en
  el que `round(proporcion × aristas de doble sentido)` aristas, elegidas con `azar`, pasan a
  un solo sentido, también al azar. Nunca deja una casilla no bloqueada sin salida ni sin
  entrada (si un sentido lo haría, prueba el otro; si los dos, esa arista se queda doble).
  `id: ${id}-sen${porcentaje}`; la `descripcion` añade «N conexiones de un solo sentido».
  Proporciones que ofrece la interfaz: 0 (defecto), 0,25, 0,5 y 1.

### 10.2 Bordes pegados, rectángulos, flechas con patrón y casillas fantasma (T21)

- `cuadrado4`, `cuadrado8` y `caballo` ganan dos parámetros: `alto` (filas; entero, mismo
  rango que `lado`; si falta, igual a `lado`) y `bordes` (opción: `normales` (defecto) /
  `cilindro` / `toro` / `mobius` / `klein`). `lado` son las columnas. Con los defectos, el
  tablero es idéntico al de la tanda 1, `id` incluido; si no, `id` lleva `-<lado>x<alto>`
  y `-<bordes>` (p. ej. `cuadrado8-6x4-toro`).
- Pegado, en la casilla (fila f, columna c) con `alto` filas y `lado` columnas (§2.2
  generalizado): cilindro, c módulo `lado`; toro, f módulo `alto` y c módulo `lado`;
  mobius, al cruzar el borde izquierdo o derecho la fila se invierte (f → alto − 1 − f);
  klein, toro con esa inversión en izquierda/derecha. En 8 vecinas y caballo se aplica el
  mismo desplazamiento que en el plano y después el pegado. Nunca una casilla es vecina de
  sí misma ni se repite una vecina (se descartan).
- `hexagonal` gana `bordes`: `normales` (defecto) / `toro`. Toro hexagonal: el hexágono de
  radio r con los lados opuestos pegados; en las coordenadas axiales (q, r) de
  `hexagonal.js`, una vecina que cae fuera se trae dentro sumándole una combinación entera
  de las traslaciones (2r+1, −r) y (r, r+1). Oráculo (comprobado en
  `reparto/datos/analisis-2026-10-26/`): todas las casillas con 6 vecinas, simétrico, sin
  bucles, y es el grafo circulante de 3r²+3r+1 casillas con saltos 1, 3r+1 y 3r+2; radio 1
  da 7 casillas todas vecinas entre sí.
- `superficie` sigue existiendo, igual, para las URL antiguas y el reto del día, pero
  **sale de la lista visible**: `generadores` ya no la incluye y `generador('superficie')`
  la sigue devolviendo (sus tipos se piden ahora con `bordes` en `cuadrado4`).
- **Flechas con patrón**, parámetro `flechas` de `cuadrado4` y `cuadrado8`: `ninguna`
  (defecto) / `manhattan` (calles alternas: la fila 0 va hacia la derecha, la 1 hacia la
  izquierda, y así; la columna 0 hacia abajo, la 1 hacia arriba, y así; en `cuadrado8` las
  diagonales siguen de doble sentido) / `corriente` (todas las horizontales hacia la
  derecha y todas las verticales hacia abajo; **solo con `bordes: toro`**: en el plano las
  partidas salen demasiado cortas, como mucho 7 de 16 casillas en 4×4). En `hexagonal`:
  `ninguna` / `corrientes` (de las tres direcciones de la rejilla, cada una en un solo
  sentido, a 120° entre sí: cada casilla interior con 3 salidas y 3 entradas). Si en
  Möbius o Klein el pegado contradice el patrón, esa conexión se queda de doble sentido.
  Un parámetro de tipo opción puede declarar en una opción `soloSi: { bordes: ['toro'] }`:
  el formulario de ajustes (T26) la oculta cuando no se cumple, y `crear` lanza Error si
  se la piden sin cumplirse. Valores comprobados en 4×4: manhattan plano, de 1 a 11 según
  el inicio (dos esquinas sin salida); manhattan en toro, 8; corriente en toro, 13.
- **Casillas fantasma.** Con bordes pegados, el tablero lleva
  `dibujo.fantasmas: [{ casilla, x, y, vertices? }]`: una franja de una casilla de ancho
  junto a cada borde pegado (y en las esquinas, si los dos están pegados), cada fantasma
  una copia de la casilla real que hay al otro lado del pegado, con la inversión de Möbius
  o Klein cuando toque. En el toro hexagonal, un anillo alrededor del hexágono. La caja de
  `dibujo` crece para que quepan; las casillas reales se desplazan, no cambian de tamaño.

### 10.3 Motor general (T22)

La ronda gana un **modo** `{ gusanos: 1 | 2, cabezas: 1 | 2 }`. Defecto `{ 1, 1 }`, que es
la tanda 1 exacta.

```js
export function nuevaRonda(tablero, modo = { gusanos: 1, cabezas: 1 })
  // → { tablero, modo, camino: [], jugadas: [], cuerpos: [[]] o [[], []], mueve: 0 }
  //   camino: TODAS las casillas en el orden en que se rellenaron (como en la tanda 1)
  //   jugadas[k] = { casilla, gusano, extremo } de camino[k]; cuerpos[g] = el gusano g de la
  //   cola a la cabeza; mueve = papel que tiene el turno (0: el que «tiene» el gusano 0)
export function extremos(ronda, gusano = 0)  // → [cabeza] o, con dos cabezas y cuerpo ≥ 2, [cabeza, cola]
export function jugadasCompletas(ronda)      // → [{ casilla, gusano, extremo }] legales ahora
export function jugadasLegales(ronda)        // → índices de casilla (las de jugadasCompletas, sin repetir): igual que antes
export function jugadasEn(ronda, casilla)    // → las jugadasCompletas con esa casilla (más de una = hay que elegir extremo)
export function jugar(ronda, jugada)         // jugada: objeto, o índice si jugadasEn da exactamente una;
                                             //   si no, Error('jugada ilegal') o Error('jugada ambigua')
export function maximiza(ronda)              // → true si mueve el papel 0
export function turno(ronda)                 // → 'gusano' si maximiza, 'pajaro' si no (como antes con 1 gusano)
export function duenoDe(ronda, k)            // → papel (0 | 1) que rellenó camino[k]
// cabeza, ocupada, rondaTerminada, puntuacion, alcanzables, cotaSuperior: como antes, generalizadas abajo
```

- **Crecer.** Una cabeza crece a una casilla libre de `vecinos[cabeza]`; la cola (dos
  cabezas) crece a una casilla libre de `predecesores[cola]` (sin flechas, las mismas). Un
  gusano de una sola casilla con dos cabezas: `extremo 0` crece por `vecinos` y la nueva
  pasa a ser la cabeza; `extremo 1` crece por `predecesores` y la nueva pasa a ser la cola;
  si el tablero no es dirigido, solo se ofrece `extremo 0` (las dos darían el mismo
  gusano).
- **Un gusano** (clásico o dos cabezas): `camino[0]` es la casilla inicial; luego alternan
  pájaro, gusano, … (`duenoDe` = paridad de k). La ronda acaba cuando ningún extremo puede
  crecer. `puntuacion` = suma de valores del camino, como antes.
- **Dos gusanos.** `camino[0]` es la salida del gusano 0 (papel 0) y `camino[1]` la del
  gusano 1; después mueve el papel 0, luego el 1, y así; cada uno alarga **solo el suyo**
  por cualquiera de sus extremos. Las casillas de los dos gusanos bloquean a los dos. Si el
  que tiene el turno no puede crecer, pasa el turno; **si uno queda bloqueado, el otro
  sigue solo** hasta bloquearse. La ronda acaba cuando ninguno puede crecer. `puntuacion` =
  suma de valores del gusano 0 menos la del gusano 1 (puede ser negativa): gana el más
  largo.
- `alcanzables`: casillas libres a las que se llega desde **cualquier** extremo de
  **cualquier** gusano (desde una cabeza siguiendo `vecinos`, desde una cola siguiendo
  `predecesores`). `cotaSuperior`: con un gusano, como antes con este `alcanzables`; con
  dos, suma del gusano 0 + positivos de lo alcanzable desde el gusano 0 − suma del gusano 1
  − negativos de lo alcanzable desde el gusano 1 (corregido el 2026-10-26: sin este último
  término no es cota cuando hay casillas negativas, porque el gusano 1 puede comérselas;
  lo vio la 22 y lo implementa la 25).
- **Partida** (`js/motor/partida.js`): `nuevaPartida({ …, modo })` guarda `partida.modo` y
  crea las rondas con él; `jugarEnPartida(partida, jugada)` acepta lo mismo que `jugar`.
  En la ronda r de cada par el jugador r tiene el papel 0, como ahora, y `marcador` no
  cambia de fórmula. Dos gusanos con inicio `azar`: la app sortea dos salidas distintas,
  no bloqueadas, a distancia (contando las conexiones sin sentido) de al menos
  `max(2, ⌈diámetro / 2⌉)` (si no hay ningún par así, el par más alejado), y las pone como
  `camino[0]` y `camino[1]` antes del primer turno; en la segunda ronda del par las salidas
  son las mismas, así que **cada jugador sale de la casilla que tuvo el otro**, y el papel 0
  (que mueve primero) le toca ahora al otro jugador. Con inicio `libre`: en la primera ronda
  el jugador del papel 0 elige su salida y después el otro la suya; la segunda ronda empieza
  con las dos puestas. `inicioFijo` pasa a ser índice (un gusano), `[s0, s1]` (dos) o null.
  Con un gusano y flechas, la casilla inicial sorteada tiene al menos una salida.

### 10.4 Máquina (T25)

`elegirJugada(nivel, ronda, opciones)` devuelve una jugada que `jugar` acepta: un índice
cuando `jugadasEn` da una sola para esa casilla, y si no el objeto. `minimax.js` recorre
`jugadasCompletas` y maximiza o minimiza según `maximiza(ronda)` (con dos gusanos el mismo
papel puede mover dos veces seguidas). La clave de memoria incluye las ocupadas, los
extremos de cada gusano y quién mueve. Heurística de `voraz` y `fuerte` con dos gusanos:
diferencia de casillas libres que cada gusano alcanza antes que el otro (regiones de
Voronoi por distancia desde sus extremos), más la diferencia de `puntuacion`. `perfecto`:
exacto si el tablero tiene ≤ 30 casillas y cabe en el presupuesto; si no, `fuerte`.
`par(tablero, inicio, opciones)` acepta `opciones.modo` (el reto sigue usando el clásico).
Con el modo clásico, los oráculos de §4 dan lo mismo que antes. Para los modos nuevos, las
pruebas comparan con un minimax ingenuo escrito en la propia prueba en tableros de ≤ 9
casillas.

### 10.5 Vista (T23) y vista 3D (T24)

- `crearVista` y `actualizar` mantienen su firma. `actualizar` acepta además
  `elegirExtremo: [casillas]` (marca esas casillas con la clase `elegir-extremo`). Lo nuevo
  que se dibuja: **fantasmas** (`dibujo.fantasmas`; clase `fantasma` más las mismas clases
  de estado que su casilla real; pulsar uno llama a `alClicar(casilla real)`); **flechas**
  en cada conexión de un solo sentido, haya o no `dibujo.aristas` (`<line class="arco">`
  con punta); **un trazo por gusano** (`gusano-cuerpo gusano-0` / `gusano-1`) de la cola a
  la cabeza, con ojos en la cabeza y, con dos cabezas, también en la cola. Un tramo entre
  dos casillas vecinas a través de un borde pegado no cruza el tablero: va hasta el
  fantasma de la de destino, si lo hay, o se corta en el borde. Colores: con un gusano,
  como ahora (casillas del gusano y del pájaro); con dos, cada casilla con el color de su
  gusano (`--gusano` el 0, `--pajaro` el 1).
- `js/ui/vista-3d.js`: `crearVista3D(contenedor, tablero, { alClicar })` con la misma
  interfaz (`actualizar` con las mismas opciones, `destruir`). Necesita
  `tablero.dibujo3d = { caras: [[[x, y, z], …], …] }`: el polígono 3D de cada casilla
  (cara), con el centro del sólido en el origen, que añade `poliedros.js` (T24). SVG, sin
  dependencias: proyección ortográfica, caras traseras ocultas (normal hacia atrás) y el
  resto pintado de atrás adelante; **arrastrar gira** (punteros, también en pantalla
  táctil) y **pulsar sin arrastrar** (menos de 5 px) llama a `alClicar(cara)`. Las caras
  llevan las mismas clases que en el plano; el gusano es una línea por los centros de las
  caras visibles, con la cabeza.

### 10.6 Aplicación (T26, T27)

- **Ajustes**: campos nuevos «Gusanos» (uno / dos), «Cabezas» (una / dos) y «Sentido
  único» (no / 25 % / 50 % / todas); `ajustesPorDefecto()` gana `gusanos: 1, cabezas: 1,
  sentido: 0`. Transformaciones en el punto único, en este orden: obstáculos → sentido
  único → valores. Los parámetros nuevos de los generadores (`alto`, `bordes`, `flechas`)
  salen solos del formulario, que respeta `soloSi`. **`alto` sigue a `lado`** mientras el
  jugador no lo cambie a mano: hasta entonces el formulario no lo envía (y `crear` toma
  `alto = lado`), así que `cuadrado4` lado 4 sigue siendo 4×4 (lo vio la 21: si el
  formulario manda el defecto 6, sale 4×6).
- **Jugar**: si la casilla pulsada admite dos jugadas (dos extremos), se marcan los dos
  extremos con `elegirExtremo` y el aviso dice «¿Por qué extremo? Pulsa uno»; pulsar uno
  juega; pulsar otra cosa o `Esc` cancela. Con `tablero.dibujo3d`, un interruptor «Vista:
  plano / 3D» (defecto plano). Marcador y ventanas (§6) con los textos de cada modo: dos
  cabezas, «El gusano puede crecer por cualquiera de sus dos extremos»; flechas, «Las
  flechas marcan el sentido: la cabeza avanza a favor de la flecha y la cola, en contra»;
  dos gusanos, sin gusano ni pájaro: «Jugador A lleva el gusano verde y Jugador B el
  violeta. Cada uno alarga el suyo; las casillas de los dos bloquean; si uno se queda sin
  salida, el otro sigue solo. Gana el gusano más largo». Fin de ronda con dos gusanos:
  «El gusano de Jugador A mide 9 y el de Jugador B, 6: Jugador A +3, Jugador B −3». Techo
  del modo ayuda: solo con un gusano.
- **Ayudas, análisis y compartir** (T27): `decoraciones` con el `alcanzables` general;
  el análisis repasa `jugadas` y, con dos gusanos, dice el nombre del jugador en vez del
  papel («Aquí Jugador A perdió 2 puntos»). Compartir: con el modo clásico, la carga sigue
  siendo `v: 1` exacta; con cualquier otro, `v: 2` con `m: [gusanos, cabezas]` y cada
  jugada como índice (extremo 0) o `[casilla, 1]` (extremo 1); el gusano sale del turno.
  Los tableros con flechas al azar viajan literales en `t`, como los de obstáculos.
  `partidaDesdeURL` sigue leyendo `v: 1`.
- El reto del día y el editor no cambian (el editor no maneja flechas: decidido).

### 10.7 Retoques tras la verificación de la tanda 2 (T30, T31; decidido el 2026-10-28)

Decididos por Juan Luis con los hallazgos de la 26, la 27 y la 29.

- **«Un par más» con los mismos ajustes** (T30). El tablero de desempate sale de los mismos
  ajustes que la partida: mismo generador y parámetros, y **otra vez** obstáculos, sentido
  único y valores, con el azar del par nuevo (`semilla + índice del par`, como
  `tablerosDesdeAjustes`). Con un tablero del editor se repite ese tablero, como ahora. Para
  eso la partida guarda su **origen**: `partida.origen = { generadorId, parametros,
  obstaculos, sentido, valores, semilla }` (o `tableroFijo` en lugar de generador y
  parámetros), que pone `jugar.js` al crearla y que viaja en los enlaces.
- **Enlaces cortos** (T30). Si la partida tiene `origen` con generador, el enlace lleva
  `o: { g, pa, ob, se, va }` (y la semilla `s` de siempre) en lugar de los tableros
  literales, y al abrirlo cada tablero se rehace con los ajustes y el índice de su par. Va
  en `v: 2`; con el modo clásico y sin obstáculos, sentido ni valores, sigue siendo `v: 1`
  exacta, y los enlaces antiguos (con `t` o `ts` literales) se siguen leyendo. Objetivo: un
  enlace de `cuadrado4` lado 12 con flechas al azar y 20 jugadas, por debajo de 1 000
  caracteres (hoy son 15 785).
- **En 3D, girar solo si no se ve ninguna jugada** (T31). Cuando `actualizar` recibe
  `legales` no vacías y **ninguna** de esas caras se ve, la vista 3D gira suavemente (unos
  400 ms; sin animación con `prefers-reduced-motion`) hasta poner de frente la cabeza del
  gusano que mueve (o, si aún no hay gusano, la primera legal). Si se ve al menos una, no
  gira; nunca gira mientras se arrastra, ni cuando `legales` viene vacía (turno de la
  máquina).
- **Flechas más finas** (T31). En la vista plana, el trazo y la punta de las conexiones de
  un solo sentido, más pequeños en todos los tableros, para que con tres salidas y tres
  entradas por casilla (hexagonal con `corrientes`, radio 3, a 375 px) se distingan las
  casillas.
