import std/exitprocs
import std/strutils

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

const katexJs = staticRead("../katex/katex.min.js")

proc renderMathKatex*(math: string, displayMode: bool): string =
  var ctx {.global.}: ptr duk_context
  once:
    ctx = duk_create_heap_default()
    addExitProc do():
      ctx.duk_destroy_heap
    ctx.duk_eval_string(katexJs)
  ctx.duk_eval_string("katex.renderToString(\"$1\", {throwOnError: false, displayMode: $2})" % [math.multiReplace({"\\": "\\\\", "\"": "\\\""}), $displayMode])
  $ctx.duk_get_string(-1)
