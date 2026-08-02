# R-info · Catálogo de proyectos EPA

Catálogo de 28 proyectos resueltos en R-info para el curso de ingreso de la
Facultad de Informática (UNLP), con un simulador del lenguaje corriendo
100% en el navegador — sin instalar nada.

![Encabezado del catálogo, con la ficha de FaboSistemas y una animación 3D del robot patrullando una ciudad](docs/img/screenshot-hero.png)

## Demo en vivo

**[fabian-martinez-rincon.github.io/epa-rinfo-simulator](https://fabian-martinez-rincon.github.io/epa-rinfo-simulator/)**

## Qué es esto

[EPA](https://github.com/Fabian-Martinez-Rincon/EPA) es el repositorio de
material de estudio del curso de ingreso. Este proyecto toma esos 28
ejercicios (ya resueltos, con ciudad de ejemplo incluida) y los deja
navegables y ejecutables sin depender del compilador oficial
(`r-info-2.9.jar`) ni de instalar Java: alcanza con un navegador.

- **Catálogo filtrable** por unidad, dificultad o texto libre, con el
  detalle de cada ejercicio (precondición, postcondición, descomposición
  top-down, caso de prueba sugerido).
- **Editor con resaltado de sintaxis** propio para R-info.
- **Simulador 2D y 3D** de la ciudad, con animación paso a paso del robot
  (toma/deposita flores y papeles, informa, etc.), edición manual de la
  ciudad con el mouse, y seguimiento de cámara.
- **Intérprete de R-info propio**, escrito para este proyecto: lexer →
  parser → AST → intérprete. Sigue la sintaxis confirmada contra los
  capítulos 1 a 8 del material EPA, pero **no es el compilador oficial** —
  es una implementación independiente, sin relación con la cátedra ni con
  [RobotScript](https://github.com/josu-dev/RobotScript). No reemplaza una
  revisión docente antes de asignar estos proyectos a estudiantes.
- **Sin dependencias externas ni build step**: HTML + CSS + JS servidos tal
  cual, sin framework ni bundler. Las únicas dependencias (tipografía
  Satoshi, avatar, logo) están copiadas dentro del repo.

## Correrlo localmente

```bash
git clone git@github.com:Fabian-Martinez-Rincon/epa-rinfo-simulator.git
cd epa-rinfo-simulator
```

Después serví la carpeta con cualquier servidor estático — por ejemplo:

```bash
npx serve .
# o la extensión Live Server de VS Code
```

> `js/main.js` se carga como ES module, así que **no funciona abriendo
> `index.html` directo con doble click** (protocolo `file://`): los
> navegadores bloquean `import` ahí. Necesita servirse por `http(s)://`,
> aunque sea localhost.

## Arquitectura

Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para el detalle de cómo
está dividido el código en módulos y por qué.

```text
epa-rinfo-simulator/
├── index.html
├── css/rinfo.css
├── js/
│   ├── rinfo-data.js          catálogo + vocabulario (28 proyectos)
│   ├── rinfo-interpreter.js   intérprete de R-info
│   ├── main.js                punto de entrada (ES module)
│   └── modules/                un módulo por responsabilidad (ver docs/ARQUITECTURA.md)
├── img/, fonts/                assets propios, sin CDN
└── docs/
```

## Licencia

[MIT](LICENSE) — © 2026 Fabian Martinez Rincon ([FaboSistemas](https://fabianmartinezrincon.com/fabosistemas)).
