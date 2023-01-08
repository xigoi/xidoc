import ./string_view
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

proc format*(err: XidocError, doc: Document, termColors: bool): FormattedXidocError =
  let
    red    = if termColors: "\e[91m" else: ""
    yellow = if termColors: "\e[93m" else: ""
    cyan   = if termColors: "\e[96m" else: ""
    gray   = if termColors: "\e[90m" else: ""
    reset  = if termColors: "\e[0m"  else: ""
  var msg: string
  msg &= &"{red}Error while rendering file {doc.stack[0].path.get}\n"
  for frame in doc.stack[1..^1]:
    msg &= yellow
    if frame.cmd.body == doc.body:
      let ctx = lineContext(frame.cmd)
      msg &= &"at ({ctx.lnNumA}, {ctx.colNumA})-({ctx.lnNumB}, {ctx.colNumB}), "
    const maxDisplayedArgLength = 48
    var truncatedArg = frame.cmdArg.replace(peg"\s+", " ")
    if truncatedArg.len > maxDisplayedArgLength:
      truncatedArg = truncatedArg[0..<maxDisplayedArgLength]
      truncatedArg.add "…"
      let numOpeningBrackets = truncatedArg.count('[')
      let numClosingBrackets = truncatedArg.count(']')
      truncatedArg.add "]…".repeat(numOpeningBrackets - numClosingBrackets)
    msg &= &"in {gray}[{cyan}{frame.cmdName}{reset}{truncatedArg}{gray}]\n"
  msg &= reset & err.msg
  return FormattedXidocError(msg: msg)
