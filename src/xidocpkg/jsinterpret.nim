import ./error
import ./types
import std/os
import std/strutils
import std/sugar
import std/tables

const srcDir = currentSourcePath.parentDir.parentDir

const civetJs = staticRead(srcDir / "civet/civet.min.js")

const prismCoreJs = staticRead(srcDir / "prism/prism-core.min.js")
const prismLanguages = block:
  var langs: Table[string, string]
  for file in walkDir(srcDir / "prism/languages"):
    langs[
      file.path.splitFile.name.dup(removeSuffix(".min")).dup(removePrefix("prism-"))
    ] = readFile(file.path)
  langs
const prismLangDependencies = {
  "javascript": @["clike"],
  "actionscript": @["javascript"],
  "apex": @["clike", "sql"],
  "arduino": @["cpp"],
  "aspnet": @["markup", "csharp"],
  "birb": @["clike"],
  "bison": @["c"],
  "c": @["clike"],
  "csharp": @["clike"],
  "cpp": @["c"],
  "cfscript": @["clike"],
  "chaiscript": @["clike", "cpp"],
  "cilkc": @["c"],
  "cilkcpp": @["cpp"],
  "coffeescript": @["javascript"],
  "crystal": @["ruby"],
  "css-extras": @["css"],
  "d": @["clike"],
  "dart": @["clike"],
  "django": @["markup-templating"],
  "ejs": @["javascript", "markup-templating"],
  "etlua": @["lua", "markup-templating"],
  "erb": @["ruby", "markup-templating"],
  "fsharp": @["clike"],
  "firestore-security-rules": @["clike"],
  "flow": @["javascript"],
  "ftl": @["markup-templating"],
  "gml": @["clike"],
  "glsl": @["c"],
  "go": @["clike"],
  "gradle": @["clike"],
  "groovy": @["clike"],
  "haml": @["ruby"],
  "handlebars": @["markup-templating"],
  "haxe": @["clike"],
  "hlsl": @["c"],
  "idris": @["haskell"],
  "java": @["clike"],
  "javadoc": @["markup", "java", "javadoclike"],
  "jolie": @["clike"],
  "jsdoc": @["javascript", "javadoclike", "typescript"],
  "js-extras": @["javascript"],
  "json5": @["json"],
  "jsonp": @["json"],
  "js-templates": @["javascript"],
  "kotlin": @["clike"],
  "latte": @["clike", "markup-templating", "php"],
  "less": @["css"],
  "lilypond": @["scheme"],
  "liquid": @["markup-templating"],
  "markdown": @["markup"],
  "markup-templating": @["markup"],
  "mongodb": @["javascript"],
  "n4js": @["javascript"],
  "objectivec": @["c"],
  "opencl": @["c"],
  "parser": @["markup"],
  "php": @["markup-templating"],
  "phpdoc": @["php", "javadoclike"],
  "php-extras": @["php"],
  "plsql": @["sql"],
  "processing": @["clike"],
  "protobuf": @["clike"],
  "pug": @["markup", "javascript"],
  "purebasic": @["clike"],
  "purescript": @["haskell"],
  "qsharp": @["clike"],
  "qml": @["javascript"],
  "qore": @["clike"],
  "racket": @["scheme"],
  "cshtml": @["markup", "csharp"],
  "jsx": @["markup", "javascript"],
  "tsx": @["jsx", "typescript"],
  "reason": @["clike"],
  "ruby": @["clike"],
  "sass": @["css"],
  "scss": @["css"],
  "scala": @["java"],
  "shell-session": @["bash"],
  "smarty": @["markup-templating"],
  "solidity": @["clike"],
  "soy": @["markup-templating"],
  "sparql": @["turtle"],
  "sqf": @["clike"],
  "squirrel": @["clike"],
  "stata": @["mata", "java", "python"],
  "t4-cs": @["t4-templating", "csharp"],
  "t4-vb": @["t4-templating", "vbnet"],
  "tap": @["yaml"],
  "tt2": @["clike", "markup-templating"],
  "textile": @["markup"],
  "twig": @["markup-templating"],
  "typescript": @["javascript"],
  "v": @["clike"],
  "vala": @["clike"],
  "vbnet": @["basic"],
  "velocity": @["markup"],
  "wiki": @["markup"],
  "xeora": @["markup"],
  "xml-doc": @["markup"],
  "xquery": @["markup"]
}.toTable
const prismLangAliases = {
  "html": "markup",
  "xml": "markup",
  "svg": "markup",
  "mathml": "markup",
  "ssml": "markup",
  "atom": "markup",
  "rss": "markup",
  "js": "javascript",
  "g4": "antlr4",
  "ino": "arduino",
  "arm-asm": "armasm",
  "art": "arturo",
  "adoc": "asciidoc",
  "avs": "avisynth",
  "avdl": "avro-idl",
  "gawk": "awk",
  "sh": "bash",
  "shell": "bash",
  "shortcode": "bbcode",
  "rbnf": "bnf",
  "oscript": "bsl",
  "cs": "csharp",
  "dotnet": "csharp",
  "cfc": "cfscript",
  "cilk-c": "cilkc",
  "cilk-cpp": "cilkcpp",
  "cilk": "cilkcpp",
  "coffee": "coffeescript",
  "conc": "concurnas",
  "jinja2": "django",
  "dns-zone": "dns-zone-file",
  "dockerfile": "docker",
  "gv": "dot",
  "eta": "ejs",
  "xlsx": "excel-formula",
  "xls": "excel-formula",
  "gamemakerlanguage": "gml",
  "po": "gettext",
  "gni": "gn",
  "ld": "linker-script",
  "go-mod": "go-module",
  "hbs": "handlebars",
  "mustache": "handlebars",
  "hs": "haskell",
  "idr": "idris",
  "gitignore": "ignore",
  "hgignore": "ignore",
  "npmignore": "ignore",
  "webmanifest": "json",
  "kt": "kotlin",
  "kts": "kotlin",
  "kum": "kumir",
  "tex": "latex",
  "context": "latex",
  "ly": "lilypond",
  "emacs": "lisp",
  "elisp": "lisp",
  "emacs-lisp": "lisp",
  "md": "markdown",
  "moon": "moonscript",
  "n4jsd": "n4js",
  "nani": "naniscript",
  "objc": "objectivec",
  "qasm": "openqasm",
  "objectpascal": "pascal",
  "px": "pcaxis",
  "pcode": "peoplecode",
  "plantuml": "plant-uml",
  "pq": "powerquery",
  "mscript": "powerquery",
  "pbfasm": "purebasic",
  "purs": "purescript",
  "py": "python",
  "qs": "qsharp",
  "rkt": "racket",
  "razor": "cshtml",
  "rpy": "renpy",
  "res": "rescript",
  "robot": "robotframework",
  "rb": "ruby",
  "sh-session": "shell-session",
  "shellsession": "shell-session",
  "smlnj": "sml",
  "sol": "solidity",
  "sln": "solution-file",
  "rq": "sparql",
  "sclang": "supercollider",
  "t4": "t4-cs",
  "trickle": "tremor",
  "troy": "tremor",
  "trig": "turtle",
  "ts": "typescript",
  "tsconfig": "typoscript",
  "uscript": "unrealscript",
  "uc": "unrealscript",
  "url": "uri",
  "vb": "visual-basic",
  "vba": "visual-basic",
  "webidl": "web-idl",
  "mathematica": "wolfram",
  "nb": "wolfram",
  "wl": "wolfram",
  "xeoracube": "xeora",
  "yml": "yaml"
}.toTable

