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

proc expand(doc: Document, str: string, typ: XidocType): XidocValue =
  result = XidocValue(typ: typ)
  var lastIsWhitespace = false
  for node in str.parseXidoc(doc.verbose):
    case node.kind
      of xnkString:
        lastIsWhitespace = false
        case typ
        of xtString:
          result.str.add node.str
        of xtMarkup:
          result.str.add node.str.escapeText(doc.target)
        of xtList:
          result.list.add XidocValue(typ: xtString, str: node.str)
      of xnkWhitespace:
        case typ
        of xtString, xtMarkup:
          if not lastIsWhitespace:
            result.str.add " "
          lastIsWhitespace = true
        of xtList:
          discard
      of xnkCommand:
        lastIsWhitespace = false
        let name = node.name
        let command = doc.lookup(commands, name)
        if command.isNil:
          xidocError &"Command not found: {name}"
        var frame = Frame(cmdName: name, cmdArg: node.arg)
        doc.stack.add frame
        let val = command(node.arg)
        discard doc.stack.pop
        case typ
        of xtString:
          case val.typ
          of xtString, xtMarkup:
            result.str.add val.str
          of xtList:
            xidocError "Cannot convert a List to a String"
        of xtMarkup:
          case val.typ
          of xtString:
            result.str.add val.str.escapeText(doc.target)
          of xtMarkup:
            result.str.add val.str
          of xtList:
            xidocError "Cannot convert a List to a Markup"
        of xtList:
          case val.typ
          of xtString, xtMarkup:
            result.list.add val
          of xtList:
            result.list &= val

proc expandStr*(doc: Document, str: string): string =
  doc.expand(str, xtString).str

proc renderStr*(doc: Document, str = doc.body): string =
  doc.expand(str, xtMarkup).str
