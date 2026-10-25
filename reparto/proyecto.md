# FICHA DEL PROYECTO — Gusano (reparto «GU»)

Este fichero **no se regenera nunca**. Guarda lo que el tablón no puede guardar, porque
el tablón se reescribe entero cada vez que se reclama o termina una tarea. Se escribió al
montar el reparto (2026-10-20, sesión coordinadora; su sid está en el nombre de su nota en
`reparto/hechos/notas/`) y solo cambia cuando cambia el reparto.

## Qué es

Gusano es un juego de estrategia para dos jugadores sobre un grafo, idea de Juan Luis
Salas García (profesor de matemáticas). El 2026-10-20 describió las reglas, pidió
sugerencias de mejora y después pidió repartir el desarrollo de la aplicación web entre
varias sesiones. Las reglas, la arquitectura y las interfaces entre módulos están en
`ESPECIFICACION.md` (raíz del repositorio), que es **el contrato entre tareas**; las
sugerencias y el análisis que las respaldan, en `reparto/datos/`. La app no existe
todavía: este reparto la construye desde cero.

Convenciones que toda tarea respeta: módulos ES sin dependencias ni compilación; código,
identificadores e interfaz en español; estilo sobrio; `npm test` en verde; lo que
`ESPECIFICACION.md` no fija no lo decide una tarea MEDIO o BAJO (se entrega como propuesta
o se para con `BLOQUEADA por decisión`). Lo que toda tarea necesita saber para trabajar
—verificación, protocolo de reclamo y cierre, git, trampas del entorno— está en
`reparto/tareas/_COMUN.md`.

## Dónde está cada cosa

Raíz del repositorio: `/Users/salasgar/Documents/git/Gusano/`. Todas las rutas de abajo
son relativas a esa raíz; las sesiones son Claude Code en este Mac con esa carpeta como
directorio de trabajo (no hay carpetas que «conectar»).

| Qué | Ruta exacta | Quién llega |
|---|---|---|
| Tablón (vista derivada) | `reparto/_ESTADO.md` | todas |
| Hechos (la fuente de verdad) | `reparto/hechos/` | **todas, obligatoriamente** |
| Fichas de tarea | `reparto/tareas/tarea-NN-<nombre>.md` | todas (leen); la coordinadora escribe |
| Reglas comunes a todas las tareas | `reparto/tareas/_COMUN.md` | todas |
| Especificación (contrato) | `ESPECIFICACION.md` | todas (leen); solo la coordinadora escribe |
| Datos de entrada | `reparto/datos/` (solo lectura) | todas |
| Salidas | el propio repositorio: cada tarea declara en su ficha los ficheros que toca y los deja en un commit. Las tareas que verifican (08, 16) escriben además su informe en `reparto/salidas/NN-<nombre>/` con marcador `.ok-<sid>` | |
| Papelera | `reparto/_papelera/` | la vacía Juan Luis a mano |
| Autorizaciones | `reparto/autorizaciones.md` | las firma Juan Luis a mano |

`hechos/` está en el disco porque todas las sesiones son atendidas y corren en este Mac.
**No puede haber dos.** Sesiones en un solo dispositivo; `~/Documents` está sincronizado
con iCloud, pero todas las sesiones leen el mismo disco: la espera del reclamo es
`sleep 30`. Ficheros solo en la nube: ninguno (el repositorio se creó el 2026-10-20).

Renombrar y borrar ficheros en este sitio: sí (comprobado con un fichero de prueba el
2026-10-20). Aun así, aquí no se borra nada: lo que sobra va a `reparto/_papelera/`.

Horas: todas en UTC, generadas con `date -u` en el mismo comando que las escribe. La hora
local de Juan Luis es UTC+2 hasta el 25 de octubre de 2026 y UTC+1 después.

Dónde corren las operaciones largas: en el shell local de Claude Code, que admite segundo
plano (`run_in_background`). Aquí casi nada es largo: `npm test` tarda segundos (las
pruebas de la IA tienen que estar acotadas a menos de 10 s en total) y
`herramientas/test-ui.js` menos de un minuto. Si algo fuera a durar más de 15 minutos,
estirar `caduca:` antes y latir cada 10-15 min.

