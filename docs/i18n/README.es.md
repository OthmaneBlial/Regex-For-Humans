<div align="center">

[![Regex For Humans: la regex ^#[0-9A-Fa-f]{6}$ con el significado de cada fragmento en inglés sencillo debajo](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-banner.svg)](https://othmaneblial.github.io/Regex-For-Humans/)

**Escribe regex en inglés sencillo. Lee cualquier regex de la misma forma.**

Reglas cortas en inglés se compilan en un `RegExp` nativo de JavaScript, con un fragmento visible por regla. Pega una regex y recupera las reglas.

**[Probar el taller](https://othmaneblial.github.io/Regex-For-Humans/workshop/) · [Sitio web](https://othmaneblial.github.io/Regex-For-Humans/) · [Versión preliminar en npm](https://www.npmjs.com/package/regex-for-humans/v/0.1.0-dev.13) · [Sintaxis](../LANGUAGE.md)**

[English](../../README.md) · [简体中文](README.zh-CN.md) · **Español** · [Français](README.fr.md) · [Português do Brasil](README.pt-BR.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

</div>

## Escribe reglas, obtén una regex

<table>
<tr><th>Reglas</th><th>Regex de JavaScript</th></tr>
<tr><td>

```text
start "#"
6 hex digits
end
```

</td><td>

```js
/^#[0-9A-Fa-f]{6}$/u
```

✅ `#12aBcF` · `#000000`<br>
❌ `#123` · `#G00000`

</td></tr>
</table>

Cada línea tiene un significado documentado y añade un fragmento a la regex, en orden. El resultado es la regex que escribirías a mano: `?` en lugar de `{0,1}`, sin grupos de sobra. Una frase desconocida se detiene con su línea, su columna y una corrección sugerida.

[![Seis recetas por turnos: sus reglas, la regex compilada, el significado de cada fragmento y lo que coincidió en un ejemplo](https://raw.githubusercontent.com/OthmaneBlial/Regex-For-Humans/main/site/assets/readme-reel.svg)](https://othmaneblial.github.io/Regex-For-Humans/workshop/)

## Lee una regex al revés

¿Heredaste un patrón que nadie entiende? `regexToRules` convierte una regex compatible en reglas editables, que vuelven a compilarse en la misma regex.

```js
import { regexToRules } from 'regex-for-humans';

regexToRules(/^[A-Z]{2}-\d{4}$/u).rules;
```

```text
start
2 uppercase letter
"-"
4 digit
end
```

El [sitio web](https://othmaneblial.github.io/Regex-For-Humans/) anota en el lugar cualquier regex que pegues. La sintaxis no compatible se rechaza indicando su posición; nunca se descarta en silencio.

## Nombra lo que capturas

<!-- captures:date -->
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
toRegExp(compile(rules)).exec('2026-10-10').groups;
// { year: '2026', month: '10', day: '10' }
```

Las capturas son grupos nativos de JavaScript. Escribe `same as capture "year"` para exigir otra vez el mismo texto.

## Instalación

```sh
npm install regex-for-humans@preview
```

```js
import { compile, toRegExp } from 'regex-for-humans';

const result = compile('start\n3 digits\nend');
console.log(result.source);                 // ^\d{3}$
console.log(toRegExp(result).test('123'));  // true
```

```sh
printf 'start "ABC"\n3 digits\nend\n' | npx --yes --package=regex-for-humans@preview regex-for-humans --explain
```

Node.js 22+, sin dependencias en tiempo de ejecución, ESM con declaraciones de TypeScript. La biblioteca, la [línea de comandos](../CLI.md) y el taller comparten un único compilador. Es una versión preliminar (`0.1.0-dev.13`); el [taller](https://othmaneblial.github.io/Regex-For-Humans/workshop/) no necesita instalación.

## El vocabulario de un vistazo

| Escribe | Obtienes |
| --- | --- |
| `start` · `end` | `^` · `$` |
| `3 digits` · `digits` | `\d{3}` · `\d+` |
| `between 2 and 4 letters` | `[A-Za-z]{2,4}` |
| `optional "-"` | `-?` |
| `one of: a, b` | `[ab]` |
| `either { "INFO" "WARN" }` | `(?:INFO\|WARN)` |
| `capture "id" { … }` | `(?<id>…)` |
| `not followed by { "x" }` | `(?!x)` |

Los bloques como `either { … }` llevan una regla por línea dentro de las llaves. La [guía del lenguaje](../LANGUAGE.md) cubre cada regla, flag, clase Unicode, aserción y límite.

## 34 recetas listas para abrir

| Receta | Qué comprueba |
| --- | --- |
| [Validar una fecha del calendario](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=calendar-date) | Mes 01–12, día 01–31, capturados como año, mes y día |
| [Validar una dirección IPv4](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=ipv4-address) | Cuatro números de 0 a 255, sin ceros a la izquierda |
| [Validar una hora de 24 horas](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=clock-time) | De `00:00` a `23:59` |
| [Validar la sintaxis de SemVer 2.0](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=semantic-version) | Núcleo, prelanzamiento y metadatos de compilación |
| [Extraer campos con nombre de un registro](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=log-fields) | Nivel y código, por nombre |
| [Detectar una palabra repetida](https://othmaneblial.github.io/Regex-For-Humans/workshop/?example=repeated-word) | Una palabra y luego la misma palabra |

Cada receta incluye ejemplos que deben y no deben coincidir, y una nota sobre lo que no comprueba. Consulta [las 34 recetas](../RECIPES.md) y cuatro [ejemplos complejos](../COMPLEX-EXAMPLES.md) con **35 casos aceptados o rechazados**.

## Por qué fiarte del resultado

- **Determinista.** Un analizador, no un modelo: las mismas reglas siempre dan la misma regex. Sin IA, sin red, sin telemetría.
- **Nativo.** El resultado es un `RegExp` corriente; al buscar solo se ejecuta el motor. Las [exportaciones](../LANGUAGE.md#engine-exports) a Python, Rust, Go, Java, C#, PHP y Ruby se comparan con esos motores.
- **Honesto con sus límites.** Las recetas dicen lo que no comprueban. El taller prueba tus ejemplos en un worker con tiempo limitado; una regex copiada necesita sus propias protecciones ([modelo de seguridad](../SECURITY_MODEL.md)).
- **Probado.** Cada receta y cada ejemplo del README se recompilan en la batería de pruebas ([pruebas](../TESTING.md)).

[Arquitectura](../ARCHITECTURE.md) · [Compatibilidad](../COMPATIBILITY.md) · [Contribuir](https://github.com/OthmaneBlial/Regex-For-Humans/blob/main/CONTRIBUTING.md) · [Cambios](../../CHANGELOG.md) · [Seguridad](../../SECURITY.md) · [MIT](../../LICENSE)

<div align="center">

Si una regla te ahorró entrecerrar los ojos, una ⭐ ayuda a otros desarrolladores a encontrar el proyecto.

</div>
