import ./error
import std/strformat
import std/strutils

type
  XidocNodeKind* = enum
    xnkString
    xnkWhitespace
    xnkCommand
  XidocNode* = object
    pos*: Slice[int]
    case kind*: XidocNodeKind
    of xnkString:
      str*: string
    of xnkWhitespace:
      newline*: bool
    of xnkCommand:
      name*: string
      arg*: string
      argPos*: Slice[int]
  XidocNodes* = seq[XidocNode]

const nonTextChars = Whitespace + {'[', ']'}

func lineContext(body: string, i: int): tuple[lnNum, colNum: int, msg: string] =
  let lns = body.splitLines
  var lnIndex = 0
  var lenSum = 0
  while i >= lenSum + lns[lnIndex].len:
    lenSum += lns[lnIndex].len + 1
    lnIndex.inc
  let colIndex = i - lenSum
  result.lnNum = lnIndex + 1
  result.colNum = colIndex + 1
  let caret = &"{' '.repeat(($result.lnNum).len)} │ {' '.repeat(colIndex)}^"
  result.msg = &"{result.lnNum} │ {lns[lnIndex]}\n{caret}"

proc skipBalancedText(body: string, i: var int) =
  ## Scans `body` from position `i`, incrementing the index
  ## until it reaches an unbalanced bracket or the end of the string.
  ## After calling this procedure, either `body[i] == ']'`
  ## or `i > body.high`.
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
  ## Finds a string of non-whitespace non-brackets characters in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  let start = i
  while i <= body.high and body[i] notin nonTextChars:
    i.inc
  body[start..<i]

proc parseXidocString(body: string, i: var int): XidocNode =
  ## Finds a string of non-whitespace non-brackets characters in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  ## Returns a `XidocNode` with kind `xnkString`.
  let start = i
  let str = parseXidocStringHelper(body, i)
  XidocNode(pos: start..<i, kind: xnkString, str: str)

proc parseXidocWhitespace(body: string, i: var int): XidocNode =
  ## Finds a string of whitespace characters in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  ## Returns a `XidocNode` with kind `xnkWhitespace`.
  let start = i
  var newline = false
  while i <= body.high and body[i] in Whitespace:
    newline = newline or body[i] == '\n'
    i.inc
  XidocNode(pos: start..<i, kind: xnkWhitespace, newline: newline)

proc parseXidocCommand(body: string, i: var int): XidocNode =
  ## Finds a xidoc command in `body`,
  ## starting from position `i` and leaving `i` after the found substring.
  ## `body[i]` must be '[' at the start.
  ## Returns a `XidocNode` with kind `xnkCommand`.
  assert body[i] == '['
  let start = i
  i.inc
  let name = parseXidocStringHelper(body, i)
  if i > body.high:
    xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
  if body[i] == '[':
    let (lnNum, colNum, msg) = lineContext(body, i)
    xidocError &"Parse error: Unexpected '[' in command name at position {lnNum}:{colNum}\n{msg}"
  let argStart = i
  skipBalancedText(body, i)
  if i > body.high:
    xidocError "Parse error: Unexpected end of file (did you forget to close a bracket?)"
  result = XidocNode(
    pos: start..<i+1,
    kind: xnkCommand, name: name, arg: body[argStart..<i], argPos: argStart..<i
  )
  i.inc

proc parseXidoc*(body: string, verbose = false): XidocNodes =
  ## Parses a xidoc document, returning a sequence of `XidocNode`.
  var i = body.low
  while i <= body.high:
    result.add case body[i]
    of Whitespace:
      parseXidocWhitespace(body, i)
    of '[':
      parseXidocCommand(body, i)
    of ']':
      let (lnNum, colNum, msg) = lineContext(body, i)
      xidocError &"Parse error: Unexpected ']' at position {lnNum}:{colNum}\n{msg}"
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
