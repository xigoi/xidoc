# import std/options
import ./types
import std/options
import std/pegs
import std/strformat
import std/strutils

type
  XidocError* = ref object of CatchableError

template xidocError*(msge: string) =
  raise XidocError(msg: msge)

proc xidocWarning*(msge: string) =
  when not defined(js):
    stderr.writeLine("Warning: " & msge)

proc format*(err: XidocError, doc: Document, termColors: bool): string =
  const
    red = "\e[91m"
    yellow = "\e[93m"
    reset = "\e[0m"
  if termColors:
    result &= red
  result &= &"Error while rendering file {doc.stack[0].path.get}\n"
  if termColors:
    result &= yellow
  for frame in doc.stack[1..^1]:
    const maxDisplayedArgLength = 48
    var truncatedArg = frame.cmdArg.replace(peg"\s+", " ")
    if truncatedArg.len > maxDisplayedArgLength:
      truncatedArg = truncatedArg[0..<maxDisplayedArgLength]
      truncatedArg.add "…"
      let numOpeningBrackets = truncatedArg.count('[')
      let numClosingBrackets = truncatedArg.count(']')
      truncatedArg.add "]…".repeat(numOpeningBrackets - numClosingBrackets)
    result &= &"in [{frame.cmdName}{truncatedArg}]\n"
  if termColors:
    result &= reset
  result &= err.msg & "\n"