Candados de fichero del entorno: un hook de Claude Code (`~/.claude/hooks/sesiones.sh`)
anota en `.claude/sesiones/<sesión>.json` los ficheros que cada sesión edita con `Edit`,
`Write` o `NotebookEdit`, y **las demás sesiones del mismo árbol no pueden editarlos
durante 30 min**; no vigila lo que se escribe desde el shell. Con el protocolo bien seguido
no contiende: cada fichero de `hechos/` tiene un solo escritor, y dos tareas que compartan
un fichero de código no van en paralelo. Si el tablón está reservado cuando te toque
regenerarlo, no esperes: latido «tablón reservado, no regenerado» y sigue.
`.claude/sesiones/` está en `.gitignore`.

Repositorio git: **sí, en un solo árbol de trabajo** (sin worktrees) y **sin remoto**: no
hay `push`. La coordinadora hizo el commit inicial con el reparto y la especificación; la
tarea 01 crea el esqueleto de la app y es precondición de todas las demás. Reglas:

- Cada ficha declara los ficheros que toca; **dos tareas que compartan un fichero no van
  en paralelo** (precondición o cadena). Si al trabajar necesitas tocar un fichero que no
  está en tu ficha, no lo toques: incidencia, y dilo.
- `add` nunca separado de `commit`. Ficheros ya seguidos: `git commit -m "…" -- ruta1
  ruta2`. Ficheros nuevos: `git add ruta1 ruta2 && git commit -m "…" -- ruta1 ruta2` en la
  misma orden. **Nunca `git add .` ni `git add -A`.** Antes de comitear, `git diff --stat
  -- <ficheros>` y `git status --short`: lo que no sea tuyo no entra.
- Orden de cierre: `npm test` en verde → commit del código con solo los ficheros de la
  ficha (sale el hash) → `hechos/terminadas/NN--<sid>.md` con ese hash, `CERRADA` en el
  reclamo, tablón regenerado y trampas en la ficha → un solo commit con rutas explícitas
  de tus ficheros de `hechos/` (por sid), `reparto/_ESTADO.md` y la ficha que tocaste.
- Los mensajes de commit terminan con la línea de atribución que indique el entorno de la
  sesión (`Co-Authored-By: Claude … <noreply@anthropic.com>`).
- **El código no se edita desde el shell** (`sed -i`, heredocs, scripts): pasa por debajo
  de la reserva del hook. Se edita con las herramientas de edición de la sesión. Los
  ficheros de `hechos/` sí se escriben desde el shell, a propósito, para que el sid y la
  hora salgan del mismo comando.
- Tope de procesos: ninguno fijado (como mucho un Chrome sin cabeza por sesión).
- Publicar (crear el repositorio en GitHub, `push`, activar Pages) **no forma parte de
  ninguna tarea**: lo hace Juan Luis cuando quiera (ver `autorizaciones.md`).
- **Desde el 2026-10-25 hay remoto**: `origin` = https://github.com/salasgar/Gusano
  (público), con GitHub Pages sobre `main` en https://salasgar.github.io/Gusano/. Lo creó
  la coordinadora s-20261025T073409-9564e458 con la firma de Juan Luis y a petición
  suya. **Las tareas siguen sin hacer `push`**: cada `push` publica la web, así que solo
  se hace cuando él lo pide en la conversación.

Vigía: ninguno. Si Juan Luis quiere uno, la coordinadora deja un `/loop` cada 30 min que
lista `reparto/hechos/reclamos/`, compara `caduca:` con `date -u` y solo avisa de lo
accionable; no reclama, no escribe, no regenera; muere al cerrar esa conversación.

Duración real observada: sin medir aún. La caducidad sale siempre de la ficha (2 × la
duración esperada, mínimo 45 min). La primera terminada recalibra: si su duración real
difiere mucho de la estimada, quien regenere el tablón se lo dice a Juan Luis.

## Bandas de modelo

Cada tarea lleva una banda —ALTO, MEDIO o BAJO— que dice con qué modelo conviene abrirla.
Aquí queda a qué corresponde cada banda en el menú **tal como Juan Luis lo vio el
2026-10-19 en Claude Code** (copiado del reparto de Conecta-puntos, que lo comprobó con
él ese día: «Default (recommended) · Opus 5.5», «Opus 5.5», «Fable 5.1», «Sonnet 5.5»,
«Haiku 5.5», y debajo los antiguos «Haiku 4.5» y «Sonnet 5»; esfuerzo en cinco puntos;
interruptor «Ultracode»). Se escribe una vez, aquí y en ningún otro sitio; cuando cambie
la gama, se corrige esta tabla y no los ficheros de tarea. Toda frase de arranque y toda
recomendación de este reparto lleva la banda **con esta traducción entre paréntesis**.

