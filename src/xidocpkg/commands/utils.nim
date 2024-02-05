import ../error
import ../expand
import ../parser
import ../string_view
import ../types
import aspartame
import std/macros
import std/options
import std/os
import std/sequtils
import std/sets
import std/strutils
import std/sugar
import std/tables

func `==`(a, b: BackwardsIndex): bool {.borrow.}

proc expandArguments(
    doc: Document, name: string, arg: StringView, types: openArray[ParamType]
): seq[XidocValue] =
  if types.len == 1 and types[0] == Literal:
    return @[XidocValue(typ: String, str: arg)]
  if types.len == 1 and types[0] == Raw:
    return @[XidocValue(typ: String, str: arg.strip)]
  let args = parseXidocArguments(arg)
  var starPos = none int
  var questionPos = 0 ..< 0
  for index, typ in types:
    case typ.kind
    of ptkMultiple:
      if likely starPos.isNone:
        starPos = some index
      else:
        xidocError "There can only be one star parameter"
      break
    of ptkOptional:
      if questionPos == 0 ..< 0:
        questionPos = index .. index
      else:
        questionPos.b = index
    of ptkOne, ptkRaw, ptkLiteral:
      discard
    # TODO: handle ambiguous optional params
  if starPos.isSome:
    let minLen = types.len - 1
    if args.len < minLen:
      xidocError "Command $1 needs at least $2 arguments, $3 given" %
        [name, $minLen, $args.len]
  else:
    let minLen = types.len - questionPos.len
    let maxLen = types.len
    if args.len < minLen or args.len > maxLen:
      xidocError "Command $1 needs at least $2 and at most $3 arguments, $4 given" %
        [name, $minLen, $maxLen, $args.len]
  proc expandIfNeeded(doc: Document, arg: StringView, typ: ParamType): XidocValue =
    if typ.kind == ptkRaw:
      XidocValue(typ: String, str: arg)
    else:
      doc.expand(arg, typ.base)

  ifSome starPos:
    block beforeStar:
      for index, typ in types[0 ..< starPos]:
        let val = doc.expandIfNeeded(args[index], typ)
        result.add val
    block star:
      var start = starPos
      var `end` = args.len - types.len + start
      if start <= `end`:
        if start == 0 and args.len > 0 and args[0].isEmpty:
          start = 1
        if `end` == args.len - 1 and args.len > 0 and args[^1].isEmpty:
          `end` = args.len - 2
      let base = types[starPos].base
      let vals = args[start .. `end`].map(arg => doc.expand(arg, base))
      result.add XidocValue(typ: List, list: vals)
    block afterStar:
      for index, typ in types[starPos + 1 .. ^1]:
        let index = ^(types.len - index - starPos - 1)
        let val = doc.expandIfNeeded(args[index], typ)
        result.add val
  do:
    block beforeQuestion:
      for index, typ in types[0 ..< questionPos.a]:
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
    of "String", "Markup":
      "str"
    of "List":
      "list"
    else:
      error "invalid type: " & $typ
      ""

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
  of "String", "Markup":
    ident"string"
  of "List":
    quote:
      seq[XidocValue]
  of "Optional":
    quote:
      Option[XidocValue]
  else:
    error "invalid type: " & $typ
    ident""

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
    else:
      error "invalid type: " & $typ
      ident""
  else:
    baseNim

template safe*() {.pragma.}
template useCommands*(cmds: untyped) {.pragma.}

func hasPragma(node: NimNode, name: string): bool =
  if node[4].kind != nnkPragma:
    return false
  for pragma in node[4]:
    if pragma.eqIdent(name) or
        (pragma.kind == nnkExprColonExpr and pragma[0].eqIdent(name)):
      return true
  return false

func getPragma(node: NimNode, name: string): Option[NimNode] =
  if node[4].kind != nnkPragma:
    return none(NImNode)
  for pragma in node[4]:
    if pragma.kind == nnkExprColonExpr and pragma[0].eqIdent(name) and pragma[1] != nil:
      return some(pragma[1])
  return none(NImNode)

macro command*(name: string, baseProc: untyped): untyped =
  baseProc.expectKind(nnkProcDef)
  let baseName = baseProc[0]
  let sig = baseProc[3]
  let isSafe = baseProc.hasPragma("safe")
  let usedCommands = baseProc.getPragma("useCommands")
  let returns = sig[0].kind != nnkEmpty
  let retTyp =
    if returns:
      sig[0]
    else:
      ident"String"
  let retGet = getter(retTyp)
  var params = @[xidocTypeToNimType(retTyp)]
  var args = newSeq[NimNode]()
  let types = nnkBracket.newTree
  let vals = genSym(nskLet, "vals")
  for index, pair in sig[1 ..^ 1]:
    pair.expectKind(nnkIdentDefs)
    let nimType = paramTypeToNimType(pair[1])
    params.add newIdentDefs(name = pair[0], kind = nimType)
    types.add pair[1]
    args.add quote do:
      `vals`[`index`].to(`nimType`)
  var cmdProc = baseProc.copy
  cmdProc[3] = nnkFormalParams.newTree(params)
  let call = newCall(baseName, args)
  let safetyCheck =
    if isSafe:
      newEmptyNode()
    else:
      quote:
        if doc.safeMode:
          xidocError "The [$1] command is not allowed in safe mode" % `name`
  let commandInsertion = block:
    ifSome usedCommands:
      quote:
        doc.stack[^1].commands = `usedCommands`(doc)
    do:
      newEmptyNode()
  quote:
    `cmdProc`
    commands[`name`] = proc(arg {.inject.}: StringView): XidocValue =
      `safetyCheck`
      `commandInsertion`
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

proc addTableOfContentsEntry*(doc: Document, text: string) =
  let entry = TableOfContentsEntry(text: text)
  let parent = doc.lookup(tableOfContentsEntry)
  if parent.isNil:
    doc.tableOfContents.add(entry)
  else:
    parent.children.add(entry)
  doc.stack[^1].tableOfContentsEntry = some(entry)
