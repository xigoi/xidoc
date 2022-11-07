import ./types
import std/options
import std/pegs
import std/strformat
import std/strutils

type
  XidocError* = ref object of CatchableError
  FormattedXidocError* = ref object of CatchableError

template xidocError*(msge: string) =
  raise XidocError(msg: msge)

proc xidocWarning*(msge: string) =
  when not defined(js):
    stderr.writeLine("Warning: " & msge)

func posToCoords(body: string, pos: int): tuple[row, col: int] =
  var newlines = 0
  var lastNewline = -1
  for i in 0..<pos:
    if body[i] == '\n':
      newlines.inc
      lastNewline = i
  return (newlines + 1, pos - lastNewline)

func formatPos(pos: tuple[row, col: int]): string =
  &"{pos.row}:{pos.col}"

proc format*(err: XidocError, doc: Document, termColors: bool): FormattedXidocError =
  const
    red = "\e[91m"
    yellow = "\e[93m"
    reset = "\e[0m"
  var msg: string
  if termColors:
    msg &= red
  msg &= &"Error while rendering file {doc.stack[0].path.get}\n"
  if termColors:
    msg &= yellow
  for frame in doc.stack[1..^1]:
    const maxDisplayedArgLength = 48
    var truncatedArg = frame.cmdArg.replace(peg"\s+", " ")
    if truncatedArg.len > maxDisplayedArgLength:
      truncatedArg = truncatedArg[0..<maxDisplayedArgLength]
      truncatedArg.add "…"
      let numOpeningBrackets = truncatedArg.count('[')
      let numClosingBrackets = truncatedArg.count(']')
      truncatedArg.add "]…".repeat(numOpeningBrackets - numClosingBrackets)
    let posA = posToCoords(doc.body, frame.cmdPos.a).formatPos
    let posB = posToCoords(doc.body, frame.cmdPos.b).formatPos
    msg &= &"[{posA}–{posB}] in [{frame.cmdName}{truncatedArg}]\n"
  if termColors:
    msg &= reset
  msg &= err.msg
  return FormattedXidocError(msg: msg)
