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

  proc jsCall*(code: string, args: varargs[string]): string =
    xidocError "JavaScript evaluation is currently not available when using JavaScript (how ironic)"

else:

  import std/exitprocs

  {.passl: "-lm"}
  {.compile: "../duktape/duktape.c"}
  {.push importc, header: "duktape/duktape.h".}

  type
    duk_context = object

  proc duk_create_heap_default(): ptr duk_context
  proc duk_destroy_heap(ctx: ptr duk_context)
  proc duk_eval_string(ctx: ptr duk_context, str: cstring)
  proc duk_get_prop_string(ctx: ptr duk_context, obj_idx: cint, key: cstring): cint
  proc duk_get_string(ctx: ptr duk_context, idx: cint): cstring
  proc duk_pcall(ctx: ptr duk_context, nargs: cint): cint
  proc duk_peval_string(ctx: ptr duk_context, str: cstring): cint
  proc duk_pop(ctx: ptr duk_context)
  proc duk_push_boolean(ctx: ptr duk_context, val: cint)
  proc duk_push_object(ctx: ptr duk_context)
  proc duk_push_string(ctx: ptr duk_context, str: cstring)
  proc duk_put_prop_string(ctx: ptr duk_context, obj_idx: cint, key: cstring)
  proc duk_remove(ctx: ptr duk_context, idx: cint)
  proc duk_safe_to_string(ctx: ptr duk_context, idx: cint): cstring

  {.pop.}

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var ctx {.global.}: ptr duk_context
    once:
      ctx = duk_create_heap_default()
      addExitProc do():
        ctx.duk_destroy_heap
      ctx.duk_eval_string(arrayPrototypeFillJs)
      ctx.duk_eval_string(katexJs)
    ctx.duk_eval_string("katex.renderToString")
    ctx.duk_push_string(math)
    ctx.duk_push_object
    ctx.duk_push_boolean(displayMode.cint)
    ctx.duk_put_prop_string(-2, "displayMode")
    if ctx.duk_pcall(2) != 0:
      xidocError "Error while rendering math: $1\n$2" % [math, $ctx.duk_safe_to_string(-1)]
    result = $ctx.duk_get_string(-1)
    ctx.duk_pop

  proc highlightCode*(code: string, lang: string): string =
    var ctx {.global.}: ptr duk_context
    once:
      ctx = duk_create_heap_default()
      addExitProc do():
        ctx.duk_destroy_heap
      ctx.duk_eval_string(prismJs)
      ctx.duk_eval_string(xidocPrismJs)
    ctx.duk_eval_string("Prism.highlight")
    ctx.duk_push_string(code)
    ctx.duk_eval_string("Prism.languages")
    if ctx.duk_get_prop_string(-1, lang) == 0:
      xidocError &"Unknown language for syntax highlighting: {lang}"
    ctx.duk_remove(-2)
    ctx.duk_push_string(lang)
    if ctx.duk_pcall(3) != 0:
      xidocError "Error while highlighting code\n$1" % [$ctx.duk_safe_to_string(-1)]
    result = $ctx.duk_get_string(-1)
    ctx.duk_pop

  proc jsCall*(function: string, args: varargs[string]): string =
    var ctx {.global.}: ptr duk_context
    once:
      ctx = duk_create_heap_default()
      addExitProc do():
        ctx.duk_destroy_heap
    if ctx.duk_peval_string(function) != 0:
      xidocError "Invalid JavaScript function: $1\n$2" % [function, $ctx.duk_safe_to_string(-1)]
    for arg in args:
      ctx.duk_push_string(arg.cstring)
    if ctx.duk_pcall(args.len.cint) != 0:
      xidocError "Error while calling JavaScript function: $1\n$2" % [function, $ctx.duk_safe_to_string(-1)]
    result = $ctx.duk_safe_to_string(-1)
    ctx.duk_pop
