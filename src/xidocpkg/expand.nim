import ./error
import ./parser
import ./types
import std/strformat
import std/strutils

proc escapeText*(text: string, target: Target): string =
  case target
  of tHtml:
    text.multiReplace({"<": "&lt;", ">": "&gt;", "&": "&amp;"})
  of tLatex:
    text

template expand(doc: Document, str: string, render: static bool) =
  for node in str.parseXidoc(doc.verbose):
    result.add case node.kind
      of xnkString:
        when render: node.str.escapeText(doc.target)
        else: node.str
      of xnkWhitespace: " "
      of xnkCommand:
        let name {.inject.} = node.name
        let command = doc.lookup(commands, name)
        if command.isNil:
          xidocError &"Command not found: {name}"
        var frame = Frame(cmdName: name, cmdArg: node.arg)
        doc.stack.add frame
        let xstr = command(node.arg)
        discard doc.stack.pop
        if render and not xstr.rendered:
          xstr.str.escapeText(doc.target)
        else:
          xstr.str

proc expandStr*(doc: Document, str: string): string =
  doc.expand(str, render = false)

proc renderStr*(doc: Document, str = doc.body): string =
  doc.expand(str, render = true)
