window.EPA_DATA = (function(){ // Contenido del catalogo EPA: vocabulario confirmado y 28 proyectos.
// Todo starter code es un esqueleto valido (parsea y corre) sin resolver el ejercicio.

const VOCAB = {
  primitivas: ['mover', 'derecha', 'tomarFlor', 'tomarPapel', 'depositarFlor', 'depositarPapel'],
  sensores: ['PosAv', 'PosCa', 'HayFlorEnLaEsquina', 'HayPapelEnLaEsquina', 'HayFlorEnLaBolsa', 'HayPapelEnLaBolsa'],
  es: ['Pos(Av,Ca)', 'Informar(e1, e2, ...)'],
  control: ['si (cond) / sino', 'repetir N', 'mientras (cond)'],
  logica: ['& (y)', '| (o)', '~ (no)', 'V / F'],
  tipos: ['numero', 'boolean'],
  operadores: [':=', '+ - * /', '= < > <= >= <>'],
  modulos: ['procesos / proceso Nombre(parametros)', 'E (entrada, solo lectura)', 'ES (entrada/salida)']
};

function tmplSimple(nombre, todos, extraVars) {
  const varsBlock = extraVars ? `    variables\n${extraVars}\n` : '';
  const todoLines = todos.map((t, i) => `      { TODO ${i + 1}: ${t} }`).join('\n');
  return `programa ${nombre}
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
${varsBlock}    comenzar
      Pos(1,1)
${todoLines}
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin`;
}

function tmplProceso(nombre, procesos, robotTodos, extraRobotVars) {
  const procBlocks = procesos.map((p) => {
    const localsBlock = p.locals ? `    variables\n${p.locals}\n` : '';
    const todoLines = p.todos.map((t, i) => `      { TODO ${i + 1}: ${t} }`).join('\n');
    return `  proceso ${p.nombre}(${p.params})
${localsBlock}    comenzar
      Pos(PosAv,PosCa)
${todoLines}
    fin`;
  }).join('\n');
  const varsBlock = extraRobotVars ? `    variables\n${extraRobotVars}\n` : '';
  const robotTodoLines = robotTodos.map((t, i) => `      { TODO ${i + 1}: ${t} }`).join('\n');
  return `programa ${nombre}
procesos
${procBlocks}
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
${varsBlock}    comenzar
      Pos(1,1)
${robotTodoLines}
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin`;
}

const PROJECTS = [
{ id:'P01', nombre:'Ronda de deteccion doble', tier:'U2', dificultad:1, prereq:'Unidad 2', categoria:'Microproyecto (1 unidad)', verbos:['detectar'],
  resumen:'Recorrer un tramo fijo informando solo las esquinas donde hay flor Y papel a la vez, usando la conjuncion & dentro de un si (los ejemplos del capitulo 2 solo evaluan condiciones atomicas).',
  precondicion:'El tramo a recorrer existe dentro del area (no es necesario que existan flores ni papeles).',
  postcondicion:'Se informo la posicion de cada esquina del tramo que tenia flor y papel simultaneamente.',
  topdown:['posicionar y orientar el robot al inicio del tramo','en cada esquina evaluar HayFlorEnLaEsquina & HayPapelEnLaEsquina','si se cumple, informar con Informar(PosAv, PosCa)','avanzar y repetir para el resto del tramo'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (tabla 2.1 y tabla 2.3, conectivos logicos)'],
  validacion:null, varianteAvanzada:'Cambiar & por | y comparar cuantas esquinas cumplen cada condicion.',
  casoPrueba:'Tramo de 5 esquinas con flor+papel solo en la esquina 3 -> se informa exactamente una posicion.',
  starter: tmplSimple('RondaDeteccionDoble', ['evaluar HayFlorEnLaEsquina & HayPapelEnLaEsquina en la esquina actual','si se cumple, informar con Informar(PosAv, PosCa)','avanzar y repetir para el resto del tramo (elegi cuantas esquinas)']) },

{ id:'P02', nombre:'Esquina vacia por negacion compuesta', tier:'U2', dificultad:2, prereq:'Unidad 2', categoria:'Microproyecto (1 unidad)', verbos:['detectar'],
  resumen:'Avanzar mientras la esquina actual no este vacia, usando la negacion de una conjuncion (~(~flor & ~papel)) en vez de una condicion atomica como en el ejemplo 2.9 del libro.',
  precondicion:'Existe una esquina vacia en el tramo (convencion "seguro existe" del curso).',
  postcondicion:'El robot queda parado en la primera esquina vacia; se informo su posicion.',
  topdown:['ubicar al robot al inicio del tramo a explorar','mientras ~(~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina), avanzar','al salir del mientras la esquina esta vacia: informar PosAv y PosCa'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (ejemplo 2.9, tabla 2.3)'],
  validacion:null, varianteAvanzada:'Verificar por reflexion que ~(~flor & ~papel) equivale a (flor | papel) segun De Morgan.',
  casoPrueba:'Flores en (7,1)..(7,5), esquina (7,6) vacia -> Informar(PosCa) = 6.',
  starter: tmplSimple('EsquinaVaciaPorNegacion', ['ubicar al robot al inicio del tramo con Pos','mientras ~(~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina), avanzar (mover)','al salir del mientras, informar PosAv y PosCa']) },

{ id:'P03', nombre:'Rectangulo cerrado', tier:'U2', dificultad:2, prereq:'Unidad 2', categoria:'Microproyecto (1 unidad) / visual', verbos:['trasladar'],
  resumen:'Recorrer un rectangulo y volver exactamente a la esquina y orientacion de partida. Los ejemplos 2.1/2.5/2.12 del libro nunca cierran el camino: esa es la restriccion nueva.',
  precondicion:'El rectangulo elegido cabe dentro del area (1,1)-(100,100).',
  postcondicion:'El robot vuelve a la esquina y orientacion iniciales (recorrido cerrado).',
  topdown:['elegir ancho y alto del rectangulo','recorrer los 4 lados con repetir + derecha entre cada lado','verificar que la suma de giros sea 360 grados (4 veces derecha)'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (ejemplos 2.1, 2.5, 2.12)'],
  validacion:null, varianteAvanzada:'Repetir el rectangulo N veces en espiral hacia afuera (ver P09 para la variante narrativa).',
  casoPrueba:'Rectangulo 3x2 desde (1,1) -> el robot debe terminar en (1,1) mirando al norte.',
  starter: tmplSimple('RectanguloCerrado', ['elegir ancho y alto del rectangulo','recorrer los 4 lados con repetir(lado) + mover, y derecha entre lados','verificar que quedaste en (1,1) mirando al norte']) },

{ id:'P04', nombre:'Seleccion en cascada sin variables', tier:'U2', dificultad:2, prereq:'Unidad 2', categoria:'Microproyecto (1 unidad)', verbos:['clasificar'],
  resumen:'Evaluar 4 esquinas fijas, cada una con una proposicion molecular distinta combinando &, | y ~, informando un codigo literal distinto segun el caso, usando solo si/sino anidados (sin variables).',
  precondicion:'Las 4 esquinas a evaluar existen dentro del area.',
  postcondicion:'Se informo exactamente un codigo por cada una de las 4 esquinas.',
  topdown:['ubicar al robot en la primera esquina a clasificar','construir una condicion molecular distinta por esquina (&, |, ~)','informar un numero literal distinto segun el resultado','repetir para las otras 3 esquinas'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (seccion 2.4, tablas de verdad)'],
  validacion:null, varianteAvanzada:'Usar las 4 combinaciones de verdad de dos proposiciones (V-V, V-F, F-V, F-F) a proposito.',
  casoPrueba:'Esquina con flor y sin papel -> debe informar el codigo asignado a ese caso, no otro.',
  starter: tmplSimple('SeleccionEnCascada', ['en la primera esquina, armar una condicion con & / | / ~ e informar un codigo','moverse a la siguiente esquina a clasificar','repetir con una condicion distinta para cada una de las 4 esquinas']) },

{ id:'P05', nombre:'Contador de flores sin recolectar', tier:'U3', dificultad:3, prereq:'Unidades 2-3', categoria:'Microproyecto (1 unidad)', verbos:['contar','detectar'],
  resumen:'Recorrer N esquinas de una calle contando en una variable numero cuantas TIENEN flor, sin tomarla. Separa "detectar" de "recoger", verbos que el libro casi siempre junta.',
  precondicion:'N (cantidad de esquinas) es conocido de antemano.',
  postcondicion:'La variable contador refleja exactamente cuantas esquinas del tramo tenian flor.',
  topdown:['declarar una variable numero para el contador, inicializarla en 0','repetir N veces: si HayFlorEnLaEsquina, sumar 1 al contador; avanzar','informar el contador final'],
  fundamento:['conocimiento/unidad-03-datos/capitulo-3-datos.md (declaracion de variables, asignacion, tabla de tipos)'],
  validacion:null, varianteAvanzada:'Contar flores Y papeles con dos contadores separados en el mismo recorrido.',
  casoPrueba:'Tramo de 5 esquinas con flor en 3 de ellas -> contador final = 3.',
  starter: tmplSimple('ContadorDeFloresSinRecolectar', ['inicializar el contador en 0','repetir N veces: si HayFlorEnLaEsquina, sumar 1 al contador; avanzar','informar el contador final'], '      contador: numero') },

{ id:'P06', nombre:'Comparador de calles', tier:'U3', dificultad:3, prereq:'Unidades 2-3', categoria:'Microproyecto (1 unidad)', verbos:['comparar'],
  resumen:'Contar flores en dos calles de igual longitud (dos variables independientes) e informar, con un operador relacional, cual tuvo mas o si empataron. Primer proyecto que compara dos recorridos.',
  precondicion:'Las dos calles a comparar tienen la misma longitud.',
  postcondicion:'Se informo cual calle tuvo mas flores, o que empataron.',
  topdown:['contar flores de la primera calle en una variable','volver e ir a la segunda calle, contar flores en otra variable','comparar ambas variables con <, > o = e informar el resultado'],
  fundamento:['conocimiento/unidad-03-datos/capitulo-3-datos.md (tabla 3.1, operadores relacionales)'],
  validacion:null, varianteAvanzada:'Generalizar a 3 calles usando el mayor progresivo (comparar de a pares).',
  casoPrueba:'Calle A con 4 flores, calle B con 2 -> informa que A tiene mas.',
  starter: tmplSimple('ComparadorDeCalles', ['contar flores de la primera calle en contadorA','contar flores de la segunda calle en contadorB','comparar contadorA y contadorB e informar cual es mayor (o si empatan)'], '      contadorA: numero\n      contadorB: numero') },

{ id:'P07', nombre:'Clasificador de esquinas por carga', tier:'U3', dificultad:3, prereq:'Unidades 2-3', categoria:'Microproyecto (1 unidad)', verbos:['clasificar','contar'],
  resumen:'Recorrer una avenida clasificando cada esquina en 4 categorias (flor sola / papel solo / ambos / ninguno) con 4 contadores, informando los 4 totales al final.',
  precondicion:'La longitud del tramo a recorrer es conocida.',
  postcondicion:'Los 4 contadores suman exactamente la cantidad de esquinas recorridas.',
  topdown:['declarar 4 contadores en 0','en cada esquina decidir con si/sino en cascada a cual de las 4 categorias pertenece y sumar 1 al contador correspondiente','avanzar y repetir','informar los 4 contadores al final'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (tabla 2.1, sensores)','conocimiento/unidad-03-datos/capitulo-3-datos.md (declaracion de multiples variables)'],
  validacion:null, varianteAvanzada:'Agregar una quinta categoria: esquinas con mas de una flor (no se puede contar cantidad exacta, solo presencia; discutir la limitacion).',
  casoPrueba:'Tramo con 2 esquinas "solo flor", 1 "solo papel", 1 "ambos", 1 "ninguno" -> los 4 contadores lo reflejan.',
  starter: tmplSimple('ClasificadorDeEsquinasPorCarga', ['inicializar los 4 contadores en 0','clasificar la esquina actual con si/sino en cascada y sumar al contador correspondiente','avanzar y repetir para todo el tramo','informar los 4 contadores'], '      soloFlor: numero\n      soloPapel: numero\n      ambos: numero\n      ninguno: numero') },

{ id:'P08', nombre:'Saldo de bolsa comparado', tier:'U3', dificultad:3, prereq:'Unidades 2-3', categoria:'Microproyecto (1 unidad)', verbos:['comparar','trasladar'],
  resumen:'Recoger flores y papeles alternadamente en un tramo llevando contadores propios, porque el robot NO expone una cantidad numerica de bolsa (solo HayFlorEnLaBolsa/HayPapelEnLaBolsa, que son proposiciones). Al final compara cual cantidad fue mayor.',
  precondicion:'El tramo contiene una mezcla de flores y papeles recolectables.',
  postcondicion:'Se informo si se tomaron mas flores, mas papeles, o la misma cantidad.',
  topdown:['declarar contadorFlores y contadorPapeles en 0','en cada esquina, tomar lo que haya y sumar al contador correspondiente','avanzar y repetir','comparar los dos contadores e informar el resultado'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (tabla 2.1: HayFlorEnLaBolsa/HayPapelEnLaBolsa son proposiciones, no hay identificador numerico de bolsa documentado)'],
  validacion:null, varianteAvanzada:'Depositar todo lo recolectado en la ultima esquina y verificar con Hay...EnLaEsquina que quedo vacia la bolsa.',
  casoPrueba:'Tramo con 3 flores y 1 papel recolectables -> informa que hay mas flores.',
  starter: tmplSimple('SaldoDeBolsaComparado', ['inicializar contadorFlores y contadorPapeles en 0','en cada esquina tomar flor y/o papel si hay, sumando al contador correspondiente','avanzar y repetir','comparar los contadores e informar cual es mayor'], '      contadorFlores: numero\n      contadorPapeles: numero') },

{ id:'P09', nombre:'Mapa del tesoro en espiral', tier:'U3', dificultad:4, prereq:'Unidades 2-3', categoria:'Visual / narrativo', verbos:['recoger','detectar'],
  resumen:'La ciudad se reformula como "mapa" (flor=tesoro, papel=trampa): recorrer una espiral fija desde (1,1) recogiendo tesoros e informando la posicion de cada trampa sin tocarla.',
  precondicion:'No esta confirmado si repetir acepta un contador guardado en variable (el libro solo ejemplifica con literales). Alternativa segura: fijar la espiral con literales crecientes (1,1,2,2,3,3...) en vez de una variable de paso.',
  postcondicion:'Se recolectaron los tesoros (flores) del camino y se informo la posicion de cada trampa (papel) sin tomarla.',
  topdown:['dar el primer paso de la espiral (1 cuadra) y girar','dar el segundo tramo (1 cuadra) y girar: se completo la primera vuelta chica','seguir agrandando cada tramo de a 1 (2,2,3,3,4,4...) usando literales, no una variable, para no depender de un comportamiento no confirmado','en cada esquina: si hay flor tomarla; si hay papel, informar la posicion sin tomarlo'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (repetir, Pos)','unidad-05-programacion-estructurada/recursos/ y unidad-08-practica-adicional/recursos/ (referencia visual de figuras de recorrido, no de codigo)'],
  validacion:'Dependencia parcial no confirmada: uso de una variable como contador de repetir. Resuelto con literales crecientes como alternativa segura.',
  varianteAvanzada:'Intentar la version con variable de paso y comparar si el interprete la acepta (documentar el resultado).',
  casoPrueba:'Ciudad con 3 tesoros en el camino de la primera vuelta -> los 3 se recolectan.',
  starter: tmplSimple('MapaDelTesoroEnEspiral', ['dar el primer tramo de la espiral (repetir 1; mover) y girar con derecha','agrandar cada tramo de a 1 usando literales (1,1,2,2,3,3...), no una variable','en cada esquina: si hay flor (tesoro) tomarla; si hay papel (trampa) informar la posicion sin tomarlo']) },

{ id:'P10', nombre:'Parada por condicion molecular triple', tier:'U4', dificultad:4, prereq:'Unidades 2-4', categoria:'Repaso (combina 2 unidades)', verbos:['detectar','contar'],
  resumen:'Iterar con mientras sobre una condicion que combina tres proposiciones (dos de estado de esquina, una de estado de bolsa) con & y | mixtos, acumulando conteo. Nivel de integracion propio del repaso.',
  precondicion:'Existe una esquina donde la condicion compuesta se vuelve falsa (convencion "seguro existe").',
  postcondicion:'El contador refleja los pasos dados mientras la condicion triple se mantuvo verdadera.',
  topdown:['inicializar el contador en 0','armar una condicion con 3 proposiciones combinando & y |','mientras se cumpla, avanzar y sumar al contador','informar el contador final'],
  fundamento:['conocimiento/unidad-04-repaso/capitulo-4-repaso.md (ejemplos con proposiciones moleculares anidadas)'],
  validacion:null, varianteAvanzada:'Cambiar la combinacion de & por | y comparar cuantos pasos da en cada caso.',
  casoPrueba:'Condicion verdadera en 4 esquinas consecutivas -> contador final = 4.',
  starter: tmplSimple('ParadaPorCondicionMolecularTriple', ['inicializar el contador en 0','armar una condicion con 3 proposiciones (esquina + esquina + bolsa) usando & y |','mientras se cumpla: avanzar y sumar 1 al contador','informar el contador final'], '      contador: numero') },

{ id:'P11', nombre:'Verificacion contra expectativa fija', tier:'U4', dificultad:4, prereq:'Unidades 2-4', categoria:'Repaso (combina 2 unidades)', verbos:['comparar'],
  resumen:'Recorrer un tramo, contar flores tomadas y comparar el resultado contra un valor esperado fijo en el propio codigo, informando V/F segun coincida. Introduce la idea de "auto-test" antes de llegar a procesos.',
  precondicion:'El valor esperado se define de antemano en el codigo (por ejemplo, 5).',
  postcondicion:'Se informo V si el conteo coincidio con lo esperado, F en caso contrario.',
  topdown:['definir el valor esperado (literal) y un contador en 0','recorrer el tramo tomando flores y sumando al contador','comparar el contador contra el valor esperado con = ','informar V o F segun el resultado'],
  fundamento:['conocimiento/unidad-03-datos/capitulo-3-datos.md (literales V/F, linea 281)','conocimiento/unidad-04-repaso/capitulo-4-repaso.md'],
  validacion:null, varianteAvanzada:'En vez de un valor fijo, recibir el valor esperado como si fuera un parametro (preparacion conceptual para la unidad 6).',
  casoPrueba:'4 flores en el tramo y esperado=4 -> informa V; esperado=5 -> informa F.',
  starter: tmplSimple('VerificacionContraExpectativaFija', ['definir el contador en 0 (el valor esperado podes dejarlo como literal, ej 4)','recorrer el tramo tomando flores y sumando al contador','comparar el contador contra el valor esperado con =','informar V o F segun el resultado'], '      contador: numero') },

{ id:'P12', nombre:'Exploracion acotada por limite logico', tier:'U4', dificultad:4, prereq:'Unidades 2-4', categoria:'Repaso (combina 2 unidades)', verbos:['detectar'],
  resumen:'Usar PosAv/PosCa con relacionales para detener un mientras en un limite propio del problema (ej. avenida 50), distinto del limite fisico de la ciudad. Practica la diferencia entre "limite de la ciudad" y "limite que yo defino".',
  precondicion:'El limite logico elegido (ej. avenida 50) esta dentro del area real (100x100).',
  postcondicion:'El robot se detuvo exactamente en el limite logico definido, sin llegar al limite fisico de la ciudad.',
  topdown:['elegir un limite logico propio (por ejemplo, avenida 50)','mientras PosAv sea menor que ese limite, avanzar','informar la posicion final y verificar que no se acerco al limite fisico (100)'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (linea 169, restriccion de limites de la ciudad)','conocimiento/unidad-03-datos/capitulo-3-datos.md (operadores relacionales)'],
  validacion:null, varianteAvanzada:'Definir el limite logico como resultado de una cuenta (por ejemplo, mitad de la ciudad) en vez de un literal.',
  casoPrueba:'Limite logico = 5, inicio en avenida 1 -> el robot se detiene en avenida 5, no en 100.',
  starter: tmplSimple('ExploracionAcotadaPorLimiteLogico', ['elegir un limite logico propio, por ejemplo 5 (no el limite fisico 100)','mientras PosAv sea menor que ese limite: girar hacia el este y avanzar','informar la posicion final']) },

{ id:'P13', nombre:'Modulo de esquina reutilizable', tier:'U5', dificultad:5, prereq:'Unidades 2-5', categoria:'Microproyecto (1 unidad)', verbos:['recoger'],
  resumen:'Encapsular "recoger todo lo que haya en la esquina actual" (flores y papeles) en UN proceso sin parametros, invocado 4 veces en un recorrido. Top-Down real con reutilizacion literal.',
  precondicion:'No hay limite documentado en la cantidad de flores/papeles por esquina.',
  postcondicion:'Las 4 esquinas visitadas quedan sin flores ni papeles.',
  topdown:['declarar un proceso LimpiarEsquina sin parametros','dentro, usar mientras HayFlorEnLaEsquina y mientras HayPapelEnLaEsquina para vaciarla por completo','en el robot, invocar LimpiarEsquina en 4 esquinas distintas, moviendose entre invocaciones'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (lineas 116-148, sintaxis de proceso)'],
  validacion:null, varianteAvanzada:'Que LimpiarEsquina informe cuantas flores y papeles encontro antes de vaciarla.',
  casoPrueba:'Esquina con 2 flores y 1 papel -> tras invocar el proceso, ambos sensores dan F.',
  starter: tmplProceso('ModuloDeEsquinaReutilizable', [{nombre:'LimpiarEsquina', params:'', todos:['mientras HayFlorEnLaEsquina, tomarFlor','mientras HayPapelEnLaEsquina, tomarPapel']}], ['invocar LimpiarEsquina','avanzar a la siguiente esquina a limpiar','repetir la invocacion para completar 4 esquinas']) },

{ id:'P14', nombre:'Escuadra modular', tier:'U5', dificultad:5, prereq:'Unidades 2-5', categoria:'Microproyecto (1 unidad)', verbos:['trasladar'],
  resumen:'Recorrer los 4 lados de un cuadrado con UN unico proceso Lado invocado 4 veces con un derecha entre invocaciones. Fuerza reutilizacion identica en vez de codificar el cuadrado como secuencia plana.',
  precondicion:'El lado elegido cabe dentro del area.',
  postcondicion:'El robot recorrio un cuadrado cerrado usando el mismo proceso 4 veces.',
  topdown:['declarar un proceso Lado sin parametros que avance una cantidad fija de cuadras','en el robot, invocar Lado y luego derecha, cuatro veces seguidas'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (proceso sin parametros)','unidad-05-programacion-estructurada/recursos/figura-5-9-recorridos-cuadrados.png (referencia visual)'],
  validacion:null, varianteAvanzada:'Comparar contra P03 (rectangulo cerrado sin procesos) y discutir que gano al modularizar.',
  casoPrueba:'Lado de 3 cuadras -> tras 4 invocaciones de Lado + derecha, el robot vuelve a (1,1) mirando al norte.',
  starter: tmplProceso('EscuadraModular', [{nombre:'Lado', params:'', todos:['avanzar una cantidad fija de cuadras (elegi el largo del lado)']}], ['invocar Lado','girar con derecha','repetir invocar Lado + derecha hasta completar las 4 vueltas']) },

{ id:'P15', nombre:'Dos modulos colaborando', tier:'U5', dificultad:5, prereq:'Unidades 2-5', categoria:'Microproyecto (1 unidad)', verbos:['recoger','clasificar'],
  resumen:'Un proceso RecorrerYLimpiar que invoca alternadamente a JuntarFlores y JuntarPapeles (ambos ya declarados antes). Ejercita explicitamente la regla de orden de declaracion del capitulo 5.',
  precondicion:'JuntarFlores y JuntarPapeles deben declararse ANTES que RecorrerYLimpiar (regla del capitulo 5).',
  postcondicion:'El tramo recorrido queda sin flores ni papeles.',
  topdown:['declarar JuntarFlores (vacia flores de la esquina actual)','declarar JuntarPapeles (vacia papeles de la esquina actual), despues de JuntarFlores','declarar RecorrerYLimpiar que invoca a ambos y avanza, repitiendo el tramo'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (lineas 232, 312-318: orden de declaracion y un proceso invocando a otros)'],
  validacion:null, varianteAvanzada:'Invertir el orden de declaracion a proposito y observar el error que produce el simulador.',
  casoPrueba:'Tramo de 3 esquinas con flores y papeles mezclados -> al terminar, ninguna tiene flor ni papel.',
  starter: tmplProceso('DosModulosColaborando', [
    {nombre:'JuntarFlores', params:'', todos:['mientras HayFlorEnLaEsquina, tomarFlor']},
    {nombre:'JuntarPapeles', params:'', todos:['mientras HayPapelEnLaEsquina, tomarPapel']},
    {nombre:'RecorrerYLimpiar', params:'', todos:['invocar JuntarFlores','invocar JuntarPapeles','avanzar a la siguiente esquina']}
  ], ['invocar RecorrerYLimpiar la cantidad de veces necesaria para cubrir el tramo']) },

{ id:'P16', nombre:'Refactor guiado del recorrido de avenidas', tier:'U5', dificultad:5, prereq:'Unidades 2-5', categoria:'Refuerzo explicito (no nuevo)', verbos:['(meta) modularizar'],
  resumen:'Tomar el objetivo del ejercicio 8 del capitulo 5 (recorrer todas las avenidas) y resolverlo con exactamente 2 procesos. Aviso: el objetivo de recorrido coincide con un ejercicio existente; lo que cambia es el objetivo pedagogico (modularizar algo ya resuelto, no resolver desde cero). No usar como "proyecto nuevo" si ya se asigno el ejercicio 8 original.',
  precondicion:'El estudiante ya resolvio (o conoce) el ejercicio 8 del capitulo 5 de forma no modular.',
  postcondicion:'La misma funcionalidad del ejercicio 8 queda expresada en exactamente 2 procesos reutilizables.',
  topdown:['declarar RecorrerAvenida (avanza una avenida completa)','declarar CruzarACalleSiguiente (gira, avanza una cuadra, gira para quedar orientado a la proxima avenida)','en el robot, alternar invocaciones de ambos procesos para cubrir todas las avenidas'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (linea 781, enunciado 8)'],
  validacion:'Redundancia de objetivo senalada explicitamente: no asignar junto al ejercicio 8 original a los mismos estudiantes.',
  varianteAvanzada:'Medir cuantas lineas de codigo se ahorran al reutilizar los 2 procesos versus la version plana.',
  casoPrueba:'Ciudad de 5x5 -> el robot recorre las 5 avenidas usando solo 2 procesos.',
  starter: tmplProceso('RefactorRecorridoDeAvenidas', [
    {nombre:'RecorrerAvenida', params:'', todos:['avanzar una avenida completa (elegi hasta donde)']},
    {nombre:'CruzarACalleSiguiente', params:'', todos:['girar, avanzar una cuadra y volver a girar para quedar orientado a la proxima avenida']}
  ], ['alternar RecorrerAvenida y CruzarACalleSiguiente hasta cubrir todas las avenidas elegidas']) },

{ id:'P17', nombre:'Umbral configurable', tier:'U6', dificultad:6, prereq:'Unidades 2-6', categoria:'Microproyecto (1 unidad)', verbos:['contar'],
  resumen:'Proceso con parametro E umbral:numero que recorre una avenida y se detiene cuando el conteo de flores alcanza ese umbral. Mismo modulo reutilizable con distintos valores sin tocar codigo.',
  precondicion:'Existen al menos "umbral" flores en el tramo (o el proceso debe decidir que hacer si no las hay).',
  postcondicion:'El robot se detuvo apenas junto "umbral" flores (o agoto el tramo, segun la variante).',
  topdown:['declarar el proceso con parametro E umbral:numero y una variable local contador','mientras contador < umbral (y haya mas tramo), tomar flor si hay y avanzar','invocar el proceso dos veces con umbrales distintos desde el robot'],
  fundamento:['conocimiento/unidad-06-parametros-de-entrada/capitulo-6-parametros-de-entrada.md (lineas 79-97, sintaxis de parametros)'],
  validacion:null, varianteAvanzada:'Manejar el caso en que el tramo termine antes de alcanzar el umbral (ver P28).',
  casoPrueba:'umbral=3 con 5 flores disponibles -> el robot se detiene tras tomar la tercera.',
  starter: tmplProceso('UmbralConfigurable', [{nombre:'ContarHastaUmbral', params:'E umbral:numero', locals:'      contador: numero', todos:['inicializar contador en 0','mientras contador sea menor que umbral: si hay flor, tomarla y sumar 1 a contador; avanzar','informar el contador final']}], ['invocar ContarHastaUmbral con un primer valor, por ejemplo 3','invocar ContarHastaUmbral de nuevo con otro valor distinto']) },

{ id:'P18', nombre:'Verificador de rango con parametro protegido', tier:'U6', dificultad:6, prereq:'Unidades 2-6', categoria:'Microproyecto (1 unidad)', verbos:['contar'],
  resumen:'Proceso con E longitud:numero que recorre esa cantidad de esquinas contando papeles, usando una variable local auxiliar porque el parametro E no puede reasignarse. Vuelve explicita esa restriccion central del capitulo 6.',
  precondicion:'longitud es un numero positivo menor o igual al espacio disponible en el area.',
  postcondicion:'El contador local refleja los papeles hallados en exactamente "longitud" esquinas.',
  topdown:['declarar el proceso con parametro E longitud:numero','declarar una variable local para el conteo Y otra para llevar cuantas esquinas ya se recorrieron (nunca reasignar longitud)','repetir usando la variable local de progreso hasta llegar a longitud, contando papeles'],
  fundamento:['conocimiento/unidad-06-parametros-de-entrada/capitulo-6-parametros-de-entrada.md (lineas 739-793, restriccion de no modificar E, ejemplo de error UnaMenosV1)'],
  validacion:null, varianteAvanzada:'Intentar deliberadamente reasignar longitud dentro del proceso y leer el error que produce el simulador.',
  casoPrueba:'longitud=4 con papel en 2 de esas 4 esquinas -> informa 2.',
  starter: tmplProceso('VerificadorDeRango', [{nombre:'ContarPapelesEnRango', params:'E longitud:numero', locals:'      contadorPapeles: numero\n      avanzadas: numero', todos:['inicializar contadorPapeles y avanzadas en 0','mientras avanzadas sea menor que longitud: si hay papel, tomarlo y sumar 1 a contadorPapeles; avanzar y sumar 1 a avanzadas','informar contadorPapeles']}], ['invocar ContarPapelesEnRango con un valor de longitud, por ejemplo 4']) },

{ id:'P19', nombre:'Selector de direccion por parametro booleano', tier:'U6', dificultad:6, prereq:'Unidades 2-6', categoria:'Microproyecto (1 unidad)', verbos:['clasificar'],
  resumen:'Proceso con E girar:boolean que decide en cada esquina si doblar o seguir recto. Usa E de tipo boolean, menos frecuente que numero en los ejemplos del libro.',
  precondicion:'El valor booleano se decide antes de invocar el proceso.',
  postcondicion:'El robot giro o siguio recto segun el parametro recibido, de forma consistente.',
  topdown:['declarar el proceso con parametro E girar:boolean','si girar es V, aplicar derecha antes de avanzar; si es F, avanzar directo','invocar el proceso dos veces, una con V y otra con F, y comparar los recorridos'],
  fundamento:['conocimiento/unidad-06-parametros-de-entrada/capitulo-6-parametros-de-entrada.md (linea 92, tipos permitidos en parametros: numero o boolean)'],
  validacion:null, varianteAvanzada:'Reemplazar el literal V/F por el resultado de una condicion evaluada en el robot (por ejemplo, HayFlorEnLaEsquina).',
  casoPrueba:'girar=V hace que el robot cambie de avenida; girar=F lo mantiene en la misma.',
  starter: tmplProceso('SelectorDeDireccion', [{nombre:'AvanzarSegunParametro', params:'E girar:boolean', todos:['si girar es V, aplicar derecha antes de avanzar','si girar es F, avanzar directo (sin girar)']}], ['invocar AvanzarSegunParametro con V','invocar AvanzarSegunParametro con F y comparar el resultado']) },

{ id:'P20', nombre:'Doble llamada comparativa', tier:'U6', dificultad:6, prereq:'Unidades 2-6', categoria:'Microproyecto (1 unidad)', verbos:['comparar'],
  resumen:'Invocar dos veces el mismo proceso con E (una por cada avenida a comparar); cada llamada informa su propio resultado por separado. Muestra la limitacion de E puro para "traer" un resultado combinado (preparacion conceptual para ES).',
  precondicion:'Las dos avenidas a comparar existen dentro del area.',
  postcondicion:'Se informaron dos resultados independientes, uno por cada invocacion.',
  topdown:['declarar un proceso con E avenida:numero que se posiciona ahi y cuenta flores','invocarlo con la primera avenida e informar','invocarlo con la segunda avenida e informar','notar que, sin ES, no hay forma de comparar ambos resultados dentro de un unico proceso'],
  fundamento:['conocimiento/unidad-06-parametros-de-entrada/capitulo-6-parametros-de-entrada.md (linea 805, parametros E unidireccionales)'],
  validacion:null, varianteAvanzada:'Reescribir el mismo problema con ES (ver P21) y comparar cuanto codigo se ahorra en el robot.',
  casoPrueba:'Avenida 1 con 3 flores, avenida 2 con 5 -> se informan "3" y "5" por separado, no un resultado combinado.',
  starter: tmplProceso('DobleLlamadaComparativa', [{nombre:'ContarFloresEnAvenida', params:'E avenida:numero', locals:'      contador: numero', todos:['posicionarse al inicio de la avenida recibida con Pos','recorrer la avenida contando flores','informar el contador']}], ['invocar ContarFloresEnAvenida con la primera avenida','invocar ContarFloresEnAvenida con la segunda avenida']) },

{ id:'P21', nombre:'Acumulador cruzado', tier:'U7', dificultad:7, prereq:'Unidades 2-7', categoria:'Microproyecto (1 unidad)', verbos:['contar'],
  resumen:'Un proceso con ES total:numero invocado 3 veces sobre 3 tramos distintos, acumulando en la misma variable a traves de las tres llamadas. Demuestra mejor que un solo llamado la semantica "entrada Y salida".',
  precondicion:'La variable total se inicializa en 0 antes de la primera invocacion (responsabilidad del programador).',
  postcondicion:'total contiene la suma de flores encontradas en los 3 tramos.',
  topdown:['declarar el proceso con parametro ES total:numero','dentro, recorrer un tramo sumando flores encontradas a total (sin reiniciarlo)','en el robot, inicializar una variable en 0 e invocar el proceso 3 veces sobre esa misma variable, moviendose entre tramos'],
  fundamento:['conocimiento/unidad-07-parametros-de-entrada-salida/capitulo-7-parametros-de-entrada-salida.md (lineas 63, 98, sintaxis ES)'],
  validacion:null, varianteAvanzada:'Comparar contra P20: mismo problema, pero ahora un unico total acumula las 3 llamadas.',
  casoPrueba:'3 tramos con 2, 3 y 1 flor respectivamente -> total final = 6.',
  starter: tmplProceso('AcumuladorCruzado', [{nombre:'AcumularFloresDelTramo', params:'ES total:numero', todos:['recorrer un tramo (elegi cuanto) sumando las flores encontradas a total','no reiniciar total: debe seguir sumando sobre lo que ya traia']}], ['inicializar una variable en 0','invocar AcumularFloresDelTramo con esa variable, 3 veces, moviendose entre tramos','informar la variable al final']) },

{ id:'P22', nombre:'Intercambio de objetos (transformacion)', tier:'U7', dificultad:7, prereq:'Unidades 2-7', categoria:'Microproyecto (1 unidad)', verbos:['transformar'],
  resumen:'Proceso con dos parametros ES (flores tomadas, papeles tomados) que recorre un tramo y, cada vez que toma un papel, deposita una flor en su lugar si tiene alguna en la bolsa. Primer proyecto con el verbo "transformar".',
  precondicion:'El robot lleva flores en la bolsa antes de empezar (bolsa inicial configurable en el simulador).',
  postcondicion:'Cada papel recogido en el tramo fue reemplazado por una flor, cuando la bolsa lo permitio.',
  topdown:['declarar el proceso con dos parametros ES: floresUsadas y papelesTomados','en cada esquina: si hay papel, tomarlo y sumar a papelesTomados; si ademas hay flor en la bolsa, depositarla y sumar a floresUsadas','avanzar y repetir para todo el tramo'],
  fundamento:['conocimiento/unidad-07-parametros-de-entrada-salida/capitulo-7-parametros-de-entrada-salida.md (lineas 210-211, multiples parametros mixtos, ejemplo Rectangulo)'],
  validacion:null, varianteAvanzada:'Que informe cuantos papeles NO pudieron transformarse por falta de flores en la bolsa.',
  casoPrueba:'Bolsa inicial con 2 flores, tramo con 3 papeles -> se transforman 2, el tercero queda sin cambiar.',
  starter: tmplProceso('IntercambioDeObjetos', [{nombre:'TransformarPapelesEnFlores', params:'ES floresUsadas:numero; ES papelesTomados:numero', todos:['en la esquina actual: si hay papel, tomarlo y sumar 1 a papelesTomados','si ademas hay flor en la bolsa, depositarla y sumar 1 a floresUsadas','avanzar y repetir para el resto del tramo']}], ['inicializar floresUsadas y papelesTomados en 0','invocar TransformarPapelesEnFlores con ambas variables','informar floresUsadas y papelesTomados'], '      floresUsadas: numero\n      papelesTomados: numero') },

{ id:'P23', nombre:'Rectangulo clasificador', tier:'U7', dificultad:7, prereq:'Unidades 2-7', categoria:'Variacion de ejemplo existente', verbos:['clasificar'],
  resumen:'Mismo esqueleto de parametros que el ejemplo Rectangulo(E base, E altura, ES cantidad) del capitulo 7, pero con objetivo distinto: en vez de contar, marcar con ES esquinaVacia:boolean si el perimetro tuvo alguna esquina sin flor ni papel.',
  precondicion:'base y altura definen un rectangulo dentro del area.',
  postcondicion:'esquinaVacia queda en V si al menos una esquina del perimetro estaba vacia, F si no.',
  topdown:['declarar el proceso con E base:numero, E altura:numero, ES esquinaVacia:boolean','inicializar esquinaVacia en F antes de recorrer','recorrer el perimetro del rectangulo; si una esquina no tiene flor ni papel, poner esquinaVacia en V','invocar el proceso desde el robot e informar el resultado'],
  fundamento:['conocimiento/unidad-07-parametros-de-entrada-salida/capitulo-7-parametros-de-entrada-salida.md (lineas 210-211, ejemplo Rectangulo con E/E/ES)'],
  validacion:'Variacion de objetivo sobre un ejemplo existente del capitulo 7 (parcial): la firma de parametros se apoya en el ejemplo Rectangulo, el objetivo (clasificar en vez de contar) es nuevo.',
  varianteAvanzada:'En vez de un booleano, usar ES esquinasVacias:numero para contar cuantas hubo.',
  casoPrueba:'Rectangulo 3x2 con una esquina vacia en el perimetro -> esquinaVacia = V.',
  starter: tmplProceso('RectanguloClasificador', [{nombre:'Rectangulo', params:'E base:numero; E altura:numero; ES esquinaVacia:boolean', todos:['inicializar esquinaVacia en F','recorrer el perimetro definido por base y altura','si una esquina no tiene flor ni papel, poner esquinaVacia en V']}], ['invocar Rectangulo con base, altura y una variable booleana','informar esa variable'], '      vacia: boolean') },

{ id:'P24', nombre:'Diseno por contrato en pareja', tier:'U7', dificultad:7, prereq:'Unidades 2-7', categoria:'Colaborativo', verbos:['(meta) especificar'],
  resumen:'Actividad de a dos: Estudiante A escribe precondicion, postcondicion y 3 casos de prueba para un modulo con ES (sin escribir codigo de robot); Estudiante B lo implementa solo a partir de ese contrato, sin ver el diseno original. Al final comparan contra P21.',
  precondicion:'El contrato (precondicion, postcondicion, 3 casos de prueba) esta escrito antes de tocar el simulador.',
  postcondicion:'La implementacion de B cumple los 3 casos de prueba escritos por A, sin haber visto el diseno de A.',
  topdown:['(Estudiante A) escribir precondicion y postcondicion de un proceso con ES, sin codigo','(Estudiante A) escribir 3 casos de prueba concretos (ciudad + resultado esperado)','(Estudiante B) implementar el proceso solo a partir del contrato','correr los 3 casos en el simulador y comparar con P21'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (Top-Down, lineas 50-109)','conocimiento/unidad-07-parametros-de-entrada-salida/capitulo-7-parametros-de-entrada-salida.md (linea 374, responsabilidad de inicializar ES)'],
  validacion:'Si se usa Estudiantes/valen/examen_voluntario.ri como ejemplo de "contrato no cumplido", aclarar que ese archivo esta marcado no validado en la auditoria previa (el proceso se declara pero nunca se invoca).',
  varianteAvanzada:'Repetir el ejercicio intercambiando los roles A/B con un proceso distinto.',
  casoPrueba:'Los 3 casos de prueba de A deben ejecutarse tal cual sobre la implementacion de B.',
  starter: tmplProceso('DisenoPorContratoEnPareja', [{nombre:'ProcesoAContrato', params:'ES resultado:numero', todos:['(Estudiante B) implementar aca solo a partir del contrato escrito por Estudiante A, sin ver P21']}], ['inicializar una variable en 0','invocar ProcesoAContrato y comparar contra los 3 casos de prueba escritos antes de programar']) },

{ id:'P25', nombre:'Barrendero de ciudad', tier:'U8', dificultad:8, prereq:'Unidades 2-8', categoria:'Integrador', verbos:['contar','recoger'],
  resumen:'Recorrer las avenidas completas en patron serpiente (alternando sentido), contando flores y papeles totales por separado con modulos E/ES, informando ambos al final. Integrador de todo el curso.',
  precondicion:'La ciudad (o el sector elegido) tiene un ancho conocido de avenidas.',
  postcondicion:'Se recorrieron todas las avenidas del sector elegido exactamente una vez cada una.',
  topdown:['declarar un proceso RecorrerAvenida(ES flores:numero; ES papeles:numero) que recoja todo en una avenida','declarar CruzarACalleSiguiente para pasar de una avenida a la siguiente sin perder orientacion','alternar sentido de recorrido en avenidas pares e impares (patron serpiente)','acumular flores y papeles totales e informarlos al final'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (modularizacion)','conocimiento/unidad-08-practica-adicional/ejercicios-adicionales.md (linea 29, "recorrer todas las avenidas", como referencia de escala, no de solucion)'],
  validacion:null, varianteAvanzada:'Restriccion agregada: no volver a pisar ninguna esquina dos veces (verificable solo por diseno del algoritmo).',
  casoPrueba:'Sector de 3 avenidas x 3 calles con flores y papeles distribuidos -> el total informado coincide con la suma real sembrada.',
  starter: tmplProceso('BarrenderoDeCiudad', [
    {nombre:'RecorrerAvenida', params:'ES flores:numero; ES papeles:numero', todos:['recorrer la avenida actual completa, tomando flores y papeles y sumando a los totales']},
    {nombre:'CruzarACalleSiguiente', params:'', todos:['girar, avanzar una cuadra y girar para quedar orientado a la proxima avenida']}
  ], ['inicializar totalFlores y totalPapeles en 0','alternar RecorrerAvenida y CruzarACalleSiguiente para el sector elegido','informar totalFlores y totalPapeles'], '      totalFlores: numero\n      totalPapeles: numero') },

{ id:'P26', nombre:'Auditor de simetria', tier:'U8', dificultad:8, prereq:'Unidades 2-8', categoria:'Integrador', verbos:['comparar'],
  resumen:'Recorrer media ciudad comparando cada esquina con su simetrica opuesta (Pos(PosAv, limite+1-PosCa)), informando cuantas esquinas simetricas coinciden en tener flor. Usa Pos con una expresion aritmetica como argumento.',
  precondicion:'El limite de calles del sector (por ejemplo 10 si se trabaja en una ciudad reducida de prueba) es conocido para calcular la esquina espejada.',
  postcondicion:'coincidencias contiene cuantos pares de esquinas simetricas tenian flor en ambos lados.',
  topdown:['elegir el limite de calles del sector a auditar','recorrer la mitad de las calles, y para cada una moverse a su espejo con Pos(PosAv, limite+1-PosCa)','comparar si ambas esquinas tienen flor y sumar a coincidencias si es asi','informar coincidencias al final'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/codigo/soluciones/capitulo-05/Cap5Ejempo4 (evidencia de sintaxis: Pos(PosAv+1,1) con expresion aritmetica)','conocimiento/unidad-03-datos/capitulo-3-datos.md (aritmetica)'],
  validacion:'Dependencia no validada: Cap5Ejempo4 esta marcado requiere_revision en la auditoria previa (archivo huerfano, sin ejercicio confirmado). Se cita solo como evidencia de que Pos admite una expresion aritmetica como argumento, no como solucion de referencia.',
  varianteAvanzada:'Extender la simetria a las dos coordenadas (espejo diagonal) en vez de una sola.',
  casoPrueba:'Sector de 4 calles con flor en (1,1) y (1,4) -> coincidencias = 1 para ese par.',
  starter: tmplSimple('AuditorDeSimetria', ['elegir el limite de calles del sector (ej. 10)','recorrer la mitad de las calles; para cada una, ir a su espejo con Pos(PosAv, limite+1-PosCa)','comparar si ambas esquinas tienen flor y sumar a coincidencias','informar coincidencias'], '      coincidencias: numero') },

{ id:'P27', nombre:'Clasificador de manzanas', tier:'U8', dificultad:9, prereq:'Unidades 2-8', categoria:'Integrador / desafio de modularizacion', verbos:['clasificar','contar'],
  resumen:'Dividir la ciudad en bloques de 10x10 con un proceso "manzana" invocado desde un proceso mayor, contando cuantos bloques tienen mas flores que papeles. Ejercita modularizacion a 3 niveles (proceso que invoca proceso que invoca proceso).',
  precondicion:'El sector de prueba es multiplo del tamano de manzana elegido.',
  postcondicion:'manzanasConMasFlores cuenta los bloques donde las flores superaron a los papeles.',
  topdown:['declarar EvaluarEsquina (clasifica una esquina, nivel mas interno)','declarar EvaluarManzana que invoca EvaluarEsquina repetidamente y decide si esa manzana tuvo mas flores','en el robot, invocar EvaluarManzana para cada bloque del sector'],
  fundamento:['conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (linea 232, regla de declaracion previa; la cadena de 3 niveles es una extrapolacion razonable de la regla general "un proceso invoca a otro ya declarado", no probada explicitamente a 3 niveles en el material)'],
  validacion:'Extrapolacion de la regla de invocacion de procesos de 2 a 3 niveles, sealada como supuesto (no confirmada explicitamente en el material).',
  varianteAvanzada:'Reducir el tamano de manzana para trabajar con un sector mas chico y validar el resultado a mano.',
  casoPrueba:'Sector de 2 manzanas donde una tiene mas flores y otra mas papeles -> manzanasConMasFlores = 1.',
  starter: tmplProceso('ClasificadorDeManzanas', [
    {nombre:'EvaluarEsquina', params:'ES flores:numero; ES papeles:numero', todos:['si hay flor, sumar 1 a flores (sin tomarla)','si hay papel, sumar 1 a papeles (sin tomarlo)']},
    {nombre:'EvaluarManzana', params:'ES manzanasConMasFlores:numero', locals:'      flores: numero\n      papeles: numero', todos:['recorrer la manzana invocando EvaluarEsquina en cada esquina, acumulando flores y papeles','si flores es mayor que papeles, sumar 1 a manzanasConMasFlores']}
  ], ['inicializar manzanasConMasFlores en 0','invocar EvaluarManzana para cada bloque del sector, moviendose entre bloques','informar manzanasConMasFlores'], '      totalManzanas: numero') },

{ id:'P28', nombre:'Buscador sin garantia', tier:'U8', dificultad:9, prereq:'Unidades 2-8', categoria:'Desafio avanzado', verbos:['detectar'],
  resumen:'A diferencia de todos los ejemplos del libro (que asumen "seguro existe"), disenar un proceso que busque una esquina vacia en un tramo donde NO esta garantizado que exista, deteniendose al llegar al final sin exceder los limites de la ciudad.',
  precondicion:'NO se garantiza que exista una esquina vacia en el tramo (a diferencia de todos los demas proyectos de este catalogo).',
  postcondicion:'El robot se detuvo en la primera esquina vacia si existe, o en el limite del tramo elegido si no, sin abortar por exceder los limites de la ciudad.',
  topdown:['definir el largo maximo del tramo a explorar (para no depender de "seguro existe")','mientras la esquina no este vacia Y no se haya alcanzado el largo maximo, avanzar y contar pasos','informar si se encontro una esquina vacia (comparando pasos contra el largo maximo) y la posicion final'],
  fundamento:['conocimiento/unidad-02-algoritmos-y-logica/capitulo-2-algoritmos-y-logica.md (linea 169, aborto por exceder limites)','conocimiento/unidad-05-programacion-estructurada/capitulo-5-programacion-estructurada.md (ejercicios 9b/10b, lineas 783-793, manejo explicito del caso "puede no existir")'],
  validacion:null, varianteAvanzada:'Generalizar para detenerse tambien si se alcanza el borde real del area (100), no solo el limite logico elegido.',
  casoPrueba:'Tramo de 5 esquinas todas ocupadas (sin esquina vacia) -> el robot se detiene en la quinta sin abortar.',
  starter: tmplSimple('BuscadorSinGarantia', ['definir un largo maximo de busqueda (para no asumir que existe una esquina vacia)','mientras la esquina no este vacia y no se haya llegado al largo maximo: avanzar y sumar 1 a pasos','informar si se encontro una esquina vacia (pasos < largo maximo) y la posicion final'], '      pasos: numero') }
];

// Soluciones de referencia, completas y funcionales, para los 28 proyectos ejecutables.
// Cada una fue verificada con validate-solutions.js contra un resultado esperado concreto.

const SOLUTIONS = {

P01: { demoCity: { '3,2':{flor:1,papel:0}, '3,3':{flor:1,papel:1}, '3,4':{flor:0,papel:1}, '3,5':{flor:1,papel:1} },
code: `programa RondaDeteccionDoble
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(3,1)
      repetir 6
        si HayFlorEnLaEsquina & HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
        mover
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P02: { demoCity: { '7,1':{flor:1,papel:0}, '7,2':{flor:0,papel:1}, '7,3':{flor:1,papel:0}, '7,4':{flor:0,papel:1} },
code: `programa EsquinaVaciaPorNegacion
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(7,1)
      mientras ~(~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina)
        mover
      Informar(PosAv, PosCa)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P03: { demoCity: {},
code: `programa RectanguloCerrado
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      repetir 3
        mover
      derecha
      repetir 2
        mover
      derecha
      repetir 3
        mover
      derecha
      repetir 2
        mover
      derecha
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P04: { demoCity: { '9,1':{flor:1,papel:0}, '9,2':{flor:0,papel:1}, '9,3':{flor:1,papel:1}, '9,4':{flor:0,papel:0} },
code: `programa SeleccionEnCascada
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(9,1)
      si HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
        Informar(1)
      sino
        Informar(0)
      mover
      si HayPapelEnLaEsquina & ~HayFlorEnLaEsquina
        Informar(1)
      sino
        Informar(0)
      mover
      si HayFlorEnLaEsquina & HayPapelEnLaEsquina
        Informar(1)
      sino
        Informar(0)
      mover
      si ~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
        Informar(1)
      sino
        Informar(0)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P05: { demoCity: { '2,1':{flor:1,papel:0}, '2,3':{flor:1,papel:0}, '2,5':{flor:1,papel:0} },
code: `programa ContadorDeFloresSinRecolectar
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      contador: numero
    comenzar
      Pos(2,1)
      contador := 0
      repetir 5
        si HayFlorEnLaEsquina
          contador := contador + 1
        mover
      Informar(contador)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P06: { demoCity: { '1,1':{flor:1,papel:0}, '3,1':{flor:1,papel:0}, '1,2':{flor:1,papel:0}, '2,2':{flor:1,papel:0}, '4,2':{flor:1,papel:0} },
code: `programa ComparadorDeCalles
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      contadorA: numero
      contadorB: numero
    comenzar
      contadorA := 0
      contadorB := 0
      Pos(1,1)
      derecha
      repetir 4
        si HayFlorEnLaEsquina
          contadorA := contadorA + 1
        mover
      Pos(1,2)
      repetir 4
        si HayFlorEnLaEsquina
          contadorB := contadorB + 1
        mover
      si contadorA > contadorB
        Informar(1)
      sino
        si contadorA < contadorB
          Informar(2)
        sino
          Informar(0)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P07: { demoCity: { '4,1':{flor:1,papel:0}, '4,2':{flor:0,papel:1}, '4,3':{flor:1,papel:1}, '4,4':{flor:0,papel:0} },
code: `programa ClasificadorDeEsquinasPorCarga
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      soloFlor: numero
      soloPapel: numero
      ambos: numero
      ninguno: numero
    comenzar
      soloFlor := 0
      soloPapel := 0
      ambos := 0
      ninguno := 0
      Pos(4,1)
      repetir 4
        si HayFlorEnLaEsquina & HayPapelEnLaEsquina
          ambos := ambos + 1
        sino
          si HayFlorEnLaEsquina
            soloFlor := soloFlor + 1
          sino
            si HayPapelEnLaEsquina
              soloPapel := soloPapel + 1
            sino
              ninguno := ninguno + 1
        mover
      Informar(soloFlor, soloPapel, ambos, ninguno)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P08: { demoCity: { '5,1':{flor:1,papel:0}, '5,2':{flor:1,papel:0}, '5,3':{flor:1,papel:0}, '5,4':{flor:0,papel:1} },
code: `programa SaldoDeBolsaComparado
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      contadorFlores: numero
      contadorPapeles: numero
    comenzar
      contadorFlores := 0
      contadorPapeles := 0
      Pos(5,1)
      repetir 4
        si HayFlorEnLaEsquina
          tomarFlor
          contadorFlores := contadorFlores + 1
        si HayPapelEnLaEsquina
          tomarPapel
          contadorPapeles := contadorPapeles + 1
        mover
      si contadorFlores > contadorPapeles
        Informar(1)
      sino
        si contadorFlores < contadorPapeles
          Informar(2)
        sino
          Informar(0)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P09: { demoCity: { '10,11':{flor:1,papel:0}, '11,11':{flor:1,papel:0}, '11,10':{flor:0,papel:1} },
code: `programa MapaDelTesoroEnEspiral
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(10,10)
      si HayFlorEnLaEsquina
        tomarFlor
      si HayPapelEnLaEsquina
        Informar(PosAv, PosCa)
      repetir 1
        mover
        si HayFlorEnLaEsquina
          tomarFlor
        si HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
      derecha
      repetir 1
        mover
        si HayFlorEnLaEsquina
          tomarFlor
        si HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
      derecha
      repetir 2
        mover
        si HayFlorEnLaEsquina
          tomarFlor
        si HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
      derecha
      repetir 2
        mover
        si HayFlorEnLaEsquina
          tomarFlor
        si HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
      derecha
      repetir 3
        mover
        si HayFlorEnLaEsquina
          tomarFlor
        si HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
      derecha
      repetir 3
        mover
        si HayFlorEnLaEsquina
          tomarFlor
        si HayPapelEnLaEsquina
          Informar(PosAv, PosCa)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P10: { demoCity: { '6,1':{flor:1,papel:0}, '6,2':{flor:0,papel:1}, '6,3':{flor:1,papel:0}, '6,4':{flor:0,papel:1} },
code: `programa ParadaPorCondicionMolecularTriple
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      contador: numero
    comenzar
      Pos(6,1)
      contador := 0
      mientras (HayFlorEnLaEsquina | HayPapelEnLaEsquina) & ~HayFlorEnLaBolsa
        mover
        contador := contador + 1
      Informar(contador)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P11: { demoCity: { '7,1':{flor:1,papel:0}, '7,2':{flor:1,papel:0}, '7,3':{flor:1,papel:0}, '7,4':{flor:1,papel:0} },
code: `programa VerificacionContraExpectativaFija
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      contador: numero
      esperado: numero
    comenzar
      contador := 0
      esperado := 4
      Pos(7,1)
      repetir 4
        si HayFlorEnLaEsquina
          tomarFlor
          contador := contador + 1
        mover
      si contador = esperado
        Informar(V)
      sino
        Informar(F)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P12: { demoCity: {},
code: `programa ExploracionAcotadaPorLimiteLogico
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      limite: numero
    comenzar
      limite := 5
      derecha
      mientras PosAv < limite
        mover
      Informar(PosAv, PosCa)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P13: { demoCity: { '8,1':{flor:2,papel:0}, '8,2':{flor:0,papel:2}, '8,3':{flor:1,papel:1}, '8,4':{flor:3,papel:0} },
code: `programa ModuloDeEsquinaReutilizable
procesos
  proceso LimpiarEsquina
    comenzar
      mientras HayFlorEnLaEsquina
        tomarFlor
      mientras HayPapelEnLaEsquina
        tomarPapel
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(8,1)
      LimpiarEsquina
      mover
      LimpiarEsquina
      mover
      LimpiarEsquina
      mover
      LimpiarEsquina
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P14: { demoCity: {},
code: `programa EscuadraModular
procesos
  proceso Lado
    comenzar
      repetir 3
        mover
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Lado
      derecha
      Lado
      derecha
      Lado
      derecha
      Lado
      derecha
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P15: { demoCity: { '2,5':{flor:2,papel:1}, '2,6':{flor:0,papel:1}, '2,7':{flor:1,papel:1} },
code: `programa DosModulosColaborando
procesos
  proceso JuntarFlores
    comenzar
      mientras HayFlorEnLaEsquina
        tomarFlor
    fin
  proceso JuntarPapeles
    comenzar
      mientras HayPapelEnLaEsquina
        tomarPapel
    fin
  proceso RecorrerYLimpiar
    comenzar
      JuntarFlores
      JuntarPapeles
      mover
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(2,5)
      repetir 3
        RecorrerYLimpiar
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P16: { demoCity: {},
code: `programa RefactorRecorridoDeAvenidas
procesos
  proceso RecorrerAvenida
    comenzar
      repetir 3
        mover
      derecha
      derecha
      repetir 3
        mover
      derecha
      derecha
    fin
  proceso CruzarACalleSiguiente
    comenzar
      derecha
      mover
      derecha
      derecha
      derecha
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      RecorrerAvenida
      CruzarACalleSiguiente
      RecorrerAvenida
      CruzarACalleSiguiente
      RecorrerAvenida
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P17: { demoCity: { '3,1':{flor:1,papel:0}, '3,2':{flor:1,papel:0}, '3,4':{flor:1,papel:0}, '3,5':{flor:1,papel:0}, '3,6':{flor:1,papel:0} },
code: `programa UmbralConfigurable
procesos
  proceso ContarHastaUmbral(E umbral:numero)
    variables
      contador: numero
      pasos: numero
    comenzar
      contador := 0
      pasos := 0
      mientras (contador < umbral) & (pasos < 20)
        si HayFlorEnLaEsquina
          tomarFlor
          contador := contador + 1
        mover
        pasos := pasos + 1
      Informar(contador)
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(3,1)
      ContarHastaUmbral(3)
      ContarHastaUmbral(2)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P18: { demoCity: { '4,1':{flor:0,papel:1}, '4,3':{flor:0,papel:1} },
code: `programa VerificadorDeRango
procesos
  proceso ContarPapelesEnRango(E longitud:numero)
    variables
      contadorPapeles: numero
      avanzadas: numero
    comenzar
      contadorPapeles := 0
      avanzadas := 0
      mientras avanzadas < longitud
        si HayPapelEnLaEsquina
          tomarPapel
          contadorPapeles := contadorPapeles + 1
        mover
        avanzadas := avanzadas + 1
      Informar(contadorPapeles)
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      Pos(4,1)
      ContarPapelesEnRango(4)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P19: { demoCity: {},
code: `programa SelectorDeDireccion
procesos
  proceso AvanzarSegunParametro(E girar:boolean)
    comenzar
      si girar
        derecha
      mover
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      AvanzarSegunParametro(V)
      Informar(PosAv, PosCa)
      AvanzarSegunParametro(F)
      Informar(PosAv, PosCa)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P20: { demoCity: { '1,1':{flor:1,papel:0}, '1,3':{flor:1,papel:0}, '1,5':{flor:1,papel:0}, '2,1':{flor:1,papel:0}, '2,2':{flor:1,papel:0}, '2,3':{flor:1,papel:0}, '2,4':{flor:1,papel:0}, '2,5':{flor:1,papel:0} },
code: `programa DobleLlamadaComparativa
procesos
  proceso ContarFloresEnAvenida(E avenida:numero)
    variables
      contador: numero
    comenzar
      contador := 0
      Pos(avenida, 1)
      repetir 6
        si HayFlorEnLaEsquina
          contador := contador + 1
        mover
      Informar(contador)
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    comenzar
      ContarFloresEnAvenida(1)
      ContarFloresEnAvenida(2)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P21: { demoCity: { '5,1':{flor:1,papel:0}, '5,2':{flor:1,papel:0}, '6,1':{flor:1,papel:0}, '6,2':{flor:1,papel:0}, '6,3':{flor:1,papel:0}, '7,1':{flor:1,papel:0} },
code: `programa AcumuladorCruzado
procesos
  proceso AcumularFloresDelTramo(ES total:numero)
    comenzar
      repetir 3
        si HayFlorEnLaEsquina
          tomarFlor
          total := total + 1
        mover
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      total: numero
    comenzar
      total := 0
      Pos(5,1)
      AcumularFloresDelTramo(total)
      Pos(6,1)
      AcumularFloresDelTramo(total)
      Pos(7,1)
      AcumularFloresDelTramo(total)
      Informar(total)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P22: { demoCity: { '8,1':{flor:0,papel:1}, '8,2':{flor:0,papel:1}, '8,3':{flor:0,papel:1} }, demoBagFlor: 2,
code: `programa IntercambioDeObjetos
procesos
  proceso TransformarPapelesEnFlores(ES floresUsadas:numero; ES papelesTomados:numero)
    comenzar
      repetir 4
        si HayPapelEnLaEsquina
          tomarPapel
          papelesTomados := papelesTomados + 1
          si HayFlorEnLaBolsa
            depositarFlor
            floresUsadas := floresUsadas + 1
        mover
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      floresUsadas: numero
      papelesTomados: numero
    comenzar
      floresUsadas := 0
      papelesTomados := 0
      Pos(8,1)
      TransformarPapelesEnFlores(floresUsadas, papelesTomados)
      Informar(floresUsadas, papelesTomados)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P23: { demoCity: { '1,1':{flor:1,papel:0}, '1,2':{flor:1,papel:0}, '1,3':{flor:1,papel:0}, '1,4':{flor:1,papel:0}, '2,4':{flor:0,papel:1}, '3,4':{flor:1,papel:0}, '3,2':{flor:0,papel:1}, '2,1':{flor:1,papel:0} },
code: `programa RectanguloClasificador
procesos
  proceso Rectangulo(E base:numero; E altura:numero; ES esquinaVacia:boolean)
    comenzar
      esquinaVacia := F
      si ~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
        esquinaVacia := V
      repetir base
        mover
        si ~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
          esquinaVacia := V
      derecha
      repetir altura
        mover
        si ~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
          esquinaVacia := V
      derecha
      repetir base
        mover
        si ~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
          esquinaVacia := V
      derecha
      repetir altura
        mover
        si ~HayFlorEnLaEsquina & ~HayPapelEnLaEsquina
          esquinaVacia := V
      derecha
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      vacia: boolean
    comenzar
      Pos(1,1)
      Rectangulo(3, 2, vacia)
      Informar(vacia)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P24: { demoCity: { '9,1':{flor:1,papel:0}, '9,2':{flor:1,papel:0}, '9,4':{flor:1,papel:0} },
code: `programa DisenoPorContratoEnPareja
procesos
  proceso ProcesoAContrato(ES resultado:numero)
    comenzar
      repetir 4
        si HayFlorEnLaEsquina
          tomarFlor
          resultado := resultado + 1
        mover
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      resultado: numero
    comenzar
      resultado := 0
      Pos(9,1)
      ProcesoAContrato(resultado)
      Informar(resultado)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P25: { demoCity: { '1,1':{flor:1,papel:0}, '1,2':{flor:0,papel:1}, '1,3':{flor:1,papel:0}, '2,2':{flor:1,papel:0}, '2,4':{flor:0,papel:1}, '3,1':{flor:0,papel:1}, '3,3':{flor:1,papel:0}, '3,4':{flor:1,papel:0} },
code: `programa BarrenderoDeCiudad
procesos
  proceso RecorrerAvenida(ES flores:numero; ES papeles:numero)
    comenzar
      repetir 3
        si HayFlorEnLaEsquina
          tomarFlor
          flores := flores + 1
        si HayPapelEnLaEsquina
          tomarPapel
          papeles := papeles + 1
        mover
      derecha
      derecha
      repetir 3
        si HayFlorEnLaEsquina
          tomarFlor
          flores := flores + 1
        si HayPapelEnLaEsquina
          tomarPapel
          papeles := papeles + 1
        mover
      derecha
      derecha
    fin
  proceso CruzarACalleSiguiente
    comenzar
      derecha
      mover
      derecha
      derecha
      derecha
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      totalFlores: numero
      totalPapeles: numero
    comenzar
      totalFlores := 0
      totalPapeles := 0
      Pos(1,1)
      RecorrerAvenida(totalFlores, totalPapeles)
      CruzarACalleSiguiente
      RecorrerAvenida(totalFlores, totalPapeles)
      CruzarACalleSiguiente
      RecorrerAvenida(totalFlores, totalPapeles)
      Informar(totalFlores, totalPapeles)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P26: { demoCity: { '6,1':{flor:1,papel:0}, '6,4':{flor:1,papel:0}, '6,3':{flor:1,papel:0} },
code: `programa AuditorDeSimetria
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      limite: numero
      coincidencias: numero
      avActual: numero
      caActual: numero
      espejoCa: numero
      tieneFlorAqui: boolean
    comenzar
      limite := 4
      coincidencias := 0
      Pos(6,1)
      repetir 2
        avActual := PosAv
        caActual := PosCa
        tieneFlorAqui := HayFlorEnLaEsquina
        espejoCa := limite + 1 - caActual
        Pos(avActual, espejoCa)
        si tieneFlorAqui & HayFlorEnLaEsquina
          coincidencias := coincidencias + 1
        Pos(avActual, caActual)
        mover
      Informar(coincidencias)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P27: { demoCity: { '10,10':{flor:1,papel:0}, '10,11':{flor:1,papel:0}, '11,11':{flor:1,papel:0}, '11,10':{flor:0,papel:1}, '12,10':{flor:0,papel:1}, '12,11':{flor:0,papel:1}, '13,11':{flor:0,papel:1}, '13,10':{flor:1,papel:0} },
code: `programa ClasificadorDeManzanas
procesos
  proceso EvaluarEsquina(ES flores:numero; ES papeles:numero)
    comenzar
      si HayFlorEnLaEsquina
        flores := flores + 1
      si HayPapelEnLaEsquina
        papeles := papeles + 1
    fin
  proceso EvaluarManzana(ES manzanasConMasFlores:numero)
    variables
      flores: numero
      papeles: numero
    comenzar
      flores := 0
      papeles := 0
      EvaluarEsquina(flores, papeles)
      mover
      EvaluarEsquina(flores, papeles)
      derecha
      mover
      EvaluarEsquina(flores, papeles)
      derecha
      mover
      EvaluarEsquina(flores, papeles)
      derecha
      mover
      derecha
      si flores > papeles
        manzanasConMasFlores := manzanasConMasFlores + 1
    fin
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      totalManzanas: numero
    comenzar
      totalManzanas := 0
      Pos(10,10)
      EvaluarManzana(totalManzanas)
      Pos(12,10)
      EvaluarManzana(totalManzanas)
      Informar(totalManzanas)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` },

P28: { demoCity: { '11,1':{flor:1,papel:0}, '11,2':{flor:0,papel:1}, '11,3':{flor:1,papel:0} },
code: `programa BuscadorSinGarantia
areas
  ciudad: AreaC(1,1,100,100)
robots
  robot robot1
    variables
      pasos: numero
      largoMaximo: numero
      encontrada: boolean
    comenzar
      pasos := 0
      largoMaximo := 5
      Pos(11,1)
      mientras (HayFlorEnLaEsquina | HayPapelEnLaEsquina) & pasos < largoMaximo
        mover
        pasos := pasos + 1
      si pasos < largoMaximo
        encontrada := V
      sino
        encontrada := F
      Informar(encontrada, PosAv, PosCa)
    fin
variables
  R-info: robot1
comenzar
  AsignarArea(R-info,ciudad)
  Iniciar(R-info,1,1)
fin` }

};

 return { VOCAB, PROJECTS, SOLUTIONS }; })();
