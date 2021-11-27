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
import std/tables

macro command*(name: string, sig: untyped, rendered: untyped, body: untyped): untyped =
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
    elif sig == ident"expand":
      quote:
        let arg {.inject.} = doc.expandStr(`arg`.strip)
        `body`
    elif sig == ident"render":
      quote:
        let arg {.inject.} = doc.renderStr(`arg`.strip)
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
      template process(kind: NimNode): (proc(doc: Document, str: string): string {.nimcall.}) =
        if kind == ident"render":
          renderStr
        elif kind == ident"expand":
          expandStr
        elif kind == ident"raw":
          (proc(doc: Document, str: string): string = str)
        else:
          error "invalid kind"
          (proc(doc: Document, str: string): string = str)
      if starPos.isSome:
        block beforeStar:
          for index, pair in sig[0..<starPos.get(sigLen)]:
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[`index`])
        block star:
          let start = starPos.get
          let ende = sigLen - start
          let pair = sig[start]
          let name = pair[0]
          let process = process(pair[1][1])
          unpacks.add quote do:
            let `name` {.inject.} = `args`[`start`..^`ende`].mapIt(`process`(doc, it))
        block afterStar:
          for index, pair in sig[starPos.get + 1 .. ^1]:
            let index = sigLen - index - starPos.get - 1
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[^`index`])
      else: # starPos.isNone
        block beforeQuestion:
          for index, pair in sig[0..<questionPos.a]:
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[`index`])
        block question:
          let minLen = sigLen - questionPos.len
          let start = questionPos.a
          for index, pair in sig[questionPos]:
            let name = pair[0]
            let process = process(pair[1][1])
            unpacks.add quote do:
              let `name` {.inject.} =
                if `args`.len - `minLen` > `index`:
                  some `process`(doc, `args`[`start` + `index`])
                else:
                  none string
        block afterQuestion:
          for index, pair in sig[questionPos.b + 1 .. ^1]:
            let index = sigLen - index - questionPos.b - 1
            let name = pair[0]
            let process = process(pair[1])
            unpacks.add quote do:
              let `name` {.inject.} = `process`(doc, `args`[^`index`])
      quote:
        let `args` = parseXidocArguments(`arg`)
        `lenCheck`
        `unpacks`
        block:
          `body`
  let rendered = newLit(rendered == ident"rendered")
  quote:
    commands[`name`] = proc(`arg`: string): XidocString = XidocString(rendered: `rendered`, str: `logic`)

template commands*(name, defs: untyped) =
  proc name*(doc {.inject.}: Document): Table[string, Command] =
    var commands {.inject.}: Table[string, Command]
    defs
    commands
