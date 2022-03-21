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

  proc jsEval*(code: string, values: varargs[(string, string)]): string =
    xidocError "JavaScript evaluation is currently not available when using JavaScript (how ironic)"

else:

  import std/exitprocs

  {.passl: "-lm"}
  {.compile: "../duktape/duktape.c"}
  {.push header: "duktape/duktape.h".}

  type
    DukContext {.importc: "duk_context".} = object

  proc createHeapDefault(): ptr DukContext {.importc: "duk_create_heap_default".}
  proc destroyHeap(ctx: ptr DukContext) {.importc: "duk_destroy_heap".}
  proc evalString(ctx: ptr DukContext, str: cstring) {.importc: "duk_eval_string".}
  proc evalStringNoResult(ctx: ptr DukContext, str: cstring) {.importc: "duk_eval_string_noresult".}
  proc getPropString(ctx: ptr DukContext, obj_idx: cint, key: cstring): cint {.importc: "duk_get_prop_string".}
  proc getString(ctx: ptr DukContext, idx: cint): cstring {.importc: "duk_get_string".}
  proc pop(ctx: ptr DukContext) {.importc: "duk_pop".}
  proc protectedCall(ctx: ptr DukContext, nargs: cint): cint {.importc: "duk_pcall".}
  proc protectedEvalString(ctx: ptr DukContext, str: cstring): cint {.importc: "duk_peval_string".}
  proc pushBoolean(ctx: ptr DukContext, val: cint) {.importc: "duk_push_boolean".}
  proc pushObject(ctx: ptr DukContext) {.importc: "duk_push_object".}
  proc pushString(ctx: ptr DukContext, str: cstring) {.importc: "duk_push_string".}
  proc putGlobalString(ctx: ptr DukContext, key: cstring) {.importc: "duk_put_global_string".}
  proc putPropString(ctx: ptr DukContext, obj_idx: cint, key: cstring) {.importc: "duk_put_prop_string".}
  proc remove(ctx: ptr DukContext, idx: cint) {.importc: "duk_remove".}
  proc safeToString(ctx: ptr DukContext, idx: cint): cstring {.importc: "duk_safe_to_string".}

  {.pop.}

  var ctx: ptr DukContext

  proc initCtx() =
    once:
      ctx = createHeapDefault()
      addExitProc do():
        ctx.destroyHeap

  proc renderMathKatex*(math: string, displayMode: bool): string =
    once:
      initCtx()
      ctx.evalStringNoResult(arrayPrototypeFillJs)
      ctx.evalStringNoResult(katexJs)
    ctx.evalString("katex.renderToString")
    ctx.pushString(math)
    ctx.pushObject
    ctx.pushBoolean(displayMode.cint)
    ctx.putPropString(-2, "displayMode")
    if ctx.protectedCall(2) != 0:
      xidocError "Error while rendering math: $1\n$2" % [math, $ctx.safeToString(-1)]
    result = $ctx.getString(-1)
    ctx.pop

  proc highlightCode*(code: string, lang: string): string =
    once:
      initCtx()
      ctx.evalStringNoResult(prismJs)
      ctx.evalStringNoResult(xidocPrismJs)
    ctx.evalString("Prism.highlight")
    ctx.pushString(code)
    ctx.evalString("Prism.languages")
    if ctx.getPropString(-1, lang) == 0:
      xidocError &"Unknown language for syntax highlighting: {lang}"
    ctx.remove(-2)
    ctx.pushString(lang)
    if ctx.protectedCall(3) != 0:
      xidocError "Error while highlighting code\n$1" % [$ctx.safeToString(-1)]
    result = $ctx.getString(-1)
    ctx.pop

  proc jsCall*(function: string, args: varargs[string]): string =
    initCtx()
    if ctx.protectedEvalString(function) != 0:
      xidocError "Invalid JavaScript function: $1\n$2" % [function, $ctx.safeToString(-1)]
    for arg in args:
      ctx.pushString(arg.cstring)
    if ctx.protectedCall(args.len.cint) != 0:
      xidocError "Error while calling JavaScript function: $1\n$2" % [function, $ctx.safeToString(-1)]
    result = $ctx.safeToString(-1)
    ctx.pop

  proc jsEval*(code: string, values: varargs[(string, string)]): string =
    initCtx()
    for (name, val) in values:
      ctx.pushString(val.cstring)
      ctx.putGlobalString(name.cstring)
    if ctx.protectedEvalString(code) != 0:
      xidocError "Error while evaluating JavaScript code:\n$1" % [$ctx.safeToString(-1)]
    result = $ctx.safeToString(-1)
    ctx.pop
