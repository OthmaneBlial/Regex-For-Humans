<div align="center">

# 🧠 Regex For Humans

[![Regex For Humans: reglas claras, regex real](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Escríbelo. Entiéndelo. Pruébalo.**

Convierte reglas claras en inglés en una expresión regular JavaScript cuyas partes puedes seguir.

[🚀 Taller](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [🎨 Sitio](https://othmaneblial.github.io/Regex-For-Humans/) · [📖 Sintaxis](../LANGUAGE.md) · [📦 Versión preliminar de npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.7)

🔒 Ejecución local · 🧩 Sin dependencias en tiempo de ejecución · ⚡ Un compilador, tres interfaces

[English](../../README.md) · [简体中文](README.zh-CN.md) · **Español** · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## 🪄 Menos signos por descifrar

Un regex se entiende mejor cuando ves las reglas que lo generaron.

```text
start "#"
6 hex digits
end
```

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF`, `#000000` · ❌ `#123`, `#G00000`

El vocabulario es **fijo**: cada instrucción tiene un significado exacto. Biblioteca, CLI y taller comparten el compilador determinista. Las frases desconocidas producen un diagnóstico con línea, columna y sugerencia. La sintaxis de las reglas se mantiene en inglés en todas las traducciones.

> 🌱 La versión preliminar `0.1.0-dev.7` requiere **Node.js 22+** para la biblioteca y el CLI. El taller funciona sin instalación. Las revisiones humanas de usabilidad y lectores de pantalla siguen pendientes.

## 🧰 Qué puedes construir hoy

| Capacidad | npm `0.1.0-dev.7` / taller alojado |
| --- | --- |
| Reglas → regex JavaScript | ✅ |
| Regex compatible → reglas editables | ✅ |
| Explicaciones y navegación al origen | ✅ |
| CLI, API ESM y tipos TypeScript | ✅ |
| Capturas con nombre/número y bloques anidados | ✅ |
| Repetición de bloques y referencias a capturas anteriores | ✅ |
| Alternativas ordenadas con `either { … }` | ✅ |
| Repetición no codiciosa con `lazy` | ✅ |
| Aserciones de anticipación y retrospección | ✅ |
| Límites de palabra | ✅ |
| [Propiedades Unicode](../LANGUAGE.md#unicode-properties) | ✅ |
| [Clases de caracteres combinadas](../LANGUAGE.md#composable-character-classes) | ✅ |
| [Cadenas Unicode y conjuntos anidados](../LANGUAGE.md#nested-unicode-set-operations) | ✅ |
| Los ocho flags JavaScript | ✅ |
| [Edición de grupos y resaltado de capturas](../LANGUAGE.md#editing-groups) | ✅ |
| [Estructura interactiva y exportación SVG](../LANGUAGE.md#structural-diagrams) | ✅ |
| [Revisión de riesgos estructurales](../LANGUAGE.md#structural-risk-review) | ✅ |
| [Exportación de código adaptada al motor](../LANGUAGE.md#engine-exports) | ✅ |
| Inglés libre | — |

El taller ofrece **Edit groups and references** para renombrar capturas, cambiar su tipo y localizar sus referencias. Las referencias numéricas conservan su destino al cambiar la numeración; eliminar una captura referenciada se rechaza sin modificar las reglas. **Highlight** resalta el intervalo nativo de una captura, incluso si está vacía o fuera del texto consumido. La API `editGroup` devuelve reglas validadas. Consulta la [edición de grupos](../LANGUAGE.md#editing-groups).

En el código fuente, `lazy digits` genera `\d+?`: prueba primero un dígito y amplía la repetición si las reglas siguientes lo requieren. Disponible en npm `0.1.0-dev.7`. Consulta las [reglas de repetición](../LANGUAGE.md#repetition).

El código fuente también admite `followed by { … }`, `not followed by { … }`, `preceded by { … }`, `not preceded by { … }`. Comprueban el texto alrededor de la posición actual sin consumirlo. Las capturas conservan sus valores y posiciones nativos, incluso fuera del texto consumido; la retrospección requiere un motor compatible. Disponible en npm `0.1.0-dev.7`. Consulta las [aserciones](../LANGUAGE.md#lookaround-assertions).

El código fuente acepta `word boundary` (`\b`) y `not word boundary` (`\B`). No consumen caracteres. JavaScript considera caracteres de palabra las letras ASCII, los dígitos y el guion bajo, además de sus equivalentes al ignorar mayúsculas con `i`. Esto no segmenta palabras del lenguaje natural. Disponible en npm `0.1.0-dev.7`; consulta los [límites de palabra](../LANGUAGE.md#word-boundaries).

El código fuente también acepta `unicode property "L"` y `not unicode property "L"` como `\p{L}` y `\P{L}` nativos. `L` significa Letter; los alias distinguen mayúsculas y la clasificación usa los datos Unicode del motor. Los recuentos y `lazy` funcionan normalmente. Con `i`, el complemento nativo en modo `u` puede incluir letras equivalentes al ignorar mayúsculas. Disponible en npm `0.1.0-dev.7`; consulta las [propiedades Unicode](../LANGUAGE.md#unicode-properties).

El código fuente admite `range "α" to "ω"` y `character class: digit, "_"`. Una clase combina literales de un punto Unicode, rangos, abreviaturas singulares y propiedades Unicode; `not character class:` niega toda la unión. Los recuentos y `lazy` se aplican a la clase. Los complementos conservan el comportamiento nativo `u`/`i`. Disponible en npm `0.1.0-dev.7`; consulta [clases de caracteres](../LANGUAGE.md#composable-character-classes).

npm `0.1.0-dev.7` incluye grupos, capturas, referencias anteriores y alternativas ordenadas en la biblioteca y el CLI. El taller añade inspección de capturas y múltiples coincidencias de búsqueda. Consulta [compatibilidad](../COMPATIBILITY.md) y [publicación](../DISTRIBUTION.md).

## 🌍 Exportar a tu lenguaje

Abre **Export to a programming language** en el taller local, llama a `exportRegex(rules, { target: "python" })` o ejecuta `node bin/regex-for-humans.js --target python --json rules.txt`. Los nueve formatos son JavaScript, TypeScript, Python, Rust, Go, Java, C#, PHP y Ruby. JavaScript/TypeScript conservan el patrón nativo; los demás destinos traducen los comportamientos compatibles desde el AST antes de generar el código fuente con el escapado correcto.

Las comparaciones del código generado pasan en siete motores nativos; **PHP está verificado con PHP 8.5.11 / PCRE2 10.44**. Las versiones probadas y los límites del corpus figuran en la [guía de compatibilidad](../COMPATIBILITY.md#engine-exports). Conserva los requisitos y el mapa de capturas: los destinos externos usan nombres `gN`, y una captura inactiva puede estar ausente. La entrada debe ser Unicode bien formado. Las opciones `d/g/i/y`, propiedades Unicode y comportamientos incompatibles de aserción, captura o repetición producen diagnósticos con ubicación. Descarga el código o el resultado JSON completo; los ejemplos del navegador siguen ejecutándose en JavaScript. Consulta los [perfiles y límites](../LANGUAGE.md#engine-exports).

## 📦 Instalar la versión preliminar

```sh
npm install regex-for-humans@preview
```

Ejecuta el CLI sin instalación global:

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans
```

Imprime `/^ABC\d{3}$/u`. Para fijar la versión, usa `regex-for-humans@0.1.0-dev.7`. No hay dependencias de ejecución ni ejecutables independientes por sistema operativo.

## 🎮 Experimentar con un patrón

Elige **Interface language** para usar inglés, chino simplificado, español o francés. Las etiquetas, ejemplos, resultados y controles de navegación cambian sin modificar reglas, entradas, selecciones, paneles abiertos ni código generado. La elección se guarda localmente si el almacenamiento está disponible. Las reglas siguen en inglés controlado; las explicaciones del compilador, etiquetas del diagrama y requisitos técnicos exportados siguen en inglés. Consulta [la localización del taller](../ARCHITECTURE.md#workshop-localization).

Usa **Theme** para seguir la apariencia del sistema o elegir un taller claro u oscuro. La preferencia se guarda localmente si el almacenamiento está disponible; cambiar la apariencia conserva las reglas, ejemplos, selecciones y paneles abiertos. Consulta [la preferencia de tema](../ARCHITECTURE.md#theme-preference).

el editor nativo colorea palabras clave, cadenas, capturas, cuantificadores, aserciones, alternativas y comentarios. Subraya el token señalado por el compilador y mantiene la escritura, selección, copia y desplazamiento nativos. Los colores forzados y las entradas que superan los límites usan texto nativo simple. Las líneas de comentario con `#` conservan sus posiciones y cuentan en los límites habituales. Consulta los [comentarios](../LANGUAGE.md#comments) y el [resaltado del editor](../ARCHITECTURE.md#editor-highlighting).

el panel de construcción inserta plantillas editables de captura, sección opcional, alternativa, repetición, clase de caracteres y aserción antes de la línea o selección actual, entre los anclajes exteriores. Añadir una captura conserva los destinos de las referencias numéricas existentes. Las inserciones inválidas o demasiado grandes conservan las reglas y la selección; los flags y ejemplos permanecen. Consulta la [construcción de reglas](../ARCHITECTURE.md#rule-construction).

las expectativas exactas comprueban todos los rangos UTF-16, los valores de captura en orden (`null` para ausencia, `""` para una captura vacía) y los resultados de reemplazo JavaScript con los indicadores originales. Los fixtures permiten importar/exportar JSON versionado y guardar/restaurar ejemplos localmente de forma manual. Los borradores o archivos inválidos conservan el trabajo actual; los CR/CRLF importados permanecen exactos hasta editar el campo del ejemplo. Consulta el [formato, los ejemplos y los límites de los fixtures](../TEST_FIXTURES.md).

1. Elige una receta o escribe una instrucción por línea.
2. Examina cada fragmento generado y su explicación.
3. Añade ejemplos e indica cuáles deberían coincidir.
4. Copia el regex cuando el comportamiento sea el esperado.

Una coincidencia parcial muestra contexto escapado y resaltado; una coincidencia vacía muestra una marca. Reglas y ejemplos permanecen en el navegador, sin cuenta, interpretación por IA ni servidor de aplicación.

En el taller actual, abre una coincidencia para ver las capturas y sus posiciones nativas. Un grupo ausente y una captura vacía son distintos; los grupos repetidos muestran su último valor. **Search anywhere** lista hasta 100 coincidencias sin solapamiento y avanza un punto de código Unicode después de una coincidencia vacía. Las posiciones cuentan unidades UTF-16, con el final excluido. Si el motor no ofrece índices, se muestran valores sin deducir posiciones.

[![Captura real del taller de escritorio](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/media/screenshots/workshop-desktop-dev.png?v=e1a2f3784e8c)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

[Vista móvil y sumas de comprobación](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/media/screenshots/README.md).

## 🔄 ¿Ya tienes un regex?

Pega un literal JavaScript compatible en **Already have a regex?**. Pulsa Ctrl/Cmd + Enter o **Translate to rules**. `/^[A-Z]{2}-\d{4}$/u` se convierte en:

```text
start
2 uppercase letter
"-"
4 digit
end
```

Usa delimitadores `/`, el flag `u` o `v` y saltos escapados como `\n`. La conversión conserva los comportamientos compatibles de `i`, `s`, `m` y `u`. El código fuente importa capturas, grupos anidados y referencias anteriores conservando nombres, números y valores.

`[^]` se convierte en un carácter cualquiera con `s`; los puntos ordinarios próximos excluyen explícitamente los terminadores de línea. Se reconocen órdenes equivalentes de clases completas de letras, palabras y hexadecimales. Las exclusiones de rutas, escapes de control y guiones literales se conservan.

La sintaxis no compatible falla, sin eliminación ni aproximación. **Go to regex error** selecciona el origen; el fallo conserva reglas y opciones. Se rechazan referencias futuras o a capturas abiertas. Un grupo vacío no capturante se convierte en `0 any character`: encuentra vacío en búsqueda y solo acepta una entrada vacía en modo de cadena completa.

## 🍱 Recetas para empezar

| Receta | Ejemplo | Qué comprueba |
| --- | --- | --- |
| [ID con prefijo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=prefixed-identifier) | `ABC123` | Prefijo y tres dígitos |
| [Factura](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=invoice-number) | `INV-1234` | `INV-` y 2–6 dígitos |
| [Usuario](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=username-shape) | `Alice_7` | 3–16 caracteres, letra ASCII inicial |
| [Color hexadecimal](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=hex-color) | `#12aBcF` | Seis dígitos tras `#` |
| [Dirección MAC](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=mac-address-shape) | `00:1A:2B:3C:4D:5E` | Seis pares hexadecimales |
| [UUID](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=uuid-shape) | `8–4–4–4–12` | Cinco grupos hexadecimales |
| [Producto](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=product-code-shape) | `AB-rgb-0420` | Cantidades y mayúsculas/minúsculas ASCII |
| [Fecha](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=date-shape) | `2026-09-30` | Forma `YYYY-MM-DD` |
| [Hora](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=time-shape) | `09:30` | Forma `HH:MM` |
| [Teléfono](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=phone-shape) | `+33123456789` | `+` opcional y 7–15 dígitos |
| [IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-shape) | `192.0.2.42` | Cuatro grupos de 1–3 dígitos |
| [Archivo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=filename-shape) | `report.txt` | Nombre Unicode acotado sin separadores |
| [Manifiesto](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=artifact-manifest) | Ruta, hash, tamaño | 19 reglas y nueve ejemplos |
| [Registro de acceso](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=access-log) | Petición, estado, tamaño | 43 reglas y ocho ejemplos |
| [Telemetría](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=structured-event) | IDs y campos opcionales | 38 reglas y nueve ejemplos |
| [Versión](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=version-shape) | `1.2.3` | Tres partes numéricas |
| [Exclusiones](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=excluded-characters) | `xyz` | Texto sin los caracteres elegidos |
| [Línea](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=line-rule) | `item 123` | Termina en al menos tres dígitos |
| [Slug en minúsculas](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=slug) | `hello-world` | Letras y dígitos ASCII separados por un guion |
| [Extensión de archivo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=file-extension) | `README.md` | Sufijo txt, md o json que distingue mayúsculas |
| [Forma de fecha UTC](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=iso8601-shape) | `2026-10-11T09:30:00Z` | Fracción opcional; validar el calendario aparte |
| [Forma de URL HTTPS](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=https-url-shape) | `https://example.com` | Subconjunto de hosts ASCII; validación URL incompleta |
| [Campo de cabecera](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=http-header) | `Content-Type: application/json` | Campo con nombre y valor en una línea |
| [Título Markdown](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=markdown-heading) | `# Hello` | De uno a seis # y un título |
| [Sintaxis SemVer 2.0](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | `1.2.3-alpha.1+001` | Sintaxis principal, prelanzamiento y compilación; sin comparar precedencia |
| [Forma de hash Git](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=git-object-hash) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | 40 o 64 caracteres hexadecimales ASCII; verificar existencia aparte |
| [Palabras repetidas](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | `hello hello` | Referencia anterior con nombre a una palabra ASCII |
| [Duplicados adyacentes](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=duplicate-token) | `item,item` | Una pareja separada por coma, 1–16 caracteres de palabra |
| [Letras Unicode](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=unicode-word) | `العربية / اردو` | Propiedades nativas L/M, incluido árabe y urdu |
| [Campos de registro](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | `INFO code=200` | Campos level y code en un fragmento buscado |
| [Búsqueda y reemplazo](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=replace-word) | `teh then teh → the then teh` | Expectativas exactas de posiciones, capturas y reemplazo sin g |

La biblioteca reúne **31 recetas, 24 categorías y tres niveles**. Busca títulos, límites y reglas en los cuatro idiomas de la interfaz y combina los filtros. Consulta la [guía](../EXAMPLE_LIBRARY.md).

Los ejemplos fallidos incluyen [explicaciones verificables](../FAILURE_EXPLANATIONS.md): rangos nativos, longitud mínima demostrable o texto literal obligatorio ausente. Si se desconoce el paso exacto del fallo, el taller lo indica.

Elige [explicaciones de nivel principiante, intermedio o experto](../EXPLANATION_LEVELS.md). Las notas definen términos regex o detallan rangos de código, capturas, referencias e indicadores. Cambiar de nivel conserva el trabajo sin ejecutar búsquedas.

Son comprobaciones de **forma**: una fecha imposible o `25:99` puede coincidir. Valida calendario y rangos aparte. IPv4 no limita octetos a 255; UUID no verifica versión, variante ni unicidad. No se consulta disponibilidad de usuarios, registros de facturas ni validez telefónica. La receta de forma de versión no valida toda la sintaxis SemVer; el color exige `#RRGGBB`. Las reglas del sistema de archivos son independientes.

## 🏗️ Patrones más grandes, reglas igual de claras

La [guía completa](../COMPLEX-EXAMPLES.md) cubre registros de acceso, telemetría, manifiestos y pedidos multilínea: 35 casos aceptados/rechazados y todas las explicaciones.

### 📦 Manifiesto de artefactos

Directorio `nightly/` opcional, ruta Unicode acotada, versión, archivo, hash y tamaño separados por tabulaciones:

```text
start
"incoming/"
optional "nightly/"
between 1 and 32 path segment characters
"/v"
between 1 and 3 digits
"."
between 1 and 3 digits
"."
between 1 and 3 digits
"/linux-arm64/widget_"
8 digits
"_"
8 hex digits
".tar.gz\t"
64 hex digits
"\t"
between 1 and 12 digits
end
```

```js
/^incoming\/(?:nightly\/){0,1}[^\/\\\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,32}\/v\d{1,3}\.\d{1,3}\.\d{1,3}\/linux-arm64\/widget_\d{8}_[0-9A-Fa-f]{8}\.tar\.gz\u{9}[0-9A-Fa-f]{64}\u{9}\d{1,12}$/u
```

Comprueba formas, no existencia del archivo ni integridad de su contenido.

### 🧾 Pedido multilínea

ID, comprador Unicode, teléfono, cantidad, importe, referencia, aprobación opcional y línea de prioridad opcional:

```text
start
"ORDER\nid=ORD-"
8 hex digits
"\nbuyer="
between 1 and 60 none of: "\u0000", "\n", "\r", "\u2028", "\u2029"
"\nphone="
optional "+"
between 7 and 15 digits
"\nitems="
between 1 and 4 digits
"\ntotal="
between 1 and 6 digits
"."
2 digits
" EUR\nreference="
16 hex digits
"\napproval="
optional one of: "A", "D"
"\n"
optional "priority=HIGH\n"
"END"
optional "\n"
end
```

```js
/^ORDER\u{a}id=ORD-[0-9A-Fa-f]{8}\u{a}buyer=[^\u{0}\u{a}\u{d}\u{2028}\u{2029}]{1,60}\u{a}phone=\+{0,1}\d{7,15}\u{a}items=\d{1,4}\u{a}total=\d{1,6}\.\d{2} EUR\u{a}reference=[0-9A-Fa-f]{16}\u{a}approval=[AD]{0,1}\u{a}(?:priority=HIGH\u{a}){0,1}END\u{a}{0,1}$/u
```

Los saltos de línea son literales. La aplicación debe validar importes, números y pedidos. Los cuatro ejemplos planos no extraen campos.

## 🧲 Extraer campos con capturas con nombre

Este ejemplo funciona con npm `0.1.0-dev.7` y en el taller publicado.

```text
start
capture "year" {
  4 digits
}
"-"
capture "month" {
  2 digits
}
"-"
capture "day" {
  2 digits
}
end
```

```js
import { compile, toRegExp } from './index.js';

const rules = `start
capture "year" {
  4 digits
}
"-"
capture "month" {
  2 digits
}
"-"
capture "day" {
  2 digits
}
end`;

const match = toRegExp(compile(rules)).exec('2026-10-10');
console.log(match?.groups); // { year: '2026', month: '10', day: '10' }
```

`capture {` crea una captura numerada; `group {` agrupa sin capturar. Los nombres son identificadores JavaScript únicos. La numeración sigue el orden de apertura, también en grupos anidados. Una captura opcional ausente vale `undefined`; una captura vacía participante vale `""`; una repetida conserva su último valor.

Después del cierre, `same as capture "word"` o `same as capture 1` exige el mismo texto. El [ejemplo](../LANGUAGE.md#capture-references) acepta `cat cat` y rechaza `cat dog`. Las referencias futuras o dentro de su propio destino producen un diagnóstico. La traducción inversa conserva las capturas compatibles; una fecha extraída aún necesita validación de calendario.

## 🧩 Guía rápida

Una instrucción por línea. Pon el texto literal entre comillas.

| Regla | Resultado | Significado |
| --- | --- | --- |
| `start` / `end` | `^` / `$` | Límites de entrada |
| `line start` / `line end` | `^` / `$` y `m` | Límites de línea |
| `digit` / `not digit` | `\d` / `\D` | Dígito ASCII o complemento |
| `3 digits` / `digits` | `\d{3}` / `\d+` | Tres o uno o más |
| `between 2 and 4 digits` | `\d{2,4}` | Límites inclusivos |
| `optional "-"` | `-{0,1}` | Guion opcional |
| `letter` / `letters` | `[A-Za-z]` / `[A-Za-z]+` | Letras ASCII |
| `lowercase letters` / `uppercase letters` | `[a-z]+` / `[A-Z]+` | `i` ignora la diferencia |
| `6 hex digits` | `[0-9A-Fa-f]{6}` | Seis dígitos hexadecimales |
| `space` / `spaces` | `\s` / `\s+` | Espacio en blanco, incluidos saltos |
| `between 1 and 32 path segment characters` | 1–32 puntos de código | Sin separadores, NUL ni saltos |
| `"hello"` | `hello` | Texto literal escapado |
| `one of: a, b` | `[ab]` | Un carácter de la lista |
| `text without: a, b` | `[^ab]*` | Cero o más caracteres fuera de la lista |
| `any text` | `.*` | Con `s`, incluye saltos |

`word character` / `word characters` y `word` / `not word` siguen `\w` / `\W`. `\w` incluye `_`, excluye `é`; `letter` excluye dígitos y guion bajo. Con `i`, JavaScript añade equivalencias como `K` y `ſ`. `u` es el valor predeterminado; el código fuente también acepta `v`. Ninguno convierte las clases ASCII en categorías Unicode universales.

## 💻 Llevarlo al terminal

```sh
npm install --global regex-for-humans@preview
printf 'start "ABC"\n3 digits\nend\n' | regex-for-humans
```

O desde un clon:

```sh
git clone https://github.com/OthmaneBlial/Regex-For-Humans.git
cd Regex-For-Humans
printf 'start "ABC"\n3 digits\nend\n' | node bin/regex-for-humans.js
```

```text
/^ABC\d{3}$/u
```

✅ `ABC123` · ❌ `ABC12`, `ABC1234`, `abc123`

| Opción | Función |
| --- | --- |
| `--explain` | Fragmentos y explicaciones |
| `--json` | Resultados en stdout; errores en stderr |
| `--ignore-case` | Flag `i` |
| `--dot-all` | Flag `s` |
| `--flags` | Elegir flags nativos de JavaScript; u/v son excluyentes |
| `--help` | Ayuda |
| `--target` | exportar al lenguaje indicado; consulta los [perfiles](../LANGUAGE.md#engine-exports) |
| `--version` | Versión |

Lee UTF-8 desde archivo o stdin. Usa `--` antes de nombres que empiecen por `-`. Códigos de salida: `0` éxito/ayuda/versión, `1` reglas inválidas o errores de E/S, `2` argumentos inválidos.

El UTF-8 mal formado se rechaza sin sustitución silenciosa. Los códigos JSON son los del diagnóstico, `CLI_USAGE` para argumentos y `CLI_ERROR` para archivos/ejecución. Los controles se muestran escapados; al decodificar JSON se recuperan los datos originales. Si falla stderr, la salida sigue siendo no cero.

### 🔄 Traducción inversa en el CLI

```sh
printf '%s\n' '/^[A-Z]{2}-[0-9]{4}$/u' | npx --yes --package=regex-for-humans@preview regex-for-humans --reverse
```

```text
start
2 uppercase letter
"-"
4 digit
end
```

`--reverse --json` devuelve `{ rules, flags }`, igual que `regexToRules()`. Pasa `flags` a `compile(rules, { flags })` para conservar las opciones nativas y el comportamiento del cursor. Se admiten los ocho flags; las regex con g/y conservan su estado.

## 📦 Biblioteca JavaScript

Usa ESM (`.mjs` o `"type": "module"`). TypeScript está incluido. Desde el código fuente, importa `./index.js`.

```js
import { compile, regexToRules, toRegExp } from 'regex-for-humans';

const result = compile('start 3 digits\nend');
console.log(result.source);                // ^\d{3}$
console.log(toRegExp(result).test('123'));  // true
console.log(result.segments);              // Each fragment + explanation

const reverse = regexToRules(/^[A-Z]{2}-\d{4}$/u);
console.log(reverse.rules);                 // start\n2 uppercase letter\n"-"\n4 digit\nend
console.log(reverse.flags);                 // Flags to pass back to compile()
```

`toRegExp({ source, flags })` acepta metadatos en caché, ambos como cadenas, sin leer segmentos. `compile("digit", { flags: undefined })` utiliza `u`, incluso con `exactOptionalPropertyTypes`.

`regexToRules()` acepta regex auténticos de otros contextos, conserva `lastIndex` y lee los metadatos nativos sin llamar a métodos de coincidencia ni sobreescrituras de la instancia. Escapes como `\u{00000041}` respetan el límite de fuente.

## 🎛️ Flags con efectos concretos

| Flag | Cómo activarlo | Efecto |
| --- | --- | --- |
| `u` | Por defecto | Puntos de código Unicode |
| `i` | `{ flags: 'i' }` o `--ignore-case` | Comparación nativa sin distinguir mayúsculas |
| `s` | `{ flags: 's' }` o `--dot-all` | El punto incluye saltos |
| `m` | `line start` / `line end` | Anclas por línea |
| `d` | `{ flags: 'd' }` | Índices nativos de coincidencias y capturas |
| `g` | `{ flags: 'g' }` | Las llamadas sucesivas avanzan `lastIndex` |
| `y` | `{ flags: 'y' }` | Coincide en `lastIndex`; se detiene al primer hueco |
| `v` | `{ flags: 'v' }` | Clases Unicode y complementos nativos en modo v |

**En la vista previa:** se aceptan los ocho flags `d`, `g`, `i`, `m`, `s`, `u`, `v`, `y`, con `{ flags: 'dgiv' }` o `--flags dgiv`. La salida usa el orden `dgimsuvy`; rechaza duplicados y combinar u/v, y u es el valor predeterminado. m puede ser explícito o activarse con anclas de línea; las anclas de entrada siguen siendo absolutas al mezclar ambos modos. La traducción inversa conserva las opciones sin modificar `lastIndex`. El workshop inicia cada ejemplo en 0 y enumera hasta 100 coincidencias; los regex g/y copiados siguen teniendo estado. Las capacidades nativas ausentes reciben diagnósticos explícitos. Disponible en npm `0.1.0-dev.7`.

**En la vista previa:** selecciona `v` para `one of strings: "a", "ab", ""` o `unicode property "RGI_Emoji"`. Los conjuntos nativos prueban primero los miembros más largos, sin depender del orden de la lista; las reglas posteriores pueden exigir uno más corto. Se permiten cadenas vacías. Usa `string "ab"` dentro de una clase. Las propiedades de cadenas y los miembros vacíos o de varios puntos de código no se pueden complementar. Disponible en npm `0.1.0-dev.7`.

**En la vista previa:** los conjuntos anidados usan `character set union {`, `character set intersection {` y `character set subtraction {`, cerrados con `}`. Cada línea contiene un carácter, rango, clase, propiedad, conjunto de cadenas o conjunto anidado. La intersección conserva miembros comunes; la resta elimina los miembros de la derecha del primer operando. Las repeticiones y `lazy` se aplican al bloque completo. `not` respeta las restricciones estructurales nativas sobre cadenas; una unión vacía no coincide con nada. Selecciona `v`; Disponible en npm `0.1.0-dev.7`. [Sintaxis y ejemplos](../LANGUAGE.md#nested-unicode-set-operations).

## 🛠️ Desarrollar localmente

```sh
npm ci
npm run build
npm run serve
```

Abre **http://127.0.0.1:4174/**. `npm run serve -- 0` elige un puerto libre. Las redirecciones de directorio conservan parámetros y añaden la barra final.

Con Chrome instalado, ejecuta todos los controles:

```sh
npm ci
npm exec -- playwright install firefox webkit
npm run verify
```

Sin Chrome, usa Chromium de Playwright:

```sh
npm exec -- playwright install chromium firefox webkit
CI=1 npm run verify
```

Incluye formato, lint, tipos, enlaces, Node, construcción Pages, consumidor limpio, navegadores y auditoría. `CI=1` selecciona el navegador local; no activa GitHub Actions, que sigue deshabilitado.

## 🧭 Conocer los límites

Las alternativas se convierten en bloques editables `either { … }`: cada entrada es una opción, probada en orden. Usa `group { … }` para una opción con varias reglas o una opción vacía.

La salida apunta a **JavaScript `RegExp`**. No admite regex bruto como reglas ni inglés libre. La conversión inversa acepta solo el subconjunto documentado. El inglés libre, las clases de caracteres vacías en modo u y las referencias adelantadas o a grupos abiertos siguen sin admitirse. El taller usa un worker con plazo; un regex copiado necesita las protecciones de su aplicación. Consulta el [modelo de seguridad](../SECURITY_MODEL.md).

## 💬 Preguntas frecuentes

**¿Usa IA?** No: parser determinista, AST, compilador y explicaciones estructuradas.

**¿Traduce cualquier regex?** No. La sintaxis desconocida falla sin quitar capturas o aserciones.

**¿Una prueba correcta demuestra seguridad?** No. Comprueba casos elegidos, no todos los caminos ni el coste.

**¿Las clases cubren todo Unicode?** No. `digit` es ASCII, `letter` es `[A-Za-z]`, `word` sigue `\w`.

**¿Qué límites hay?** 16 384 unidades UTF-16, 200 líneas, repeticiones acotadas hasta 1000, profundidad 64; 100 ejemplos de hasta 2048 unidades y plazo de 1200 ms. Un emoji suele ocupar dos unidades UTF-16.

**¿Funciona sin conexión?** Biblioteca y CLI son locales. Puedes construir y servir el taller tras instalar dependencias. No se promete PWA ni caché sin conexión.

**¿Dónde informar errores?** En [GitHub issues](https://github.com/OthmaneBlial/Regex-For-Humans/issues), con reglas, flags, entrada, expectativa y versión del motor. Para seguridad, usa [SECURITY.md](../../SECURITY.md) en privado.

## 🗺️ Explorar el proyecto

| Guía | Contenido |
| --- | --- |
| [Lenguaje](../LANGUAGE.md) | Gramática, grupos, referencias y diagnósticos |
| [Ejemplos complejos](../COMPLEX-EXAMPLES.md) | Cuatro formatos explicados |
| [Arquitectura](../ARCHITECTURE.md) | Parser → AST → compilador → interfaces |
| [Compatibilidad](../COMPATIBILITY.md) | Construcciones y motores probados |
| [Pruebas](../TESTING.md) | Comandos y resultados reproducibles |
| [Seguridad](../SECURITY_MODEL.md) | Fronteras de confianza y límites |
| [Distribución](../DISTRIBUTION.md) | Evidencia de publicación |
| [Hoja de ruta](../AUTONOMOUS_ROADMAP.md) | Avances y prioridades |
| [Comparación](../COMPETITOR_GAPS.md) | Fuentes y capacidades pendientes |
| [Contribuir](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) | Preparación y convenciones |

**Verificado localmente el 11 de octubre de 2026:** pasan 1.138 pruebas: 334 de Node, 478 controles Chromium de escritorio/móvil, 262 de Firefox/WebKit y 64 del sitio. También pasan las compilaciones y la instalación en un proyecto JavaScript/TypeScript independiente; la auditoría no informa vulnerabilidades. Otra instalación independiente pasa con Node 22.23.3. Son resultados de esta versión; las revisiones humanas de uso y lectores de pantalla siguen abiertas.

## Revisión de riesgos estructurales

Abre **Review the pattern** en el taller local para revisar repeticiones variables anidadas o contiguas, alternativas solapadas, comodines amplios, anclas de línea y patrones grandes. Al pasar el puntero se conectan la regla, el fragmento regex, la explicación y el diagrama sin mover el cursor; seleccionar una nota vuelve a su línea de origen. Los cambios en reglas, flags, recetas y grupos actualizan la revisión.

La API compartida `analyze(rules, { flags })` devuelve flags canónicos, notas tipadas con posiciones e intervalos de origen y limitaciones explícitas. Los caracteres conocidos de clases e intervalos positivos detectan algunos solapamientos; un conjunto desconocido no demuestra que no haya solapamiento. Este análisis heurístico puede omitir patrones costosos o producir falsos positivos: **la ausencia de notas no demuestra seguridad de rendimiento**. No ejecuta coincidencias ni mide backtracking. Los ejemplos conservan su worker aislado y su límite de tiempo.

 Consulta el [contrato de revisión estructural](../LANGUAGE.md#structural-risk-review).

## Diagrama de estructura

Abre **Explore the pattern** en el taller local para ver un diagrama de vías construido desde el AST: grupos anidados, alternativas ordenadas, bucles de repetición y aserciones que no consumen texto. Al pasar el puntero o seleccionar un nodo se conectan las reglas, los fragmentos regex y las explicaciones; pasar el puntero no mueve el cursor. **Enter/Espacio** vuelve a la línea de origen. El cursor del editor y la selección de regex también siguen la estructura. **Actual size** conserva etiquetas legibles con desplazamiento; **Fit overview** muestra el mapa completo. **Export SVG** guarda un archivo autónomo, también disponible mediante `toSVG(rules, { flags })`. Las etiquetas largas conservan la explicación completa en una ayuda. El diagrama describe la estructura, no la ejecución ni el backtracking. Consulta los [diagramas de estructura](../LANGUAGE.md#structural-diagrams).

Licencia [MIT](../../LICENSE) · [Changelog](../../CHANGELOG.md) · [Volver al inglés](../../README.md).
