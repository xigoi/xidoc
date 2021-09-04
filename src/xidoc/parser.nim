import ./types
import npeg
import std/strutils

type
  XidocNodeKind* = enum
    xnkString
    xnkWhitespace
    xnkCommand
  XidocNode* = ref object
    case kind*: XidocNodeKind
    of xnkString:
      str*: string
    of xnkWhitespace:
      discard
    of xnkCommand:
      name*: string
      arg*: string
  XidocNodes* = seq[XidocNode]

grammar "xidoc":
  textChar <- Print - Space - {'[', ']'}
  unparsedText <- *((Print - {'[', ']'}) | '[' * unparsedText * ']')
  commandChar <- textChar

const xidocParser = peg("text", output: XidocNodes):
  textChars <- >+xidoc.textChar:
    output.add XidocNode(kind: xnkString, str: $1)
  whitespace <- +Space:
    output.add XidocNode(kind: xnkWhitespace)
  command <- '[' * >*xidoc.commandChar * >?xidoc.unparsedText * ']':
    output.add XidocNode(kind: xnkCommand, name: $1, arg: $2)
  chunk <- command | textChars | whitespace
  text <- *chunk * !1

proc parseXidoc*(body: string): XidocNodes =
  if not xidocParser.match(body, result).ok:
    raise XidocError(msg: "Parse error")

const xidocArgumentParser = peg("args", output: seq[string]):
  arg <- >*((Print - {'[', ']', ';'}) | '[' * xidoc.unparsedText * ']'):
    output.add ($1).strip
  args <- ?(arg * *(';' * arg))

proc parseXidocArguments*(body: string): seq[string] =
  if not xidocArgumentParser.match(body, result).ok:
    raise XidocError(msg: "Parse error")
