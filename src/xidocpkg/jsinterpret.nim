import ./error
import std/strformat
import std/strutils

const katexJs = staticRead("../katex/katex.min.js")
const arrayPrototypeFillJs = staticRead("../katex/array-prototype-fill.min.js")
const prismJs = staticRead("../prism/prism.js")
const xidocPrismJs = staticRead("../prism/xidoc-prism.js")

when defined(js):

  import std/jsffi

  {.emit: katexJs.}

  proc katexRenderToString(math: cstring, opts: JsObject): cstring {.importjs: "katex.renderToString(@)".}

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var opts = newJsObject()
    opts["throwOnError"] = false
    opts["displayMode"] = displayMode
    $katexRenderToString(math.cstring, opts)

  # This doesn't compile for a bizarre reason
  #
  # {.emit: prismJs.}
  # {.emit: "window.Prism={manual:true};"}
  #
  # var Prism {.importjs.}: JsObject
  # proc prismHighlight(code: cstring, lang: JsObject, langStr: cstring): cstring {.importjs: "Prism.highlight(@)"}
  #
  # proc highlightCode*(code: string, lang: string): string =
  #   try:
  #     $prismHighlight(code, Prism.languages[lang], lang)
  #   except:
  #     xidocError &"Unknown language: {lang}"

  proc highlightCode*(code: string, lang: string): string =
    code

else:

  import std/exitprocs

  {.passl: "-lm"}
  {.compile: "../duktape/duktape.c"}
  {.push importc, header: "duktape/duktape.h".}

  type
    duk_context = object

  proc duk_create_heap_default(): ptr duk_context
  proc duk_eval_string(ctx: ptr duk_context, str: cstring)
  proc duk_get_string(ctx: ptr duk_context, idx: cint): cstring
  proc duk_destroy_heap(ctx: ptr duk_context)

  {.pop.}

  proc escapeJs(str: string): string =
    str.multiReplace({"\\": "\\\\", "\"": "\\\"", "\n": "\\n"})

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var ctx {.global.}: ptr duk_context
    once:
      ctx = duk_create_heap_default()
      addExitProc do():
        ctx.duk_destroy_heap
      ctx.duk_eval_string(arrayPrototypeFillJs)
      ctx.duk_eval_string(katexJs)
    let call = "katex.renderToString(\"$1\", {throwOnError: false, displayMode: $2})" % [math.escapeJs, $displayMode]
    ctx.duk_eval_string(call.cstring)
    $ctx.duk_get_string(-1)

  proc highlightCode*(code: string, lang: string): string =
    var ctx {.global.}: ptr duk_context
    once:
      ctx = duk_create_heap_default()
      addExitProc do():
        ctx.duk_destroy_heap
      ctx.duk_eval_string(prismJs)
      ctx.duk_eval_string(xidocPrismJs)
    let call = "try { Prism.highlight(\"$1\", Prism.languages[\"$2\"], \"$2\") } catch (exc) { \"<ERROR>\"; }" % [code.escapeJs, lang.escapeJs]
    ctx.duk_eval_string(call.cstring)
    result = $ctx.duk_get_string(-1)
    if result == "<ERROR>":
      xidocError &"Unknown language: {lang}"
