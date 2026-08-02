# Arquitectura

Sin build ni bundler: HTML + CSS + JS servidos tal cual. El único requisito es
correrlo detrás de un servidor HTTP (no `file://`), porque `js/main.js` se
carga como ES module y los navegadores bloquean `import` en ese protocolo.

## Capas

```
index.html
├── css/rinfo.css              estilos (variables de tema claro/oscuro + layout)
├── js/rinfo-data.js           datos: catálogo de 28 proyectos + vocabulario (script clásico → window.EPA_DATA)
├── js/rinfo-interpreter.js    lexer/parser/intérprete de R-info (script clásico → window.RInfo)
└── js/main.js                 punto de entrada (ES module), conecta todo lo de abajo con el DOM
    └── js/modules/
        ├── dom.js             helpers de DOM ($, $all, el, esc)
        ├── color.js           shade()/resolveColorRGB() para sombreado de dibujos en canvas
        ├── state.js           estado compartido del simulador (sim, canvas/cctx, helpers de ciudad)
        ├── editor.js          gutter, resaltado de sintaxis, consola de salida
        ├── render2d.js        vista 2D (planta) del simulador
        ├── render3d.js        vista 3D (isométrica) del simulador
        ├── render.js          dispatcher 2D/3D + redraw()
        ├── city-editor.js     edición manual de la ciudad + paneo de cámara
        ├── run-engine.js      corre el programa y reproduce la traza animada
        ├── catalog.js         tabla de vocabulario + grilla de proyectos filtrable
        ├── project.js         carga un proyecto del catálogo en el editor/simulador
        ├── nav.js             estado activo del riel de navegación
        └── hero-demo.js       animación del encabezado
```

`rinfo-data.js` y `rinfo-interpreter.js` se dejaron como scripts clásicos (no
ES modules) a propósito: son las dos piezas que menos cambian, y exponer
`window.EPA_DATA`/`window.RInfo` evita reescribir el intérprete —que no tiene
ninguna dependencia de la UI— solo para agregarle `export`.

## Por qué está dividido así

Antes de esta separación todo el código de la app (catálogo, editor, dibujo
2D, dibujo 3D, motor de ejecución, wiring de eventos) vivía en un único
archivo de ~1200 líneas. Cada módulo ahora tiene una sola responsabilidad y
declara explícitamente de qué otros módulos depende via `import`, en vez de
compartir todo por clausura implícita sobre una IIFE gigante. Beneficios
concretos:

- **Ubicar código es directo**: "¿dónde está el dibujo del robot en 3D?" →
  `render3d.js`, sin buscar en un archivo de mil líneas.
- **El estado compartido es explícito**: todo lo que es "estado del
  simulador" vive en `state.js`; los demás módulos lo importan de solo
  lectura (`sim`, `canvas`, `cctx` son bindings vivos de ES modules: cuando
  `state.js` los reasigna, cualquier módulo que los importó ve el valor
  actualizado sin necesidad de pasarlo como parámetro).
- **Menor acoplamiento accidental**: por ejemplo `render3d.js` no sabe nada
  de cómo se ejecuta un programa R-info, y `run-engine.js` no sabe nada de
  cómo se dibuja un robot; ambos solo dependen de `state.js` y `render.js`.

## Estado compartido (`sim`)

`sim` (en `state.js`) es el único objeto mutable central: ciudad activa,
robot, cámara (origen/tamaño de la ventana visible), y flags de ejecución
(`running`, `finished`). La distinción entre `sim.city` (base editable) y
`sim.liveCity` (copia efímera que consume una corrida) es intencional: separa
"lo que el usuario configuró" de "lo que pasó al ejecutar", para que apretar
Ejecutar dos veces seguidas repita el mismo escenario en vez de seguir
vaciando la ciudad a cada click.

## Intérprete de R-info

`rinfo-interpreter.js` es un intérprete propio (no el oficial
`r-info-2.9.jar`) escrito para este simulador, con lexer → parser → AST →
intérprete recursivo. Cada corrida genera una traza completa de eventos
(`mover`, `tomarFlor`, `Informar`, etc.) antes de animarse; `run-engine.js`
solo reproduce esa traza, no re-ejecuta el programa paso a paso durante la
animación.