when defined(js):
  import std/jsffi

  const katexJs = staticRead(srcDir / "katex/katex.min.js")

  {.emit: katexJs.}

  proc compileCivet*(src: string): string =
    xidocError "Civet compilation is currently not available when using JavaScript (how ironic)"

  proc katexRenderToString(
    math: cstring, opts: JsObject
  ): cstring {.importjs: "katex.renderToString(@)".}

  proc renderMathKatex*(
      math: string, displayMode: bool, trust = false, renderer = mrKatexHtml
  ): string =
    if renderer == mrTemml:
      xidocError "Temml is currently not supported when using JavaScript"
    var opts = newJsObject()
    opts["throwOnError"] = false
    opts["displayMode"] = displayMode
    opts["trust"] = trust
    if renderer == mrKatexMathml:
      opts["output"] = "mathml"
    $katexRenderToString(math.cstring, opts)

  proc highlightCode*(code: string, lang: string): string =
    code

  proc jsCall*(code: string, args: varargs[string]): string =
    xidocError "JavaScript evaluation is currently not available when using JavaScript (how ironic)"

  proc jsEval*(code: string, values: varargs[(string, string)]): string =
    xidocError "JavaScript evaluation is currently not available when using JavaScript (how ironic)"

else:
  import pkg/rapidjs
  import std/sequtils
  import std/strformat

  {.compile: "../katex/katex.c".}
  {.compile: "../temml/temml.c".}

  let
    katexBin {.importc: "qjsc_katex_min_ptr".}: ptr uint8
    katexBinLen {.importc: "qjsc_katex_min_size".}: int32
    temmlBin {.importc: "qjsc_temml_ptr".}: ptr uint8
    temmlBinLen {.importc: "qjsc_temml_size".}: int32

  var
    runtime: JsRuntime
    ctx: JsContext

  proc initCtx() =
    once:
      runtime = newJsRuntime()
      ctx = runtime.newContext

  proc compileCivet*(src: string): string =
    initCtx()
    var compile: JsValue
    once:
      discard ctx.eval(civetJs)
      compile = ctx.globalObject["Civet"]["compile"]
    let res = compile(src.toJs(ctx))
    if not res.isString:
      xidocError &"Error while compiling Civet\n{ctx.exceptionMsg}"
    return res.to(string)

  proc renderMathKatex*(
      math: string, displayMode: bool, trust = false, renderer = mrKatexHtml
  ): string =
    initCtx()
    case renderer
    of mrKatexHtml, mrKatexMathml:
      once:
        ctx.evalBin(katexBin, katexBinLen)
    of mrTemml:
      once:
        ctx.evalBin(temmlBin, temmlBinLen)
    let renderToString =
      case renderer
      of mrKatexHtml, mrKatexMathml:
        ctx.eval("katex.renderToString")
      of mrTemml:
        ctx.eval("temml.renderToString")
    let opts = (displayMode: displayMode, trust: trust, throwOnError: true).toJs(ctx)
    if renderer == mrKatexMathml:
      opts["output"] = "mathml"
    let res = renderToString(math.toJs(ctx), opts)
    if not res.isString:
      xidocError &"Error while rendering math: {math}\n{ctx.exceptionMsg}"
    return res.to(string)

  proc loadPrismLanguage(name: string) =
    var loaded {.global.}: seq[string]
    let name =
      if name in prismLanguages:
        name
      elif name in prismLangAliases:
        prismLangAliases[name]
      else:
        xidocError &"Unknown language for syntax highlighting: {name}"
    if name in loaded:
      return
    for dep in prismLangDependencies.getOrDefault(name, @[]):
      loadPrismLanguage(dep)
    discard ctx.eval(prismLanguages[name])
    loaded.add(name)

  proc highlightCode*(code: string, lang: string): string =
    var highlight {.global.}: JsValue
    var languages {.global.}: JsValue
    once:
      initCtx()
      discard ctx.eval(prismCoreJs)
      highlight = ctx.eval("Prism.highlight")
      languages = ctx.eval("Prism.languages")
    loadPrismLanguage(lang)
    let language = languages[lang]
    if language.isUndefined:
      xidocError &"Error loading language for syntax highlighting: {lang}"
    let res = highlight(code.toJs(ctx), language, lang.toJs(ctx))
    if not res.isString:
      xidocError &"Error while highlighting code\n{ctx.exceptionMsg}"
    return res.to(string)

  proc jsCall*(function: string, args: varargs[string]): string =
    initCtx()
    let functionJs = ctx.eval(function)
    if not functionJs.isFunction:
      xidocError &"Invalid JavaScript function: {function}\n{ctx.exceptionMsg}"
    let res = functionJs(args.mapIt(it.toJs(ctx)))
    if res.isException:
      xidocError &"Error while calling JavaScript function: {function}\n{ctx.exceptionMsg}"
    return res.to(string)

  proc jsEval*(code: string, values: varargs[(string, string)]): string =
    initCtx()
    let global = ctx.globalObject
    for (name, val) in values:
      global[name] = val
    let res = ctx.eval(code)
    if res.isException:
      xidocError &"Error while evaluating JavaScript code\n{ctx.exceptionMsg}"
    return res.to(string)
