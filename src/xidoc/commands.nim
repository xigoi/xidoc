import ./document
import ./error
import ./parser
import fusion/matching
import std/sequtils
import std/strutils
import std/tables

{.experimental: "caseStmtMacros".}

type
  Command* = proc(arg: string): string

const
  htmlTags = "!-- !DOCTYPE a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup data datalist dd del details dfn dialog dir div dl dt em embed fieldset figcaption figure font footer form frame frameset h1 to h6 head header hr html i iframe img input ins kbd label legend li link main map mark meta meter nav noframes noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr".splitWhitespace

proc renderStr*(doc: Document, str: string): string =
  for node in str.parseXidoc:
    result.add case node.kind
      of xnkString: node.str
      of xnkWhitespace: " "
      of xnkCommand: doc.commands[node.name](node.arg)

proc defineDefaultCommands*(doc: Document) =

  proc renderArg(arg: string): string =
    doc.renderStr(arg.strip)

  template command(name: string; body: untyped): untyped =
    doc.commands[name] = proc(arg {.inject.}: string): string = body

  template commandRender(name: string; body: untyped): untyped =
    doc.commands[name] = proc(argRaw: string): string =
      let arg {.inject.} = argRaw.renderArg
      body

  template commandArgs(name: string, body: untyped): untyped =
    doc.commands[name] = proc(arg: string): string =
      let args {.inject.} = parseXidocArguments(arg)
      body

  template commandArgsRenderAll(name: string, minLen = 0, body: untyped): untyped =
    doc.commands[name] = proc(arg: string): string =
      let argsRaw = parseXidocArguments(arg)
      if argsRaw.len < minLen:
        raise XidocError(msg: "Command $1 needs at least $2 aguments, $3 given" % [name, $minLen, $argsRaw.len])
      let args {.inject.} = parseXidocArguments(arg).map(renderArg)
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

  case doc.target
  of tHtml:

    commandArgsRenderAll "<>", 2:
      "<$1>$2</$3>" % [args[0..^2].join(" "), args[^1], args[0]]

    for tag in htmlTags:
      # This proc makes sure that tag is captured by value
      (proc(tag: string) =
        commandArgsRenderAll "<$1>" % tag, 1:
          "<$3 $1>$2</$3>" % [args[0..^2].join(" "), args[^1], tag]
      )(tag)

  else:
    discard
