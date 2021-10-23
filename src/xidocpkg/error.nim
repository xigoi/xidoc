import ./types
import std/macros
import std/strformat
import std/terminal
import std/sequtils

type
  XidocError* = ref object of CatchableError

macro styledWriteLine(file: File, args: varargs[untyped]) =
  let fallbackCall = quote:
    writeLine(`file`)
  for arg in args:
    if arg.kind in {nnkStrLit, nnkPrefix}:
      fallbackCall.add arg
  quote:
    if `file`.isatty:
      terminal.styledWriteLine(`file`, `args`)
    else:
      `fallbackCall`

proc printXidocError*(err: XidocError, doc: Document) =
  stderr.writeLine ""
  stderr.styledWriteLine styleBright, fgRed, &"Error while rendering file {doc.path}"
  for frame in doc.stack[1..^1]:
    stderr.styledWriteLine styleBright, fgYellow, &"in command [{frame.cmdName}]"
  stderr.writeLine err.msg
  stderr.writeLine ""
