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

proc expandArguments(doc: Document, name: string, arg: string, types: seq[ParamType]): seq[XidocValue] =
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

macro command*(name: string, sig: untyped, retTyp: XidocType, body: untyped): untyped =
  let sigLen = sig.len
  let arg = genSym(nskParam, "arg")
  let logic =
    if sig == ident"void":
      quote:
        if `arg` != "":
          xidocError "Command $1 must be called without an argument" % [`name`]
        `body`
    elif sig == ident"literal":
      quote:
        let arg {.inject.} = `arg`
        `body`
    elif sig == ident"raw":
      quote:
        let arg {.inject.} = `arg`.strip
        `body`
    elif sig.kind == nnkIdent:
      let get = getter(sig)
      quote:
        let arg {.inject.} = doc.expand(`arg`.strip, `sig`).`get`
        `body`
    else:
      var starPos = none int
      var questionPos = 0..<0
      for index, pair in sig:
        pair.expectKind nnkExprColonExpr
        if pair[1].kind == nnkPrefix and pair[1][0] == ident"*":
          starPos = some index
          break
        if pair[1].kind == nnkPrefix and pair[1][0] == ident"?":
          if questionPos == 0..<0:
            questionPos = index..index
          else:
            questionPos.b = index
      let args = genSym(nskLet, "args")
      let lenCheck =
        if starPos.isSome:
          let minLen = sigLen - 1
          quote:
            if `args`.len < `minLen`:
              xidocError "Command $1 needs at least $2 arguments, $3 given" % [`name`, $`minLen`, $`args`.len]
        else:
          let minLen = sigLen - questionPos.len
          let maxLen = sigLen
          quote:
            if `args`.len < `minLen` or `args`.len > `maxLen`:
              xidocError "Command $1 needs at least $2 and at most $3 arguments, $4 given" % [`name`, $`minLen`, $`maxLen`, $`args`.len]
      let unpacks = nnkStmtList.newTree
      proc process(str: NimNode, typ: NimNode): NimNode =
        if typ == ident"raw":
          return str
        else:
          let get = getter(typ)
          return quote: expand(doc, `str`, `typ`).`get`
      if starPos.isSome:
        block beforeStar:
          for index, pair in sig[0..<starPos.get(sigLen)]:
            let name = pair[0]
            let str = quote:
              `args`[`index`]
            let processed = process(str, pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `processed`
        block star:
          let start = starPos.get
          let ende = sigLen - start
          let pair = sig[start]
          let name = pair[0]
          let processedIt = process(ident"it", pair[1][1])
          unpacks.add quote do:
            let `name` {.inject.} = `args`[`start`..^`ende`].mapIt(`processedIt`)
        block afterStar:
          for index, pair in sig[starPos.get + 1 .. ^1]:
            let index = sigLen - index - starPos.get - 1
            let name = pair[0]
            let str = quote:
              `args`[^`index`]
            let processed = process(str, pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `processed`
      else: # starPos.isNone
        block beforeQuestion:
          for index, pair in sig[0..<questionPos.a]:
            let name = pair[0]
            let str = quote:
              `args`[`index`]
            let processed = process(str, pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `processed`
        block question:
          let minLen = sigLen - questionPos.len
          let start = questionPos.a
          for index, pair in sig[questionPos]:
            let name = pair[0]
            let str = quote:
              `args`[`start` + `index`]
            let processed = process(str, pair[1][1])
            unpacks.add quote do:
              let `name` {.inject.} =
                if `args`.len - `minLen` > `index`:
                  some `processed`
                else:
                  none string
        block afterQuestion:
          for index, pair in sig[questionPos.b + 1 .. ^1]:
            let index = sigLen - index - questionPos.b - 1
            let name = pair[0]
            let str = quote:
              `args`[^`index`]
            let processed = process(str, pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `processed`
      quote:
        let `args` = parseXidocArguments(`arg`)
        `lenCheck`
        `unpacks`
        block:
          `body`
  let retGet = getter(retTyp)
  quote:
    commands[`name`] = proc(`arg`: string): XidocValue = XidocValue(typ: `retTyp`, `retGet`: `logic`)

template commands*(name, defs: untyped) =
  proc name*(doc {.inject.}: Document): Table[string, Command] =
    var commands {.inject.}: Table[string, Command]
    defs
    commands
