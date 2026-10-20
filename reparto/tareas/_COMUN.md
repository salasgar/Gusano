# Lo que toda tarea necesita saber

Léelo antes de coger cualquier tarea. Las fichas lo dan por leído y solo repiten lo que
de verdad hace falta repetir.

## El proyecto en dos frases

Gusano es un juego de dos jugadores sobre un grafo: los dos alargan el mismo gusano y uno
quiere que sea largo y el otro corto. La app es web estática en módulos ES sin
dependencias; `ESPECIFICACION.md` (raíz del repositorio) fija reglas, estructura de
carpetas e interfaces de cada módulo, y es el contrato que tu tarea cumple.

## Cómo se verifica

```sh
cd /Users/salasgar/Documents/git/Gusano && npm test
```

`npm test` ejecuta `node --test`, que descubre solo `tests/*.test.js`. **Tiene que estar
en verde antes de dar nada por hecho.** Anota el recuento (`pass N`) al empezar y al
terminar: si hay menos pruebas al terminar, has roto algo. El recuento va en tu
terminada. Para ver la app: `python3 -m http.server 8000` desde la raíz (en segundo plano)
y `http://localhost:8000/`; los módulos ES no cargan desde `file://`.

## Qué puedes decidir y qué no

Lo que dice `ESPECIFICACION.md` se cumple tal cual. Lo que no dice y es un detalle de
implementación (nombre de una variable interna, cómo partes una función) lo decides tú.
Lo que no dice y **va a durar** —un campo nuevo en el modelo de datos, un cambio de
interfaz entre módulos, una decisión de diseño visible— no lo decides: escríbelo como
propuesta en tu terminada (y en `hechos/incidencias/<sid>.md` si bloquea a otras tareas),
sigue con lo que no dependa de ello, o para con el latido `BLOQUEADA por decisión` y
díselo a Juan Luis. Si crees que la especificación tiene un error, no la corrijas:
incidencia, y díselo; la corrige la coordinadora.

## Reclamar, latir, cerrar (desde `reparto/`)

Reclamo (la ficha te da NN y los minutos de caducidad; el sid se genera en este mismo
comando y a partir de ahí es el del nombre del fichero):

```sh
cd /Users/salasgar/Documents/git/Gusano/reparto && sid="s-$(date -u +%Y%m%dT%H%M%S)-$(head -c4 /dev/urandom | od -An -tx1 | tr -d ' \n')" && printf 'sesión: %s\ntarea: NN\nabierto: %s\ncaduca: %s\nlatidos:\n- %s reclamo abierto\n' "$sid" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(date -u -v+MINUTOSM +%Y-%m-%dT%H:%M:%SZ)" "$(date -u +%H:%M:%SZ)" > hechos/reclamos/NN--$sid.md && ls hechos/reclamos/
```

Después, **el comando, no la intención**: `sleep 30 && ls hechos/reclamos/`. Si hay otro
reclamo vivo de la misma tarea con `abierto:` anterior (o igual y sid menor), añade una
línea `CEDIDA a <sid>` al tuyo y elige otra. Si el que hay está caducado, relévalo con
`releva a: <sid>` en el tuyo (el suyo no se toca) y mira con `git log` y `git status` qué
dejó hecho. Si ganas, regenera `reparto/_ESTADO.md` entero (todas las filas contra
`hechos/` y `date -u`; las columnas Banda, Encadenable y Ficheros que toca se copian de
las fichas; la leyenda de bandas, de `proyecto.md`) y sigue hasta cerrar o soltar; no
termines el turno para pedir confirmación.

Latido y estirar la caducidad (a tu reclamo solo se añade, nunca se reescribe):

```sh
printf -- '- %s latido: <qué has terminado>\n' "$(date -u +%H:%M:%SZ)" >> hechos/reclamos/NN--<sid>.md
printf 'caduca: %s\n' "$(date -u -v+60M +%Y-%m-%dT%H:%M:%SZ)" >> hechos/reclamos/NN--<sid>.md
```