| Banda | Modelo | Esfuerzo | Para qué |
|---|---|---|---|
| ALTO | Opus 5.5 («Default (recommended)» es el mismo modelo) | Alto | Criterio, ambigüedad, decisiones con Juan Luis delante, coordinar |
| MEDIO | Sonnet 5.5 | Medio | Programar y revisar lo ya especificado; entender el contenido |
| BAJO | Haiku 5.5 | Medio | Mecánico con el criterio ya fijado: el esqueleto del proyecto |

Reserva dentro de ALTO, «ALTO (Fable 5.1, esfuerzo Alto)»: montar o recortar el reparto,
una coordinadora de horas. Extra y Máx solo si los elige Juan Luis. Los modelos antiguos
que siguen en el menú (Haiku 4.5, Sonnet 5) no se recomiendan. El interruptor «Ultracode»
conviene **apagado** para las tareas de este reparto (una sesión, una tarea).

Comprobado el 2026-10-19 por Juan Luis. Si el menú vuelve a cambiar, él dice los nombres
nuevos y se corrigen aquí; mientras, la posición manda: ALTO es el más capaz de la gama
normal, BAJO el más rápido, MEDIO el de en medio.

## Automatismos activos

Ninguno. Todas las tareas se abren a mano.

| Tarea programada | Cuándo | Qué hace | Duración esperada | Caducidad | Modelo | Id |
|---|---|---|---|---|---|---|
| — | | | | | | |

## Frase de arranque para una sesión nueva

Esto es lo que Juan Luis pega al abrir una sesión, desde la carpeta del repositorio. Sin
ello, la sesión nueva no sabe que hay un protocolo y se salta el reclamo entero:

> `GU T<NN> (<BANDA>)` — Trabaja en el reparto de `/Users/salasgar/Documents/git/Gusano/reparto/`
> (el repositorio de Gusano). He abierto esta sesión con un modelo de banda <BANDA>
> (<modelo>, esfuerzo <esfuerzo>) —copiado de la tabla de bandas de `reparto/proyecto.md`—,
> y el nombre de esta sesión es el que encabeza este mensaje. Lee `reparto/proyecto.md`,
> `reparto/tareas/_COMUN.md`, `ESPECIFICACION.md` y `reparto/_ESTADO.md`, lista
> `reparto/hechos/`, reclama la tarea NN siguiendo el protocolo del tablón, dime en tu
> primer mensaje qué tarea has reclamado —o por qué no has podido— y con qué identificador
> de sesión, y sigue con ella hasta cerrarla o soltarla sin esperar confirmación.

La banda va en la frase porque **una sesión no puede saber en qué modelo corre**. La
traducción entre paréntesis es para Juan Luis —qué elegir en el menú— y la pone quien
escribe la frase, copiándola de la tabla de arriba.

**Si van a abrirse varias sesiones a la vez, hay una frase por sesión, no una por banda**,
y cada una nombra la tarea o la cadena que esa sesión reclama:

> … reclama la tarea 02 siguiendo el protocolo del tablón y, al cerrarla, encadena la 03 …

Una sesión cuya frase nombra una cadena encadena por defecto; solo deja de hacerlo si el
semáforo está en ámbar o rojo, y entonces lo dice. Quien cierra una tarea escribe tantas
frases como sesiones quepan a la vez sin estorbarse (cruzando los «ficheros que toca»),
cada una con su banda traducida y su tarea o cadena ya puestas.

Para coger una tarea MAL CORTADA que Juan Luis haya decidido tratar como larga, la frase
la nombra: «… reclama la tarea NN, que está MAL CORTADA y se continúa como larga …».

**Frase para una sesión coordinadora** (no reclama ni implementa; resuelve dudas, regenera
el tablón si una sesión no pudo, da de alta o recorta tareas si Juan Luis lo pide, corrige
`ESPECIFICACION.md` si hace falta, y deja un vigía barato si él lo quiere). Banda ALTO
(Opus 5.5, esfuerzo Alto); «ALTO (Fable 5.1, esfuerzo Alto)» si va a durar horas. Ultracode
apagado:

