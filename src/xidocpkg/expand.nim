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
  if not (s2 == " " and s1 != "" and s1[^1] == ' '):
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
      of xnkWhitespace:
        case typ
        of String, Markup:
          result.str.addIfNeeded " "
        of List:
          discard
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
        of Markup:
          case val.typ
          of String:
            result.str.addIfNeeded val.str.escapeText(doc.target)
          of Markup:
            result.str.addIfNeeded val.str
          of List:
            xidocError "Cannot convert a List to a Markup"
        of List:
          case val.typ
          of String, Markup:
            result.list.add val
          of List:
            result.list &= val.list

proc expandStr*(doc: Document, str: string): string =
  doc.expand(str, String).str

proc renderStr*(doc: Document, str = doc.body): string =
  doc.expand(str, Markup).str
