import ./error
import std/sequtils
import std/strformat
import std/strutils

const katexJs = staticRead("../katex/katex.min.js")
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

  proc highlightCode*(code: string, lang: string): string =
    var highlight {.global.}: JsValue
    var languages {.global.}: JsValue
    once:
      initCtx()
      ctx.free(ctx.eval(prismJs))
      ctx.free(ctx.eval(xidocPrismJs))
      highlight = ctx.eval("Prism.highlight")
      languages = ctx.eval("Prism.languages")
      addExitProc do():
        ctx.free(highlight)
        ctx.free(languages)
    let language = ctx.getProperty(languages, lang)
    defer: ctx.free(language)
    if isUndefined(language):
      xidocError &"Unknown language for syntax highlighting: {lang}"
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
    var args = args.mapIt(ctx.toJS(it.cstring))
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
