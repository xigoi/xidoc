import ./error
import ./parser
import ./types
import std/strformat
import std/strutils

func inc(pos: var TextPosition, str: string) =
  pos.row.inc str.count('\n')
  pos.col.inc str.len - 1 - str.rfind('\n')

func escapeText*(text: string, target: Target): string =
  case target
  of tHtml:
    text.multiReplace({"<": "&lt;", "&": "&amp;", "\"": "&quot;"})
  of tLatex:
    text

template expand(doc: Document, str: string, render: static bool) {.dirty.} =
  var pos = doc.stack[^1].pos
  for node in str.parseXidoc(doc.verbose):
    result.add case node.kind
      of xnkString:
        pos.inc node.str
        when render: node.str.escapeText(doc.target)
        else: node.str
      of xnkWhitespace:
        echo "before ", pos
        pos.inc node.ws
        echo "after ", pos
        " "
      of xnkCommand:
        let name {.inject.} = node.name
        let command = doc.lookup(commands, name)
        if command.isNil:
          xidocError &"Command not found: {name}"
        var frame = Frame(cmdName: name, cmdArg: node.arg, pos: pos)
        doc.stack.add frame
        let xstr = command(node.arg)
        discard doc.stack.pop
        pos.inc node.call
        if render and not xstr.rendered:
          xstr.str.escapeText(doc.target)
        else:
          xstr.str

proc expandStr*(doc: Document, str: string): string =
  doc.expand(str, render = false)

proc renderStr*(doc: Document, str = doc.body): string =
  doc.expand(str, render = true)
