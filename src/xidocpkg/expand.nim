import ./error
import ./parser
import ./types
import std/strformat
import std/strutils

proc escapeText*(text: string, target: Target): string =
  case target
  of tHtml:
    text.multiReplace({"<": "&lt;", "&": "&amp;", "\"": "&quot;"})
  of tLatex:
    text
  of tGemtext:
    text

proc addIfNeeded(s1: var string, s2: string) =
  let s1Last =
    if s1 == "":
      '\0'
    else:
      s1[^1]
  if s2 in [" ", "\n"] and s1Last in [' ', '\n']:
    if s2 == "\n" and s1Last == ' ':
      s1[^1] = '\n'
    return
  s1.add s2

proc expand*(doc: Document, str: string, typ: XidocType): XidocValue =
  result = XidocValue(typ: typ)
  for node in str.parseXidoc(doc.verbose):
    case node.kind
      of xnkString:
        case typ
        of String:
          result.str.addIfNeeded node.str
        of Markup:
          result.str.addIfNeeded node.str.escapeText(doc.target)
        of List:
          result.list.add XidocValue(typ: String, str: node.str)
        of Optional:
          discard # TODO
      of xnkWhitespace:
        case typ
        of String, Markup:
          let whitespace =
            if node.newline and not doc.target.isWhitespaceSensitive:
              "\n"
            else:
              " "
          result.str.addIfNeeded whitespace
        of List:
          discard
        of Optional:
          discard # TODO
      of xnkCommand:
        let name = node.name
        let command = doc.lookup(commands, name)
        if command.isNil:
          xidocError &"Command not found: {name}"
        var frame = Frame(cmdName: name, cmdArg: node.arg)
        doc.stack.add frame
        let val = command(node.arg)
        discard doc.stack.pop
        case typ
        of String:
          case val.typ
          of String, Markup:
            result.str.addIfNeeded val.str
          of List:
            xidocError "Cannot convert a List to a String"
          of Optional:
            discard # TODO
        of Markup:
          case val.typ
          of String:
            result.str.addIfNeeded val.str.escapeText(doc.target)
          of Markup:
            result.str.addIfNeeded val.str
          of List:
            xidocError "Cannot convert a List to a Markup"
          of Optional:
            discard # TODO
        of List:
          case val.typ
          of String, Markup:
            result.list.add val
          of List:
            result.list &= val.list
          of Optional:
            discard # TODO
        of Optional:
          discard # TODO

proc expandStr*(doc: Document, str: string): string =
  doc.expand(str, String).str

proc renderStr*(doc: Document, str = doc.body): string =
  doc.expand(str, Markup).str
