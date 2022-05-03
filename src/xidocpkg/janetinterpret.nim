import ./error
import std/sequtils
import std/strutils

when defined(janet):

  proc janetCall*(code: string, args: varargs[string]): string =
    xidocError "Janet evaluation is not available when using JavaScript"

  proc janetEval*(code: string, values: varargs[(string, string)]): string =
    xidocError "Janet evaluation is not available when using JavaScript"

else:

  import std/exitprocs

  {.passl: "-lm"}
  {.compile: "../janet/janet.c"}
  {.push header: "janet/janet.h".}

  {.push importc.}
  type
    Janet {.importc: "Janet".} = object
    JanetFiber = object
    JanetFunction = object
    JanetSignal = cint
    JanetTable = object
    JanetType = cint
  {.pop.}

  let
    jsError {.importc: "JANET_SIGNAL_ERROR".}: JanetSignal
    jtFunction {.importc: "JANET_FUNCTION".}: JanetType
    jtNil {.importc: "JANET_NIL".}: JanetType
    jtString {.importc: "JANET_STRING".}: JanetType

  proc isType(x: Janet, typ: JanetType): bool {.importc: "janet_checktype".}
  proc deinitJanet() {.importc: "janet_deinit".}
  proc defineSym(env: ptr JanetTable, name: cstring, val: Janet, documentation: cstring, sourceFile: cstring, sourceLine: cint) {.importc: "janet_def_sm".}
  proc doBytes(env: ptr JanetTable, bytes: cstring, len: cint, sourcePath: cstring, outp: ptr Janet): cint {.importc: "janet_dobytes".}
  proc initJanet(): cint {.importc: "janet_init".}
  proc janetCoreEnv(replacements: ptr JanetTable): ptr JanetTable {.importc: "janet_core_env".}
  proc protectedCall(fun: ptr JanetFunction, argc: cint, argv: ptr Janet, outp: ptr Janet, fiber: ptr ptr JanetFiber): JanetSignal {.importc: "janet_pcall".}
  proc toJanet(x: cstring): Janet {.importc: "janet_cstringv".}
  proc unwrapFunction(x: Janet): ptr JanetFunction {.importc: "janet_unwrap_function".}
  proc unwrapString(x: Janet): cstring {.importc: "janet_unwrap_string".}

  {.pop.}

  proc initEnv() =
    once:
      discard initJanet()
      addExitProc deinitJanet

  proc janetCall*(function: string, args: varargs[string], path: string): string =
    initEnv()
    let env = janetCoreEnv(nil)
    var functionValue: Janet
    if env.doBytes(function, function.len.cint, path, functionValue.addr) != 0:
      xidocError "Error while evaluating Janet function (see above): $1" % [function]
    if not functionValue.isType(jtFunction):
      xidocError "Invalid Janet function: $1" % [function]
    let f = functionValue.unwrapFunction
    let wrappedArgs = args.mapIt(it.cstring.toJanet)
    var value: Janet
    if f.protectedCall(args.len.cint, wrappedArgs[0].unsafeAddr, value.addr, nil) == jsError:
      xidocError "Error while calling Janet function: $1\n$2" % [function, $value.unwrapString]
    if not value.isType(jtString):
      xidocError "Returned value from Janet function is not a string: $1" % [function]
    $value.unwrapString

  proc janetEval*(code: string, values: varargs[(string, string)], path: string): string =
    initEnv()
    let env = janetCoreEnv(nil)
    for (name, val) in values:
      env.defineSym(name.cstring, val.cstring.toJanet, "", path, 0)
    var value: Janet
    if env.doBytes(code, code.len.cint, path, value.addr) != 0:
      xidocError "Error while evaluating Janet code (see above)"
    if value.isType(jtString):
      $value.unwrapString
    elif value.isType(jtNil):
      ""
    else:
      xidocError "Returned value from Janet code is not a string or nil"
