import ./error
import npeg
import std/strformat
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

const nonTextChars = Whitespace + {'[', ']'}

grammar "xidoc":
  unparsedText <- *((1 | {'\n'} - {'[', ']'}) | '[' * unparsedText * ']')

proc parseXidocStringHelper(body: string, i: var int): string =
  let start = i
  while i <= body.high and body[i] notin nonTextChars:
    i.inc
  body[start..<i]

proc parseXidocString(body: string, i: var int): XidocNode =
  XidocNode(kind: xnkString, str: parseXidocStringHelper(body, i))

proc parseXidocWhitespace(body: string, i: var int): XidocNode =
  var newline = false
  while i <= body.high and body[i] in Whitespace:
    newline = newline or body[i] == '\n'
    i.inc
  XidocNode(kind: xnkWhitespace, newline: newline)

proc parseXidocCommand(body: string, i: var int): XidocNode =
  assert body[i] == '[' #]
  i.inc
  let name = parseXidocStringHelper(body, i)
  if i > body.high:
    xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
  if body[i] == '[': #]
    # TODO: print the context
    xidocError &"Parse error: Unexpected '[' in command name at position {i}"
  let argStart = i
  var brackets = 0
  while true:
    if i > body.high:
      xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
    case body[i]
    of '[':
      brackets.inc
    of ']':
      if brackets == 0:
        break
      brackets.dec
    else: discard
    i.inc
  result = XidocNode(kind: xnkCommand, name: name, arg: body[argStart..<i])
  i.inc

proc parseXidoc*(body: string, verbose = false): XidocNodes =
  var i = 0
  while i <= body.high:
    result.add case body[i]
    of Whitespace:
      parseXidocWhitespace(body, i)
    of '[':
      parseXidocCommand(body, i)
    of ']':
      # TODO: print the context
      xidocError &"Parse error: Unexpected ']' at position {i}"
    else:
      parseXidocString(body, i)

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
