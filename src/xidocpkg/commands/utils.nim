import ../error
import ../expand
import ../parser
import ../types
import std/macros
import std/options
import std/os
import std/sequtils
import std/sets
import std/strutils
import std/sugar
import std/tables

proc expandArguments(doc: Document, name: string, arg: string, types: openArray[ParamType]): seq[XidocValue] =
  let args = parseXidocArguments(arg)
  var starPos = none int
  var questionPos = 0..<0
  for index, (kind, base) in types:
    case kind
    of ptkMultiple:
      if likely starPos.isNone:
        starPos = some index
      else:
        xidocError "There can only be one star parameter"
      break
    of ptkOptional:
      if questionPos == 0..<0:
        questionPos = index..index
      else:
        questionPos.b = index
    of ptkOne:
      discard
    # TODO: handle ambiguous optional params
  if starPos.isSome:
    let minLen = types.len - 1
    if args.len < minLen:
      xidocError "Command $1 needs at least $2 arguments, $3 given" % [name, $minLen, $args.len]
  else:
    let minLen = types.len - questionPos.len
    let maxLen = types.len
    if args.len < minLen or args.len > maxLen:
      xidocError "Command $1 needs at least $2 and at most $3 arguments, $4 given" % [name, $minLen, $maxLen, $args.len]
  if starPos.isSome:
    block beforeStar:
      for index, typ in types[0..<starPos.get]:
        let val = doc.expand(args[index], typ.base)
        result.add val
    block star:
      let start = starPos.get
      let ende = ^(types.len - start)
      let base = types[start].base
      let vals = args[start..ende].map(arg => doc.expand(arg, base))
      result.add XidocValue(typ: List, list: vals)
    block afterStar:
      for index, typ in types[starPos.get + 1 .. ^1]:
        let index = ^(types.len - index - starPos.get - 1)
        let val = doc.expand(args[index], typ.base)
        result.add val
  else: # starPos.isNone
    block beforeQuestion:
      for index, typ in types[0..<questionPos.a]:
        let val = doc.expand(args[index], typ.base)
        result.add val
    block question:
      let minLen = types.len - questionPos.len
      let start = questionPos.a
      for index, typ in types[questionPos]:
        if args.len - minLen > index:
          let val = doc.expand(args[start + index], typ.base)
          # TODO: optional type
          result.add XidocValue(typ: List, list: @[val])
    block afterQuestion:
      for index, typ in types[questionPos.b + 1 .. ^1]:
        let index = ^(types.len - index - questionPos.b - 1)
        let val = doc.expand(args[index], typ.base)
        result.add val

func getter(typ: NimNode | XidocType): NimNode =
  ident:
    case $typ
    of "String", "Markup": "str"
    of "List": "list"
    else: error "invalid type: " & $typ; ""

func to(val: XidocValue, _: typedesc[string]): string =
  val.str

func to(val: XidocValue, _: typedesc[seq[XidocType]]): seq[XidocType] =
  val.list

func xidocTypeToNimType(typ: NimNode | XidocType): NimNode =
  case $typ
  of "String", "Markup": ident"string"
  of "List":
    quote:
      seq[XidocValue]
  else: error "invalid type: " & $typ; ident""

func paramTypeToNimType(typ: NimNode): NimNode =
  let base =
    if typ.kind == nnkPrefix:
      typ[1]
    else:
      typ
  let baseNim = xidocTypeToNimType(base)
  if typ.kind == nnkPrefix:
    case $typ[0]
    of "!":
      baseNim
    of "*":
      quote:
        seq[`baseNim`]
    of "?":
      quote:
        seq[`baseNim`]
    else: error "invalid type: " & $typ; ident""
  else:
    baseNim

macro command*(name: string, sig: untyped, retTyp: XidocType, body: untyped): untyped =
  let logic =
    if sig == ident"void":
      quote:
        if arg != "":
          xidocError "Command $1 must be called without an argument" % [`name`]
        `body`
    elif sig == ident"literal":
      quote:
        let arg {.inject.} = arg
        `body`
    elif sig == ident"raw":
      quote:
        let arg {.inject.} = arg.strip
        `body`
    elif sig.kind == nnkIdent:
      let get = getter(sig)
      quote:
        let arg {.inject.} = doc.expand(arg.strip, `sig`).`get`
        `body`
    else:
      var params = @[xidocTypeToNimType(retTyp)]
      var args = newSeq[NimNode]()
      let types = nnkBracket.newTree
      let vals = genSym(nskLet, "vals")
      for index, pair in sig:
        pair.expectKind nnkExprColonExpr
        let nimType = paramTypeToNimType(pair[1])
        params.add newIdentDefs(name = pair[0], kind = nimType)
        types.add pair[1]
        args.add quote do:
          `vals`[`index`].to(`nimType`)
      let cmdProc = newProc(params = params, body = body)
      let call = newCall(cmdProc, args)
      quote:
        let `vals` = expandArguments(doc, `name`, arg, @`types`)
        `call`
  let retGet = getter(retTyp)
  quote:
    commands[`name`] = proc(arg {.inject.}: string): XidocValue =
      return XidocValue(typ: `retTyp`, `retGet`: `logic`)

template commands*(name, defs: untyped) =
  proc name*(doc {.inject.}: Document): Table[string, Command] =
    var commands {.inject.}: Table[string, Command]
    defs
    commands
