// Each entry contains Simplified Chinese, Spanish and French; English is the key.
/** @type {Record<string, [string, string, string]>} */
export const translations = {
  "Explanation level": ["解释级别", "Nivel de explicación", "Niveau d’explication"],
  "Read the meaning first; short notes explain regex terms. The compiler's rules and meanings stay in English.":
    [
      "先阅读含义；简短注释解释正则术语。编译器的规则和含义保持英文。",
      "Lee primero el significado; las notas breves explican los términos regex. Las reglas y los significados del compilador siguen en inglés.",
      "Lisez d’abord le sens ; des notes expliquent les termes regex. Les règles et les explications du compilateur restent en anglais.",
    ],
  "Each rule maps to its generated fragment and compiler explanation.": [
    "每条规则对应生成的片段和编译器解释。",
    "Cada regla corresponde a su fragmento generado y a la explicación del compilador.",
    "Chaque règle correspond au fragment produit et à l’explication du compilateur.",
  ],
  "Ranges refer to the generated regex, in UTF-16 units. Flags: {flags}. Engine export lists compatibility requirements; this is structure, not an execution trace.":
    [
      "范围指生成正则中的 UTF-16 单元。标志：{flags}。引擎导出列出兼容要求；这里展示结构，并非执行轨迹。",
      "Los rangos corresponden al regex generado, en unidades UTF-16. Indicadores: {flags}. La exportación indica los requisitos de compatibilidad; esto muestra la estructura, no la ejecución.",
      "Les plages concernent le regex généré, en unités UTF-16. Options : {flags}. L’export détaille les exigences de compatibilité ; ceci montre la structure, sans tracer l’exécution.",
    ],
  "Source line {line}, column {column}; regex UTF-16 range [{start}, {end}).": [
    "源代码第 {line} 行，第 {column} 列；正则 UTF-16 范围 [{start}, {end})。",
    "Línea {line}, columna {column} del código; rango UTF-16 del regex [{start}, {end}).",
    "Source : ligne {line}, colonne {column} ; plage UTF-16 du regex [{start}, {end}).",
  ],
  "Capture #{index}; name: {name}.": [
    "捕获 #{index}；名称：{name}。",
    "Captura #{index}; nombre: {name}.",
    "Capture n° {index} ; nom : {name}.",
  ],
  "Resolved reference: capture #{index}.": [
    "已解析的引用：捕获 #{index}。",
    "Referencia resuelta: captura #{index}.",
    "Référence résolue : capture n° {index}.",
  ],
  "This closes the nested rules above; it does not itself match a closing brace.": [
    "这会关闭上面的嵌套规则；它本身不匹配右花括号。",
    "Esto cierra las reglas anidadas anteriores; no coincide por sí mismo con una llave de cierre.",
    "Ceci ferme les règles imbriquées précédentes ; la règle ne recherche pas une accolade fermante.",
  ],
  "A capture remembers the text matched by its inner rules. Its number or name lets you read that text later.":
    [
      "捕获保存其内部规则匹配的文本。之后可通过编号或名称读取该文本。",
      "Una captura guarda el texto que coincida con sus reglas internas. Su número o nombre permite leerlo después.",
      "Une capture mémorise le texte reconnu par ses règles internes. Son numéro ou son nom permet de le lire ensuite.",
    ],
  "A noncapturing group keeps inner rules together without storing a separate captured value.": [
    "非捕获组把内部规则组合在一起，但不保存独立的捕获值。",
    "Un grupo sin captura mantiene unidas sus reglas internas sin guardar un valor capturado aparte.",
    "Un groupe non capturant réunit ses règles internes sans mémoriser une valeur de capture distincte.",
  ],
  "An assertion checks a condition at the current position without advancing the match. Lookahead checks forward; lookbehind checks backward.":
    [
      "断言在当前位置检查条件，不推进匹配位置。先行断言向前检查，后行断言向后检查。",
      "Una aserción comprueba una condición en la posición actual sin avanzar la coincidencia. Lookahead comprueba hacia delante; lookbehind, hacia atrás.",
      "Une assertion vérifie une condition à la position courante sans avancer la correspondance. Lookahead vérifie vers l’avant ; lookbehind vers l’arrière.",
    ],
  "An alternative is one possible path. The engine tries paths in their written order; later rules can make it try another path.":
    [
      "备选分支是一条可能的路径。引擎按书写顺序尝试；后续规则可能使它改试其他路径。",
      "Una alternativa es un camino posible. El motor los prueba en el orden escrito; las reglas posteriores pueden llevarlo a probar otro camino.",
      "Une alternative est un chemin possible. Le moteur les essaie dans l’ordre écrit ; les règles suivantes peuvent l’amener à essayer un autre chemin.",
    ],
  "An anchor checks a position at an edge of the input or a line. It adds no text to the match.": [
    "锚点检查输入或行的边缘位置，不向匹配中添加文本。",
    "Un ancla comprueba una posición en un extremo de la entrada o de una línea. No añade texto a la coincidencia.",
    "Une ancre vérifie une position au début ou à la fin de l’entrée ou d’une ligne. Elle n’ajoute aucun texte à la correspondance.",
  ],
  "A word boundary compares word-character status on either side of a position. It does not identify natural-language words.":
    [
      "单词边界比较一个位置两侧是否为单词字符，并不识别自然语言词语。",
      "Un límite de palabra compara si hay caracteres de palabra a ambos lados de una posición. No identifica palabras de lenguaje natural.",
      "Une frontière de mot compare le statut de caractère de mot des deux côtés d’une position. Elle ne reconnaît pas les mots d’une langue naturelle.",
    ],
  "A backreference matches text from an earlier capture, not the spelling of that capture's name.":
    [
      "反向引用匹配先前捕获的文本，而不是捕获名称本身。",
      "Una referencia inversa coincide con el texto de una captura anterior, no con las letras de su nombre.",
      "Une référence arrière reconnaît le texte d’une capture précédente, sans rechercher son nom dans l’entrée.",
    ],
  "A literal matches the written text. Punctuation in that text is escaped by the compiler.": [
    "字面文本匹配所写的内容。编译器会转义其中的标点符号。",
    "Un literal coincide con el texto escrito. El compilador escapa la puntuación de ese texto.",
    "Un texte littéral recherche le contenu écrit. Le compilateur échappe sa ponctuation.",
  ],
  "A Unicode property selects characters or strings from the runtime's Unicode data; it does not normalize text.":
    [
      "Unicode 属性从运行时的 Unicode 数据中选择字符或字符串，不会规范化文本。",
      "Una propiedad Unicode selecciona caracteres o cadenas de los datos Unicode del entorno; no normaliza el texto.",
      "Une propriété Unicode sélectionne des caractères ou des chaînes dans les données Unicode du moteur ; elle ne normalise pas le texte.",
    ],
  "A character set lists possible matching values. In Unicode sets mode it can also contain strings.":
    [
      "字符集列出可能匹配的值。在 Unicode 集合模式下，它也可包含字符串。",
      "Un conjunto de caracteres enumera los valores posibles. En el modo de conjuntos Unicode también puede contener cadenas.",
      "Un ensemble de caractères liste les valeurs possibles. En mode ensembles Unicode, il peut aussi contenir des chaînes.",
    ],
  "A shorthand or wildcard is a regex abbreviation for permitted characters. The meaning above describes its actual scope.":
    [
      "简写或通配符是允许字符的正则缩写。上面的含义说明其实际范围。",
      "Una abreviatura o comodín representa los caracteres permitidos. El significado anterior describe su alcance real.",
      "Une classe abrégée ou un caractère générique représente les caractères autorisés. L’explication précédente décrit sa portée réelle.",
    ],
  "A quantifier says how often this unit may repeat. Greedy tries more repetitions first; lazy tries fewer first, subject to the rest of the pattern.":
    [
      "量词说明该单元可重复多少次。贪婪模式先尝试较多次数，懒惰模式先尝试较少次数，均受后续模式约束。",
      "Un cuantificador indica cuántas veces puede repetirse esta unidad. Greedy prueba primero más repeticiones; lazy, menos, según lo permita el resto del patrón.",
      "Un quantificateur indique combien de fois cette unité peut se répéter. Greedy essaie d’abord davantage de répétitions ; lazy en essaie moins, selon la suite du motif.",
    ],
  "Any match needs at least {minimum} UTF-16 units; this input has {length}.": [
    "任何匹配至少需要 {minimum} 个 UTF-16 单元；此输入有 {length} 个。",
    "Toda coincidencia necesita al menos {minimum} unidades UTF-16; esta entrada tiene {length}.",
    "Toute correspondance nécessite au moins {minimum} unités UTF-16 ; cette entrée en contient {length}.",
  ],
  "Required literal {literal} is absent from the input.": [
    "输入中缺少必需的字面文本 {literal}。",
    "El texto literal obligatorio {literal} no aparece en la entrada.",
    "Le texte littéral obligatoire {literal} est absent de l’entrée.",
  ],
  "The native match covers [{start}, {end}); full-input mode requires [0, {length}).": [
    "原生匹配覆盖 [{start}, {end})；完整输入模式要求 [0, {length})。",
    "La coincidencia nativa cubre [{start}, {end}); el modo de entrada completa exige [0, {length}).",
    "La correspondance native couvre [{start}, {end}) ; le mode entrée complète exige [0, {length}).",
  ],
  "The native engine matched [{start}, {end}); this example expects no match.": [
    "原生引擎匹配了 [{start}, {end})；此示例预期不匹配。",
    "El motor nativo encontró una coincidencia en [{start}, {end}); este ejemplo espera ninguna.",
    "Le moteur natif a trouvé une correspondance sur [{start}, {end}) ; cet exemple n’en attend aucune.",
  ],
  "The native engine found no match. A precise failing step is unavailable.": [
    "原生引擎未找到匹配。无法提供确切的失败步骤。",
    "El motor nativo no encontró coincidencias. No se dispone del paso exacto del fallo.",
    "Le moteur natif n’a trouvé aucune correspondance. L’étape précise de l’échec est inconnue.",
  ],
  "Test fixtures": ["测试用例文件", "Fixtures de pruebas", "Fixtures de tests"],
  "Keep rules, flags, examples and exact expectations in a versioned JSON file. Saving and restoring locally are manual; storage belongs to this browser and can be cleared.":
    [
      "在带版本的 JSON 文件中保留规则、标志、示例和精确预期。需手动保存和恢复；本地存储仅属于当前浏览器，可能被清除。",
      "Guarda reglas, indicadores, ejemplos y expectativas exactas en un archivo JSON versionado. Guardar y restaurar localmente es manual; el almacenamiento pertenece a este navegador y puede borrarse.",
      "Conservez règles, options, exemples et attentes exactes dans un fichier JSON versionné. La sauvegarde et la restauration locales sont manuelles ; le stockage appartient à ce navigateur et peut être effacé.",
    ],
  "Import JSON": ["导入 JSON", "Importar JSON", "Importer un JSON"],
  "Export tests": ["导出测试", "Exportar pruebas", "Exporter les tests"],
  "Save locally": ["本地保存", "Guardar localmente", "Sauvegarder localement"],
  "Restore saved tests": [
    "恢复已保存的测试",
    "Restaurar pruebas guardadas",
    "Restaurer les tests sauvegardés",
  ],
  "No fixture loaded. Import limit: 4 MiB.": [
    "尚未加载测试文件。导入上限：4 MiB。",
    "Ningún fixture cargado. Límite de importación: 4 MiB.",
    "Aucune fixture chargée. Limite d’import : 4 MiB.",
  ],
  "Exact expectations": ["精确预期", "Expectativas exactas", "Attentes exactes"],
  "Expected details (JSON)": [
    "预期详情（JSON）",
    "Detalles esperados (JSON)",
    "Détails attendus (JSON)",
  ],
  "Expected details for example {index}": [
    "示例 {index} 的预期详情",
    "Detalles esperados del ejemplo {index}",
    "Détails attendus pour l’exemple {index}",
  ],
  "Optional JSON: spans are [start,end] pairs; captures are arrays in group-number order for each match. Use null for absence and an empty string for participation. Limit: 8,192 UTF-16 units.":
    [
      "可选 JSON：spans 为 [起点,终点] 对；captures 为每次匹配按组号排列的数组。null 表示未参与，空字符串表示参与了空匹配。上限：8,192 个 UTF-16 单元。",
      "JSON opcional: spans contiene pares [inicio,fin]; captures contiene un array por coincidencia, en orden de número de grupo. Usa null para ausencia y una cadena vacía para participación. Límite: 8.192 unidades UTF-16.",
      "JSON facultatif : spans contient des paires [début,fin] ; captures contient un tableau par correspondance, dans l’ordre des numéros de groupe. null signifie absent, une chaîne vide signifie une capture participante. Limite : 8 192 unités UTF-16.",
    ],
  "Replacement uses the original flags and JavaScript string replacement tokens. Search lists all matches even without g; replacement without g changes only the first match.":
    [
      "替换使用原始标志和 JavaScript 字符串替换符号。搜索即使没有 g 也列出所有匹配；没有 g 的替换只修改第一次匹配。",
      "El reemplazo usa los indicadores originales y los tokens de reemplazo de JavaScript. La búsqueda lista todas las coincidencias incluso sin g; el reemplazo sin g cambia solo la primera.",
      "Le remplacement utilise les options d’origine et les jetons de remplacement JavaScript. La recherche liste toutes les correspondances même sans g ; le remplacement sans g modifie seulement la première.",
    ],
  "Imported line endings are preserved for testing and export. Editing the example field converts them to LF.":
    [
      "导入的换行符在测试和导出时保持原样。编辑示例输入框会将其转换为 LF。",
      "Los saltos de línea importados se conservan en pruebas y exportaciones. Editar el campo del ejemplo los convierte en LF.",
      "Les fins de ligne importées sont conservées pour les tests et l’export. Modifier le champ de l’exemple les convertit en LF.",
    ],
  "Fix the expectation JSON to run the examples.": [
    "请修复预期 JSON 以运行示例。",
    "Corrige el JSON de expectativas para ejecutar los ejemplos.",
    "Corrigez le JSON des attentes pour lancer les exemples.",
  ],
  "Exact spans": ["精确范围", "Rangos exactos", "Positions exactes"],
  "Capture values": ["捕获值", "Valores de captura", "Valeurs des captures"],
  "Replacement result": ["替换结果", "Resultado del reemplazo", "Résultat du remplacement"],
  "✓ {check} agrees": ["✓ {check} 符合预期", "✓ {check} coincide", "✓ {check} conforme"],
  "! {check} differs": ["! {check} 与预期不同", "! {check} difiere", "! {check} différent"],
  "More than 100 matches: exact match expectations cannot pass.": [
    "超过 100 次匹配：无法通过精确匹配预期。",
    "Más de 100 coincidencias: las expectativas exactas no pueden aprobarse.",
    "Plus de 100 correspondances : les attentes exactes ne peuvent pas être validées.",
  ],
  "Actual replacement ({count} UTF-16 units):": [
    "实际替换结果（{count} 个 UTF-16 单元）：",
    "Reemplazo real ({count} unidades UTF-16):",
    "Remplacement obtenu ({count} unités UTF-16) :",
  ],
  "Fixture unavailable: {error}": [
    "测试文件不可用：{error}",
    "Fixture no disponible: {error}",
    "Fixture indisponible : {error}",
  ],
  "Import cancelled because the workshop changed. Choose the file again.": [
    "工作区已更改，导入已取消。请重新选择文件。",
    "Importación cancelada porque cambió el taller. Elige el archivo de nuevo.",
    "Import annulé car l’atelier a changé. Sélectionnez à nouveau le fichier.",
  ],
  "Imported {count} examples. Review the rules and test results.": [
    "已导入 {count} 个示例。请检查规则和测试结果。",
    "Importados {count} ejemplos. Revisa las reglas y los resultados.",
    "{count} exemples importés. Vérifiez les règles et les résultats des tests.",
  ],
  "Test fixture download started.": [
    "已开始下载测试文件。",
    "Descarga del fixture iniciada.",
    "Téléchargement de la fixture lancé.",
  ],
  "Tests saved in this browser. Export JSON for a durable copy.": [
    "测试已保存在此浏览器中。请导出 JSON 以保留持久副本。",
    "Pruebas guardadas en este navegador. Exporta JSON para conservar una copia duradera.",
    "Tests sauvegardés dans ce navigateur. Exportez un JSON pour conserver une copie durable.",
  ],
  "No saved test fixture in this browser.": [
    "此浏览器中没有已保存的测试文件。",
    "No hay ningún fixture guardado en este navegador.",
    "Aucune fixture de tests sauvegardée dans ce navigateur.",
  ],
  "Restored {count} saved examples.": [
    "已恢复 {count} 个保存的示例。",
    "Restaurados {count} ejemplos guardados.",
    "{count} exemples sauvegardés restaurés.",
  ],
  "Build a rule": ["构建规则", "Construir una regla", "Construire une règle"],
  "Rule to add": ["要添加的规则", "Regla que añadir", "Règle à ajouter"],
  "Capture group": ["捕获组", "Grupo de captura", "Groupe de capture"],
  "Optional section": ["可选部分", "Sección opcional", "Section facultative"],
  Alternative: ["分支", "Alternativa", "Alternative"],
  Repetition: ["重复", "Repetición", "Répétition"],
  "Character class": ["字符类", "Clase de caracteres", "Classe de caractères"],
  Assertion: ["断言", "Aserción", "Assertion"],
  "Insert rule": ["插入规则", "Insertar regla", "Insérer la règle"],
  "Insert a template before the current line or selection, between the outer anchors. Edit it freely in the rule field.":
    [
      "在当前行或选区之前插入模板，并保留外层锚点。可在规则输入框中自由编辑。",
      "Inserta una plantilla antes de la línea o selección actual, entre los anclajes exteriores. Edítala libremente en el campo de reglas.",
      "Insérez un modèle avant la ligne ou la sélection actuelle, entre les ancres extérieures. Modifiez-le librement dans le champ des règles.",
    ],
  "Rule inserted on line {line}. Edit the template in the rule field.": [
    "已在第 {line} 行插入规则。可在规则输入框中编辑模板。",
    "Regla insertada en la línea {line}. Edita la plantilla en el campo de reglas.",
    "Règle insérée à la ligne {line}. Modifiez le modèle dans le champ des règles.",
  ],
  Theme: ["主题", "Tema", "Thème"],
  System: ["跟随系统", "Sistema", "Système"],
  Light: ["浅色", "Claro", "Clair"],
  Dark: ["深色", "Oscuro", "Sombre"],
  "0 rules": ["0 条规则", "0 reglas", "0 règles"],
  "#{index} {name} → {target}": [
    "#{index} {name} → {target}",
    "#{index} {name} → {target}",
    "#{index} {name} → {target}",
  ],
  "Validate a prefixed identifier": [
    "验证带前缀的标识符",
    "Validar un identificador con prefijo",
    "Valider un identifiant avec préfixe",
  ],
  "ABC followed by exactly three digits. Ignore case also permits abc123.": [
    "ABC 后紧跟三个数字。忽略大小写时也允许 abc123。",
    "ABC seguido de exactamente tres dígitos. Ignorar mayúsculas y minúsculas también permite abc123.",
    "ABC suivi d’exactement trois chiffres. Ignorer la casse autorise aussi abc123.",
  ],
  "Exclude characters": ["排除字符", "Excluir caracteres", "Exclure des caractères"],
  "Empty strings are allowed. The recipe excludes a, b, c and d; Ignore case also excludes A, B, C and D.":
    [
      "允许空字符串。此示例排除 a、b、c、d；忽略大小写时也排除 A、B、C、D。",
      "Se permiten cadenas vacías. El ejemplo excluye a, b, c y d; al ignorar mayúsculas y minúsculas también excluye A, B, C y D.",
      "Les chaînes vides sont acceptées. Cet exemple exclut a, b, c et d ; ignorer la casse exclut aussi A, B, C et D.",
    ],
  "Read a line rule": ["读取行规则", "Leer una regla de línea", "Lire une règle de ligne"],
  "Search mode finds a line ending with at least three digits; the prefix may include more digits. Entire string mode requires the match to cover the whole example.":
    [
      "搜索模式查找以至少三个数字结尾的行；前缀也可包含数字。整个字符串模式要求匹配覆盖整个示例。",
      "El modo de búsqueda encuentra una línea que termina en al menos tres dígitos; el prefijo puede incluir más dígitos. Cadena completa exige cubrir todo el ejemplo.",
      "La recherche trouve une ligne se terminant par au moins trois chiffres ; le préfixe peut en contenir davantage. Le mode chaîne entière exige de couvrir tout l’exemple.",
    ],
  "Match a date shape": [
    "匹配日期格式",
    "Reconocer el formato de una fecha",
    "Reconnaître le format d’une date",
  ],
  "YYYY-MM-DD shape only. Impossible dates such as 2026-02-31 also match; validate calendar values separately.":
    [
      "仅检查 YYYY-MM-DD 格式。2026-02-31 这样的无效日期也会匹配；请另行验证日期值。",
      "Solo el formato YYYY-MM-DD. Fechas imposibles como 2026-02-31 también coinciden; valida los valores del calendario por separado.",
      "Format YYYY-MM-DD uniquement. Les dates impossibles comme 2026-02-31 correspondent aussi ; validez les valeurs du calendrier séparément.",
    ],
  "Match a version shape": [
    "匹配版本格式",
    "Reconocer el formato de una versión",
    "Reconnaître le format d’une version",
  ],
  "Three numeric parts with literal dots. Leading zeros are allowed, and prerelease suffixes are rejected. This is not full SemVer.":
    [
      "三个数字部分，以字面点号分隔。允许前导零，拒绝预发布后缀。这不是完整的 SemVer。",
      "Tres partes numéricas separadas por puntos literales. Se permiten ceros iniciales y se rechazan sufijos de prepublicación. No es SemVer completo.",
      "Trois parties numériques séparées par des points littéraux. Les zéros initiaux sont acceptés, les suffixes de préversion refusés. Ce n’est pas SemVer complet.",
    ],
  "Match a hex color": [
    "匹配十六进制颜色",
    "Reconocer un color hexadecimal",
    "Reconnaître une couleur hexadécimale",
  ],
  "Six hex digits after #, in either letter case. Only #RRGGBB; no shorthand, alpha or other CSS color forms.":
    [
      "# 后跟六个十六进制数字，字母大小写均可。仅支持 #RRGGBB，不支持简写、透明度或其他 CSS 颜色格式。",
      "Seis dígitos hexadecimales tras #, en mayúsculas o minúsculas. Solo #RRGGBB; sin abreviaturas, alfa u otros formatos CSS.",
      "Six chiffres hexadécimaux après #, en majuscules ou minuscules. Seulement #RRGGBB ; sans forme abrégée, alpha ou autre format CSS.",
    ],
  "Match a MAC address shape": [
    "匹配 MAC 地址格式",
    "Reconocer el formato de una dirección MAC",
    "Reconnaître le format d’une adresse MAC",
  ],
  "Six colon-separated pairs of ASCII hexadecimal digits. Shape only; check address allocation separately.":
    [
      "六组 ASCII 十六进制数字对，以冒号分隔。仅检查格式；请另行检查地址分配。",
      "Seis pares de dígitos hexadecimales ASCII separados por dos puntos. Solo el formato; comprueba la asignación de la dirección por separado.",
      "Six paires de chiffres hexadécimaux ASCII séparées par des deux-points. Format uniquement ; vérifiez l’attribution de l’adresse séparément.",
    ],
  "Match a UUID shape": [
    "匹配 UUID 格式",
    "Reconocer el formato de un UUID",
    "Reconnaître le format d’un UUID",
  ],
  "Five ASCII hexadecimal groups of 8–4–4–4–12 characters, in either letter case. Bare text only; no braces or urn:uuid: prefix. Shape only; check version, variant and uniqueness separately.":
    [
      "五组 ASCII 十六进制字符，长度为 8–4–4–4–12，大小写均可。仅接受纯文本，不带花括号或 urn:uuid: 前缀。仅检查格式；请另行检查版本、变体和唯一性。",
      "Cinco grupos hexadecimales ASCII de 8–4–4–4–12 caracteres, en mayúsculas o minúsculas. Texto sin llaves ni prefijo urn:uuid:. Solo el formato; comprueba versión, variante y unicidad por separado.",
      "Cinq groupes hexadécimaux ASCII de 8–4–4–4–12 caractères, en majuscules ou minuscules. Texte seul, sans accolades ni préfixe urn:uuid:. Format uniquement ; vérifiez version, variante et unicité séparément.",
    ],
  "Match a case-sensitive product-code shape": [
    "匹配区分大小写的产品代码格式",
    "Reconocer un código de producto sensible a mayúsculas",
    "Reconnaître un code produit sensible à la casse",
  ],
  "Two uppercase ASCII letters, three lowercase ASCII letters and four digits. JavaScript's i option ignores case; verify product records separately.":
    [
      "两个大写 ASCII 字母、三个小写 ASCII 字母和四个数字。JavaScript 的 i 选项忽略大小写；请另行验证产品记录。",
      "Dos letras ASCII mayúsculas, tres minúsculas y cuatro dígitos. La opción i de JavaScript ignora la distinción de mayúsculas; verifica los registros del producto por separado.",
      "Deux lettres ASCII majuscules, trois minuscules et quatre chiffres. L’option i de JavaScript ignore la casse ; vérifiez les données du produit séparément.",
    ],
  "Match an invoice ID shape": [
    "匹配发票编号格式",
    "Reconocer el formato de un ID de factura",
    "Reconnaître le format d’un numéro de facture",
  ],
  "INV- followed by 2–6 ASCII digits. Leading zeros are allowed; verify invoice records separately.":
    [
      "INV- 后跟 2–6 个 ASCII 数字。允许前导零；请另行验证发票记录。",
      "INV- seguido de 2–6 dígitos ASCII. Se permiten ceros iniciales; verifica los registros de facturas por separado.",
      "INV- suivi de 2–6 chiffres ASCII. Les zéros initiaux sont acceptés ; vérifiez les données des factures séparément.",
    ],
  "Match a username shape": [
    "匹配用户名格式",
    "Reconocer el formato de un nombre de usuario",
    "Reconnaître le format d’un nom d’utilisateur",
  ],
  "3–16 ASCII word characters, starting with a letter; digits and underscores may follow. Check availability and service rules separately. Ignore case also permits Unicode case-folding equivalents.":
    [
      "3–16 个 ASCII 单词字符，以字母开头，后面可跟数字和下划线。请另行检查名称可用性和服务规则。忽略大小写时也允许 Unicode 大小写折叠的等价字符。",
      "3–16 caracteres de palabra ASCII, empezando por una letra; después puede haber dígitos y guiones bajos. Comprueba disponibilidad y reglas del servicio por separado. Ignorar mayúsculas y minúsculas también admite equivalentes Unicode por plegado de caja.",
      "3–16 caractères de mot ASCII, commençant par une lettre ; chiffres et traits de soulignement peuvent suivre. Vérifiez disponibilité et règles du service séparément. Ignorer la casse accepte aussi les équivalents Unicode par repli de casse.",
    ],
  "Match a time shape": [
    "匹配时间格式",
    "Reconocer el formato de una hora",
    "Reconnaître le format d’une heure",
  ],
  "HH:MM shape only, using ASCII digits. Values such as 25:99 also match; validate hour and minute ranges separately.":
    [
      "仅使用 ASCII 数字检查 HH:MM 格式。25:99 这样的值也会匹配；请另行验证小时和分钟范围。",
      "Solo el formato HH:MM con dígitos ASCII. Valores como 25:99 también coinciden; valida los rangos de horas y minutos por separado.",
      "Format HH:MM uniquement, avec des chiffres ASCII. Des valeurs comme 25:99 correspondent aussi ; validez les plages d’heures et de minutes séparément.",
    ],
  "Match a phone-number shape": [
    "匹配电话号码格式",
    "Reconocer el formato de un teléfono",
    "Reconnaître le format d’un numéro de téléphone",
  ],
  "Optional + followed by 7–15 ASCII digits, without spaces or punctuation. Leading zeros are allowed. This is only a shape; check country rules and number validity separately.":
    [
      "可选的 + 后跟 7–15 个 ASCII 数字，不含空格或标点。允许前导零。仅检查格式；请另行验证国家规则和号码有效性。",
      "+ opcional seguido de 7–15 dígitos ASCII, sin espacios ni puntuación. Se permiten ceros iniciales. Solo el formato; comprueba las reglas del país y la validez del número por separado.",
      "+ facultatif suivi de 7–15 chiffres ASCII, sans espaces ni ponctuation. Les zéros initiaux sont acceptés. Format uniquement ; vérifiez les règles du pays et la validité du numéro séparément.",
    ],
  "Match an IPv4 address shape": [
    "匹配 IPv4 地址格式",
    "Reconocer el formato de una dirección IPv4",
    "Reconnaître le format d’une adresse IPv4",
  ],
  "Four dot-separated groups of 1–3 ASCII digits. Values above 255 and leading zeros match too; validate octet ranges and network rules separately.":
    [
      "四组 1–3 个 ASCII 数字，以点号分隔。大于 255 的值和前导零也会匹配；请另行验证字节范围和网络规则。",
      "Cuatro grupos de 1–3 dígitos ASCII separados por puntos. También coinciden valores superiores a 255 y ceros iniciales; valida los rangos de octetos y las reglas de red por separado.",
      "Quatre groupes de 1–3 chiffres ASCII séparés par des points. Les valeurs supérieures à 255 et les zéros initiaux correspondent aussi ; validez les plages des octets et les règles réseau séparément.",
    ],
  "Match a .txt filename shape": [
    "匹配 .txt 文件名格式",
    "Reconocer el formato de un nombre de archivo .txt",
    "Reconnaître le format d’un nom de fichier .txt",
  ],
  "1–64 Unicode code points before .txt, excluding slash, backslash, NUL and line breaks. Spaces, dots and other punctuation are allowed. This is only a shape; check filesystem rules and file existence separately.":
    [
      ".txt 前为 1–64 个 Unicode 码点，排除斜杠、反斜杠、NUL 和换行。允许空格、点号及其他标点。仅检查格式；请另行检查文件系统规则和文件是否存在。",
      "1–64 puntos de código Unicode antes de .txt, excluyendo barras, contrabarras, NUL y saltos de línea. Se permiten espacios, puntos y otra puntuación. Solo el formato; comprueba reglas del sistema de archivos y existencia por separado.",
      "1–64 points de code Unicode avant .txt, sans barre oblique, barre inversée, NUL ni saut de ligne. Espaces, points et autres signes de ponctuation sont acceptés. Format uniquement ; vérifiez les règles du système de fichiers et l’existence du fichier séparément.",
    ],
  "Read a complex artifact manifest": [
    "读取复杂制品清单",
    "Leer un manifiesto de artefacto complejo",
    "Lire un manifeste de livrable complexe",
  ],
  "Synthetic TSV record: optional nightly/ directory, a 1–32 character project name, version, artifact filename, 64 hex digits and byte count. Checks shape only, not files, dates, versions or checksum contents.":
    [
      "模拟 TSV 记录：可选的 nightly/ 目录、1–32 字符的项目名、版本、制品文件名、64 个十六进制数字和字节数。仅检查格式，不验证文件、日期、版本或校验和内容。",
      "Registro TSV ficticio: directorio nightly/ opcional, nombre de proyecto de 1–32 caracteres, versión, nombre de archivo, 64 dígitos hexadecimales y número de bytes. Solo comprueba el formato, no archivos, fechas, versiones ni el contenido de la suma de verificación.",
      "Enregistrement TSV fictif : dossier nightly/ facultatif, nom de projet de 1–32 caractères, version, nom de fichier, 64 chiffres hexadécimaux et nombre d’octets. Vérifie seulement le format, pas les fichiers, dates, versions ni le contenu de la somme de contrôle.",
    ],
  "Read a complex access log": [
    "读取复杂访问日志",
    "Leer un registro de acceso complejo",
    "Lire un journal d’accès complexe",
  ],
  "Synthetic access-log record: address, timestamp, quoted request, status, size, referer and user agent. Shape only; validate IP, calendar and HTTP values separately. Does not extract fields.":
    [
      "模拟访问日志记录：地址、时间戳、带引号的请求、状态、大小、来源页和用户代理。仅检查格式；请另行验证 IP、日期和 HTTP 值。不提取字段。",
      "Registro de acceso ficticio: dirección, marca de tiempo, petición entre comillas, estado, tamaño, referer y agente de usuario. Solo el formato; valida IP, fecha y valores HTTP por separado. No extrae campos.",
      "Journal d’accès fictif : adresse, horodatage, requête entre guillemets, statut, taille, référent et agent utilisateur. Format uniquement ; validez IP, calendrier et valeurs HTTP séparément. N’extrait pas les champs.",
    ],
  "Read a complex telemetry event": [
    "读取复杂遥测事件",
    "Leer un evento de telemetría complejo",
    "Lire un événement de télémétrie complexe",
  ],
  "Synthetic telemetry record: timestamp, service, trace/span IDs, request and duration, with independent optional lane value and retry=true suffix. Shape only; validate timestamps, HTTP values and identifiers separately.":
    [
      "模拟遥测记录：时间戳、服务、trace/span 标识符、请求和持续时间，以及相互独立的可选 lane 值和 retry=true 后缀。仅检查格式；请另行验证时间戳、HTTP 值和标识符。",
      "Registro de telemetría ficticio: marca de tiempo, servicio, IDs de traza e intervalo, petición y duración, con valor lane y sufijo retry=true opcionales e independientes. Solo el formato; valida marcas de tiempo, valores HTTP e identificadores por separado.",
      "Enregistrement de télémétrie fictif : horodatage, service, identifiants de trace et de segment, requête et durée, avec valeur lane et suffixe retry=true facultatifs et indépendants. Format uniquement ; validez horodatages, valeurs HTTP et identifiants séparément.",
    ],
  "Regex For Humans — Workshop": [
    "Regex For Humans — 工作台",
    "Regex For Humans — Taller",
    "Regex For Humans — Atelier",
  ],
  "Interface language": ["界面语言", "Idioma de la interfaz", "Langue de l’interface"],
  "Interface labels are translated. Rules use controlled English; compiler explanations, diagram labels and exported technical requirements stay in English.":
    [
      "界面标签已翻译。规则使用受控英语；编译器解释、图表标签和导出的技术要求仍使用英语。",
      "Las etiquetas de la interfaz están traducidas. Las reglas usan inglés controlado; las explicaciones del compilador, etiquetas del diagrama y requisitos técnicos exportados siguen en inglés.",
      "Les libellés de l’interface sont traduits. Les règles utilisent un anglais contrôlé ; les explications du compilateur, libellés du diagramme et exigences techniques exportées restent en anglais.",
    ],
  "Skip to workshop": ["跳转到工作台", "Ir al taller", "Aller à l’atelier"],
  "Workshop navigation": ["工作台导航", "Navegación del taller", "Navigation de l’atelier"],
  "Small English rules.": [
    "简短的英语规则。",
    "Reglas breves en inglés.",
    "Des règles simples en anglais.",
  ],
  "Readable regex.": ["可读的正则表达式。", "Regex legibles.", "Des regex lisibles."],
  "Fewer surprises.": ["减少意外。", "Menos sorpresas.", "Moins de surprises."],
  "START WITH A RECIPE": ["从示例开始", "EMPIEZA CON UN EJEMPLO", "COMMENCEZ PAR UN EXEMPLE"],
  "SCROLL FOR MORE →": ["滚动查看更多 →", "DESLIZA PARA VER MÁS →", "DÉFILEZ POUR VOIR LA SUITE →"],
  "Example recipes": ["示例规则", "Ejemplos de reglas", "Exemples de règles"],
  "Rules stay local": [
    "规则保留在本机",
    "Las reglas se quedan en tu dispositivo",
    "Les règles restent sur votre appareil",
  ],
  "JavaScript RegExp · Controlled English · No account": [
    "JavaScript RegExp · 受控英语 · 无需账号",
    "JavaScript RegExp · Inglés controlado · Sin cuenta",
    "JavaScript RegExp · Anglais contrôlé · Sans compte",
  ],
  "THE WORKSHOP": ["工作台", "EL TALLER", "L’ATELIER"],
  "A CLEARER WAY TO COMPILE PATTERNS": [
    "更清晰地编译匹配模式",
    "UNA FORMA MÁS CLARA DE COMPILAR PATRONES",
    "UNE FAÇON PLUS CLAIRE DE COMPILER DES MOTIFS",
  ],
  "Write the rule.": ["写下规则。", "Escribe la regla.", "Écrivez la règle."],
  "Read the regex.": ["读懂正则。", "Lee la regex.", "Lisez la regex."],
  "Write clear rules. Inspect the regex. Test real examples.": [
    "编写清晰的规则，查看正则表达式，测试实际示例。",
    "Escribe reglas claras. Examina la regex. Prueba ejemplos reales.",
    "Écrivez des règles claires. Examinez la regex. Testez de vrais exemples.",
  ],
  "THE INPUT ✍️": ["输入 ✍️", "LA ENTRADA ✍️", "L’ENTRÉE ✍️"],
  "Write your rules": ["编写规则", "Escribe tus reglas", "Écrivez vos règles"],
  "A controlled language, not a free-form prompt.": [
    "使用受控语言，而不是任意自然语言提示。",
    "Un lenguaje controlado, no una petición de texto libre.",
    "Un langage contrôlé, pas une consigne libre.",
  ],
  "Read the syntax ↗": ["查看语法 ↗", "Consulta la sintaxis ↗", "Consultez la syntaxe ↗"],
  "Complex examples ↗": ["复杂示例 ↗", "Ejemplos complejos ↗", "Exemples complexes ↗"],
  "Regex options": ["正则选项", "Opciones de regex", "Options de la regex"],
  "Ignore case": ["忽略大小写", "Ignorar mayúsculas y minúsculas", "Ignorer la casse"],
  "Dot matches newlines": [
    "点号匹配换行",
    "El punto coincide con saltos de línea",
    "Le point accepte les sauts de ligne",
  ],
  Global: ["全局", "Global", "Global"],
  Multiline: ["多行", "Multilínea", "Multiligne"],
  Sticky: [
    "粘滞匹配",
    "Coincidencia en la posición actual",
    "Correspondance à la position courante",
  ],
  "Match indices": ["匹配位置", "Índices de coincidencia", "Indices des correspondances"],
  "Unicode mode": ["Unicode 模式", "Modo Unicode", "Mode Unicode"],
  "Unicode u": ["Unicode u", "Unicode u", "Unicode u"],
  "Unicode sets v": ["Unicode 集合 v", "Conjuntos Unicode v", "Ensembles Unicode v"],
  "Each example starts at position 0. Sticky matching starts there and stops at the first gap. Search lists up to 100 matches; global and sticky flags make repeated calls to the copied regex stateful. Input anchors remain absolute with multiline mode. Finite strings, Unicode string properties and nested set union/intersection/subtraction require v. Set complements follow native structural string restrictions.":
    [
      "每个示例都从位置 0 开始。粘滞匹配从该位置开始，在第一个间隔处停止。搜索最多列出 100 个匹配；全局和粘滞标志会让复制的正则在多次调用之间保留状态。多行模式下，输入边界仍为绝对边界。有限字符串、Unicode 字符串属性及嵌套集合的并集、交集和差集需要 v。集合补集遵循原生引擎对字符串结构的限制。",
      "Cada ejemplo empieza en la posición 0. La coincidencia sticky se detiene en el primer hueco. La búsqueda muestra hasta 100 coincidencias; los indicadores global y sticky conservan estado entre llamadas a la regex copiada. Los límites de entrada siguen siendo absolutos en modo multilínea. Las cadenas finitas, propiedades Unicode de cadenas y uniones, intersecciones o restas de conjuntos anidados requieren v. Los complementos siguen las restricciones estructurales del motor nativo.",
      "Chaque exemple commence à la position 0. Le mode sticky s’arrête au premier intervalle. La recherche affiche jusqu’à 100 correspondances ; les indicateurs global et sticky conservent un état entre les appels à la regex copiée. Les ancres d’entrée restent absolues en mode multiligne. Les chaînes finies, propriétés Unicode de chaînes et unions, intersections ou soustractions d’ensembles imbriqués nécessitent v. Les compléments respectent les restrictions structurelles du moteur natif.",
    ],
  "Already have a regex? Translate it ↙": [
    "已有正则？转换为规则 ↙",
    "¿Ya tienes una regex? Tradúcela ↙",
    "Vous avez déjà une regex ? Traduisez-la ↙",
  ],
  "Paste a JavaScript regex literal with": [
    "粘贴带有以下标志的 JavaScript 正则字面量：",
    "Pega una regex literal de JavaScript con",
    "Collez une regex littérale JavaScript avec",
  ],
  or: ["或", "o", "ou"],
  ", such as": ["，例如", ", como", ", par exemple"],
  ". Supported patterns become editable rules with their flags; unsupported syntax is explained. Limit: 16,392 UTF-16 code units, including outer whitespace. Press Ctrl/Cmd + Enter in this field to translate.":
    [
      "。支持的模式会转换为可编辑规则，并保留标志；不支持的语法会给出说明。限制为 16,392 个 UTF-16 代码单元，包括首尾空白。在此字段按 Ctrl/Cmd + Enter 进行转换。",
      ". Los patrones admitidos se convierten en reglas editables con sus indicadores; la sintaxis no admitida se explica. Límite: 16.392 unidades UTF-16, incluidos los espacios exteriores. Pulsa Ctrl/Cmd + Enter en este campo para traducir.",
      ". Les motifs pris en charge deviennent des règles modifiables avec leurs indicateurs ; la syntaxe non prise en charge est expliquée. Limite : 16 392 unités UTF-16, espaces extérieurs inclus. Appuyez sur Ctrl/Cmd + Entrée dans ce champ pour traduire.",
    ],
  "JavaScript regex literal": [
    "JavaScript 正则字面量",
    "Regex literal de JavaScript",
    "Regex littérale JavaScript",
  ],
  "Translate to rules": ["转换为规则", "Traducir a reglas", "Traduire en règles"],
  "Go to regex error": ["定位正则错误", "Ir al error de la regex", "Aller à l’erreur de la regex"],
  "THE OUTPUT 🔎": ["输出 🔎", "LA SALIDA 🔎", "LA SORTIE 🔎"],
  "Understand the pattern": ["理解匹配模式", "Entiende el patrón", "Comprenez le motif"],
  "Generated JavaScript regex": [
    "生成的 JavaScript 正则",
    "Regex de JavaScript generada",
    "Regex JavaScript générée",
  ],
  Ready: ["就绪", "Listo", "Prêt"],
  Compiled: ["已编译", "Compilado", "Compilé"],
  "Needs a fix": ["需要修正", "Necesita una corrección", "À corriger"],
  "Select a recipe or write a rule": [
    "选择示例或编写规则",
    "Elige un ejemplo o escribe una regla",
    "Choisissez un exemple ou écrivez une règle",
  ],
  "Unicode mode always on": [
    "Unicode 模式始终启用",
    "Modo Unicode siempre activo",
    "Mode Unicode toujours actif",
  ],
  "Copy regex": ["复制正则", "Copiar regex", "Copier la regex"],
  "Copy regex ↗": ["复制正则 ↗", "Copiar regex ↗", "Copier la regex ↗"],
  "Copied ✓": ["已复制 ✓", "Copiado ✓", "Copié ✓"],
  "Export to a programming language": [
    "导出为编程语言代码",
    "Exportar a un lenguaje de programación",
    "Exporter vers un langage de programmation",
  ],
  "Target language": ["目标语言", "Lenguaje de destino", "Langage cible"],
  "PHP — runtime unverified": [
    "PHP — 运行时未经验证",
    "PHP — ejecución sin verificar",
    "PHP — exécution non vérifiée",
  ],
  "Code generation translates supported regex semantics through the shared compiler. Unsupported flags or constructs explain why export is unavailable. Example tests below still use JavaScript.":
    [
      "代码生成通过共享编译器转换受支持的正则语义。不支持的标志或结构会说明导出不可用的原因。下方示例测试仍使用 JavaScript。",
      "La generación de código traduce la semántica admitida mediante el compilador compartido. Los indicadores o construcciones no admitidos explican por qué no se puede exportar. Las pruebas de abajo siguen usando JavaScript.",
      "La génération de code traduit la sémantique prise en charge via le compilateur commun. Les indicateurs ou constructions non pris en charge expliquent pourquoi l’export est indisponible. Les tests ci-dessous utilisent toujours JavaScript.",
    ],
  "Compile valid rules to export source code.": [
    "编译有效规则后即可导出源码。",
    "Compila reglas válidas para exportar código fuente.",
    "Compilez des règles valides pour exporter le code source.",
  ],
  "Go to export error": ["定位导出错误", "Ir al error de exportación", "Aller à l’erreur d’export"],
  "Generated source code": ["生成的源码", "Código fuente generado", "Code source généré"],
  "Export requirements": ["导出要求", "Requisitos de exportación", "Exigences de l’export"],
  "Export capture mapping": [
    "导出捕获组映射",
    "Correspondencia de capturas exportadas",
    "Correspondance des captures exportées",
  ],
  "Download code": ["下载代码", "Descargar código", "Télécharger le code"],
  "Download export JSON": [
    "下载导出 JSON",
    "Descargar exportación JSON",
    "Télécharger l’export JSON",
  ],
  "Edit groups and references": [
    "编辑分组和引用",
    "Editar grupos y referencias",
    "Modifier les groupes et références",
  ],
  "Rename a capture or change its type. Numbered references keep their original targets. A referenced capture cannot become noncapturing.":
    [
      "重命名捕获组或更改其类型。编号引用会保留原来的目标。被引用的捕获组不能改为非捕获组。",
      "Renombra una captura o cambia su tipo. Las referencias numeradas conservan sus destinos originales. Una captura referenciada no puede convertirse en un grupo sin captura.",
      "Renommez une capture ou changez son type. Les références numérotées gardent leurs cibles d’origine. Une capture référencée ne peut pas devenir un groupe non capturant.",
    ],
  "Edit a group": ["编辑分组", "Editar un grupo", "Modifier un groupe"],
  "Group to edit": ["要编辑的分组", "Grupo que editar", "Groupe à modifier"],
  "Group type": ["分组类型", "Tipo de grupo", "Type de groupe"],
  "Named capture": ["命名捕获组", "Captura con nombre", "Capture nommée"],
  "Numbered capture": ["编号捕获组", "Captura numerada", "Capture numérotée"],
  "Noncapturing group": ["非捕获组", "Grupo sin captura", "Groupe non capturant"],
  "Capture name": ["捕获组名称", "Nombre de la captura", "Nom de la capture"],
  "Apply group edit": ["应用分组修改", "Aplicar cambio al grupo", "Appliquer la modification"],
  "Go to group rule": ["定位分组规则", "Ir a la regla del grupo", "Aller à la règle du groupe"],
  "References to this group": [
    "对此分组的引用",
    "Referencias a este grupo",
    "Références à ce groupe",
  ],
  "Review the pattern": ["检查匹配模式", "Revisar el patrón", "Examiner le motif"],
  "Open to review": ["展开以检查", "Abre para revisar", "Ouvrir pour examiner"],
  "Compile valid rules to review the pattern.": [
    "编译有效规则后即可检查匹配模式。",
    "Compila reglas válidas para revisar el patrón.",
    "Compilez des règles valides pour examiner le motif.",
  ],
  "Analysis inspects structure; it does not run matches or measure backtracking. Example matching still runs in an isolated worker with a time limit.":
    [
      "分析仅检查结构，不执行匹配，也不测量回溯。示例匹配仍在隔离的工作线程中运行，并有时间限制。",
      "El análisis examina la estructura; no ejecuta coincidencias ni mide el retroceso. Las pruebas se ejecutan en un worker aislado con límite de tiempo.",
      "L’analyse examine la structure ; elle n’exécute pas de correspondances et ne mesure pas le retour arrière. Les exemples restent testés dans un worker isolé avec une limite de temps.",
    ],
  "Analysis limitations": ["分析限制", "Limitaciones del análisis", "Limites de l’analyse"],
  "How it was built": ["构建过程", "Cómo se construyó", "Comment le motif est construit"],
  "RULE → FRAGMENT": ["规则 → 片段", "REGLA → FRAGMENTO", "RÈGLE → FRAGMENT"],
  "Each rule will appear here with its generated fragment and meaning.": [
    "每条规则的生成片段和含义会显示在这里。",
    "Aquí verás cada regla con su fragmento generado y su significado.",
    "Chaque règle apparaîtra ici avec son fragment généré et sa signification.",
  ],
  "THE STRUCTURE ↝": ["结构 ↝", "LA ESTRUCTURA ↝", "LA STRUCTURE ↝"],
  "Explore the pattern": ["探索匹配模式", "Explora el patrón", "Explorez le motif"],
  "OPEN THE MAP": ["打开结构图", "ABRIR EL MAPA", "OUVRIR LA CARTE"],
  "Hover to connect the views. Select a node, or press Enter/Space, to return to its rule.": [
    "悬停可联动各视图。选择节点，或按 Enter/空格，返回其规则。",
    "Pasa el cursor para conectar las vistas. Selecciona un nodo o pulsa Enter/Espacio para ir a su regla.",
    "Survolez pour relier les vues. Sélectionnez un nœud ou appuyez sur Entrée/Espace pour retrouver sa règle.",
  ],
  "Diagram view": ["结构图视图", "Vista del diagrama", "Vue du diagramme"],
  "Actual size": ["实际大小", "Tamaño real", "Taille réelle"],
  "Fit overview": ["适应视图", "Vista completa ajustada", "Vue d’ensemble ajustée"],
  "Export SVG ↗": ["导出 SVG ↗", "Exportar SVG ↗", "Exporter le SVG ↗"],
  "Scrollable regex diagram": [
    "可滚动的正则结构图",
    "Diagrama de regex desplazable",
    "Diagramme de regex défilable",
  ],
  "Compile valid rules to explore their structure.": [
    "编译有效规则后即可探索其结构。",
    "Compila reglas válidas para explorar su estructura.",
    "Compilez des règles valides pour explorer leur structure.",
  ],
  "THE PROOF 🧪": ["验证 🧪", "LA PRUEBA 🧪", "LA VÉRIFICATION 🧪"],
  "Check the edge cases": [
    "检查边界情况",
    "Comprueba los casos límite",
    "Vérifiez les cas limites",
  ],
  "Match mode": ["匹配模式", "Modo de coincidencia", "Mode de correspondance"],
  "Entire string": ["整个字符串", "Cadena completa", "Chaîne entière"],
  "Search anywhere": ["搜索任意位置", "Buscar en cualquier posición", "Rechercher partout"],
  "+ Add example": ["+ 添加示例", "+ Añadir ejemplo", "+ Ajouter un exemple"],
  "Mark what should match. The workshop shows where the pattern agrees or surprises you.": [
    "标记预期匹配的内容。工作台会显示模式的结果是否符合预期。",
    "Marca qué debería coincidir. El taller muestra dónde el patrón cumple tus expectativas o te sorprende.",
    "Indiquez ce qui doit correspondre. L’atelier montre où le motif répond à vos attentes ou vous surprend.",
  ],
  "Up to 100 examples; 2,048 UTF-16 code units per string. Longer input is kept but cannot be tested. Leave a field blank to test an empty string.":
    [
      "最多 100 个示例，每个字符串最多 2,048 个 UTF-16 代码单元。超长输入会保留，但无法测试。将字段留空可测试空字符串。",
      "Hasta 100 ejemplos; 2.048 unidades UTF-16 por cadena. Las entradas más largas se conservan, pero no se pueden probar. Deja un campo en blanco para probar una cadena vacía.",
      "Jusqu’à 100 exemples ; 2 048 unités UTF-16 par chaîne. Les saisies plus longues sont conservées mais ne peuvent pas être testées. Laissez un champ vide pour tester une chaîne vide.",
    ],
  "Entire string requires a match covering the whole example. Search anywhere lists up to 100 nonoverlapping matches, including empty matches. Positions start at 0 and count UTF-16 code units; an emoji such as 😀 counts as two. Open a match to inspect its captures.":
    [
      "整个字符串模式要求匹配覆盖整个示例。搜索模式最多列出 100 个不重叠的匹配，包括空匹配。位置从 0 开始，按 UTF-16 代码单元计数；😀 这样的表情占两个代码单元。展开匹配可查看捕获组。",
      "Cadena completa exige cubrir todo el ejemplo. Buscar en cualquier posición muestra hasta 100 coincidencias sin solapamiento, incluidas las vacías. Las posiciones empiezan en 0 y cuentan unidades UTF-16; un emoji como 😀 cuenta como dos. Abre una coincidencia para ver sus capturas.",
      "Chaîne entière exige une correspondance couvrant tout l’exemple. La recherche affiche jusqu’à 100 correspondances sans chevauchement, y compris les correspondances vides. Les positions commencent à 0 et comptent les unités UTF-16 ; un emoji comme 😀 en compte deux. Ouvrez une correspondance pour examiner ses captures.",
    ],
  "Choose a recipe to load example strings.": [
    "选择示例以加载测试字符串。",
    "Elige un ejemplo para cargar cadenas de prueba.",
    "Choisissez un exemple pour charger les chaînes de test.",
  ],
  "Built for inspectable rules, not guesswork.": [
    "让规则可检查，减少猜测。",
    "Reglas que puedes inspeccionar, sin adivinar.",
    "Des règles que vous pouvez examiner, sans deviner.",
  ],
  "Project & documentation ↗": [
    "项目与文档 ↗",
    "Proyecto y documentación ↗",
    "Projet et documentation ↗",
  ],
  "Open this panel to generate source code for the selected language.": [
    "展开此面板，为所选语言生成源码。",
    "Abre este panel para generar código en el lenguaje seleccionado.",
    "Ouvrez ce panneau pour générer le code dans le langage choisi.",
  ],
  "{engine}. Source code generated; this browser does not run the exported code.": [
    "{engine}。源码已生成；浏览器不会运行导出的代码。",
    "{engine}. Código generado; este navegador no ejecuta el código exportado.",
    "{engine}. Code généré ; ce navigateur n’exécute pas le code exporté.",
  ],
  unnamed: ["未命名", "sin nombre", "sans nom"],
  "{code} — line {line}, column {column}: {error}{hint}": [
    "{code} — 第 {line} 行，第 {column} 列：{error}{hint}",
    "{code} — línea {line}, columna {column}: {error}{hint}",
    "{code} — ligne {line}, colonne {column} : {error}{hint}",
  ],
  "Export failed: {error}": [
    "导出失败：{error}",
    "Error de exportación: {error}",
    "Échec de l’export : {error}",
  ],
  "Rule on line {line}: {explanation} Select source line.": [
    "第 {line} 行的规则：{explanation}。选择源代码行。",
    "Regla en la línea {line}: {explanation} Seleccionar línea de origen.",
    "Règle à la ligne {line} : {explanation} Sélectionner la ligne source.",
  ],
  "Needs valid rules": [
    "需要有效规则",
    "Se necesitan reglas válidas",
    "Règles valides nécessaires",
  ],
  "Open this panel for a structural review.": [
    "展开此面板进行结构检查。",
    "Abre este panel para una revisión estructural.",
    "Ouvrez ce panneau pour un examen de la structure.",
  ],
  "{count} review note": ["{count} 条检查提示", "{count} nota de revisión", "{count} remarque"],
  "{count} review notes": ["{count} 条检查提示", "{count} notas de revisión", "{count} remarques"],
  "No findings": ["未发现问题", "Sin observaciones", "Aucune remarque"],
  "These are heuristic review notes, not measured runtime results. Select one to inspect its source rule.":
    [
      "这些是启发式检查提示，不是运行时测量结果。选择提示可查看其源规则。",
      "Son notas heurísticas, no mediciones de ejecución. Selecciona una para ver su regla de origen.",
      "Ce sont des remarques heuristiques, pas des mesures d’exécution. Sélectionnez-en une pour examiner sa règle source.",
    ],
  "No heuristic findings detected. This does not prove performance safety.": [
    "未发现启发式问题，但这不能证明性能安全。",
    "No se detectaron observaciones heurísticas. Esto no demuestra seguridad de rendimiento.",
    "Aucune remarque heuristique détectée. Cela ne prouve pas la sûreté des performances.",
  ],
  Review: ["检查", "Revisión", "Examen"],
  Information: ["信息", "Información", "Information"],
  "{severity} on line {line}: {error} Select source line.": [
    "第 {line} 行的{severity}：{error}。选择源代码行。",
    "{severity} en la línea {line}: {error} Seleccionar línea de origen.",
    "{severity} à la ligne {line} : {error} Sélectionner la ligne source.",
  ],
  "{severity} · LINE {line}": [
    "{severity} · 第 {line} 行",
    "{severity} · LÍNEA {line}",
    "{severity} · LIGNE {line}",
  ],
  REVIEW: ["检查", "REVISIÓN", "EXAMEN"],
  INFORMATION: ["信息", "INFORMACIÓN", "INFORMATION"],
  "Review unavailable": ["检查不可用", "Revisión no disponible", "Examen indisponible"],
  "Pattern review failed: {error} No performance conclusion is available.": [
    "模式检查失败：{error}。无法得出性能结论。",
    "Falló la revisión del patrón: {error} No hay una conclusión de rendimiento.",
    "L’examen du motif a échoué : {error} Aucune conclusion sur les performances n’est disponible.",
  ],
  "Line {line}: {text}": ["第 {line} 行：{text}", "Línea {line}: {text}", "Ligne {line} : {text}"],
  "Interactive regex structure": [
    "交互式正则结构",
    "Estructura interactiva de regex",
    "Structure interactive de la regex",
  ],
  "Line {line}: {text} Select source line.": [
    "第 {line} 行：{text}。选择源代码行。",
    "Línea {line}: {text} Seleccionar línea de origen.",
    "Ligne {line} : {text} Sélectionner la ligne source.",
  ],
  "Follow the green rails. Choices run top to bottom; dashed checks consume no text. This is structure, not a runtime backtracking trace.":
    [
      "沿绿色轨道查看。选项从上到下排列；虚线检查不消耗文本。这是结构图，不是运行时回溯轨迹。",
      "Sigue las líneas verdes. Las alternativas van de arriba abajo; las comprobaciones discontinuas no consumen texto. Es la estructura, no una traza de retroceso en ejecución.",
      "Suivez les rails verts. Les choix vont de haut en bas ; les vérifications en pointillés ne consomment pas de texte. Il s’agit de la structure, pas d’une trace de retour arrière à l’exécution.",
    ],
  "SVG export started. The standalone file contains the current structure and flags.": [
    "SVG 导出已开始。独立文件包含当前结构和标志。",
    "Exportación SVG iniciada. El archivo contiene la estructura y los indicadores actuales.",
    "L’export SVG a commencé. Le fichier autonome contient la structure et les indicateurs actuels.",
  ],
  "Capture indices": ["捕获组位置", "Índices de capturas", "Indices des captures"],
  "Line anchors": ["行边界", "Anclas de línea", "Ancres de ligne"],
  "Dot all": ["点号匹配换行", "Punto con saltos de línea", "Point avec sauts de ligne"],
  "Unicode sets": ["Unicode 集合", "Conjuntos Unicode", "Ensembles Unicode"],
  "Capture #{index} · {count} reference.": [
    "捕获组 #{index} · {count} 个引用。",
    "Captura #{index} · {count} referencia.",
    "Capture nº {index} · {count} référence.",
  ],
  "Capture #{index} · {count} references.": [
    "捕获组 #{index} · {count} 个引用。",
    "Captura #{index} · {count} referencias.",
    "Capture nº {index} · {count} références.",
  ],
  "Noncapturing group · no capture number or references.": [
    "非捕获组 · 无捕获编号或引用。",
    "Grupo sin captura · sin número de captura ni referencias.",
    "Groupe non capturant · sans numéro de capture ni références.",
  ],
  "Reference on line {line}": [
    "第 {line} 行的引用",
    "Referencia en la línea {line}",
    "Référence à la ligne {line}",
  ],
  "Capture #{index}{name} · line {line}": [
    "捕获组 #{index}{name} · 第 {line} 行",
    "Captura #{index}{name} · línea {line}",
    "Capture nº {index}{name} · ligne {line}",
  ],
  "Noncapturing group · line {line}": [
    "非捕获组 · 第 {line} 行",
    "Grupo sin captura · línea {line}",
    "Groupe non capturant · ligne {line}",
  ],
  "{matches} match · {captures} capture per match": [
    "{matches} 个匹配 · 每个匹配 {captures} 个捕获组",
    "{matches} coincidencia · {captures} captura por coincidencia",
    "{matches} correspondance · {captures} capture par correspondance",
  ],
  "{matches} match · {captures} captures per match": [
    "{matches} 个匹配 · 每个匹配 {captures} 个捕获组",
    "{matches} coincidencia · {captures} capturas por coincidencia",
    "{matches} correspondance · {captures} captures par correspondance",
  ],
  "{matches} matches · {captures} capture per match": [
    "{matches} 个匹配 · 每个匹配 {captures} 个捕获组",
    "{matches} coincidencias · {captures} captura por coincidencia",
    "{matches} correspondances · {captures} capture par correspondance",
  ],
  "{matches} matches · {captures} captures per match": [
    "{matches} 个匹配 · 每个匹配 {captures} 个捕获组",
    "{matches} coincidencias · {captures} capturas por coincidencia",
    "{matches} correspondances · {captures} captures par correspondance",
  ],
  "Positions are zero-based UTF-16 spans; the end is excluded. Repeated groups show their final capture.":
    [
      "位置使用从 0 开始的 UTF-16 范围，结束位置不包含在内。重复分组显示最后一次捕获。",
      "Las posiciones son intervalos UTF-16 desde 0; el final queda excluido. Los grupos repetidos muestran su última captura.",
      "Les positions sont des intervalles UTF-16 commençant à 0 ; la fin est exclue. Les groupes répétés affichent leur dernière capture.",
    ],
  "The 100-match display limit was reached. Matching stops at this limit.": [
    "已达到 100 个匹配的显示限制。匹配将在此限制处停止。",
    "Se alcanzó el límite de 100 coincidencias. La búsqueda se detiene en este límite.",
    "La limite d’affichage de 100 correspondances est atteinte. La recherche s’arrête à cette limite.",
  ],
  "This engine reports capture values without positions. No positions are inferred.": [
    "此引擎报告捕获值，但不提供位置。不会推断位置。",
    "Este motor informa valores de captura sin posiciones. No se infieren posiciones.",
    "Ce moteur fournit les valeurs capturées sans leurs positions. Aucune position n’est déduite.",
  ],
  "Match {index}: {value} at {position}": [
    "匹配 {index}：{value}，位置 {position}",
    "Coincidencia {index}: {value} en {position}",
    "Correspondance {index} : {value} à {position}",
  ],
  "Captures for match {index}": [
    "匹配 {index} 的捕获组",
    "Capturas de la coincidencia {index}",
    "Captures de la correspondance {index}",
  ],
  Group: ["分组", "Grupo", "Groupe"],
  Value: ["值", "Valor", "Valeur"],
  Span: ["范围", "Intervalo", "Intervalle"],
  "Go to capture #{index}{name} rule": [
    "定位捕获组 #{index}{name} 的规则",
    "Ir a la regla de la captura #{index}{name}",
    "Aller à la règle de la capture nº {index}{name}",
  ],
  "#0 · Full match": [
    "#0 · 完整匹配",
    "#0 · Coincidencia completa",
    "#0 · Correspondance complète",
  ],
  "Not captured": ["未捕获", "Sin captura", "Non capturé"],
  "{value} (empty)": ["{value}（空）", "{value} (vacío)", "{value} (vide)"],
  Unavailable: ["不可用", "No disponible", "Indisponible"],
  Highlight: ["高亮", "Resaltar", "Surligner"],
  "Highlight capture #{capture} in match {match}": [
    "高亮匹配 {match} 中的捕获组 #{capture}",
    "Resaltar captura #{capture} en la coincidencia {match}",
    "Surligner la capture nº {capture} dans la correspondance {match}",
  ],
  "Capture #{index} in input: ": [
    "输入中的捕获组 #{index}：",
    "Captura #{index} en la entrada: ",
    "Capture nº {index} dans la saisie : ",
  ],
  "Match in input: ": [
    "输入中的匹配：",
    "Coincidencia en la entrada: ",
    "Correspondance dans la saisie : ",
  ],
  "Example too long. Limit: 2,048 UTF-16 code units.": [
    "示例过长。限制为 2,048 个 UTF-16 代码单元。",
    "Ejemplo demasiado largo. Límite: 2.048 unidades UTF-16.",
    "Exemple trop long. Limite : 2 048 unités UTF-16.",
  ],
  "Shorten the oversized examples to run this example.": [
    "缩短超长示例后才能运行此示例。",
    "Acorta los ejemplos demasiado largos para ejecutar este ejemplo.",
    "Raccourcissez les exemples trop longs pour exécuter celui-ci.",
  ],
  "Shorten examples to 2,048 UTF-16 code units or fewer.": [
    "将示例缩短至不超过 2,048 个 UTF-16 代码单元。",
    "Acorta los ejemplos a un máximo de 2.048 unidades UTF-16.",
    "Raccourcissez les exemples à 2 048 unités UTF-16 au maximum.",
  ],
  "Add an example to check the pattern": [
    "添加示例以检查匹配模式",
    "Añade un ejemplo para comprobar el patrón",
    "Ajoutez un exemple pour vérifier le motif",
  ],
  "Fix the rules to run this example": [
    "修正规则以运行此示例",
    "Corrige las reglas para ejecutar este ejemplo",
    "Corrigez les règles pour exécuter cet exemple",
  ],
  "Write rules to run this example": [
    "编写规则以运行此示例",
    "Escribe reglas para ejecutar este ejemplo",
    "Écrivez des règles pour exécuter cet exemple",
  ],
  "Add a positive or negative example to check the pattern.": [
    "添加预期匹配或不匹配的示例以检查匹配模式。",
    "Añade un ejemplo positivo o negativo para comprobar el patrón.",
    "Ajoutez un exemple positif ou négatif pour vérifier le motif.",
  ],
  "Fix the rules to run the examples.": [
    "修正规则以运行示例。",
    "Corrige las reglas para ejecutar los ejemplos.",
    "Corrigez les règles pour exécuter les exemples.",
  ],
  "Write rules to run the examples.": [
    "编写规则以运行示例。",
    "Escribe reglas para ejecutar los ejemplos.",
    "Écrivez des règles pour exécuter les exemples.",
  ],
  "Checking…": ["正在检查…", "Comprobando…", "Vérification…"],
  "Checking examples…": ["正在检查示例…", "Comprobando ejemplos…", "Vérification des exemples…"],
  "{symbol} Matched {value} at {position}": [
    "{symbol} 匹配 {value}，位置 {position}",
    "{symbol} Coincide {value} en {position}",
    "{symbol} Correspondance {value} à {position}",
  ],
  "{symbol} Found {value} at {position}, not the entire string": [
    "{symbol} 在位置 {position} 找到 {value}，但未覆盖整个字符串",
    "{symbol} Se encontró {value} en {position}, sin cubrir toda la cadena",
    "{symbol} {value} trouvé à {position}, sans couvrir toute la chaîne",
  ],
  "{symbol} No match": [
    "{symbol} 无匹配",
    "{symbol} Sin coincidencia",
    "{symbol} Aucune correspondance",
  ],
  "{passed} of {total} examples behave as expected{feedback}": [
    "{total} 个示例中有 {passed} 个符合预期{feedback}",
    "{passed} de {total} ejemplos se comportan como se esperaba{feedback}",
    "{passed} exemples sur {total} se comportent comme prévu{feedback}",
  ],
  ". Example {index} matches the expected result.": [
    "。示例 {index} 的结果符合预期。",
    ". El ejemplo {index} cumple el resultado esperado.",
    ". L’exemple {index} correspond au résultat attendu.",
  ],
  ". Example {index} does not match the expected result.": [
    "。示例 {index} 的结果不符合预期。",
    ". El ejemplo {index} no cumple el resultado esperado.",
    ". L’exemple {index} ne correspond pas au résultat attendu.",
  ],
  "Testing stopped": ["测试已停止", "Pruebas detenidas", "Tests interrompus"],
  "Example testing failed in its isolated worker.": [
    "隔离工作线程中的示例测试失败。",
    "Falló la prueba en el worker aislado.",
    "Le test a échoué dans son worker isolé.",
  ],
  "Example testing took too long and was stopped.": [
    "示例测试耗时过长，已停止。",
    "La prueba tardó demasiado y se detuvo.",
    "Le test a pris trop de temps et a été interrompu.",
  ],
  "Example output is too large. Use fewer examples, captures or matches.": [
    "示例输出过大。请减少示例、捕获组或匹配数量。",
    "La salida es demasiado grande. Usa menos ejemplos, capturas o coincidencias.",
    "Les résultats sont trop volumineux. Réduisez le nombre d’exemples, de captures ou de correspondances.",
  ],
  "Empty string": ["空字符串", "Cadena vacía", "Chaîne vide"],
  "Example {index} string": [
    "示例 {index} 字符串",
    "Cadena del ejemplo {index}",
    "Chaîne de l’exemple {index}",
  ],
  "Expected match result for example {index}": [
    "示例 {index} 的预期匹配结果",
    "Resultado esperado para el ejemplo {index}",
    "Résultat attendu pour l’exemple {index}",
  ],
  "Should match": ["应匹配", "Debe coincidir", "Doit correspondre"],
  "Should not match": ["不应匹配", "No debe coincidir", "Ne doit pas correspondre"],
  "Remove example {index}": [
    "删除示例 {index}",
    "Eliminar ejemplo {index}",
    "Supprimer l’exemple {index}",
  ],
  "Over limit": ["超过限制", "Límite superado", "Limite dépassée"],
  "{count} rule": ["{count} 条规则", "{count} regla", "{count} règle"],
  "{count} rules": ["{count} 条规则", "{count} reglas", "{count} règles"],
  "No pattern generated": ["未生成匹配模式", "No se ha generado un patrón", "Aucun motif généré"],
  "Fix the instruction shown below": [
    "修正下方显示的指令",
    "Corrige la instrucción indicada abajo",
    "Corrigez l’instruction indiquée ci-dessous",
  ],
  "Line {line}, column {column}: {error}{hint}": [
    "第 {line} 行，第 {column} 列：{error}{hint}",
    "Línea {line}, columna {column}: {error}{hint}",
    "Ligne {line}, colonne {column} : {error}{hint}",
  ],
  "Unexpected compiler error: {error}": [
    "意外编译器错误：{error}",
    "Error inesperado del compilador: {error}",
    "Erreur inattendue du compilateur : {error}",
  ],
  "Go to error": ["定位错误", "Ir al error", "Aller à l’erreur"],
  "Group updated. References keep their original capture targets.": [
    "分组已更新。引用保留原来的捕获目标。",
    "Grupo actualizado. Las referencias conservan sus capturas originales.",
    "Groupe modifié. Les références gardent leurs cibles de capture d’origine.",
  ],
  "Edit rejected. Original rules unchanged. {error}": [
    "修改被拒绝。原规则未变。{error}",
    "Cambio rechazado. Las reglas originales no han cambiado. {error}",
    "Modification refusée. Les règles d’origine sont conservées. {error}",
  ],
  "Column {column}: {error}{hint}": [
    "第 {column} 列：{error}{hint}",
    "Columna {column}: {error}{hint}",
    "Colonne {column} : {error}{hint}",
  ],
  "Translated. Review the rules and test your examples.": [
    "已转换。请检查规则并测试示例。",
    "Traducido. Revisa las reglas y prueba tus ejemplos.",
    "Traduction effectuée. Examinez les règles et testez vos exemples.",
  ],
  "Clipboard access was blocked. Select the pattern and press your copy shortcut.": [
    "剪贴板访问被阻止。请选择匹配模式并按复制快捷键。",
    "Se bloqueó el acceso al portapapeles. Selecciona el patrón y usa el atajo de copiar.",
    "L’accès au presse-papiers a été bloqué. Sélectionnez le motif et utilisez votre raccourci de copie.",
  ],
  "Clipboard access was blocked. The pattern is selected; press your keyboard copy shortcut.": [
    "剪贴板访问被阻止。匹配模式已选中，请按复制快捷键。",
    "Se bloqueó el acceso al portapapeles. El patrón está seleccionado; usa el atajo de copiar.",
    "L’accès au presse-papiers a été bloqué. Le motif est sélectionné ; utilisez votre raccourci de copie.",
  ],
  "Example recipes could not load ({error}). You can still write rules manually.": [
    "无法加载示例规则（{error}）。您仍可手动编写规则。",
    "No se pudieron cargar los ejemplos ({error}). Puedes escribir reglas manualmente.",
    "Les exemples n’ont pas pu être chargés ({error}). Vous pouvez toujours écrire des règles manuellement.",
  ],
  "Write rules and add an example to test them.": [
    "编写规则并添加示例进行测试。",
    "Escribe reglas y añade un ejemplo para probarlas.",
    "Écrivez des règles et ajoutez un exemple pour les tester.",
  ],
  "Search example recipes": [
    "搜索示例配方",
    "Buscar recetas de ejemplo",
    "Rechercher des recettes",
  ],
  "Search recipes": ["搜索配方", "Buscar recetas", "Rechercher des recettes"],
  Category: ["类别", "Categoría", "Catégorie"],
  Difficulty: ["难度", "Dificultad", "Difficulté"],
  "All categories": ["所有类别", "Todas las categorías", "Toutes les catégories"],
  "All levels": ["所有级别", "Todos los niveles", "Tous les niveaux"],
  "Clear filters": ["清除筛选", "Borrar filtros", "Effacer les filtres"],
  "{count} of {total} recipes": [
    "{count} / {total} 个配方",
    "{count} de {total} recetas",
    "Recettes : {count} sur {total}",
  ],
  "No recipes match. Try fewer filters.": [
    "没有匹配的配方。请减少筛选条件。",
    "Ninguna receta coincide. Prueba con menos filtros.",
    "Aucune recette ne correspond. Essayez moins de filtres.",
  ],
  Beginner: ["初级", "Principiante", "Débutant"],
  Intermediate: ["中级", "Intermedio", "Intermédiaire"],
  Expert: ["专家", "Experto", "Expert"],
  Usernames: ["用户名", "Nombres de usuario", "Noms d’utilisateur"],
  "IDs and identifiers": ["ID 与标识符", "IDs e identificadores", "ID et identifiants"],
  Slugs: ["路径短名", "Slugs", "Slugs"],
  Filenames: ["文件名", "Nombres de archivo", "Noms de fichiers"],
  "File extensions": ["文件扩展名", "Extensiones de archivo", "Extensions de fichiers"],
  "Hexadecimal colors": ["十六进制颜色", "Colores hexadecimales", "Couleurs hexadécimales"],
  Dates: ["日期", "Fechas", "Dates"],
  Times: ["时间", "Horas", "Heures"],
  "ISO 8601-shaped strings": [
    "ISO 8601 格式字符串",
    "Cadenas con forma ISO 8601",
    "Chaînes de forme ISO 8601",
  ],
  URLs: ["网址", "URLs", "URL"],
  IPv4: ["IPv4 地址", "Direcciones IPv4", "Adresses IPv4"],
  "Log extraction": ["日志提取", "Extracción de registros", "Extraction de journaux"],
  "HTTP headers": ["HTTP 标头", "Cabeceras HTTP", "En-têtes HTTP"],
  "Markdown fragments": ["Markdown 片段", "Fragmentos Markdown", "Fragments Markdown"],
  "Version numbers": ["版本号", "Números de versión", "Numéros de version"],
  "Semantic versions": ["语义化版本", "Versiones semánticas", "Versions sémantiques"],
  "Git commit hashes": ["Git 提交哈希", "Hashes de commits Git", "Empreintes de commits Git"],
  UUIDs: ["UUID 标识符", "Identificadores UUID", "Identifiants UUID"],
  "Named fields": ["命名字段", "Campos con nombre", "Champs nommés"],
  "Repeated words": ["重复单词", "Palabras repetidas", "Mots répétés"],
  "Duplicate detection": ["重复项检测", "Detección de duplicados", "Détection de doublons"],
  "Structured text extraction": [
    "结构化文本提取",
    "Extracción de texto estructurado",
    "Extraction de texte structuré",
  ],
  "International Unicode text": [
    "多语言 Unicode 文本",
    "Texto Unicode internacional",
    "Texte Unicode international",
  ],
  "Search and replacement": ["搜索与替换", "Búsqueda y reemplazo", "Recherche et remplacement"],
  "Match a lowercase slug": [
    "匹配小写路径短名",
    "Comparar un slug en minúsculas",
    "Reconnaître un slug en minuscules",
  ],
  "ASCII letters and digits separated by single hyphens; no leading, trailing or repeated hyphen. Ignore case broadens the letter set.":
    [
      "ASCII 字母和数字以单个连字符分隔；不允许首尾或连续连字符。忽略大小写会扩大字母集合。",
      "Letras y dígitos ASCII separados por un solo guion; sin guiones iniciales, finales ni repetidos. Ignorar mayúsculas amplía las letras permitidas.",
      "Lettres et chiffres ASCII séparés par un seul tiret, sans tiret initial, final ou consécutif. Ignorer la casse élargit les lettres acceptées.",
    ],
  "Find a file extension": [
    "查找文件扩展名",
    "Buscar una extensión de archivo",
    "Trouver une extension de fichier",
  ],
  "Searches for a case-sensitive txt, md or json suffix, including a bare extension. Does not validate the filename or filesystem.":
    [
      "搜索区分大小写的 txt、md 或 json 后缀，也接受单独的扩展名。不验证文件名或文件系统。",
      "Busca un sufijo txt, md o json distinguiendo mayúsculas; también acepta una extensión sola. No valida el nombre ni el sistema de archivos.",
      "Recherche un suffixe txt, md ou json sensible à la casse, y compris une extension seule. Ne valide ni le nom de fichier ni le système de fichiers.",
    ],
  "Match a UTC timestamp shape": [
    "匹配 UTC 时间戳格式",
    "Comparar una forma de fecha UTC",
    "Reconnaître une forme d’horodatage UTC",
  ],
  "YYYY-MM-DDTHH:MM:SS with optional 1–9 fractional digits and Z. Impossible dates and times can match; offsets and calendar validation are outside this recipe.":
    [
      "YYYY-MM-DDTHH:MM:SS，可选 1–9 位小数和 Z。无效日期和时间也可能匹配；不验证时区偏移或日历。",
      "YYYY-MM-DDTHH:MM:SS con 1–9 decimales opcionales y Z. Pueden coincidir fechas y horas imposibles; no valida desfases ni el calendario.",
      "YYYY-MM-DDTHH:MM:SS avec 1 à 9 décimales facultatives et Z. Des dates et heures impossibles peuvent correspondre ; décalages et validation du calendrier sont hors périmètre.",
    ],
  "Match a simple HTTPS URL shape": [
    "匹配简单 HTTPS 网址格式",
    "Comparar una forma de URL HTTPS sencilla",
    "Reconnaître une forme d’URL HTTPS simple",
  ],
  "A lowercase https scheme, ASCII hostname components and an optional slash path without whitespace. Not a standards-complete URL or DNS validator; no ports, userinfo or IPv6.":
    [
      "小写 https 协议、ASCII 主机名部分及可选的不含空白的斜线路径。不是完整 URL 或 DNS 验证器；不支持端口、用户信息或 IPv6。",
      "Esquema https en minúsculas, componentes ASCII del host y ruta opcional con barra sin espacios. No es un validador completo de URL o DNS; no admite puertos, credenciales ni IPv6.",
      "Schéma https en minuscules, composants d’hôte ASCII et chemin facultatif après une barre sans espace. Validation URL ou DNS incomplète ; sans ports, informations utilisateur ni IPv6.",
    ],
  "Extract a simple header field": [
    "提取简单标头字段",
    "Extraer un campo de cabecera sencillo",
    "Extraire un champ d’en-tête simple",
  ],
  "One ASCII letter/hyphen field name, colon, one space and a nonempty single-line value. A small header fragment, not the complete HTTP field grammar or a message parser.":
    [
      "字段名由 ASCII 字母或连字符组成，后接冒号、一个空格和非空单行值。仅是标头片段，不是完整 HTTP 字段语法或消息解析器。",
      "Nombre con letras ASCII o guiones, dos puntos, un espacio y valor no vacío en una línea. Es un fragmento, no la gramática completa de campos HTTP ni un analizador de mensajes.",
      "Nom en lettres ASCII ou tirets, deux-points, un espace et valeur non vide sur une ligne. Fragment d’en-tête, sans grammaire HTTP complète ni analyse des messages.",
    ],
  "Match a Markdown heading fragment": [
    "匹配 Markdown 标题片段",
    "Comparar un fragmento de encabezado Markdown",
    "Reconnaître un fragment de titre Markdown",
  ],
  "One to six # characters, a space and a nonempty single-line heading. Does not parse Markdown block context, optional closing markers or escaping.":
    [
      "1–6 个 #、一个空格和非空单行标题。不解析 Markdown 块上下文、可选结束标记或转义。",
      "De uno a seis #, un espacio y un título no vacío en una línea. No analiza el contexto de bloques Markdown, los marcadores finales opcionales ni escapes.",
      "Un à six #, un espace et un titre non vide sur une ligne. N’analyse pas le contexte des blocs Markdown, les marqueurs de fin facultatifs ni les échappements.",
    ],
  "Validate SemVer 2.0 syntax": [
    "验证 SemVer 2.0 语法",
    "Validar la sintaxis SemVer 2.0",
    "Valider la syntaxe SemVer 2.0",
  ],
  "Checks core numbers, prerelease identifiers and build metadata under SemVer 2.0. Numeric prerelease identifiers cannot have leading zeros; build identifiers can. Does not compare precedence or verify releases.":
    [
      "按 SemVer 2.0 检查核心数字、预发布标识符和构建元数据。纯数字预发布标识符不允许前导零；构建标识符允许。不比较版本优先级或验证发布。",
      "Comprueba números principales, identificadores de prelanzamiento y metadatos de compilación según SemVer 2.0. Los identificadores numéricos de prelanzamiento no admiten ceros iniciales; los de compilación sí. No compara precedencia ni verifica publicaciones.",
      "Vérifie les nombres principaux, identifiants de préversion et métadonnées de construction de SemVer 2.0. Les identifiants numériques de préversion refusent les zéros initiaux ; ceux de construction les acceptent. Ne compare pas la priorité et ne vérifie pas les releases.",
    ],
  "Match a Git object hash shape": [
    "匹配 Git 对象哈希格式",
    "Comparar una forma de hash de objeto Git",
    "Reconnaître une forme d’empreinte d’objet Git",
  ],
  "Exactly 40 or 64 ASCII hexadecimal characters for SHA-1 or SHA-256 object-name shapes. Does not check the algorithm, repository object existence or abbreviated names.":
    [
      "恰好 40 或 64 个 ASCII 十六进制字符，对应 SHA-1 或 SHA-256 对象名称格式。不检查算法、对象是否存在或缩写名称。",
      "Exactamente 40 o 64 caracteres hexadecimales ASCII para formas de nombres SHA-1 o SHA-256. No comprueba el algoritmo, la existencia del objeto ni nombres abreviados.",
      "Exactement 40 ou 64 caractères hexadécimaux ASCII pour les formes de noms d’objets SHA-1 ou SHA-256. Ne vérifie pas l’algorithme, l’existence de l’objet ni les noms abrégés.",
    ],
  "Match two repeated words": [
    "匹配两个重复单词",
    "Comparar dos palabras repetidas",
    "Reconnaître deux mots répétés",
  ],
  "Two identical case-sensitive ASCII letter sequences separated by one space. A backward named reference; not language-aware word segmentation or arbitrary duplicate detection.":
    [
      "两个完全相同、区分大小写的 ASCII 字母序列，以一个空格分隔。使用向后命名引用；不是语言感知分词或任意重复检测。",
      "Dos secuencias idénticas de letras ASCII, distinguiendo mayúsculas, separadas por un espacio. Usa una referencia con nombre anterior; no segmenta palabras según el idioma ni detecta cualquier duplicado.",
      "Deux suites identiques de lettres ASCII sensibles à la casse, séparées par un espace. Référence arrière nommée ; sans segmentation linguistique ni détection générale des doublons.",
    ],
  "Detect adjacent duplicate tokens": [
    "检测相邻重复标记",
    "Detectar tokens duplicados adyacentes",
    "Détecter deux jetons identiques adjacents",
  ],
  "Two identical 1–16 ASCII word-character tokens separated by a comma. Checks one adjacent pair, not an entire list or non-adjacent duplicates.":
    [
      "两个相同的 1–16 个 ASCII 单词字符标记，以逗号分隔。只检查一对相邻标记，不检查完整列表或非相邻重复。",
      "Dos tokens idénticos de 1–16 caracteres de palabra ASCII separados por una coma. Comprueba una pareja adyacente, no una lista completa ni duplicados separados.",
      "Deux jetons identiques de 1 à 16 caractères de mot ASCII, séparés par une virgule. Vérifie une paire adjacente, sans dédupliquer une liste ni détecter les doublons éloignés.",
    ],
  "Match Unicode letters and marks": [
    "匹配 Unicode 字母和组合标记",
    "Comparar letras y marcas Unicode",
    "Reconnaître des lettres et marques Unicode",
  ],
  "A Unicode letter followed by letters or combining marks, including Arabic and Urdu. Uses native L/M properties; no normalization, grapheme counting or complete identifier validation.":
    [
      "首位 Unicode 字母后接字母或组合标记，包括阿拉伯语和乌尔都语。使用原生 L/M 属性；不做规范化、字素计数或完整标识符验证。",
      "Una letra Unicode seguida de letras o marcas combinantes, incluido árabe y urdu. Usa propiedades nativas L/M; sin normalización, recuento de grafemas ni validación completa de identificadores.",
      "Une lettre Unicode suivie de lettres ou marques combinatoires, dont l’arabe et l’ourdou. Propriétés natives L/M ; sans normalisation, comptage des graphèmes ni validation complète des identifiants.",
    ],
  "Extract named fields from a log fragment": [
    "从日志片段提取命名字段",
    "Extraer campos con nombre de un registro",
    "Extraire des champs nommés d’un journal",
  ],
  "Searches for INFO, WARN or ERROR followed by code= and three ASCII digits. Extracts level and code; does not parse a complete log format or validate HTTP status semantics.":
    [
      "搜索 INFO、WARN 或 ERROR，后接 code= 和三位 ASCII 数字。提取 level 和 code；不解析完整日志格式或验证 HTTP 状态含义。",
      "Busca INFO, WARN o ERROR seguido de code= y tres dígitos ASCII. Extrae level y code; no analiza un formato de registro completo ni valida estados HTTP.",
      "Recherche INFO, WARN ou ERROR suivi de code= et de trois chiffres ASCII. Extrait level et code ; sans analyse complète du journal ni validation du sens des statuts HTTP.",
    ],
  "Search and replace a typo": [
    "搜索并替换拼写错误",
    "Buscar y reemplazar una errata",
    "Rechercher et remplacer une faute",
  ],
  "Finds case-sensitive teh at native ASCII word boundaries. Displays every search match, but the non-global replacement changes only the first occurrence; enabling g changes the expectation.":
    [
      "在原生 ASCII 单词边界处查找区分大小写的 teh。显示每个搜索匹配，但非全局替换只更改第一处；启用 g 会改变预期结果。",
      "Busca teh distinguiendo mayúsculas en límites nativos de palabra ASCII. Muestra todas las coincidencias, pero el reemplazo sin g cambia solo la primera; activar g cambia la expectativa.",
      "Recherche teh sensible à la casse aux limites de mot ASCII natives. Affiche chaque occurrence, mais le remplacement sans g ne change que la première ; activer g change le résultat attendu.",
    ],
};
