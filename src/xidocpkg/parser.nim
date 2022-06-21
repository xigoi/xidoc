import ./error
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
      newline*: bool
    of xnkCommand:
      name*: string
      arg*: string
  XidocNodes* = seq[XidocNode]

grammar "xidoc":
  textChar <- 1 - Space - {'[', ']'}
  unparsedText <- *((1 | {'\n'} - {'[', ']'}) | '[' * unparsedText * ']')
  commandChar <- textChar

const xidocParser = peg("text", output: XidocNodes):
  textChars <- >+xidoc.textChar:
    output.add XidocNode(kind: xnkString, str: $1)
  whitespace <- >+Space:
    output.add XidocNode(kind: xnkWhitespace, newline: "\n" in $1)
  command <- '[' * >*xidoc.commandChar * >xidoc.unparsedText * ']':
    output.add XidocNode(kind: xnkCommand, name: $1, arg: $2)
  chunk <- command | textChars | whitespace
  text <- *chunk * !1

proc parseXidoc*(body: string, verbose = false): XidocNodes =
  let match = xidocParser.match(body, result)
  if not match.ok:
    if verbose:
      raise XidocError(msg: "Parse error\nSuccessfully parsed: $1" % body[0..match.matchMax])
    else:
      raise XidocError(msg: "Parse error")

const xidocArgumentParser = peg("args", output: seq[string]):
  arg <- !('\n' * *Space * !1) * >*((1 - {'[', ']', ';'}) | '[' * xidoc.unparsedText * ']'):
    output.add ($1).strip
  args <- ?(arg * *(';' * arg))

proc parseXidocArguments*(body: string): seq[string] =
  try:
    if body == "":
      return newSeq[string]()
    if not xidocArgumentParser.match(body, result).ok:
      raise XidocError(msg: "Parse error")
  except NPegException:
    raise XidocError(msg: "Parse error")
