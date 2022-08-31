import ./error
import std/os
import std/sequtils
import std/strformat
import std/strutils
import std/sugar
import std/tables

const katexJs = staticRead("../katex/katex.min.js")
const prismCoreJs = staticRead("../prism/prism-core.min.js")
const prismLanguages = block:
  var langs: Table[string, string]
  for file in walkDir("src/prism/languages"):
    langs[file
          .path
          .splitFile
          .name
          .dup(removeSuffix(".min"))
          .dup(removePrefix("prism-"))
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
  "xquery": @["markup"],
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

  {.emit: katexJs.}

  proc katexRenderToString(math: cstring, opts: JsObject): cstring {.importjs: "katex.renderToString(@)".}

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var opts = newJsObject()
    opts["throwOnError"] = false
    opts["displayMode"] = displayMode
    $katexRenderToString(math.cstring, opts)

  proc highlightCode*(code: string, lang: string): string =
    code

  proc jsCall*(code: string, args: varargs[string]): string =
    xidocError "JavaScript evaluation is currently not available when using JavaScript (how ironic)"

  proc jsEval*(code: string, values: varargs[(string, string)]): string =
    xidocError "JavaScript evaluation is currently not available when using JavaScript (how ironic)"

else:

  import std/exitprocs

  {.passc: "-DCONFIG_VERSION=\"\""}
  {.passl: "-lm -lpthread"}
  {.compile: "../quickjs/quickjs.c"}
  {.compile: "../quickjs/cutils.c"}
  {.compile: "../quickjs/libregexp.c"}
  {.compile: "../quickjs/libunicode.c"}
  {.push header: "quickjs/quickjs.h".}

  type
    JsRuntimeObj {.importc: "JSRuntime".} = object
    JsRuntime = ptr JsRuntimeObj
    JsContextObj {.importc: "JSContext".} = object
    JsContext = ptr JsContextObj
    JsValue {.importc: "JSValue".} = object

  var
    undefined {.importc: "JS_UNDEFINED".}: JsValue
    forceStrictMode {.importc: "JS_EVAL_FLAG_STRICT".}: cint

  proc call(ctx: JsContext, fn: JsValue, this: JsValue, argc: cint, argv: pointer): JsValue {.importc: "JS_Call".}
  proc eval(ctx: JsContext, input: cstring, inputLen: cint, filename: cstring, flags: cint): JsValue {.importc: "JS_Eval".}
  proc exception(ctx: JsContext): JsValue {.importc: "JS_GetException".}
  # proc free(ctx: JsContext) {.importc: "JS_FreeContext".}
  proc free(ctx: JsContext, cstr: cstring) {.importc: "JS_FreeCString".}
  proc free(ctx: JsContext, val: JsValue) {.importc: "JS_FreeValue".}
  # proc free(runtime: JsRuntime) {.importc: "JS_FreeRuntime".}
  proc getProperty(ctx: JsContext, obj: JsValue, key: cstring): JsValue {.importc: "JS_GetPropertyStr".}
  proc globalObject(ctx: JsContext): JsValue {.importc: "JS_GetGlobalObject".}
  proc isException(val: JsValue): bool {.importc: "JS_IsException".}
  proc isFunction(ctx: JsContext, val: JsValue): bool {.importc: "JS_IsFunction".}
  proc isString(val: JsValue): bool {.importc: "JS_IsString".}
  proc isUndefined(val: JsValue): bool {.importc: "JS_IsUndefined".}
  proc newJsContext(runtime: JsRuntime): JsContext {.importc: "JS_NewContext".}
  proc newJsObject(ctx: JsContext): JsValue {.importc: "JS_NewObject".}
  proc newJsRuntime(): JsRuntime {.importc: "JS_NewRuntime".}
  proc setProperty(ctx: JsContext, obj: JsValue, key: cstring, val: JsValue) {.importc: "JS_SetPropertyStr".}
  proc toCString(ctx: JsContext, val: JsValue): cstring {.importc: "JS_ToCString".}
  proc toJs(ctx: JsContext, b: bool): JsValue {.importc: "JS_NewBool".}
  proc toJs(ctx: JsContext, str: cstring): JsValue {.importc: "JS_NewString".}
  proc toStringJs(ctx: JsContext, val: JsValue): JsValue {.importc: "JS_ToString".}

  {.pop.}

  proc toString(ctx: JsContext, val: JsValue): string =
    let cstr = ctx.toCString(val)
    defer: ctx.free(cstr)
    return $cstr

  proc safeToString(ctx: JsContext, val: JsValue): string =
    let jsString = ctx.toStringJs(val)
    defer: ctx.free(jsString)
    let cstr = ctx.toCString(jsString)
    defer: ctx.free(cstr)
    return $cstr

  proc eval(ctx: JsContext, input: string): JsValue =
    ctx.eval(input, input.len.cint, "", forceStrictMode)

  proc free(ctx: JsContext, vals: openArray[JsValue]) =
    for val in vals:
      ctx.free(val)

  proc exceptionMsg(ctx: JsContext): string =
    let exc = ctx.exception
    defer: ctx.free(exc)
    return ctx.toString(exc)

  var runtime: JsRuntime
  var ctx: JsContext

  proc initCtx() =
    once:
      runtime = newJsRuntime()
      ctx = newJsContext(runtime)
      # addExitProc do():
      #   free(ctx)
      #   free(runtime)

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var renderToString {.global.}: JsValue
    once:
      initCtx()
      ctx.free(ctx.eval(katexJs))
      renderToString = ctx.eval("katex.renderToString", "katex.renderToString".len, "", 0)
      addExitProc do():
        ctx.free(renderToString)
    var args = [ctx.toJs(math), ctx.newJsObject]
    defer: ctx.free(args)
    ctx.setProperty(args[1], "displayMode", ctx.toJS(displayMode))
    let res = ctx.call(renderToString, undefined, args.len.cint, args.addr)
    defer: ctx.free(res)
    if not isString(res):
      xidocError &"Error while rendering math: {math}\n{ctx.exceptionMsg}"
    return ctx.toString(res)

  proc loadPrismLanguage(name: string) =
    var loaded {.global.}: seq[string]
    let name =
      if name in prismLanguages: name
      elif name in prismLangAliases: prismLangAliases[name]
      else: xidocError &"Unknown language for syntax highlighting: {name}"
    if name in loaded: return
    for dep in prismLangDependencies.getOrDefault(name, @[]):
      loadPrismLanguage(dep)
    ctx.free(ctx.eval(prismLanguages[name]))
    loaded.add(name)

  proc highlightCode*(code: string, lang: string): string =
    var highlight {.global.}: JsValue
    var languages {.global.}: JsValue
    once:
      initCtx()
      ctx.free(ctx.eval(prismCoreJs))
      highlight = ctx.eval("Prism.highlight")
      languages = ctx.eval("Prism.languages")
      addExitProc do():
        ctx.free(highlight)
        ctx.free(languages)
    loadPrismLanguage(lang)
    let language = ctx.getProperty(languages, lang)
    defer: ctx.free(language)
    if isUndefined(language):
      xidocError &"Error loading language for syntax highlighting: {lang}"
    var args = [ctx.toJs(code), language, ctx.toJs(lang)]
    defer:
      ctx.free(args[0])
      ctx.free(args[2])
    let res = ctx.call(highlight, undefined, args.len.cint, args.addr)
    defer: ctx.free(res)
    if not isString(res):
      xidocError &"Error while highlighting code\n{ctx.exceptionMsg}"
    result = ctx.toString(res)

  proc jsCall*(function: string, args: varargs[string]): string =
    initCtx()
    let functionJs = ctx.eval(function)
    defer: ctx.free(functionJs)
    if not ctx.isFunction(functionJs):
      xidocError &"Invalid JavaScript function: {function}\n{ctx.exceptionMsg}"
    var args = collect(for arg in args: ctx.toJs(arg.cstring))
    defer: ctx.free(args)
    let res = ctx.call(functionJs, undefined, args.len.cint, args[0].addr)
    defer: ctx.free(res)
    if isException(res):
      xidocError &"Error while calling JavaScript function: {function}\n{ctx.exceptionMsg}"
    return ctx.safeToString(res)

  proc jsEval*(code: string, values: varargs[(string, string)]): string =
    initCtx()
    let global = ctx.globalObject()
    defer: ctx.free(global)
    var toFree: seq[JsValue]
    for (name, val) in values:
      let valJs = ctx.toJs(val.cstring)
      toFree.add(valJs)
      ctx.setProperty(global, name.cstring, valJs)
    defer: ctx.free(toFree)
    let res = ctx.eval(code)
    defer: ctx.free(res)
    if isException(res):
      xidocError &"Error while evaluating JavaScript code\n{ctx.exceptionMsg}"
    return ctx.safeToString(res)
