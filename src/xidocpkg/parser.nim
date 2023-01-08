import ./error
import ./string_view
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
      str*: StringView
    of xnkWhitespace:
      newline*: bool
    of xnkCommand:
      whole*: StringView
      name*: StringView
      arg*: StringView
  XidocNodes* = seq[XidocNode]

const nonTextChars = Whitespace + {'[', ']'}

proc skipBalancedText(body: ref string, i: var int, stop: int) =
  ## Scans `body` from position `i`, incrementing the index
  ## until it reaches an unbalanced bracket or the end of the string.
  ## After calling this procedure, either `body[i] == ']'`
  ## or `i > body.high`.
  var brackets = 0
  while i <= stop:
    case body[][i]
    of '[':
      brackets.inc
    of ']':
      if brackets == 0:
        break
      brackets.dec
    else: discard
    i.inc

proc parseXidocStringHelper(body: ref string, i: var int, stop: int): StringView =
  ## Finds a string of non-whitespace non-brackets characters in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  let start = i
  while i <= stop and body[][i] notin nonTextChars:
    i.inc
  body.view(start..<i)

proc parseXidocString(body: ref string, i: var int, stop: int): XidocNode =
  ## Finds a string of non-whitespace non-brackets characters in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  ## Returns a `XidocNode` with kind `xnkString`.
  XidocNode(kind: xnkString, str: parseXidocStringHelper(body, i, stop))

proc parseXidocWhitespace(body: ref string, i: var int, stop: int): XidocNode =
  ## Finds a string of whitespace characters in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  ## Returns a `XidocNode` with kind `xnkWhitespace`.
  var newline = false
  while i <= stop and body[][i] in Whitespace:
    newline = newline or body[][i] == '\n'
    i.inc
  XidocNode(kind: xnkWhitespace, newline: newline)

proc parseXidocCommand(body: ref string, i: var int, stop: int): XidocNode =
  ## Finds a xidoc command in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  ## `body[i]` must be '[' at the start.
  ## Returns a `XidocNode` with kind `xnkCommand`.
  assert body[i] == '['
  let start = i
  i.inc
  let name = parseXidocStringHelper(body, i, stop)
  if i > stop:
    xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
  if body[][i] == '[':
    let (lnNum, colNum, msg) = lineContext(body, i)
    xidocError &"Parse error: Unexpected '[' in command name at position {lnNum}:{colNum}\n{msg}"
  let argStart = i
  skipBalancedText(body, i, stop)
  if i > stop:
    xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
  result = XidocNode(kind: xnkCommand, whole: body.view(start..i), name: name, arg: body.view(argStart..<i))
  i.inc

proc parseXidoc*(view: StringView, verbose = false): XidocNodes =
  ## Parses a xidoc document, returning a sequence of `XidocNode`.
  let body = view.body
  var i = view.slice.a
  let stop = view.slice.b
  while i <= stop:
    result.add case body[][i]
    of Whitespace:
      parseXidocWhitespace(body, i, stop)
    of '[':
      parseXidocCommand(body, i, stop)
    of ']':
      let (lnNum, colNum, msg) = lineContext(body, i)
      xidocError &"Parse error: Unexpected ']' at position {lnNum}:{colNum}\n{msg}"
    else:
      parseXidocString(body, i, stop)

proc parseXidocArgument(body: ref string, i: var int, stop: int): StringView =
  let start = i
  while i <= stop:
    case body[][i]
    of ';':
      break
    of '[':
      i.inc
      skipBalancedText(body, i, stop)
      assert body[][i] == ']'
    else: discard
    i.inc
  body.view(start..<i).strip

proc parseXidocArguments*(view: StringView): seq[StringView] =
  let body = view.body
  var i = view.slice.a
  let stop = view.slice.b
  while i <= stop:
    result.add parseXidocArgument(body, i, stop)
    i.inc
  if view.endsWith(";"):
    result.add body.view(0..<0)
  if view.strip(leading = false, chars = Whitespace - Newlines).endsWith("\n") and
    result[^1].isEmptyOrWhitespace:
    discard result.pop
