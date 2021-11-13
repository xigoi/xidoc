import std/strutils

const katexJs = staticRead("../katex/katex.min.js")

when defined(js):

  import std/jsffi

  {.emit: katexJs.}

  proc katexRenderToString(math: cstring, opts: JsObject): cstring {.importjs: "katex.renderToString(@)".}

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var opts = newJsObject()
    opts["throwOnError"] = false
    opts["displayMode"] = displayMode
    $katexRenderToString(math.cstring, opts)

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

  proc renderMathKatex*(math: string, displayMode: bool): string =
    var ctx {.global.}: ptr duk_context
    once:
      ctx = duk_create_heap_default()
      addExitProc do():
        ctx.duk_destroy_heap
      ctx.duk_eval_string(katexJs)
    let mathEscaped = math.multiReplace({"\\": "\\\\", "\"": "\\\"", "\n": "\\n"})
    let call = "katex.renderToString(\"$1\", {throwOnError: false, displayMode: $2})" % [mathEscaped, $displayMode]
    ctx.duk_eval_string(call.cstring)
    $ctx.duk_get_string(-1)
