import ./error
import std/strformat
import std/strutils

type
  XidocNodeKind* = enum
    xnkString
    xnkWhitespace
    xnkCommand
  XidocNode* = object
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

proc skipBalancedText(body: string, i: var int) =
  let start = i
  var brackets = 0
  while i <= body.high:
    case body[i]
    of '[':
      brackets.inc
    of ']':
      if brackets == 0:
        break
      brackets.dec
    else: discard
    i.inc

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
  skipBalancedText(body, i)
  if i > body.high:
    xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
  result = XidocNode(kind: xnkCommand, name: name, arg: body[argStart..<i])
  i.inc

proc parseXidoc*(body: string, verbose = false): XidocNodes =
  var i = body.low
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

proc parseXidocArgument(body: string, i: var int): string =
  let start = i
  while i <= body.high:
    case body[i]
    of ';':
      break
    of '[':
      i.inc
      skipBalancedText(body, i)
      assert body[i] == ']'
    else: discard
    i.inc
  body[start..<i].strip

proc parseXidocArguments*(body: string): seq[string] =
  var i = body.low
  while i <= body.high:
    result.add parseXidocArgument(body, i)
    i.inc
  if body.endsWith(";"):
    result.add ""
  if body.strip(leading = false, chars = Whitespace - Newlines).endsWith("\n") and
    result[^1].isEmptyOrWhitespace:
    discard result.pop