Cierre, por este orden: `npm test` en verde → commit del código con solo los ficheros de
tu ficha (sale el hash) → `hechos/terminadas/NN--<sid>.md` con el hash, la hora, la
duración real (de `abierto:` a ahora), el recuento de pruebas y la lista de ficheros →
`printf 'CERRADA\n' >> hechos/reclamos/NN--<sid>.md` → incidencias si las hubo → regenera
`reparto/_ESTADO.md` → trampas nuevas en tu ficha → un solo commit con rutas explícitas:

```sh
cd /Users/salasgar/Documents/git/Gusano && git add reparto/hechos/reclamos/NN--<sid>.md reparto/hechos/terminadas/NN--<sid>.md && git commit -m "Tarea NN cerrada" -- reparto/hechos/reclamos/NN--<sid>.md reparto/hechos/terminadas/NN--<sid>.md reparto/_ESTADO.md reparto/tareas/tarea-NN-<nombre>.md
```

(añade a las dos listas tus `hechos/incidencias/<sid>.md` o `hechos/notas/<sid>.md` si
los escribiste; no hay remoto: no hay `push`). Termina el mensaje de commit con la línea
de atribución que te indique tu entorno. Después, la foto del momento (EN CURSO ·
LIBRES · BLOQUEADAS, leída de `hechos/` ahora) y las frases de arranque de `proyecto.md`
solo para las LIBRES, una por sesión que quepa a la vez, con la banda traducida, la tarea
o cadena y el nombre de sesión delante.

Si paras sin terminar: `hechos/fallos/NN--<sid>.md` con hasta dónde llegaste y una línea
`parada por: sesión agotada` (o `avería`, o `mal cortada`), y `ABANDONADA` en tu reclamo.
Si te agotas a mitad (releer lo ya leído, lentitud, aviso de límite), deja
`hechos/notas/<sid>-traspaso-NN.md` con el estado exacto antes de soltar.

## Git en este repositorio

- Un solo árbol de trabajo, sin worktrees, sin remoto.
- Ficheros ya seguidos: `git commit -m "…" -- ruta1 ruta2`. Ficheros nuevos: `git add
  ruta1 && git commit -m "…" -- ruta1` en la misma orden (`git commit -- ruta` rechaza un
  fichero que git no conoce). **Nunca `git add .` ni `git add -A`.**
- Antes de comitear: `git status --short` y `git diff --stat -- <tus ficheros>`. Si ves
  cambios en ficheros que no son tuyos, no los toques ni los comitees: son de otra
  sesión viva.
- **El código se edita con las herramientas de edición de la sesión (`Edit`, `Write`),
  nunca desde el shell** (`sed -i`, heredocs, scripts): el hook de reservas
  (`.claude/sesiones/`) solo ve las herramientas de edición, y lo que pasa por debajo
  rompe la coordinación. Los ficheros de `hechos/` son la excepción a propósito.
- No se añaden dependencias npm. `package.json` es de la tarea 01.

## Trampas del entorno (comprobadas el 2026-10-20 en este Mac)

- `node --test` **sin argumentos**: con `node --test tests/` falla («test failed» sin
  más) porque intenta ejecutar el directorio como fichero. Vale también `node --test
  'tests/**/*.test.js'`. Node 26.5, npm 11.17.
- Las importaciones llevan la extensión: `import { x } from './tipos.js'`, nunca
  `'./tipos'`. Y `package.json` tiene `"type": "module"`.
- Chrome sin cabeza: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
  (versión 155). Node ≥ 22 trae `fetch` y `WebSocket` globales: el protocolo DevTools
  se habla sin paquetes (modelo en
  `/Users/salasgar/Documents/git/Conecta-puntos/reparto/datos/analisis-2026-10-20/accesibilidad/cdp.js`).
- `date -u -v+90M` es la forma BSD (macOS) de sumar minutos; `date -d` no existe aquí.
  `timeout` tampoco: `perl -e 'alarm shift; exec @ARGV' 120 <orden>` lo sustituye.
- `python3` es 3.9.6 (solo para `http.server` y el script de análisis).
- Ultracode apagado: una sesión, una tarea. Los subagentes que lances trabajan bajo tu
  sid y no reclaman nada.
