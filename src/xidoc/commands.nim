import ./document
import ./error
import ./parser
import std/sequtils
import std/strutils
import std/tables

type
  Command* = proc(arg: string): string

proc defineDefaultCommands*(doc: Document) =

  template command(name: string; body: untyped): untyped =
    doc.commands[name] = proc(arg {.inject.}: string): string = body

  proc renderArg(arg: string): string =
    for node in arg.strip.parseXidoc:
      result.add case node.kind
        of xnkString: node.str
        of xnkWhitespace: " "
        of xnkCommand: doc.commands[node.name](node.arg)

  template commandRender(name: string; body: untyped): untyped =
    doc.commands[name] = proc(argRaw: string): string =
      let arg {.inject.} = argRaw.renderArg
      body

  template commandArgs(name: string, body: untyped): untyped =
    doc.commands[name] = proc(arg: string): string =
      let args {.inject.} = parseXidocArguments(arg)
      body

  command "":
    arg

  command "raw":
    arg.strip

  command "--":
    "–"

  commandRender "bf":
    case doc.target
    of tHtml:
      "<b>$1</b>" % arg
    of tLatex:
      "\\textbf{$1}" % arg