> `GU Coordinadora T01-T16 (ALTO)` — Coordina el reparto de `/Users/salasgar/Documents/git/Gusano/reparto/`
> (el repositorio de Gusano). He abierto esta sesión con un modelo de banda ALTO (Opus 5.5,
> esfuerzo Alto) —copiado de la tabla de bandas de `reparto/proyecto.md`—, y el nombre de
> esta sesión es el que encabeza este mensaje. Carga la skill `reparto` y sigue su apartado
> «La sesión que monta o coordina»: no reclamas ninguna tarea ni tocas código; tus ficheros
> son las fichas de `reparto/tareas/`, `reparto/proyecto.md`, `ESPECIFICACION.md`, el
> tablón `reparto/_ESTADO.md` cuando des de alta o recortes, y en `reparto/hechos/` tu
> `notas/<sid>.md`, `incidencias/`, `reabiertas/` y `sustituidas/`. Genera tu identificador
> de sesión en el mismo comando que escriba tu nota en `reparto/hechos/notas/` y dímelo en
> tu primer mensaje. Lee `reparto/proyecto.md`, `reparto/tareas/_COMUN.md`,
> `ESPECIFICACION.md` y `reparto/_ESTADO.md`, lista `reparto/hechos/` y `git log
> --oneline`, y dame la foto del momento (EN CURSO · LIBRES · BLOQUEADAS) con una frase de
> arranque por sesión que quepa a la vez sin estorbarse, con la banda traducida y la tarea
> o cadena puestas. Después quédate: resuelve las dudas que te traiga y da de alta o
> recorta tareas solo si te lo pido (numerando al final, nunca renumerando).

## Nombres de sesión

Abreviatura del proyecto: **`GU`**. Una sesión no puede ponerse ni cambiarse el nombre
—lo hace Juan Luis con `/rename` o en el panel—, así que el nombre va como prefijo de la
frase de arranque y la sesión lo repite cuando cambia lo que hace («renómbrame a …»):

| Sesión | Nombre |
|---|---|
| Una tarea | `GU T<NN> (<BANDA>)` |
| Una cadena | `GU T<NN>+T<MM> (<BANDA>)` |
| Quien monta, recorta o coordina | `GU Coordinadora <rangos> (<BANDA>)` |

La sesión que montó este reparto: `GU Coordinadora T01-T16 (ALTO)`; su sid es el del
nombre de su nota en `reparto/hechos/notas/`.

## Decisiones de reparto que conviene no rediscutir

- **Cortado por módulos y por ficheros.** `ESPECIFICACION.md` fija las interfaces entre
  módulos para que tableros (02, 03), motor (04), máquina (05) y vista (06) se escriban
  en paralelo contra el contrato, y 07 los junte en la app. Cada tarea es dueña de sus
  ficheros; los puntos donde varias querrían tocar el mismo fichero (el registro de
  generadores, las pantallas, el formulario de ajustes) se resolvieron con **esbozos**:
  07 crea de antemano los ficheros de cada pantalla extra y los enganches
  (`ayudas.js`, `url.js`, hojas de estilo vacías), y 09-12 llenan el suyo sin tocar nada
  más. Lo que no se pudo desacoplar va en cadena: 03 detrás de 02 (una línea en
  `js/tableros/index.js`), 14 detrás de 13 (`js/ui/ajustes.js`).
- **Obstáculos y valores están en el modelo de datos desde 02 y 04** (`bloqueada`,
  `valor`), para que 13 y 14 no reabran motor, máquina ni vista.
- **La especificación la escribió la coordinadora sin Juan Luis delante.** Es la
  excepción a «decidir con el usuario delante» que permite empezar; §9 de
  `ESPECIFICACION.md` lista las decisiones para que las revise antes de abrir sesiones.
  Si cambia algo, lo corrige la coordinadora en la especificación y en las fichas
  afectadas antes de que esas tareas se reclamen.
- **Bandas.** 01 es BAJO: cada fichero está dado literalmente en la ficha. Todo lo demás
  es programar con la especificación delante: MEDIO. No hay tareas ALTO porque las
  decisiones están tomadas en la especificación; si una tarea descubre que falta una,
  no la toma.
- **No hay `salidas/` con marcadores para el código**: el marcador de terminado es el
  hash del commit en `hechos/terminadas/`. Solo los informes de verificación (08, 16)
  van a `reparto/salidas/` con `.ok-<sid>`.
- **Sin remoto, sin publicar, sin dependencias.** Publicar es de Juan Luis
  (`autorizaciones.md`). Una dependencia npm cambiaría `package.json`, que es de 01, y
  obligaría a `npm install` en cada sesión: no se añaden.
- **No hay automatismos**: todas las sesiones son atendidas.
- **Verificación en dos puntos**: 08 justo después de la app jugable (07), con el arnés
  de interfaz que después reutiliza 16, y 16 al final de la tanda. Ambas separan
  veredicto de hallazgos fuera de criterio.
