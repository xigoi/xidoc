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
  if types.len == 1 and types[0] == Literal:
    return @[XidocValue(typ: String, str: arg)]
  if types.len == 1 and types[0] == Raw:
    return @[XidocValue(typ: String, str: arg.strip)]
  let args = parseXidocArguments(arg)
  var starPos = none int
  var questionPos = 0..<0
  for index, typ in types:
    case typ.kind
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
    of ptkOne, ptkRaw, ptkLiteral:
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
  proc expandIfNeeded(doc: Document, arg: string, typ: ParamType): XidocValue =
    if typ.kind == ptkRaw:
      XidocValue(typ: String, str: arg)
    else:
      doc.expand(arg, typ.base)
  if starPos.isSome:
    block beforeStar:
      for index, typ in types[0..<starPos.get]:
        let val = doc.expandIfNeeded(args[index], typ)
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
        let val = doc.expandIfNeeded(args[index], typ)
        result.add val
  else: # starPos.isNone
    block beforeQuestion:
      for index, typ in types[0..<questionPos.a]:
        let val = doc.expandIfNeeded(args[index], typ)
        result.add val
    block question:
      let minLen = types.len - questionPos.len
      let start = questionPos.a
      for index, typ in types[questionPos]:
        if args.len - minLen > index:
          var val = new XidocValue
          val[] = doc.expand(args[start + index], typ.base)
          result.add XidocValue(typ: Optional, opt: some(val))
        else:
          result.add XidocValue(typ: Optional, opt: none(ref XidocValue))
    block afterQuestion:
      for index, typ in types[questionPos.b + 1 .. ^1]:
        let index = ^(types.len - index - questionPos.b - 1)
        let val = doc.expandIfNeeded(args[index], typ)
        result.add val

func getter(typ: NimNode | XidocType): NimNode =
  ident:
    case $typ
    of "String", "Markup": "str"
    of "List": "list"
    else: error "invalid type: " & $typ; ""

func to(val: XidocValue, _: typedesc[XidocValue]): XidocValue =
  val

func to(val: XidocValue, _: typedesc[string]): string =
  val.str

func to[T](val: XidocValue, _: typedesc[seq[T]]): seq[T] =
  val.list.map(x => x.to(T))

func to[T](val: XidocValue, _: typedesc[Option[T]]): Option[T] =
  val.opt.map(x => x[].to(T))

func xidocTypeToNimType(typ: NimNode | XidocType): NimNode =
  case $typ
  of "String", "Markup": ident"string"
  of "List":
    quote:
      seq[XidocValue]
  of "Optional":
    quote:
      Option[XidocValue]
  else: error "invalid type: " & $typ; ident""

func paramTypeToNimType(typ: NimNode): NimNode =
  let base =
    if typ.kind == nnkPrefix:
      typ[1]
    else:
      if $typ == "Raw" or $typ == "Literal":
        return ident"string"
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
        Option[`baseNim`]
    else: error "invalid type: " & $typ; ident""
  else:
    baseNim

macro command*(name: string, baseProc: untyped): untyped =
  baseProc.expectKind(nnkProcDef)
  let baseName = baseProc[0]
  let sig = baseProc[3]
  let retTyp = sig[0]
  let retGet = getter(sig[0])
  var params = @[xidocTypeToNimType(baseProc[3][0])]
  var args = newSeq[NimNode]()
  let types = nnkBracket.newTree
  let vals = genSym(nskLet, "vals")
  for index, pair in sig[1..^1]:
    pair.expectKind(nnkIdentDefs)
    let nimType = paramTypeToNimType(pair[1])
    params.add newIdentDefs(name = pair[0], kind = nimType)
    types.add pair[1]
    args.add quote do:
      `vals`[`index`].to(`nimType`)
  var cmdProc = baseProc.copy
  cmdProc[3] = nnkFormalParams.newTree(params)
  let call = newCall(baseName, args)
  quote:
    `cmdProc`
    commands[`name`] = proc(arg {.inject.}: string): XidocValue =
      let `vals` = expandArguments(doc, `name`, arg, @`types`)
      return XidocValue(typ: `retTyp`, `retGet`: `call`)

template commands*(name, defs: untyped) =
  proc name*(doc {.inject.}: Document): Table[string, Command] =
    var commands {.inject.}: Table[string, Command]
    defs
    commands

func `{}`*(cmd: string, arg: string): string =
  (if cmd.startsWith("\\"): "" else: "\\") & cmd & "{" & arg & "}"

func `[]`*(cmd: string, arg: string): string =
  (if cmd.startsWith("\\"): "" else: "\\") & cmd & "[" & arg & "]"

func env*(name: string, content: string): string =
  "\\begin{" & name & "}" & content & "\\end{" & name & "}"
